import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import '../styles/Login.css';

const ResetPassword = () => {
    const { token } = useParams();
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (formData.newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('http://localhost:3000/api/users/reset-password', {
                token, // This comes from useParams
                newPassword: formData.newPassword
            });

            toast.success(response.data.message || "Password reset successfully!");
            navigate('/login');
        } catch (error) {
            const errorMessage = error.response?.data?.error ||
                error.response?.data?.message ||
                'Password reset failed. The link may have expired.';
            toast.error(errorMessage);

            if (error.response?.status === 400) {
                setTimeout(() => navigate('/login'), 3000);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-content">
                    <div className="login-header">
                        <h1 className="login-title">colorlib.</h1>
                        <h2 className="login-subtitle">Reset Password</h2>
                        <p className="login-description">Enter your new password below</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="newPassword" className="form-label">New Password</label>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                value={formData.newPassword}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="••••••••"
                                required
                                minLength="8"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="••••••••"
                                required
                                minLength="8"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="login-button"
                        >
                            {loading ? (
                                <span className="button-loading">
                                    <span className="spinner"></span>
                                    Resetting...
                                </span>
                            ) : 'Reset Password'}
                        </button>
                    </form>


                </div>
            </div>
        </div>
    );
};

export default ResetPassword;