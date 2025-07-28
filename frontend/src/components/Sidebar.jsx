import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './CSS/Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faBoxes, faUser, faClipboardList, faBars } from '@fortawesome/free-solid-svg-icons';

const Sidebar = () => {
    const [user, setUser] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) navigate('/login');
        setUser(userData);

        const checkIfMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // On desktop, sidebar is always open
            if (!mobile) setSidebarOpen(true);
        };

        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    if (!user) return null;

    return (
        <>
            {/* Mobile Menu Button - Always visible on mobile */}
            {isMobile && (
                <button className="mobile-menu-btn" onClick={toggleSidebar}>
                    <FontAwesomeIcon icon={faBars} size="lg" />
                </button>
            )}

            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'open' : ''} ${isMobile ? 'mobile' : ''}`}>
                {/* User Profile Section */}
                <div className="user-profile">
                    <h2>{user.name}</h2>
                    <p className="user-role">Dashboard</p>
                </div>

                {/* Navigation Links */}
                <nav className="nav-menu">
                    <button onClick={() => navigate('/dashboard')}> <NavItem to="/dashboard" text="Home" icon={<FontAwesomeIcon icon={faHome} />} onClick={() => isMobile && setSidebarOpen(false)} /></button>
                    <button onClick={() => navigate('/sku-management')} ><NavItem to="/sku-management" text="SKU Management" icon={<FontAwesomeIcon icon={faBoxes} />} onClick={() => isMobile && setSidebarOpen(false)} /></button>
                    <button onClick={() => navigate('/profile')}><NavItem to="/profile" text="Profile" icon={<FontAwesomeIcon icon={faUser} />} onClick={() => isMobile && setSidebarOpen(false)} /></button>
                    <button onClick={() => navigate('/production-records')}><NavItem to="/production-records" text="Production Record" icon={<FontAwesomeIcon icon={faClipboardList} />} onClick={() => isMobile && setSidebarOpen(false)} /></button>
                </nav>

                {/* Footer with Logout */}
                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                    <div className="app-info">
                        <p>localhost:3007/dashboard</p>
                        <p className="copyright">© {new Date().getFullYear()} chatbot.com</p>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile when sidebar is open */}
            {isMobile && sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}
        </>
    );
};

const NavItem = ({ to, text, icon, onClick }) => (
    <Link
        to={to}
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        onClick={onClick}
    >
        <span className="nav-icon">{icon}</span>
        <span className="nav-text">{text}</span>
    </Link>
);

export default Sidebar;