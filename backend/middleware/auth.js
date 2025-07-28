import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export function authenticate(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Fixed env variable
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification error:', error); // Add logging
        res.status(400).json({ error: 'INVALID TOKEN' });
    }
}

export function authorize(roles = []) { // Changed parameter name for clarity
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) { // Fixed variable name
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
}