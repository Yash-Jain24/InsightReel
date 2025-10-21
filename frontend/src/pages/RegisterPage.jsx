import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/register', { username, password });
            localStorage.setItem('token', response.data.token);
            toast.success('Registration successful!');
            navigate('/dashboard');
            window.location.reload();
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Registration failed.');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formContainer}>
                <h1 style={styles.title}>Join InsightReel</h1>
                <p style={styles.subtitle}>Unlock the knowledge within your videos.</p>
                <form onSubmit={handleRegister} style={styles.form}>
                    <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={styles.input} required />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
                    <button type="submit" style={styles.button}>Register</button>
                </form>
                <p style={styles.footerText}>
                    Already have an account? <Link to="/login" style={styles.link}>Log in here</Link>
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'var(--background)',
    },
    formContainer: {
        backgroundColor: 'var(--surface)',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        width: '400px',
        textAlign: 'center',
    },
    title: {
        color: 'var(--on-surface)',
        marginBottom: '10px',
    },
    subtitle: {
        color: 'var(--on-surface-variant)',
        marginBottom: '30px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    input: {
        backgroundColor: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '12px',
        color: 'var(--on-surface)',
        marginBottom: '20px',
        fontSize: '16px',
    },
    button: {
        backgroundColor: 'var(--primary)',
        color: '#000',
        border: 'none',
        borderRadius: '4px',
        padding: '12px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
    },
    footerText: {
        marginTop: '20px',
        color: 'var(--on-surface-variant)',
    },
    link: {
        color: 'var(--secondary)',
        textDecoration: 'none',
    },
};
export default RegisterPage;