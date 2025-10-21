import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Header from '../components/Header';

const SettingsPage = () => {
    const [isEnabled, setIsEnabled] = useState(true);

    useEffect(() => {
        api.get('/settings/transcription').then(res => setIsEnabled(res.data.isTranscriptionEnabled));
    }, []);

    const handleToggle = async () => {
        const newState = !isEnabled;
        setIsEnabled(newState);
        try {
            await api.put('/settings/transcription', { enabled: newState });
            toast.success(`Personal transcription service ${newState ? 'enabled' : 'disabled'}.`);
        } catch (error) {
            toast.error("Failed to update setting.");
            setIsEnabled(!newState); // Revert on error
        }
    };

    return (
        <div>
            <Header />
            <main style={styles.main}>
                <h1>User Settings</h1>
                <div style={styles.settingItem}>
                    <p>Enable personal video transcription</p>
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

export default SettingsPage;