import pool from "../config/db.js";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { sendPasswordResetEmail } from '../Services/emailService.js'

export default {
    async Login(req, res) {
        try {
            const { email, password } = req.body;
            const [users] = await pool.query(
                'SELECT * FROM users WHERE email=?',
                [email]
            );
            const user = users[0];
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ error: 'INVALID CREDENTIALS' });
            }
            const token = jwt.sign(
                {
                    id: user.id, role: user.role
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' });
            const { password: _, ...userData } = user;
            res.json({ token, user: userData });
        }
        catch (error) {
            res.status(500).json({ error: 'LOGIN FAILED' });
        }
    },

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            const [users] = await pool.query(
                'SELECT id, email FROM users WHERE email = ?',
                [email]
            );

            if (!users.length) {
                
                return res.json({
                    message: 'If the email exists, a reset link has been sent'
                });
            }

            const user = users[0];

          
            await pool.query(
                'UPDATE users SET reset_password_token = NULL, reset_token_expires = NULL WHERE id = ?',
                [user.id]
            );

            
            const resetToken = jwt.sign(
                { id: user.id },
                process.env.JWT_RESET_SECRET,
                { expiresIn: '1h' }
            );

            const expiresAt = new Date(Date.now() + 3600000); // 1 hour

            await pool.query(
                'UPDATE users SET reset_password_token = ?, reset_token_expires = ? WHERE id = ?',
                [resetToken, expiresAt, user.id]
            );

            try {
                const resetUrl = `http://localhost:3001/reset-password/${resetToken}`;
                await sendPasswordResetEmail(user.email, resetUrl);
                return res.json({
                    message: 'If the email exists, a reset link has been sent'
                });
            } catch (emailError) {
                console.error('Email failed:', emailError);
                
                await pool.query(
                    'UPDATE users SET reset_password_token = NULL, reset_token_expires = NULL WHERE id = ?',
                    [user.id]
                );
                return res.status(500).json({
                    error: 'Failed to send reset email. Please try again later.'
                });
            }
        } catch (error) {
            console.error('Password reset error:', error);
            res.status(500).json({
                error: 'Password reset failed',
                details: error.message
            });
        }
    },

    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({ error: 'Token and new password are required' });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters' });
            }

        
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
            } catch (jwtError) {
                return res.status(400).json({ error: 'Invalid or expired token' });
            }

            const [users] = await pool.query(
                'SELECT id FROM users WHERE reset_password_token=? AND reset_token_expires > NOW() AND id=?',
                [token, decoded.id]
            );

            if (!users.length) {
                return res.status(400).json({ error: 'Invalid or expired token' });
            }

            const user = users[0];
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password and clear reset token
            await pool.query(
                'UPDATE users SET password=?, reset_password_token=NULL, reset_token_expires=NULL WHERE id=?',
                [hashedPassword, user.id]
            );

            res.json({ message: "Password reset successfully" });
        } catch (error) {
            console.error('Password reset error:', error);
            res.status(500).json({
                error: 'Password reset failed',
                details: error.message
            });
        }
    }
};