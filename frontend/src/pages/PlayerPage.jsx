import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Header from '../components/Header';

const PlayerPage = () => {
    const { id } = useParams();
    const [video, setVideo] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const videoRef = useRef(null); // Ref for HTML <video> element
    const location = useLocation();

    useEffect(() => {
        const fetchVideoAndUrl = async () => {
            setIsLoading(true);
            try {
                const videoRes = await api.get(`/videos/${id}`);
                setVideo(videoRes.data);

                // Now also fetch the playable URL for YouTube videos
                const urlRes = await api.get(`/videos/${id}/play`);
                setVideoUrl(urlRes.data.url); // This will be B2 signed URL or YouTube URL
                
            } catch (error) {
                toast.error(error.response?.data?.msg || "Failed to load video details.");
                setVideo(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchVideoAndUrl();
        }
    }, [id]);

    useEffect(() => {
        if (video && videoRef.current && !videoUrl.includes('youtube.com')) {
            const searchParams = new URLSearchParams(location.search);
            const time = searchParams.get('t');
            if (time) {
                videoRef.current.currentTime = parseFloat(time);
                videoRef.current.play();
            }
        } else if (videoUrl.includes('youtube.com')) {
            // For YouTube, if a timestamp is present, we need to append it to the iframe URL
            const searchParams = new URLSearchParams(location.search);
            const time = searchParams.get('t');
            if (time) {
                // Manually reload the iframe src to jump to time
                const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl, time);
                const iframe = document.getElementById('youtube-player');
                if (iframe) iframe.src = youtubeEmbedUrl;
            }
        }
    }, [video, videoUrl, location.search]);

    const handleWordClick = (startTime) => {
        if (videoRef.current && !videoUrl.includes('youtube.com')) {
            videoRef.current.currentTime = startTime;
            videoRef.current.play();
        } else if (videoUrl.includes('youtube.com')) {
            // For YouTube, navigate to the same page with a timestamp parameter
            const newUrl = `/video/${id}?t=${startTime}`;
            window.history.pushState({}, '', newUrl); // Update URL without full reload
            
            const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl, startTime);
            const iframe = document.getElementById('youtube-player');
            if (iframe) iframe.src = youtubeEmbedUrl;
        }
    };

    // Helper to get YouTube Embed URL with timestamp
    const getYouTubeEmbedUrl = (originalUrl, startTime) => {
        const videoIdMatch = originalUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${Math.floor(startTime)}`;
        }
        return originalUrl; // Fallback
    };


    if (isLoading) return <div style={styles.loadingContainer}>Loading video...</div>;
    if (!video) return <div style={styles.errorContainer}>Video not found or failed to load.</div>;

    return (
        <div>
            <Header />
            <main style={styles.main}>
                <h1 style={styles.pageTitle}>{video.title}</h1>
                <div style={styles.layout}>
                    <div style={styles.playerContainer}>
                        <div style={styles.videoWrapper}>
                            {videoUrl && videoUrl.includes('youtube.com') ? (
                                <iframe
                                    id="youtube-player"
                                    width="100%"
                                    height="100%"
                                    src={getYouTubeEmbedUrl(videoUrl)} // Initial embed URL
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={styles.responsivePlayer}
                                ></iframe>
                            ) : videoUrl ? (
                                <video ref={videoRef} controls style={styles.responsivePlayer}>
                                    <source src={videoUrl} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <p style={styles.placeholderText}>No playable video URL available.</p>
                            )}
                        </div>
                    </div>
                    <div style={styles.transcriptContainer}>
                        <h2 style={styles.transcriptTitle}>Transcript</h2>
                        <div style={styles.transcriptContent}>
                            {video.fullTranscript ? ( // Check fullTranscript for overall content
                                video.transcriptWords && video.transcriptWords.length > 0 ? (
                                    video.transcriptWords.map((word, index) => (
                                        <span 
                                            key={index} 
                                            className="transcript-word" 
                                            style={styles.word} 
                                            onClick={() => handleWordClick(word.start)}
                                        >
                                            {word.word}{' '}
                                        </span>
                                    ))
                                ) : (
                                    <p>Transcript available as plain text: {video.fullTranscript}</p> // Fallback display
                                )
                            ) : (
                                <p>No transcript available for this video.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const styles = {
    main: { maxWidth: '1400px', margin: '0 auto', padding: '2rem' },
    pageTitle: { marginBottom: '2rem' },
    layout: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' },
    playerContainer: { backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    videoWrapper: {
        position: 'relative',
        width: '100%',
        paddingTop: '56.25%', /* 16:9 Aspect Ratio */
        backgroundColor: '#000',
        borderRadius: '4px',
        overflow: 'hidden', /* ensure contents don't spill */
    },
    responsivePlayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none',
    },
    placeholderText: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'var(--on-surface-variant)',
        textAlign: 'center',
    },
    transcriptContainer: {
        backgroundColor: 'var(--surface)',
        borderRadius: '8px',
        padding: '1.5rem',
        maxHeight: '70vh',
        overflowY: 'auto',
        border: '1px solid var(--border)',
    },
    transcriptTitle: { marginTop: 0, borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' },
    transcriptContent: { fontSize: '1.1rem', lineHeight: '1.8' },
    word: {
        cursor: 'pointer',
        padding: '2px',
        borderRadius: '2px',
        transition: 'background-color 0.2s, color 0.2s',
        display: 'inline-block', // Ensure words don't break unexpectedly
    },
    loadingContainer: {
        display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontSize: '1.5rem', color: 'var(--primary)'
    },
    errorContainer: {
        display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontSize: '1.5rem', color: 'var(--error)'
    }
};

export default PlayerPage;