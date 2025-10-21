// frontend/src/components/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCog, FaUserShield, FaSignOutAlt } from 'react-icons/fa';
import { useAuthContext } from '../context/AuthContext';

const Header = () => {
    const { user, logout } = useAuthContext();

    return (
        <header style={styles.header}>
            <Link to="/dashboard" style={styles.logo}>InsightReel</Link>
            <nav style={styles.nav}>
                {/* CONDITIONAL RENDERING: Only show if user exists and role is 'admin' */}
                {user && user.role === 'admin' && (
                    <Link to="/admin" style={styles.navLink}><FaUserShield /> Admin</Link>
                )}
                <Link to="/settings" style={styles.navLink}><FaCog /> Settings</Link>
                <button onClick={logout} style={styles.logoutButton}><FaSignOutAlt /> Logout</button>
            </nav>
        </header>
    );
};

const styles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
    },
    logo: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: 'var(--primary)',
        textDecoration: 'none',
    },
    nav: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
    },
    navLink: {
        color: 'var(--on-surface-variant)',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'color 0.2s',
    },
    logoutButton: {
        backgroundColor: 'transparent',
        border: '1px solid var(--error)',
        color: 'var(--error)',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'background-color 0.2s, color 0.2s',
    },
};

export default Header;