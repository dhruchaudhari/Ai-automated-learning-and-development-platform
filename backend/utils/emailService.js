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
transporter.verify(function(error, success) {
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
            from: `"Bisag1" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Verify Your Email - OTP Required',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">Verify Your Email</h1>
                    </div>
                    <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;">
                        <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>,</p>
                        <p style="color: #333; font-size: 16px;">Thank you for registering! Your verification OTP is:</p>
                        <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; border: 2px dashed #667eea; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <h2 style="color: #667eea; font-size: 36px; letter-spacing: 15px; margin: 0; font-weight: bold;">${otp}</h2>
                        </div>
                        <p style="color: #333; font-size: 16px; margin-bottom: 10px;">This OTP will expire in <strong style="color: #e53e3e;">5 minutes</strong>.</p>
                        <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
                        <p style="color: #718096; font-size: 12px; text-align: center;">
                            For security reasons, do not share this OTP with anyone.<br>From Bisag1 By Lavya Workshop
                        </p>
                    </div>
                    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; background: #f7fafc; border-radius: 0 0 10px 10px;">
                        <p>© ${new Date().getFullYear()} Bisag1. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent to ${email}`);
        console.log(`📧 Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Error sending email to ${email}:`, error.message);
        return { success: false, error: error.message };
    }
};

// Send password reset email
const sendPasswordResetEmail = async (email, otp, name) => {
    try {
        const mailOptions = {
            from: `"Bisag1" <${process.env.SMTP_USER}>`,
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
                        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.<br>From Bisag1 By Lavya Workshop</p>
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
            from: `"Bisag1" <${process.env.SMTP_USER}>`,
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
                            <h3 style="color: #2d3748; margin-top: 0; margin-bottom: 10px;">Your Account Details:</h3>
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
                            From Bisag1 By Lavya Workshop
                        </p>
                    </div>
                    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; background: #f7fafc; border-radius: 0 0 10px 10px;">
                        <p>© ${new Date().getFullYear()} Bisag1. All rights reserved.</p>
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

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendForgotEmail,
    transporter
};