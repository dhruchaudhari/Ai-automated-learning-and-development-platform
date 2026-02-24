// const nodemailer = require('nodemailer');
// require('dotenv').config();

// // Create transporter
// const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: process.env.SMTP_PORT,
//     secure: false,
//     auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS
//     },
//     tls: {
//         rejectUnauthorized: false
//     }
// });

// // Test connection
// transporter.verify(function(error, success) {
//     if (error) {
//         console.log('❌ SMTP Connection Error:', error.message);
//         if (error.code === 'EAUTH') {
//             console.log('⚠️ Please check:');
//             console.log('1. Are you using App Password (not regular password)?');
//             console.log('2. Is SMTP_USER and SMTP_PASS correct in .env?');
//             console.log('3. Are you using the correct SMTP settings for Gmail?');
//         }
//     } else {
//         console.log('✅ SMTP Server is ready to send messages');
//     }
// });

// // Send verification email
// const sendVerificationEmail = async (email, otp, name) => {
//     try {
//         const mailOptions = {
//             from: `"Bisag1" <${process.env.SMTP_USER}>`,
//             to: email,
//             subject: 'Verify Your Email - OTP Required',
//             html: `
//                 <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//                     <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
//                         <h1 style="color: white; margin: 0;">Verify Your Email</h1>
//                     </div>
//                     <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">
//                         <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
//                         <p style="color: #333; font-size: 16px;">Thank you for registering! Your verification OTP is:</p>
//                         <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; border: 2px dashed #667eea; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
//                             <h2 style="color: #667eea; font-size: 36px; letter-spacing: 15px; margin: 0; font-weight: bold;">${otp}</h2>
//                         </div>
//                         <p style="color: #333; font-size: 16px; margin-bottom: 10px;">This OTP will expire in <strong style="color: #e53e3e;">5 minutes</strong>.</p>
//                         <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
//                         <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
//                         <p style="color: #718096; font-size: 12px; text-align: center;">
//                             For security reasons, do not share this OTP with anyone.<br>From Bisag1 By Lavya Workshop
//                         </p>
//                     </div>
//                     <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; background: #f7fafc; border-radius: 0 0 10px 10px;">
//                         <p>© ${new Date().getFullYear()} Bisag1. All rights reserved.</p>
//                     </div>
//                 </div>
//             `
//         };

//         const info = await transporter.sendMail(mailOptions);
//         console.log(`✅ Verification email sent to ${email}`);
//         console.log(`📧 Message ID: ${info.messageId}`);
//         return { success: true, messageId: info.messageId };
//     } catch (error) {
//         console.error(`❌ Error sending email to ${email}:`, error.message);
//         return { success: false, error: error.message };
//     }
// };

// // Send password reset email
// const sendPasswordResetEmail = async (email, otp, name) => {
//     try {
//         const mailOptions = {
//             from: `"Bisag1" <${process.env.SMTP_USER}>`,
//             to: email,
//             subject: 'Password Reset Request',
//             html: `
//                 <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//                     <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
//                         <h1 style="color: white; margin: 0;">Password Reset</h1>
//                     </div>
//                     <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">
//                         <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
//                         <p style="color: #333; font-size: 16px;">We received a request to reset your password. Use this OTP to verify:</p>
//                         <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; border: 2px dashed #f5576c;">
//                             <h2 style="color: #f5576c; font-size: 36px; letter-spacing: 15px; margin: 0;">${otp}</h2>
//                         </div>
//                         <p style="color: #333; font-size: 16px;">This OTP expires in <strong>5 minutes</strong>.</p>
//                         <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.<br>From Bisag1 By Lavya Workshop</p>
//                     </div>
//                 </div>
//             `
//         };

//         const info = await transporter.sendMail(mailOptions);
//         console.log(`✅ Password reset email sent to ${email}`);
//         return { success: true, messageId: info.messageId };
//     } catch (error) {
//         console.error(`❌ Error sending password reset email:`, error.message);
//         return { success: false, error: error.message };
//     }
// };

// // Send forgot email (email recovery)
// const sendForgotEmail = async (email, name, mobile) => {
//     try {
//         // Mask the email for display
//         const maskEmail = (email) => {
//             if (!email || !email.includes('@')) return email;

