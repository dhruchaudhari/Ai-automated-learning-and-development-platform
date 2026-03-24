const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
    console.log('--- Email Configuration Test ---');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);
    // Don't log the full password, but check if it has spaces
    const pass = process.env.SMTP_PASS;
    console.log('Password has spaces:', pass.includes(' '));
    console.log('Password length:', pass.length);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: pass
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Verifying transporter...');
        await transporter.verify();
        console.log('✅ SMTP Server is ready to send messages');

        console.log('Attempting to send a test email...');
        const info = await transporter.sendMail({
            from: `"Test Service" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // Send to self
            subject: 'SMTP Connection Test',
            text: 'This is a test email to verify SMTP configuration.'
        });

        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ SMTP Test Failed');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        if (error.code === 'EAUTH') {
            console.log('Possible solutions:');
            console.log('1. Remove spaces from the App Password in .env if present.');
            console.log('2. Ensure App Password is correct.');
            console.log('3. Enable "Less secure app access" if not using App Password (but App Password is recommended).');
        }
    }
}

testEmail();
