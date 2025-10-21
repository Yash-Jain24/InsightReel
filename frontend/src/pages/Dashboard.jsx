import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { FaPlus, FaSpinner } from 'react-icons/fa'; // Import spinner icon
import api from '../services/api';
import Header from '../components/Header';
import UploadModal from '../components/UploadModal';
import VideoCard from '../components/VideoCard';
import SearchBar from '../components/SearchBar';

const Dashboard = () => {
    const [videos, setVideos] = useState([]);
    const [searchResults, setSearchResults] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false); // New state for search loading

    useEffect(() => {
        const fetchVideos = async () => {
            setIsLoading(true); // Ensure loading is true at the start
            try {
                const response = await api.get('/videos');
                setVideos(response.data);
            } catch (error) {
                toast.error('Failed to fetch videos.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchVideos();
    }, []);

    const handleUploadSuccess = (newVideo) => {
        setVideos(prevVideos => [newVideo, ...prevVideos]);
        setSearchResults(null); // Clear search results after new upload
    };

    const handleDelete = async (videoId) => {
        try {
            await api.delete(`/videos/${videoId}`);
            setVideos(videos.filter(v => v._id !== videoId));
            // Also remove from search results if present
            if (searchResults) {
                setSearchResults(searchResults.filter(v => v._id !== videoId));
            }
            toast.success('Video deleted!');
        } catch {
            toast.error('Failed to delete video.');
        }
    };

    const handleSearch = async (query) => {
        if (!query || query.trim() === '') {
            setSearchResults(null);
            return;
        }
        setIsSearching(true);
        try {
            const res = await api.get(`/search?query=${query.trim()}`);
            setSearchResults(res.data);
        } catch {
            toast.error('Search failed.');
        } finally {
            setIsSearching(false);
        }
    };

    // Helper to format seconds into MM:SS
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div style={styles.centeredMessage}>
                    <FaSpinner className="spin" size="2em" />
                    <p>Loading your library...</p>
                </div>
            );
        }

        const videosToDisplay = searchResults ? searchResults : videos;

        if (isSearching) {
            return (
                <div style={styles.centeredMessage}>
                    <FaSpinner className="spin" size="2em" />
                    <p>Searching...</p>
                </div>
            );
        }

        if (videosToDisplay.length === 0) {
            return (
                <div style={styles.emptyState}>
                    <h2>{searchResults ? 'No results found' : 'Your library is empty'}</h2>
                    {!searchResults && <p>Click "Upload Video" to get started.</p>}
                </div>
            );
        }

        return (
            <div style={styles.grid}>
                {videosToDisplay.map(video => (
                    <VideoCard key={video._id} video={video} onDelete={handleDelete} />
                ))}
            </div>
        );
    };

    return (
        <div>
            <Header />
            <main style={styles.main}>
                <div style={styles.toolbar}>
                    <h1 style={styles.title}>My Video Library</h1>
                    <button style={styles.uploadButton} onClick={() => setIsModalOpen(true)}><FaPlus /> Upload Video</button>
                </div>
                <SearchBar onSearch={handleSearch} />
                {renderContent()}
            </main>
            {isModalOpen && <UploadModal onClose={() => setIsModalOpen(false)} onUploadSuccess={handleUploadSuccess} />}
        </div>
    );
};

// --- Styles ---
// (Ensure these are the full styles from our previous steps)
const styles = {
    main: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    title: { margin: 0, fontSize: '2rem' },
    uploadButton: { backgroundColor: 'var(--primary)', color: '#000', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' },
    emptyState: { textAlign: 'center', padding: '4rem', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '2px dashed var(--border)' },
    centeredMessage: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem', height: '50vh', color: 'var(--on-surface-variant)' },
    searchResultsContainer: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    searchResultItem: { backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' },
    timestampContainer: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
    timestampLink: { backgroundColor: 'var(--background)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '4px', textDecoration: 'none', border: '1px solid var(--border)', transition: 'background-color 0.2s' }
};

export default Dashboard;