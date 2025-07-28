import pool from "../config/db.js";
import bcrypt from "bcryptjs";

export default {
    async getProfile(req, res) {
        try {
            const [users] = await pool.query(
                'SELECT id, name, email, contact, role, created_at FROM users WHERE id = ?', 
                [req.user.id]
            );
            
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json(users[0]);
        } catch (error) {
            console.error('Profile fetch error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch profile',
                details: error.message 
            });
        }
    },

    async updateProfile(req, res) {
        try {
            const { name, contact } = req.body;
            const [result] = await pool.query(
                'UPDATE users SET name = ?, contact = ? WHERE id = ?',
                [name, contact, req.user.id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({ message: 'Profile updated successfully' });
        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({ 
                error: 'Profile update failed',
                details: error.message 
            });
        }
    },

    async ChangePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;

            const [users] = await pool.query(
                'SELECT password FROM users WHERE id = ?', 
                [req.user.id]
            );
            
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            const user = users[0];
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            
            if (!isMatch) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }
            
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const [result] = await pool.query(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, req.user.id]
            );
            
            res.json({ message: "Password changed successfully" });
        } catch (error) {
            console.error('Password change error:', error);
            res.status(500).json({ 
                error: 'Password change failed',
                details: error.message 
            });
        }
    }
};