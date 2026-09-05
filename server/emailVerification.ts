/**
 * Send verification email to new subscriber
 * This is a placeholder - actual email sending will be done via the Python script
 */
export function generateVerificationEmailHTML(
  email: string,
  verificationToken: string,
  baseUrl: string
): string {
  const verificationUrl = `${baseUrl}/verify?token=${verificationToken}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #4A90E2;
    }
    h1 {
      color: #2c3e50;
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .content {
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #4A90E2;
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #357ABD;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ecf0f1;
      color: #95a5a6;
      font-size: 12px;
    }
    .link {
      color: #4A90E2;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✉️ Verify Your Email</h1>
      <p>Insurtech News Daily Digest</p>
    </div>

    <div class="content">
      <p>Hello!</p>
      
      <p>Thank you for subscribing to the Insurtech News Daily Digest. To complete your subscription, please verify your email address by clicking the button below:</p>
      
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      <p class="link">${verificationUrl}</p>
      
      <p><strong>What you'll receive:</strong></p>
      <ul>
        <li>Daily insurtech news digest at 9:00 AM SGT</li>
        <li>AI-powered analysis and strategic insights</li>
        <li>Coverage of 11 Asia-Pacific markets</li>
        <li>Focus on life/healthcare, digital platforms, AI/ML, and regulatory changes</li>
      </ul>
      
      <p>If you didn't subscribe to this newsletter, please ignore this email.</p>
    </div>

    <div class="footer">
      <p>Insurtech News Tracker - Daily Intelligence for Insurance Leaders</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate unsubscribe link for emails
 */
export function generateUnsubscribeLink(
  unsubscribeToken: string,
  baseUrl: string
): string {
  return `${baseUrl}/unsubscribe?token=${unsubscribeToken}`;
}
