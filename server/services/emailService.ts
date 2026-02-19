/**
 * Email Service
 * Handles sending emails via SMTP using nodemailer
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.warn('⚠️  Email service not configured. Missing SMTP environment variables.');
      console.warn('   Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        // Force IPv4 to avoid IPv6 network issues in Railway
        tls: {
          // Do not fail on invalid certs
          rejectUnauthorized: false,
        },
        // Force IPv4 connection
        socketTimeout: 30000,
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        // Use IPv4 family
        family: 4,
      });

      this.isConfigured = true;
      console.log('✅ Email service configured successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.error('❌ Cannot send email: Email service not configured');
      return false;
    }

    try {
      const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER;
      const fromName = process.env.EMAIL_FROM_NAME || 'Insurtech News Tracker';

      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text || '',
        html: options.html,
      });

      console.log('✅ Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
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