//             const [namePart, domain] = email.split('@');
//             const maskedName = namePart.length > 2 
//                 ? namePart.charAt(0) + '*'.repeat(namePart.length - 2) + namePart.charAt(namePart.length - 1)
//                 : '*'.repeat(namePart.length);
//             return `${maskedName}@${domain}`;
//         };

//         const maskedEmail = maskEmail(email);

//         const mailOptions = {
//             from: `"Bisag1" <${process.env.SMTP_USER}>`,
//             to: email,
//             subject: 'Your Registered Email Address - Account Recovery',
//             html: `
//                 <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//                     <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
//                         <h1 style="color: white; margin: 0;">Account Email Recovery</h1>
//                     </div>
//                     <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">
//                         <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
//                         <p style="color: #333; font-size: 16px;">We received a request to retrieve your registered email address.</p>

//                         <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4facfe;">
//                             <h3 style="color: #2d3748; margin-top: 0; margin-bottom: 10px;">Your Account Details:</h3>
//                             <p style="margin: 8px 0; color: #4a5568;">
//                                 <strong>Full Name:</strong> ${name}<br>
//                                 <strong>Mobile Number:</strong> ${mobile}<br>
//                                 <strong>Registered Email:</strong> ${maskedEmail}
//                             </p>
//                         </div>

//                         <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; border: 2px solid #4facfe; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
//                             <h2 style="color: #2d3748; font-size: 24px; margin: 0 0 15px 0;">Your Registered Email Address</h2>
//                             <div style="background: #f7fafc; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px dashed #cbd5e0;">
//                                 <code style="font-size: 20px; color: #2d3748; font-weight: bold; letter-spacing: 1px;">${email}</code>
//                             </div>
//                             <p style="color: #4a5568; font-size: 14px; margin: 10px 0 0 0;">
//                                 Use this email to log in to your account
//                             </p>
//                         </div>

//                         <div style="background: #fffaf0; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fed7d7;">
//                             <h4 style="color: #c53030; margin-top: 0; margin-bottom: 10px;">⚠️ Security Notice</h4>
//                             <p style="color: #744210; font-size: 14px; margin: 0;">
//                                 • This email was triggered by a "Forgot Email" request<br>
//                                 • If you didn't request this, please secure your account<br>
//                                 • Never share your email or password with anyone<br>
//                                 • Contact support immediately if you suspect unauthorized access
//                             </p>
//                         </div>

//                         <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
//                             <p style="color: #718096; font-size: 14px; margin-bottom: 5px;">
//                                 <strong>Need Help?</strong><br>
//                                 If you're having trouble logging in or have security concerns, please contact our support team.
//                             </p>
//                         </div>

//                         <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
//                         <p style="color: #718096; font-size: 12px; text-align: center;">
//                             For your security, this email was sent only to your registered email address.<br>
//                             From Bisag1 By Lavya Workshop
//                         </p>
//                     </div>
//                     <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; background: #f7fafc; border-radius: 0 0 10px 10px;">
//                         <p>© ${new Date().getFullYear()} Bisag1. All rights reserved.</p>
//                     </div>
//                 </div>
//             `
//         };

//         const info = await transporter.sendMail(mailOptions);
//         console.log(`✅ Forgot email sent to ${email} for mobile ${mobile}`);
//         console.log(`📧 Message ID: ${info.messageId}`);
//         return { success: true, messageId: info.messageId };
//     } catch (error) {
//         console.error(`❌ Error sending forgot email to ${email}:`, error.message);
//         return { success: false, error: error.message };
//     }
// };

// module.exports = {
//     sendVerificationEmail,
//     sendPasswordResetEmail,
//     sendForgotEmail,
//     transporter
// };

const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test connection
transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ SMTP Connection Error:', error.message);
    if (error.code === 'EAUTH') {
      console.log('⚠️ Please check:');
      console.log('1. Are you using App Password (not regular password)?');
      console.log('2. Is SMTP_USER and SMTP_PASS correct in .env?');
      console.log('3. Are you using the correct SMTP settings for Gmail?');
    }
  } else {
    console.log('✅ SMTP Server is ready to send messages');
  }
});

