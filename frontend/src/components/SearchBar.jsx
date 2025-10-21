// frontend/src/components/SearchBar.jsx
import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

const SearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <form onSubmit={handleSearch} style={{ display: 'flex', marginBottom: '2rem' }}>
            <input
                type="search"
                placeholder="Search within your videos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ flex: 1, padding: '0.75rem', /* ... other styles */ }}
            />
            <button type="submit" style={{ padding: '0.75rem 1rem', /* ... other styles */ }}><FaSearch /></button>
        </form>
    );
};
export default SearchBar;