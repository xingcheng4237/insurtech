import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { subscribers, InsertSubscriber } from '../drizzle/schema';

/**
 * Generate a random token for verification or unsubscribe
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Subscribe a new email to the newsletter
 */
export async function subscribeEmail(email: string, name?: string) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  // Check if email already exists
  const existing = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);
  
  if (existing.length > 0) {
    const sub = existing[0];
    if (sub.active && sub.verified) {
      return { success: false, message: 'Email already subscribed', alreadySubscribed: true };
    } else if (sub.active && !sub.verified) {
      // Resend verification
      return { 
        success: true, 
        message: 'Verification email resent', 
        verificationToken: sub.verificationToken,
        needsVerification: true 
      };
    } else {
      // Reactivate subscription
      await db.update(subscribers)
        .set({ 
          active: true, 
          unsubscribedAt: null,
          name: name || sub.name,
          verificationToken: generateToken(),
          verified: false,
          verifiedAt: null
        })
        .where(eq(subscribers.id, sub.id));
      
      const updated = await db.select().from(subscribers).where(eq(subscribers.id, sub.id)).limit(1);
      return { 
        success: true, 
        message: 'Subscription reactivated. Please verify your email.', 
        verificationToken: updated[0].verificationToken,
        needsVerification: true 
      };
    }
  }

  // Create new subscription
  const verificationToken = generateToken();
  const unsubscribeToken = generateToken();
  
  const newSubscriber: InsertSubscriber = {
    email,
    name: name || null,
    verified: false,
    verificationToken,
    unsubscribeToken,
    active: true,
  };

  await db.insert(subscribers).values(newSubscriber);

  return { 
    success: true, 
    message: 'Subscription successful! Please check your email to verify.', 
    verificationToken,
    needsVerification: true 
  };
}

/**
 * Verify email subscription
 */
export async function verifySubscription(token: string) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.select().from(subscribers)
    .where(eq(subscribers.verificationToken, token))
    .limit(1);

  if (result.length === 0) {
    return { success: false, message: 'Invalid verification token' };
  }

  const subscriber = result[0];
  
  if (subscriber.verified) {
    return { success: true, message: 'Email already verified', alreadyVerified: true };
  }

  await db.update(subscribers)
    .set({ 
      verified: true, 
      verifiedAt: new Date(),
      verificationToken: null 
    })
    .where(eq(subscribers.id, subscriber.id));

  return { success: true, message: 'Email verified successfully!' };
}

/**
 * Unsubscribe from newsletter
 */
export async function unsubscribeEmail(token: string) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const result = await db.select().from(subscribers)
    .where(eq(subscribers.unsubscribeToken, token))
    .limit(1);

  if (result.length === 0) {
    return { success: false, message: 'Invalid unsubscribe token' };
  }

  const subscriber = result[0];
  
  if (!subscriber.active) {
    return { success: true, message: 'Already unsubscribed', alreadyUnsubscribed: true };
  }

  await db.update(subscribers)
    .set({ 
      active: false, 
      unsubscribedAt: new Date() 
    })
    .where(eq(subscribers.id, subscriber.id));

  return { success: true, message: 'Successfully unsubscribed from newsletter' };
}

/**
 * Get all active verified subscribers
 */
export async function getActiveSubscribers() {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const { and } = await import('drizzle-orm');
  const result = await db.select().from(subscribers)
    .where(
      and(
        eq(subscribers.active, true),
        eq(subscribers.verified, true)
      )
    );

  return result;
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats() {
  const db = await getDb();
  if (!db) {
    return {
      total: 0,
      verified: 0,
      unverified: 0,
      unsubscribed: 0,
    };
  }

  const all = await db.select().from(subscribers);
  
  return {
    total: all.filter(s => s.active).length,
    verified: all.filter(s => s.active && s.verified).length,
    unverified: all.filter(s => s.active && !s.verified).length,
    unsubscribed: all.filter(s => !s.active).length,
  };
}
