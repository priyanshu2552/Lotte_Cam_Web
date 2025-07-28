import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
class UserController {
    // In UserController.createUser
    static async createUser(req, res) {
        const { name, email, password, contact, role } = req.body;

        try {
            // Check if user exists
            const [existingUser] = await pool.query(
                "SELECT * FROM users WHERE email = ?",
                [email]
            );

            if (existingUser.length > 0) {
                return res.status(400).json({ error: "User already exists" });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create user
            const [result] = await pool.query(
                `INSERT INTO users 
      (name, email, password, contact, role) 
      VALUES (?, ?, ?, ?, ?)`,
                [name, email, hashedPassword, contact, role || 'user']
            );

            // Return success response without token
            res.status(201).json({
                message: "User created successfully",
                user: {
                    id: result.insertId,
                    name,
                    email,
                    contact,
                    role: role || 'user',
                    // No token here
                }
            });
        } catch (error) {
            console.error("Error creating user:", error);
            res.status(500).json({ error: "Failed to create user" });
        }
    }

    static async getAllUsers(req, res) {
        try {
            const [users] = await pool.query(
                'select id,name,email,contact,role,created_at from users'
            );
            res.json(users);
        } catch (error) {
            console.error("Error fectching users:", error);
            res.status(500).json({ error: "failed to fetch users" });
        }
    }

  static async updateUser(req, res) {
    const { id } = req.params;
    const { name, email, contact, role } = req.body;
    
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    try {
        // Build the update query dynamically based on provided fields
        const fieldsToUpdate = [];
        const params = [];
        
        if (name !== undefined) {
            fieldsToUpdate.push("name = ?");
            params.push(name);
        }
        if (email !== undefined) {
            fieldsToUpdate.push("email = ?");
            params.push(email);
        }
        if (contact !== undefined) {
            fieldsToUpdate.push("contact = ?");
            params.push(contact);
        }
        if (role !== undefined && req.user.role === 'admin') {
            // Only allow admin to update role
            fieldsToUpdate.push("role = ?");
            params.push(role);
        }
        
        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }
        
        params.push(id); // Add id for WHERE clause
        
        const updateQuery = `UPDATE users SET ${fieldsToUpdate.join(", ")} WHERE id = ?`;
        await pool.query(updateQuery, params);
        
        res.json({ message: "User updated successfully" });
    } catch (error) {
        console.error("Error updating user: ", error);
        res.status(500).json({ error: "Failed to update user" });
    }
}
    static async deleteUser(req, res) {
        const { id } = req.params;
        try {
            await pool.query("delete from users where id=?", [id]);
            res.json({ message: "User deleted successfully" });
        } catch (error) {
            console.error("error deleting user: ", error);
            res.status(500).json({ error: "Failed to delete user" })
        }
    }
}

export default UserController;