import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Header from '../components/Header';
import { useAuthContext } from '../context/AuthContext';

const AdminPage = () => {
    const { user } = useAuthContext(); 
    const [isEnabled, setIsEnabled] = useState(true);

    useEffect(() => {
        if (user && user.role === 'admin') {
            api.get('/admin/transcription')
               .then(res => setIsEnabled(res.data.isEnabled));
        }
    }, [user]);

    const handleToggle = async () => {
        const newState = !isEnabled;
        setIsEnabled(newState);
        try {
            await api.put('/admin/transcription', { isEnabled: newState });
            toast.success(`Global transcription service ${newState ? 'enabled' : 'disabled'}.`);
        } catch (error) {
            toast.error("Failed to update setting. You may not be an admin.");
            setIsEnabled(!newState);
        }
    };

    return (
        <div>
            <Header />
            <main style={styles.main}>
                <h1>Admin Panel</h1>
                <div style={styles.settingItem}>
                    <p>Enable **GLOBAL** video transcription for all users</p>
                    <label style={styles.switch}>
                        <input type="checkbox" checked={isEnabled} onChange={handleToggle} />
                        <span className="slider"></span>
                    </label>
                </div>
            </main>
        </div>
    );
};

const styles = {
    main: { maxWidth: '800px', margin: '4rem auto', padding: '0 2rem' },
    settingItem: {
        backgroundColor: 'var(--surface)',
        padding: '1.5rem 2rem',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid var(--border)',
    },
    // The 'switch' and 'slider' styles are now controlled by the classes in index.css
    switch: {
        position: 'relative',
        display: 'inline-block',
        width: '60px',
        height: '34px',
    },
    slider: "slider" // This tells React to use the 'slider' CSS class
};

export default AdminPage;