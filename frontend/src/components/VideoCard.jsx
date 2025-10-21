// frontend/src/components/VideoCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaPlayCircle, FaSpinner, FaExclamationTriangle, FaTrash } from 'react-icons/fa';

const VideoCard = ({ video, onDelete }) => {
    const getStatusIcon = () => {
        switch (video.status) {
            case 'completed':
                return <FaPlayCircle color="var(--secondary)" />;
            case 'processing':
                return <FaSpinner className="spin" color="var(--primary)" />;
            case 'failed':
                return <FaExclamationTriangle color="var(--error)" />;
            default:
                return null;
        }
    };

    const handleDelete = (e) => {
        e.preventDefault(); // Prevent navigating to the player page
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${video.title || video.originalFilename}"?`)) {
            onDelete(video._id);
        }
    };

    return (
        <div style={styles.card}>
            <button onClick={handleDelete} style={styles.deleteButton}><FaTrash /></button>
            <Link to={`/video/${video._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={styles.thumbnail}>
                    {getStatusIcon()}
                </div>
                <h3 style={styles.title}>{video.title || video.originalFilename}</h3>
                <p style={styles.status}>Status: {video.status}</p>
            </Link>
        </div>
    );
};

const styles = {
    card: {
        backgroundColor: 'var(--surface)',
        borderRadius: '8px',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'var(--on-surface)',
        transition: 'transform 0.2s',
        position: 'relative',
    },
    deleteButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.5)',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    thumbnail: {
        height: '150px',
        backgroundColor: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '3rem',
    },
    title: {
        fontSize: '1rem',
        margin: '0.5rem 1rem',
    },
    status: {
        fontSize: '0.8rem',
        margin: '0 1rem 0.5rem',
        color: 'var(--on-surface-variant)',
    }
};

export default VideoCard;