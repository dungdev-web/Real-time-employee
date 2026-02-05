const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  initialize() {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('⚠️  Email credentials not configured. Emails will be simulated.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Error initializing email service:', error.message);
    }
  }

  async sendEmail(to, subject, htmlContent, textContent) {
    try {
      if (!this.transporter) {
        return this.simulateEmail(to, subject, htmlContent, textContent);
      }

      const mailOptions = {
        from: `"Employee Task Management" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, '')
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Error sending email:', error.message);
      throw error;
    }
  }

  simulateEmail(to, subject, htmlContent, textContent) {
    console.log('\n========== SIMULATED EMAIL ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${textContent || htmlContent}`);
    console.log('========================================\n');
    
    return {
      simulated: true,
      to: to,
      subject: subject,
      timestamp: new Date().toISOString()
    };
  }

  async sendEmployeeWelcomeEmail(employeeEmail, employeeName, setupLink) {
    const subject = 'Welcome to Employee Task Management';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Employee Task Management!</h1>
          </div>
          <div class="content">
            <h2>Hello ${employeeName},</h2>
            <p>Your account has been created successfully. You can now access the Employee Task Management System.</p>
            <p>To get started, please click the button below to set up your account credentials:</p>
            <div style="text-align: center;">
              <a href="${setupLink}" class="button">Set Up Your Account</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4CAF50;">${setupLink}</p>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>If you have any questions, please contact your manager.</p>
            <p>Best regards,<br>The Task Management Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Welcome to Employee Task Management!
      
      Hello ${employeeName},
      
      Your account has been created successfully. You can now access the Employee Task Management System.
      
      To get started, please visit this link to set up your account credentials:
      ${setupLink}
      
      This link will expire in 24 hours for security reasons.
      
      If you have any questions, please contact your manager.
      
      Best regards,
      The Task Management Team
    `;

    return await this.sendEmail(employeeEmail, subject, htmlContent, textContent);
  }

  async sendAccessCodeEmail(email, accessCode) {
    const subject = 'Your Login Access Code';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; text-align: center; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2196F3; background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .warning { color: #ff5722; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Login Access Code</h1>
          </div>
          <div class="content">
            <p>Your access code for logging into the Employee Task Management System is:</p>
            <div class="code">${accessCode}</div>
            <p>This code will expire in 10 minutes.</p>
            <p class="warning">If you didn't request this code, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Your Login Access Code
      
      Your access code for logging into the Employee Task Management System is: ${accessCode}
      
      This code will expire in 10 minutes.
      
      If you didn't request this code, please ignore this email.
    `;

    return await this.sendEmail(email, subject, htmlContent, textContent);
  }
}

module.exports = new EmailService();