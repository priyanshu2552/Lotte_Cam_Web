import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import '../styles/Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/users/login', {
        email: formData.email,
        password: formData.password
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      if (formData.remember) {
        localStorage.setItem('remember', 'true');
      } else {
        localStorage.removeItem('remember');
      }

      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/users/forgot-password', {
        email: resetEmail
      });

      toast.success(response.data.message || 'Password reset link sent if email exists');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error) {
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to send reset email';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-content">
          {showForgotPassword ? (
            <>
              <div className="login-header">
                <h1 className="login-title">colorlib.</h1>
                <h2 className="login-subtitle">Reset Password</h2>
                <p className="login-description">Enter your email to receive a reset link</p>
              </div>

              <form onSubmit={handleForgotPassword} className="login-form">
                <div className="form-group">
                  <input
                    id="resetEmail"
                    name="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="form-input"
                    placeholder="Your email address"
                    required
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
                      Sending...
                    </span>
                  ) : 'Send Reset Link'}
                </button>

                <div className="form-footer">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="text-link"
                  >
                    <i className="fas fa-arrow-left"></i> Back to Login
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="login-header">
                <h1 className="login-title">colorlib.</h1>
                <h2 className="login-subtitle">Login</h2>
              </div>

              <form onSubmit={handleLogin} className="login-form">
                <div className="form-group">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Your email address"
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Your password"
                    required
                  />
                </div>

                <div className="form-options">
                  <label className="checkbox-container">
                    <input
                      id="remember"
                      name="remember"
                      type="checkbox"
                      checked={formData.remember}
                      onChange={handleChange}
                    />
                    <span className="checkmark"></span>
                    Remember me
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-link"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="login-button"
                >
                  {loading ? (
                    <span className="button-loading">
                      <span className="spinner"></span>
                      Signing in...
                    </span>
                  ) : 'Login'}
                </button>
              </form>




            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;