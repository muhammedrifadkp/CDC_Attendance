const nodemailer = require('nodemailer');
// Ensure environment variables are loaded
require('dotenv').config();

/**
 * Email Service for sending teacher credentials and other notifications
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on environment configuration
   */
  initializeTransporter() {
    try {
      // Debug environment variables
      console.log('🔍 Email Service Debug:');
      console.log('EMAIL_ENABLED:', process.env.EMAIL_ENABLED);
      console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
      console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
      console.log('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? '✅ Set' : '❌ Not set');

      // Check if email is enabled
      if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
        console.log('Email service is disabled. Set EMAIL_ENABLED=true to enable.');
        return;
      }

      // Gmail configuration (most common)
      if (process.env.EMAIL_SERVICE === 'gmail') {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD // Use App Password, not regular password
          }
        });
      }
      // Outlook/Hotmail configuration
      else if (process.env.EMAIL_SERVICE === 'outlook') {
        this.transporter = nodemailer.createTransport({
          service: 'hotmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
      }
      // Custom SMTP configuration
      else if (process.env.EMAIL_SERVICE === 'smtp') {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
      }
      // Development/Testing with Ethereal Email (only if no specific service is configured)
      else if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_SERVICE) {
        this.createTestAccount();
        return;
      }

      console.log('Email transporter initialized successfully');
    } catch (error) {
      console.error('Error initializing email transporter:', error);
    }
  }

  /**
   * Create test account for development (Ethereal Email)
   */
  async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      console.log('Test email account created:');
      console.log('User:', testAccount.user);
      console.log('Pass:', testAccount.pass);
      console.log('Preview URL: https://ethereal.email');
    } catch (error) {
      console.error('Error creating test email account:', error);
    }
  }

  /**
   * Verify email transporter connection
   */
  async verifyConnection() {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    try {
      await this.transporter.verify();
      console.log('Email server connection verified');
      return true;
    } catch (error) {
      console.error('Email server connection failed:', error);
      throw error;
    }
  }

  /**
   * Generate welcome email template for new teacher
   */
  generateTeacherWelcomeEmail(teacherData) {
    const { name, email, employeeId, password, department } = teacherData;

    // Get frontend URL from environment variables
    const frontendUrl = process.env.FRONTEND_URL || 'https://cdc-attendance-com.vercel.app';
    
    const subject = 'Welcome to CDC Attendance System - Your Login Credentials';
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CDC</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626, #ec4899); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials-box { background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .credential-item { margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
            .credential-label { font-weight: bold; color: #374151; }
            .credential-value { font-family: monospace; color: #dc2626; font-size: 16px; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to CDC Attendance System</h1>
                <p>Your teacher account has been created successfully!</p>
            </div>
            
            <div class="content">
                <h2>Hello ${name},</h2>
                
                <p>Welcome to the CDC (CADD Centre) Attendance Management System! Your teacher account has been created and you can now access the system using the credentials below.</p>
                
                <div class="credentials-box">
                    <h3>Your Login Credentials</h3>
                    
                    <div class="credential-item">
                        <div class="credential-label">Full Name:</div>
                        <div class="credential-value">${name}</div>
                    </div>
                    
                    <div class="credential-item">
                        <div class="credential-label">Employee ID:</div>
                        <div class="credential-value">${employeeId}</div>
                    </div>
                    
                    <div class="credential-item">
                        <div class="credential-label">Email Address:</div>
                        <div class="credential-value">${email}</div>
                    </div>
                    
                    <div class="credential-item">
                        <div class="credential-label">Department:</div>
                        <div class="credential-value">${department.name} (${department.code})</div>
                    </div>
                    
                    <div class="credential-item">
                        <div class="credential-label">Temporary Password:</div>
                        <div class="credential-value">${password}</div>
                    </div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important Security Notice:</strong>
                    <ul>
                        <li>This is a temporary password. Please change it immediately after your first login.</li>
                        <li>You can login using either your email address or Employee ID.</li>
                        <li>Keep your credentials secure and do not share them with anyone.</li>
                    </ul>
                </div>
                
                <h3>How to Login:</h3>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${frontendUrl}" class="button" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold;">
                        🚀 Access CDC Attendance System
                    </a>
                    <p style="margin: 10px 0; color: #666; font-size: 14px;">
                        Click the button above or visit: <a href="${frontendUrl}" style="color: #dc2626;">${frontendUrl}</a>
                    </p>
                </div>

                <ol>
                    <li>Visit the CDC Attendance System login page using the link above</li>
                    <li>Select "Teacher Login"</li>
                    <li>Enter either your <strong>Email</strong> (${email}) or <strong>Employee ID</strong> (${employeeId})</li>
                    <li>Enter your temporary password: <code>${password}</code></li>
                    <li>Click "Sign In"</li>
                    <li><strong>Important:</strong> Change your password immediately after login</li>
                </ol>
                
                <div class="footer">
                    <p>If you have any questions or need assistance, please contact the system administrator.</p>
                    <p><strong>CDC Attendance Management System</strong><br>
                    This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    const textContent = `
Welcome to CDC Attendance System

Hello ${name},

Your teacher account has been created successfully!

Login Credentials:
- Full Name: ${name}
- Employee ID: ${employeeId}
- Email: ${email}
- Department: ${department.name} (${department.code})
- Temporary Password: ${password}

IMPORTANT: This is a temporary password. Please change it immediately after your first login.

How to Login:
1. Visit the CDC Attendance System login page: ${frontendUrl}
2. Select "Teacher Login"
3. Enter either your Email (${email}) or Employee ID (${employeeId})
4. Enter your temporary password: ${password}
5. Click "Sign In"
6. Change your password immediately after login

Login URL: ${frontendUrl}

You can login using either your email address or Employee ID.

If you have any questions, please contact the system administrator.

CDC Attendance Management System
This is an automated message. Please do not reply to this email.
    `;

    return {
      subject,
      html: htmlContent,
      text: textContent
    };
  }

  /**
   * Send welcome email to new teacher
   */
  async sendTeacherWelcomeEmail(teacherData) {
    if (!this.transporter) {
      console.log('Email service not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      // Validate required teacher data
      if (!teacherData.email || !teacherData.name) {
        throw new Error('Teacher email and name are required');
      }

      const emailTemplate = this.generateTeacherWelcomeEmail(teacherData);

      const mailOptions = {
        from: `"CDC Attendance System" <${process.env.EMAIL_USER}>`,
        to: teacherData.email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html
      };

      // Verify connection before sending
      await this.verifyConnection();

      const info = await this.transporter.sendMail(mailOptions);

      console.log('Welcome email sent successfully:', info.messageId);

      // For development, log the preview URL
      if (process.env.NODE_ENV === 'development') {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return {
        success: false,
        message: error.message,
        errorType: error.code || 'EMAIL_SEND_ERROR'
      };
    }
  }

  // Send password change OTP email
  async sendPasswordChangeOTP(userData) {
    try {
      if (!this.transporter) {
        console.log('Email service not configured. OTP email not sent.');
        return { success: false, message: 'Email service not configured' };
      }

      const { name, email, otp } = userData;

      const mailOptions = {
        from: `"CDC Attendance System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Change Verification - OTP Required',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Change OTP</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
              .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
              .otp-box { background: #f8f9fa; border: 2px dashed #dc2626; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
              .otp-code { font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 8px; font-family: 'Courier New', monospace; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🔐 CDC</div>
                <h1>Password Change Verification</h1>
                <p>Secure your account with OTP verification</p>
              </div>

              <h2>Hello ${name},</h2>

              <p>You have requested to change your password for your CDC Attendance System account. For security purposes, please verify this action using the OTP below:</p>

              <div class="otp-box">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #666;">Your Verification Code:</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Valid for 10 minutes</p>
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This OTP is valid for <strong>10 minutes only</strong></li>
                  <li>Never share this code with anyone</li>
                  <li>If you didn't request this change, please contact support immediately</li>
                  <li>Use this code only on the CDC Attendance System website</li>
                </ul>
              </div>

              <p><strong>What happens next?</strong></p>
              <ol>
                <li>Enter this OTP on the password change page</li>
                <li>Set your new password</li>
                <li>Your account will be secured with the new password</li>
              </ol>

              <div class="footer">
                <p><strong>CDC Attendance Management System</strong></p>
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>If you need assistance, please contact your system administrator.</p>
                <p style="font-size: 12px; color: #999;">
                  Sent on ${new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Kolkata',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} IST
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Password change OTP sent successfully: ${info.messageId}`);

      return {
        success: true,
        message: 'OTP sent successfully',
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
      };

    } catch (error) {
      console.error('Error sending password change OTP:', error);
      return {
        success: false,
        message: error.message || 'Failed to send OTP email'
      };
    }
  }

  // Send password reset OTP email (for forgot password)
  async sendPasswordResetOTP(userData) {
    try {
      if (!this.transporter) {
        console.log('Email service not configured. Password reset OTP email not sent.');
        return { success: false, message: 'Email service not configured' };
      }

      const { name, email, otp } = userData;

      const mailOptions = {
        from: `"CDC Attendance System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Verification - OTP Required',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset OTP</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
              .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
              .otp-box { background: #f8f9fa; border: 2px dashed #dc2626; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
              .otp-code { font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 8px; font-family: 'Courier New', monospace; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
              .reset-info { background: #e3f2fd; border: 1px solid #2196f3; color: #1976d2; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🔑 CDC</div>
                <h1>Password Reset Request</h1>
                <p>Reset your account password securely</p>
              </div>

              <h2>Hello ${name},</h2>

              <p>You have requested to reset your password for your CDC Attendance System account. To proceed with the password reset, please use the verification code below:</p>

              <div class="otp-box">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #666;">Your Password Reset Code:</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Valid for 10 minutes</p>
              </div>

              <div class="reset-info">
                <strong>🔄 Password Reset Process:</strong>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Enter this OTP on the password reset page</li>
                  <li>Create a new secure password</li>
                  <li>Confirm your new password</li>
                  <li>Your account will be updated with the new password</li>
                </ol>
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This OTP is valid for <strong>10 minutes only</strong></li>
                  <li>Never share this code with anyone</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Use this code only on the CDC Attendance System website</li>
                  <li>Your current password remains active until you complete the reset</li>
                </ul>
              </div>

              <p><strong>Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your account remains secure and no changes will be made.</p>

              <div class="footer">
                <p><strong>CDC Attendance Management System</strong></p>
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>If you need assistance, please contact your system administrator.</p>
                <p style="font-size: 12px; color: #999;">
                  Sent on ${new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Kolkata',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} IST
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Password reset OTP sent successfully: ${info.messageId}`);

      return {
        success: true,
        message: 'Password reset OTP sent successfully',
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
      };

    } catch (error) {
      console.error('Error sending password reset OTP:', error);
      return {
        success: false,
        message: error.message || 'Failed to send password reset OTP email'
      };
    }
  }

  // Send admin welcome email
  async sendAdminWelcomeEmail(adminData) {
    try {
      if (!this.transporter) {
        console.log('Email service not configured. Admin welcome email not sent.');
        return { success: false, message: 'Email service not configured' };
      }

      const { name, email, password, role } = adminData;

      // Get frontend URL from environment variables
      const frontendUrl = process.env.FRONTEND_URL || 'https://cdc-attendance-com.vercel.app';

      const mailOptions = {
        from: `"CDC Attendance System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to CDC Attendance System - Admin Access',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to CDC - Admin Access</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
              .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
              .credentials-box { background: #f8f9fa; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .credential-item { margin: 10px 0; padding: 8px; background: white; border-radius: 4px; border-left: 4px solid #dc2626; }
              .password-highlight { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #dc2626; background: #fff3cd; padding: 8px; border-radius: 4px; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
              .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
              .admin-badge { background: #dc2626; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🛡️ CDC</div>
                <h1>Welcome to CDC Attendance System</h1>
                <span class="admin-badge">ADMINISTRATOR ACCESS</span>
                <p>Complete system administration privileges</p>
              </div>

              <h2>Hello ${name},</h2>

              <p>Welcome to the CDC Attendance Management System! You have been granted <strong>Administrator</strong> access with full system privileges.</p>

              <div class="credentials-box">
                <h3 style="margin-top: 0; color: #dc2626;">🔐 Your Login Credentials</h3>

                <div class="credential-item">
                  <strong>👤 Name:</strong> ${name}
                </div>

                <div class="credential-item">
                  <strong>📧 Email:</strong> ${email}
                </div>

                <div class="credential-item">
                  <strong>🔑 Password:</strong><br>
                  <div class="password-highlight">${password}</div>
                </div>

                <div class="credential-item">
                  <strong>👑 Role:</strong> <span style="color: #dc2626; font-weight: bold;">${role}</span>
                </div>
              </div>

              <div class="warning">
                <strong>🔒 Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This is your temporary password - please change it after first login</li>
                  <li>As an administrator, you have full access to all system features</li>
                  <li>Keep your credentials secure and never share them</li>
                  <li>You can manage teachers, students, departments, and system settings</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${frontendUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold;">
                  🚀 Access Admin Dashboard
                </a>
                <p style="margin: 10px 0; color: #666; font-size: 14px;">
                  Click the button above or visit: <a href="${frontendUrl}" style="color: #dc2626;">${frontendUrl}</a>
                </p>
              </div>

              <h3>🚀 Getting Started:</h3>
              <ol>
                <li><strong>Login:</strong> Use your email and the password above at ${frontendUrl}</li>
                <li><strong>Change Password:</strong> Go to Profile → Change Password</li>
                <li><strong>Explore:</strong> Access admin dashboard and all management features</li>
                <li><strong>Manage:</strong> Add teachers, create departments, monitor attendance</li>
              </ol>

              <h3>📋 Administrator Capabilities:</h3>
              <ul>
                <li>✅ Manage Teachers and Students</li>
                <li>✅ Create and Manage Departments</li>
                <li>✅ Monitor Attendance Reports</li>
                <li>✅ System Configuration</li>
                <li>✅ User Account Management</li>
                <li>✅ Full System Access</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <p><strong>Ready to get started?</strong></p>
                <p style="color: #666;">Login to your admin dashboard and begin managing the system!</p>
              </div>

              <div class="footer">
                <p><strong>CDC Attendance Management System</strong></p>
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>If you need assistance, please contact your system administrator.</p>
                <p style="font-size: 12px; color: #999;">
                  Sent on ${new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Kolkata',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} IST
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Admin welcome email sent successfully: ${info.messageId}`);

      return {
        success: true,
        message: 'Admin welcome email sent successfully',
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
      };

    } catch (error) {
      console.error('Error sending admin welcome email:', error);
      return {
        success: false,
        message: error.message || 'Failed to send admin welcome email'
      };
    }
  }

  // Send notification email to teachers
  async sendNotificationEmail(data) {
    try {
      if (!this.transporter) {
        console.log('Email service not configured. Notification email not sent.');
        return { success: false, message: 'Email service not configured' };
      }

      const { teacher, notification } = data;

      // Priority colors and icons
      const priorityConfig = {
        urgent: { color: '#dc2626', icon: '🚨', bgColor: '#fef2f2' },
        high: { color: '#ea580c', icon: '⚠️', bgColor: '#fff7ed' },
        medium: { color: '#2563eb', icon: 'ℹ️', bgColor: '#eff6ff' },
        low: { color: '#059669', icon: '📝', bgColor: '#f0fdf4' }
      };

      // Type configurations
      const typeConfig = {
        leave: { title: 'Leave Notification', icon: '🏖️' },
        announcement: { title: 'Important Announcement', icon: '📢' },
        urgent: { title: 'Urgent Notice', icon: '🚨' },
        warning: { title: 'Warning Notice', icon: '⚠️' },
        info: { title: 'Information', icon: 'ℹ️' }
      };

      const priority = priorityConfig[notification.priority] || priorityConfig.medium;
      const type = typeConfig[notification.type] || typeConfig.info;

      const mailOptions = {
        from: `"CDC Administration" <${process.env.EMAIL_USER}>`,
        to: teacher.email,
        subject: `${priority.icon} ${type.title}: ${notification.title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CDC Notification</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
              .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
              .priority-badge {
                display: inline-block;
                background: ${priority.color};
                color: white;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                margin: 10px 0;
              }
              .notification-box {
                background: ${priority.bgColor};
                border: 2px solid ${priority.color};
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .notification-title {
                font-size: 20px;
                font-weight: bold;
                color: ${priority.color};
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .notification-message {
                font-size: 16px;
                line-height: 1.6;
                color: #374151;
                white-space: pre-wrap;
              }
              .meta-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                border-left: 4px solid #dc2626;
              }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
              .dashboard-link {
                display: inline-block;
                background: #dc2626;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
              }
              .urgent-banner {
                background: #fef2f2;
                border: 2px solid #dc2626;
                color: #dc2626;
                padding: 10px;
                text-align: center;
                font-weight: bold;
                border-radius: 5px;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🏢 CDC</div>
                <h1>Notification from Administration</h1>
                <p>CDC Attendance Management System</p>
              </div>

              ${notification.priority === 'urgent' ? '<div class="urgent-banner">🚨 URGENT NOTIFICATION - IMMEDIATE ATTENTION REQUIRED</div>' : ''}

              <h2>Hello ${teacher.name},</h2>

              <p>You have received a new notification from the CDC Administration team.</p>

              <div class="notification-box">
                <div class="notification-title">
                  <span>${type.icon}</span>
                  <span>${notification.title}</span>
                </div>
                <span class="priority-badge">${priority.icon} ${notification.priority.toUpperCase()} PRIORITY</span>
                <div class="notification-message">${notification.message}</div>
              </div>

              <div class="meta-info">
                <p><strong>📅 Sent:</strong> ${new Date(notification.createdAt).toLocaleString('en-US', {
                  timeZone: 'Asia/Kolkata',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} IST</p>
                <p><strong>👤 From:</strong> ${notification.createdBy} (Administrator)</p>
                <p><strong>📋 Type:</strong> ${type.title}</p>
              </div>

              <div style="text-align: center;">
                <p><strong>View this notification in your dashboard:</strong></p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="dashboard-link">
                  Open Teacher Dashboard
                </a>
              </div>

              ${notification.priority === 'urgent' ?
                '<div style="background: #fef2f2; border: 1px solid #dc2626; color: #dc2626; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;"><strong>⚠️ This is an urgent notification. Please take immediate action as required.</strong></div>'
                : ''
              }

              <div class="footer">
                <p><strong>CDC Attendance Management System</strong></p>
                <p>This is an automated notification from the administration team.</p>
                <p>Please check your teacher dashboard for more details and to mark this notification as read.</p>
                <p style="font-size: 12px; color: #999;">
                  Sent on ${new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Kolkata',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} IST
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Notification email sent to ${teacher.email}: ${info.messageId}`);

      return {
        success: true,
        message: 'Notification email sent successfully',
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
      };

    } catch (error) {
      console.error('Error sending notification email:', error);
      return {
        success: false,
        message: error.message || 'Failed to send notification email'
      };
    }
  }

  /**
   * Send notification email to teacher
   */
  async sendNotificationEmail({ teacher, notification }) {
    if (!this.transporter) {
      console.log('Email service not configured. Skipping notification email.');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      // Validate required data
      if (!teacher.email || !teacher.name || !notification.title) {
        throw new Error('Teacher email, name, and notification title are required');
      }

      const priorityColors = {
        low: '#10b981',
        medium: '#f59e0b',
        high: '#ef4444',
        urgent: '#dc2626'
      };

      const typeIcons = {
        info: '📢',
        warning: '⚠️',
        urgent: '🚨',
        announcement: '📣',
        reminder: '⏰'
      };

      const mailOptions = {
        from: `"CDC Attendance System" <${process.env.EMAIL_USER}>`,
        to: teacher.email,
        subject: `[${notification.priority.toUpperCase()}] ${notification.title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CDC Notification</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              .header { background: ${priorityColors[notification.priority] || '#dc2626'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
              .priority-badge { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
              .message-box { background: #f8f9fa; border-left: 4px solid ${priorityColors[notification.priority] || '#dc2626'}; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div style="font-size: 32px; margin-bottom: 10px;">${typeIcons[notification.type] || '📢'}</div>
                <h1>${notification.title}</h1>
                <span class="priority-badge">${notification.priority.toUpperCase()} PRIORITY</span>
              </div>

              <h2>Hello ${teacher.name},</h2>

              <div class="message-box">
                <p style="margin: 0; white-space: pre-line;">${notification.message}</p>
              </div>

              <div style="margin: 20px 0; padding: 15px; background: #e3f2fd; border-radius: 5px;">
                <p style="margin: 0; font-size: 14px; color: #1976d2;">
                  <strong>📅 Sent:</strong> ${new Date(notification.createdAt).toLocaleString('en-US', {
                    timeZone: 'Asia/Kolkata',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} IST<br>
                  <strong>👤 From:</strong> ${notification.createdBy}
                </p>
              </div>

              <div class="footer">
                <p><strong>CDC Attendance Management System</strong></p>
                <p>This is an automated notification. Please do not reply to this email.</p>
                <p>Login to the system to view all notifications and updates.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`Notification email sent to ${teacher.email}:`, info.messageId);

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
      };

    } catch (error) {
      console.error(`Error sending notification email to ${teacher.email}:`, error);
      return {
        success: false,
        message: error.message,
        errorType: error.code || 'NOTIFICATION_EMAIL_ERROR'
      };
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
