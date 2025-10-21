// frontend/src/components/UploadModal.jsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { FaTimes, FaFileUpload, FaYoutube } from 'react-icons/fa';

const UploadModal = ({ onClose, onUploadSuccess }) => {
    const [uploadType, setUploadType] = useState('file');
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        setProgress(0);

        const toastId = toast.loading('Starting upload...');

        try {
            let response;
            if (uploadType === 'file') {
                if (!file || !title) {
                    throw new Error('Title and file are required.');
                }
                const formData = new FormData();
                formData.append('title', title);
                formData.append('video', file);

                response = await api.post('/videos/upload', formData, {
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percentCompleted);
                        if (percentCompleted < 100) {
                            toast.loading(`Uploading: ${percentCompleted}%`, { id: toastId });
                        } else {
                            toast.loading('Upload complete. Processing video...', { id: toastId });
                        }
                    },
                });
            } else {
                if (!youtubeUrl) {
                    throw new Error('YouTube URL is required.');
                }
                toast.loading('Importing from YouTube... This may take several minutes.', { id: toastId });
                response = await api.post('/videos/from-youtube', { title, youtubeUrl });
            }

            toast.success('Video processed successfully!', { id: toastId });
            onUploadSuccess(response.data);
            onClose();

        } catch (error) {
            toast.error(error.response?.data?.msg || 'An error occurred.', { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button onClick={onClose} style={styles.closeButton}><FaTimes /></button>
                <h2>Upload New Video</h2>
                
                <div style={styles.tabs}>
                    <button onClick={() => setUploadType('file')} style={uploadType === 'file' ? styles.activeTab : styles.tab}><FaFileUpload /> File Upload</button>
                    <button onClick={() => setUploadType('youtube')} style={uploadType === 'youtube' ? styles.activeTab : styles.tab}><FaYoutube /> YouTube URL</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Video Title (optional for YouTube)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={styles.input}
                        required={uploadType === 'file'}
                    />
                    {uploadType === 'file' ? (
                        <input type="file" onChange={(e) => setFile(e.target.files[0])} style={styles.input} accept="video/*,audio/*" required />
                    ) : (
                        <input type="url" placeholder="https://www.youtube.com/watch?v=..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} style={styles.input} required />
                    )}

                    {isUploading && (
                        <div style={styles.progressContainer}>
                            <div style={{...styles.progressBar, width: `${progress}%`}}></div>
                        </div>
                    )}

                    <button type="submit" style={styles.button} disabled={isUploading}>
                        {isUploading ? 'Processing...' : 'Upload & Transcribe'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = { 
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: 'var(--surface)',
        padding: '2rem',
        borderRadius: '8px',
        width: '500px',
        maxWidth: '90%',
        position: 'relative',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    },
    closeButton: {
        position: 'absolute',
        top: '1rem', right: '1rem',
        background: 'none', border: 'none',
        color: 'var(--on-surface-variant)',
        fontSize: '1.5rem',
        cursor: 'pointer',
    },
    tabs: {
        display: 'flex',
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--border)',
    },
    tab: {
        padding: '0.75rem 1rem',
        border: 'none',
        background: 'none',
        color: 'var(--on-surface-variant)',
        cursor: 'pointer',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    activeTab: {
        padding: '0.75rem 1rem',
        border: 'none',
        background: 'none',
        color: 'var(--primary)',
        cursor: 'pointer',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        borderBottom: '2px solid var(--primary)',
    },
    input: {
        width: '100%',
        backgroundColor: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '12px',
        color: 'var(--on-surface)',
        marginBottom: '1rem',
        fontSize: '16px',
    },
    button: {
        width: '100%',
        backgroundColor: 'var(--primary)',
        color: '#000',
        border: 'none',
        borderRadius: '4px',
        padding: '12px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '1rem',
    },
    progressContainer: {
        width: '100%',
        backgroundColor: 'var(--background)',
        borderRadius: '4px',
        overflow: 'hidden',
        marginTop: '1rem',
    },
    progressBar: {
        height: '8px',
        backgroundColor: 'var(--primary)',
        transition: 'width 0.3s ease-in-out',
    }
 };
export default UploadModal;