// Send verification email
const sendVerificationEmail = async (email, otp, name) => {
  try {
    const mailOptions = {
      from: `"Application Portal" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email - OTP Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Verify Your Email</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
            <p style="color: #333; font-size: 16px;">Thank you for registering with our application portal! Your verification OTP is:</p>
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; border: 2px dashed #667eea; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #667eea; font-size: 36px; letter-spacing: 15px; margin: 0; font-weight: bold;">${otp}</h2>
            </div>
            <p style="color: #333; font-size: 16px; margin-bottom: 10px;">This OTP will expire in <strong style="color: #e53e3e;">5 minutes</strong>.</p>
            <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
            <p style="color: #718096; font-size: 12px; text-align: center;">
              For security reasons, do not share this OTP with anyone.<br>
              Application Portal Team
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending email to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

// Send registration confirmation email
const sendRegistrationConfirmation = async (email, name) => {
  try {
    const mailOptions = {
      from: `"Application Portal" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Registration Complete - Application Submitted',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Registration Complete! 🎉</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px;">Dear <strong>${name}</strong>,</p>
            <p style="color: #333; font-size: 16px;">Congratulations! Your application has been successfully submitted and is now under review.</p>
            
            <div style="background: #f0fff4; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #48bb78;">
              <h3 style="color: #22543d; margin-top: 0;">What Happens Next?</h3>
              <ul style="color: #2d3748;">
                <li>Your application will be reviewed by our admin team</li>
                <li>You will be notified about the status via email</li>
                <li>Check your application status in your dashboard</li>
                <li>Keep your login credentials secure</li>
              </ul>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border: 2px solid #e2e8f0; text-align: center;">
              <h3 style="color: #2d3748; margin-top: 0;">Application Timeline</h3>
              <p style="color: #4a5568;">
                <strong>Review Period:</strong> 5-7 business days<br>
                <strong>Status Updates:</strong> Will be sent via email<br>
                <strong>Contact Support:</strong> support@applicationportal.com
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" 
                 style="background: #48bb78; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Your Dashboard
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #718096; font-size: 12px; text-align: center;">
              This is an automated email. Please do not reply to this message.<br>
              Application Portal Team
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Registration confirmation sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending registration confirmation:`, error.message);
    return { success: false, error: error.message };
  }
};

// Send status update email
const sendStatusUpdateEmail = async (email, name, status, notes = '') => {
  try {
    const statusColors = {
      'approved': '#48bb78',
      'rejected': '#f56565',
      'shortlisted': '#4299e1',
      'pending': '#ed8936'
    };

    const statusMessages = {
      'approved': 'Congratulations! Your application has been approved.',
      'rejected': 'We regret to inform you that your application has been rejected.',
      'shortlisted': 'Great news! Your application has been shortlisted.',
      'pending': 'Your application is still under review.'
    };

    const color = statusColors[status] || '#718096';

    const mailOptions = {
      from: `"Application Portal" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Application Status Update: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, ${color} 0%, ${color}99 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Application Status Update</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px;">Dear <strong>${name}</strong>,</p>
            <p style="color: #333; font-size: 18px; font-weight: bold; color: ${color};">
              ${statusMessages[status]}
            </p>
            
            ${notes ? `
            <div style="background: #fffaf0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ed8936;">
              <h4 style="color: #744210; margin-top: 0;">Admin Notes:</h4>
              <p style="color: #744210; margin: 0;">${notes}</p>
            </div>
            ` : ''}
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0;">
              <h3 style="color: #2d3748; margin-top: 0;">Current Status: 
                <span style="color: ${color}; font-weight: bold;">
                  ${status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </h3>
              <p style="color: #4a5568;">
                <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
                <strong>Time:</strong> ${new Date().toLocaleTimeString()}
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" 
                 style="background: ${color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Your Dashboard
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #718096; font-size: 12px; text-align: center;">
              This is an automated status update. For queries, contact our support team.<br>
              Application Portal Team
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Status update sent to ${email}: ${status}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending status update:`, error.message);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, otp, name) => {
  try {
    const mailOptions = {
      from: `"Application Portal" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
            <p style="color: #333; font-size: 16px;">We received a request to reset your password. Use this OTP to verify:</p>
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; border: 2px dashed #f5576c;">
              <h2 style="color: #f5576c; font-size: 36px; letter-spacing: 15px; margin: 0;">${otp}</h2>
            </div>
            <p style="color: #333; font-size: 16px;">This OTP expires in <strong>5 minutes</strong>.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.<br>From Application Portal Team</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending password reset email:`, error.message);
    return { success: false, error: error.message };
  }
};

// Send forgot email (email recovery)
const sendForgotEmail = async (email, name, mobile) => {
  try {
    // Mask the email for display
    const maskEmail = (email) => {
      if (!email || !email.includes('@')) return email;

      const [namePart, domain] = email.split('@');
      const maskedName = namePart.length > 2
        ? namePart.charAt(0) + '*'.repeat(namePart.length - 2) + namePart.charAt(namePart.length - 1)
        : '*'.repeat(namePart.length);
      return `${maskedName}@${domain}`;
    };

    const maskedEmail = maskEmail(email);

    const mailOptions = {
      from: `"Application Portal" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Registered Email Address - Account Recovery',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Account Email Recovery</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
            <p style="color: #333; font-size: 16px;">We received a request to retrieve your registered email address.</p>
            
            <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4facfe;">
              <h3 style="color: #2d3748; margin-top: 0;">Your Account Details:</h3>
              <p style="margin: 8px 0; color: #4a5568;">
                <strong>Full Name:</strong> ${name}<br>
                <strong>Mobile Number:</strong> ${mobile}<br>
                <strong>Registered Email:</strong> ${maskedEmail}
              </p>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; border: 2px solid #4facfe; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #2d3748; font-size: 24px; margin: 0 0 15px 0;">Your Registered Email Address</h2>
              <div style="background: #f7fafc; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px dashed #cbd5e0;">
                <code style="font-size: 20px; color: #2d3748; font-weight: bold; letter-spacing: 1px;">${email}</code>
              </div>
              <p style="color: #4a5568; font-size: 14px; margin: 10px 0 0 0;">
                Use this email to log in to your account
              </p>
            </div>
            
            <div style="background: #fffaf0; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fed7d7;">
              <h4 style="color: #c53030; margin-top: 0; margin-bottom: 10px;">⚠️ Security Notice</h4>
              <p style="color: #744210; font-size: 14px; margin: 0;">
                • This email was triggered by a "Forgot Email" request<br>
                • If you didn't request this, please secure your account<br>
                • Never share your email or password with anyone<br>
                • Contact support immediately if you suspect unauthorized access
              </p>
            </div>
            
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #718096; font-size: 14px; margin-bottom: 5px;">
                <strong>Need Help?</strong><br>
                If you're having trouble logging in or have security concerns, please contact our support team.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
            <p style="color: #718096; font-size: 12px; text-align: center;">
              For your security, this email was sent only to your registered email address.<br>
              Application Portal Team
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; background: #f7fafc; border-radius: 0 0 10px 10px;">
            <p>© ${new Date().getFullYear()} Application Portal. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Forgot email sent to ${email} for mobile ${mobile}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending forgot email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Send interview invite email
const sendInterviewInviteEmail = async (email, name, scheduledDate, panelName, advertisementTitle, location, helpline, userDetails = {}) => {
  try {
    const formattedDate = new Date(scheduledDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedDob = userDetails.dob ? new Date(userDetails.dob).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A';

    const serverUrl = process.env.BASE_URL || 'http://localhost:5000';
    const profileImageUrl = userDetails.profileImage
      ? (userDetails.profileImage.startsWith('http') ? userDetails.profileImage : `${serverUrl}${userDetails.profileImage}`)
      : null;

    const mailOptions = {
      from: `"Lavya Workshop - Interview Team" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Interview Invitation - ${advertisementTitle || 'Position'}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; box-shadow: 0 40px 100px rgba(79, 70, 229, 0.15); border: 2px solid #eef2ff;">
          <!-- Vibrant Premium Header -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #4338ca 100%); padding: 60px 40px; text-align: center; position: relative;">
            <!-- Decorative Elements -->
            <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
            
            <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -0.04em; text-shadow: 0 4px 12px rgba(0,0,0,0.15);">Interview Invitation</h1>
            <p style="color: #e0e7ff; margin: 15px 0 0 0; font-size: 17px; font-weight: 600; letter-spacing: 0.02em;">Shape your professional journey with Lavya Workshop</p>
          </div>
          
          <div style="padding: 50px 40px; background: linear-gradient(to bottom, #ffffff, #f8faff);">
            <!-- Profile Section -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 28px; font-weight: 800; letter-spacing: -0.03em;">${name}</h2>
              <div style="display: inline-block; padding: 6px 16px; background: #eef2ff; border-radius: 100px; border: 1px solid #e0e7ff;">
                 <p style="margin: 0; color: #4338ca; font-size: 11px; font-weight: 800; letter-spacing: 0.15em;">Interview Candidate</p>
              </div>
            </div>

            <div style="margin-bottom: 40px;">
              <p style="font-size: 18px; margin-bottom: 20px; color: #1e293b; font-weight: 700; font-style: italic;">Dear ${name},</p>
              <p style="font-size: 16px; color: #475569; margin-bottom: 0; line-height: 1.8; font-weight: 500;">
                We are thrilled to extend an official invitation for your upcoming interview. Your background uniquely positions you for success within our dynamic team, and we look forward to exploring your potential contributions.
              </p>
            </div>
            
            <!-- Logistics Card -->
            <div style="background: #ffffff; padding: 35px; border-radius: 30px; margin: 40px 0; border: 1px solid #eef2ff; box-shadow: 0 15px 40px rgba(79, 70, 229, 0.05);">
              <div style="margin-bottom: 30px; border-bottom: 1px solid #f0f4ff; padding-bottom: 15px;">
                <h3 style="color: #4f46e5; margin: 0; font-size: 13px; font-weight: 800; letter-spacing: 0.2em; display: inline-block;">
                  Appointment Logistics
                </h3>
              </div>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 15px 0; color: #94a3b8; font-size: 11px; width: 150px; font-weight: 800; letter-spacing: 0.1em;">Target Position</td>
                  <td style="padding: 15px 0; color: #1e293b; font-weight: 800; font-size: 16px;">${advertisementTitle || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; color: #94a3b8; font-size: 11px; font-weight: 800; letter-spacing: 0.1em;">Interview Window</td>
                  <td style="padding: 15px 0; color: #4f46e5; font-weight: 900; font-size: 20px;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; color: #94a3b8; font-size: 11px; font-weight: 800; letter-spacing: 0.1em;">Corporate Venue</td>
                  <td style="padding: 15px 0; color: #0f172a; font-weight: 700; font-size: 15px; line-height: 1.6;">${location || 'To be announced'}</td>
                </tr>
              </table>
            </div>

            <!-- Concierge Support Card -->
            <div style="background: #0f172a; padding: 35px; border-radius: 30px; color: #ffffff; margin: 40px 0; box-shadow: 0 25px 50px rgba(15, 23, 42, 0.2); position: relative; overflow: hidden;">
               <div style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: rgba(79, 70, 229, 0.1); border-radius: 50%; blur: 40px;"></div>
               <p style="margin: 0 0 15px 0; color: #6366f1; font-size: 11px; font-weight: 800; letter-spacing: 0.2em;">Concierge Support</p>
               <table style="width: 100%;">
                 <tr>
                   <td style="width: 60px;">
                      <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 15px; text-align: center; line-height: 50px; font-size: 20px;">📞</div>
                   </td>
                   <td>
                      <span style="font-size: 26px; font-weight: 800; display: block; letter-spacing: -0.01em; color: #ffffff;">${helpline || 'Not assigned'}</span>
                      <span style="font-size: 10px; color: #475569; font-weight: 700; letter-spacing: 0.15em;">Primary Assistance Line</span>
                   </td>
                 </tr>
               </table>
            </div>

            
            <div style="padding-top: 40px; text-align: center; border-top: 1px solid #f0f4ff;">
              <div style="display: inline-block; padding: 8px 20px; background: #f8faff; border-radius: 100px; border: 1px solid #eef2ff; margin-bottom: 15px;">
                <p style="margin: 0; color: #6366f1; font-size: 10px; font-weight: 800; letter-spacing: 0.2em;">By Lavya Workshop</p>
              </div>
              <p style="color: #64748b; font-size: 12px; margin: 0; font-weight: 600;">Automated Priority Correspondence</p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 40px; background: #f8faff; color: #64748b; font-size: 12px; border-top: 1px solid #eef2ff;">
            <p style="margin: 0; font-weight: 600;">© ${new Date().getFullYear()} Lavya Workshop</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Interview invite email sent to ${email} `);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending interview invite email to ${email}: `, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendRegistrationConfirmation,
  sendStatusUpdateEmail,
  sendPasswordResetEmail,
  sendForgotEmail,
  sendInterviewInviteEmail,
  transporter
};