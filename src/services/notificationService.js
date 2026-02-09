const nodemailer = require('nodemailer');
const { Resend } = require('resend');

class NotificationService {
  constructor() {
    // Initialize email service configuration
    this.apiKey = process.env.SENDGRID_API_KEY;
    this.resendApiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@finance-tracker.com';
    this.fromName = process.env.FROM_NAME || 'Personal Finance Tracker';
    
    // Initialize SMTP settings for Gmail
    this.smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
      }
    };
    
    // Try to initialize email service
    this.emailService = null;
    this.serviceType = 'none';
    
    // Try SMTP first (most reliable with Gmail)
    if (this.smtpConfig.auth.user && this.smtpConfig.auth.pass) {
      try {
        this.emailService = nodemailer.createTransport(this.smtpConfig);
        this.serviceType = 'smtp';
        console.log('✅ SMTP email service initialized with Gmail');
      } catch (error) {
        console.warn('⚠️  SMTP configuration error:', error.message);
      }
    }
    
    // Try Resend second
    if (this.serviceType === 'none' && this.resendApiKey) {
      try {
        this.resend = new Resend(this.resendApiKey);
        this.serviceType = 'resend';
        console.log('✅ Resend email service initialized');
      } catch (error) {
        console.warn('⚠️  Resend module error:', error.message);
      }
    }
    
    // Try SendGrid third
    if (this.serviceType === 'none' && this.apiKey) {
      try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(this.apiKey);
        this.sgMail = sgMail;
        this.serviceType = 'sendgrid';
        console.log('✅ SendGrid email service initialized');
      } catch (error) {
        console.warn('⚠️  SendGrid module not found');
      }
    }
    
    if (this.serviceType === 'none') {
      console.warn('⚠️  No email service configured. Set SMTP credentials (Gmail), RESEND_API_KEY, or SENDGRID_API_KEY.');
    }
  }

  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      if (this.serviceType === 'none') {
        console.log('📧 Email would be sent (no service configured):', { to, subject });
        return { 
          success: true, 
          message: 'Email simulated - no email service configured',
          service: 'simulation'
        };
      }

      if (this.serviceType === 'smtp') {
        return await this.sendWithSMTP(to, subject, htmlContent, textContent);
      }

      if (this.serviceType === 'resend') {
        return await this.sendWithResend(to, subject, htmlContent, textContent);
      }

      if (this.serviceType === 'sendgrid') {
        return await this.sendWithSendGrid(to, subject, htmlContent, textContent);
      }

      return { success: false, message: 'No email service available' };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWithResend(to, subject, htmlContent, textContent) {
    const emailData = {
      from: `${this.fromName} <${this.fromEmail}>`,
      to: [to],
      subject: subject,
      html: htmlContent,
      text: textContent || this.stripHtml(htmlContent)
    };

    const result = await this.resend.emails.send(emailData);
    console.log('✅ Email sent via Resend to:', to);
    return { 
      success: true, 
      messageId: result.data?.id,
      service: 'resend'
    };
  }

  async sendWithSendGrid(to, subject, htmlContent, textContent) {
    const msg = {
      to: to,
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
      subject: subject,
      text: textContent || this.stripHtml(htmlContent),
      html: htmlContent,
    };

    const result = await this.sgMail.send(msg);
    console.log('✅ Email sent via SendGrid to:', to);
    return { 
      success: true, 
      messageId: result[0].headers['x-message-id'],
      service: 'sendgrid'
    };
  }

  async sendWithSMTP(to, subject, htmlContent, textContent) {
    const mailOptions = {
      from: `"${this.fromName}" <${this.smtpConfig.auth.user}>`,
      to: to,
      subject: subject,
      text: textContent || this.stripHtml(htmlContent),
      html: htmlContent
    };

    const result = await this.emailService.sendMail(mailOptions);
    console.log('✅ Email sent via SMTP to:', to);
    return { 
      success: true, 
      messageId: result.messageId,
      service: 'smtp'
    };
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Personal Finance Tracker!';
    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #2c3e50;">Welcome to Personal Finance Tracker! 🎉</h1>
        <p>Hi ${user.first_name || user.name},</p>
        <p>Thank you for joining Personal Finance Tracker. We're excited to help you manage your finances better!</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057;">Getting Started:</h3>
          <ul>
            <li>📊 Create your expense categories</li>
            <li>💰 Add your first transaction</li>
            <li>📈 Track your spending patterns</li>
            <li>🎯 Set up budgets and goals</li>
          </ul>
        </div>
        
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Happy tracking!</p>
        <p><strong>The Personal Finance Tracker Team</strong></p>
      </div>
    `;

    return await this.sendEmail(user.email, subject, htmlContent);
  }

  async sendBudgetAlert(user, budgetData) {
    const { categoryName, spentAmount, budgetLimit, percentageUsed } = budgetData;
    
    let alertType, alertMessage, alertIcon;
    if (percentageUsed >= 100) {
      alertType = 'Budget Exceeded';
      alertMessage = 'You have exceeded your budget limit!';
      alertIcon = '🚨';
    } else if (percentageUsed >= 80) {
      alertType = 'Budget Warning';
      alertMessage = 'You are approaching your budget limit.';
      alertIcon = '⚠️';
    } else {
      return; // No need to send alert for < 80%
    }

    const subject = `${alertIcon} ${alertType}: ${categoryName}`;
    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: ${percentageUsed >= 100 ? '#dc3545' : '#ffc107'};">${alertIcon} ${alertType}</h1>
        <p>Hi ${user.first_name || user.name},</p>
        <p>${alertMessage}</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057;">Budget Summary for <strong>${categoryName}</strong>:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Budget Limit:</strong> $${budgetLimit.toLocaleString()}</li>
            <li style="margin: 10px 0;"><strong>Amount Spent:</strong> $${spentAmount.toLocaleString()}</li>
            <li style="margin: 10px 0;"><strong>Percentage Used:</strong> ${percentageUsed.toFixed(1)}%</li>
            <li style="margin: 10px 0;"><strong>Remaining:</strong> $${Math.max(0, budgetLimit - spentAmount).toLocaleString()}</li>
          </ul>
        </div>
        
        ${percentageUsed >= 100 
          ? '<p style="color: #dc3545;"><strong>Consider reviewing your spending in this category to get back on track.</strong></p>' 
          : '<p style="color: #ffc107;"><strong>Consider slowing down spending in this category to stay within budget.</strong></p>'
        }
        
        <p>Best regards,<br><strong>Personal Finance Tracker</strong></p>
      </div>
    `;

    return await this.sendEmail(user.email, subject, htmlContent);
  }

  async sendMonthlyReport(user, reportData) {
    const { month, year, totalIncome, totalExpenses, netAmount, topCategories } = reportData;
    
    const subject = `📊 Your Monthly Financial Report - ${month} ${year}`;
    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #2c3e50;">📊 Monthly Financial Report</h1>
        <h2 style="color: #495057;">${month} ${year}</h2>
        <p>Hi ${user.first_name || user.name},</p>
        <p>Here's your monthly financial summary:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057;">Financial Overview:</h3>
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px; align-items: center;">
            <span><strong>Total Income:</strong></span>
            <span style="color: #28a745; font-weight: bold;">$${totalIncome.toLocaleString()}</span>
            
            <span><strong>Total Expenses:</strong></span>
            <span style="color: #dc3545; font-weight: bold;">$${totalExpenses.toLocaleString()}</span>
            
            <span><strong>Net Amount:</strong></span>
            <span style="color: ${netAmount >= 0 ? '#28a745' : '#dc3545'}; font-weight: bold;">
              ${netAmount >= 0 ? '+' : ''}$${netAmount.toLocaleString()}
            </span>
          </div>
        </div>
        
        ${topCategories && topCategories.length > 0 ? `
        <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057;">Top Spending Categories:</h3>
          <ol>
            ${topCategories.map(cat => 
              `<li style="margin: 5px 0;"><strong>${cat.name}:</strong> $${cat.amount.toLocaleString()}</li>`
            ).join('')}
          </ol>
        </div>
        ` : ''}
        
        <p>${netAmount >= 0 
          ? '🎉 Great job! You had a positive cash flow this month.' 
          : '💡 Consider reviewing your expenses to improve your cash flow next month.'
        }</p>
        
        <p>Keep up the great work tracking your finances!</p>
        <p><strong>Personal Finance Tracker Team</strong></p>
      </div>
    `;

    return await this.sendEmail(user.email, subject, htmlContent);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const subject = 'Reset Your Password - Personal Finance Tracker';
    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #2c3e50;">🔐 Password Reset Request</h1>
        <p>Hi ${user.first_name || user.name},</p>
        <p>We received a request to reset your password for your Personal Finance Tracker account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset My Password
          </a>
        </div>
        
        <p style="color: #6c757d; font-size: 14px;">
          This link will expire in 1 hour for security reasons.<br>
          If you didn't request a password reset, please ignore this email.
        </p>
        
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${resetLink}</p>
        
        <p>Best regards,<br><strong>Personal Finance Tracker Team</strong></p>
      </div>
    `;

    return await this.sendEmail(user.email, subject, htmlContent);
  }

  async sendTransactionAlert(user, transaction) {
    if (transaction.amount < 100) return;
    
    const subject = `💳 Large Transaction Alert - $${transaction.amount.toLocaleString()}`;
    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #2c3e50;">💳 Transaction Alert</h1>
        <p>Hi ${user.first_name || user.name},</p>
        <p>A large transaction was recorded in your account:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #495057;">Transaction Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Amount:</strong> $${transaction.amount.toLocaleString()}</li>
            <li style="margin: 10px 0;"><strong>Type:</strong> ${transaction.type}</li>
            <li style="margin: 10px 0;"><strong>Category:</strong> ${transaction.category_name || 'Uncategorized'}</li>
            <li style="margin: 10px 0;"><strong>Description:</strong> ${transaction.description || 'No description'}</li>
            <li style="margin: 10px 0;"><strong>Date:</strong> ${new Date(transaction.transaction_date).toLocaleDateString()}</li>
          </ul>
        </div>
        
        <p style="color: #6c757d; font-size: 14px;">
          If this transaction wasn't made by you, please review your account immediately.
        </p>
        
        <p>Best regards,<br><strong>Personal Finance Tracker Team</strong></p>
      </div>
    `;

    return await this.sendEmail(user.email, subject, htmlContent);
  }
}

module.exports = NotificationService;