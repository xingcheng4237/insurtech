/**
 * Email Service
 * Handles sending emails via Resend API (bypasses SMTP port blocking)
 */

import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private resend: Resend | null = null;
  private isConfigured = false;
  private fromEmail: string = '';
  private fromName: string = '';

  constructor() {
    this.initialize();
  }

  private initialize() {
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.warn('⚠️  Email service not configured. Missing RESEND_API_KEY environment variable.');
      console.warn('   Get your API key at: https://resend.com/api-keys');
      this.isConfigured = false;
      return;
    }

    try {
      this.resend = new Resend(resendApiKey);
      
      // Configure sender email
      // Use FROM_EMAIL environment variable for custom domain
      // Default to Resend's testing email if not set
      this.fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
      this.fromName = process.env.EMAIL_FROM_NAME || 'Insurtech News Tracker';
      
      this.isConfigured = true;
      console.log('✅ Email service configured successfully (Resend API)');
      console.log(`   From: ${this.fromName} <${this.fromEmail}>`);
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.resend) {
      console.error('❌ Cannot send email: Email service not configured');
      console.error('   Set RESEND_API_KEY environment variable');
      return false;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || '',
      });

      if (error) {
        console.error('❌ Resend API error:', error);
        return false;
      }

      console.log('✅ Email sent successfully via Resend');
      console.log('   Email ID:', data?.id);
      console.log('   Recipient:', options.to);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send email:', error?.message || error);
      return false;
    }
  }

  async sendNewsReport(
    to: string,
    subject: string,
    htmlContent: string,
    articles: any[]
  ): Promise<boolean> {
    // Generate plain text version as fallback
    const textContent = this.generatePlainTextReport(articles);

    return this.sendEmail({
      to,
      subject,
      html: htmlContent,
      text: textContent,
    });
  }

  private generatePlainTextReport(articles: any[]): string {
    let text = 'INSURTECH NEWS DAILY DIGEST\n\n';
    text += `${articles.length} articles collected\n\n`;
    
    articles.forEach((article, index) => {
      text += `${index + 1}. ${article.title}\n`;
      text += `   Source: ${article.source}\n`;
      text += `   URL: ${article.url}\n`;
      text += `   Published: ${article.publishedDate}\n\n`;
    });

    return text;
  }

  isReady(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const emailService = new EmailService();
