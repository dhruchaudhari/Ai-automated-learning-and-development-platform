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
                        <p>© ${new Date().getFullYear()} Your Application. All rights reserved.</p>
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

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    transporter
};