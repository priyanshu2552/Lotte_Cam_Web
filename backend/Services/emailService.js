import nodemailer from 'nodemailer';
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // convert to boolean
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false' // default true unless set to false
    }
});

export const sendPasswordResetEmail = async (email, resetUrl) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset</h2>
                <p>You requested a password reset. Click the button below to reset your password:</p>
                <a href="${resetUrl}" 
                   style="display: inline-block; padding: 10px 20px; 
                          background-color: #4CAF50; color: white; 
                          text-decoration: none; border-radius: 4px;
                          margin: 10px 0;">
                    Reset Password
                </a>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request this, please ignore this email.</p>
                <p style="margin-top: 20px; color: #666;">
                    <small>If the button doesn't work, copy and paste this link into your browser:<br>
                    ${resetUrl}</small>
                </p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};