import React, { useState } from 'react';
import { Video, Play, Search, ExternalLink, Loader2, Maximize2 } from 'lucide-react';

// Import your songs data
import songsData from '@/lib/json/songs.json';

interface SearchResult {
    id: string;
    title: string;
    thumbnail: string;
    channel: string;
    publishedAt?: string;
    description?: string;
    views?: string;
}

interface YTPlayerProps {
    onPlayVideo: (videoId: string) => void;
}

const YTPlayer: React.FC<YTPlayerProps> = ({ onPlayVideo }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchMode, setSearchMode] = useState<'keyword' | 'url'>('keyword');
    const [hasSearched, setHasSearched] = useState(false);
    const [inPageVideoId, setInPageVideoId] = useState<string>('');
    const [showInPagePlayer, setShowInPagePlayer] = useState(false);

    const extractVideoId = (url: string): string | null => {
        url = url.trim();

        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
            return url;
        }

        let match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];

        match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];

        match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];

        return null;
    };

    const isYouTubeUrl = (input: string): boolean => {
        return input.includes('youtube.com') || input.includes('youtu.be') || /^[a-zA-Z0-9_-]{11}$/.test(input.trim());
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        if (isYouTubeUrl(searchQuery)) {
            const videoId = extractVideoId(searchQuery);
            if (videoId) {
                handlePlayInPage(videoId);
                setSearchQuery('');
                return;
            } else {
                alert('Invalid YouTube URL or Video ID');
                return;
            }
        }

        setIsSearching(true);
        setHasSearched(true);

        try {
            const query = searchQuery.toLowerCase();
            const results = songsData.filter((song: SearchResult) =>
                song.title.toLowerCase().includes(query) ||
                song.channel.toLowerCase().includes(query)
            );

            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            alert('Unable to search. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setHasSearched(false);
    };

    const handlePlayInPage = (videoId: string) => {
        setInPageVideoId(videoId);
        setShowInPagePlayer(true);
        // Scroll to player
        setTimeout(() => {
            document.getElementById('in-page-player')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const handlePlayPersistent = (videoId: string) => {
        onPlayVideo(videoId);
    };

    const displayVideos = hasSearched ? searchResults : songsData;

    return (
        <div className="min-h-screen w-screen overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <Video className="h-8 w-8 text-sky-500" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        YouTube Player
                    </h1>
                </div>

                {/* Search Section */}
                <div className="mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <button
                                onClick={() => setSearchMode('keyword')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${searchMode === 'keyword'
                                    ? 'bg-sky-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                <Search className="inline mr-2" size={16} />
                                Search by Keyword
                            </button>
                            <button
                                onClick={() => setSearchMode('url')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${searchMode === 'url'
                                    ? 'bg-sky-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                <ExternalLink className="inline mr-2" size={16} />
                                Play by URL/ID
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder={
                                    searchMode === 'keyword'
                                        ? 'Search for songs... (e.g., "Blinding Lights", "Drake", "pop")'
                                        : 'Paste YouTube URL or Video ID (e.g., dQw4w9WgXcQ)'
                                }
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none
                         transition-all duration-200"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={isSearching || !searchQuery.trim()}
                                className="px-6 py-3 bg-sky-500 text-white font-semibold rounded-lg
                         hover:bg-sky-600 transition-all duration-200 flex items-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg hover:shadow-xl active:scale-95"
                            >
                                {isSearching ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        {searchMode === 'keyword' ? <Search size={20} /> : <Play size={20} />}
                                        {searchMode === 'keyword' ? 'Search' : 'Play'}
                                    </>
                                )}
                            </button>
                            {hasSearched && (
                                <button
                                    onClick={clearSearch}
                                    className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white 
                           font-semibold rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500
                           transition-all duration-200"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                            {searchMode === 'keyword' ? (
                                <p>{`💡 Search from ${songsData.length} songs by title, artist, or genre`}</p>
                            ) : (
                                <p>{`💡 Supports: youtube.com/watch?v=ID, youtu.be/ID, or just the video ID`}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* In-Page Player */}
                {showInPagePlayer && (
                    <div id="in-page-player" className="h-fit mb-6 bg-black rounded-xl overflow-hidden shadow-2xl">
                        <div className="bg-gray-900 px-4 py-3 flex justify-between items-center">
                            <span className="text-white font-medium">Now Playing</span>
                            <button
                                onClick={() => setShowInPagePlayer(false)}
                                className="text-gray-400 hover:text-white transition-colors text-sm"
                            >
                                ✕ Close
                            </button>
                        </div>
                        <div className="relative" style={{ paddingBottom: '40.25%' }}>
                            <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src={`https://www.youtube.com/embed/${inPageVideoId}?autoplay=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                )}
            </div>

            {/* Videos Grid */}
            <div className="max-w-7xl mx-auto">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {hasSearched ? `Search Results (${displayVideos.length} found)` : `All Songs (${songsData.length} total)`}
                </h2>

                {isSearching ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-12 w-12 text-sky-500 animate-spin mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Searching...</p>
                    </div>
                ) : displayVideos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {displayVideos.map((video: SearchResult) => (
                            <div
                                key={video.id}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden 
                         transition-all duration-300 hover:shadow-xl group"
                            >
                                <div
                                    className="relative cursor-pointer"
                                    onClick={() => handlePlayInPage(video.id)}
                                >
                                    <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-full h-48 object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 
                                transition-all duration-300 flex items-center justify-center">
                                        <Play
                                            className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            size={48}
                                        />
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 text-sm">
                                        {video.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        {video.channel}
                                    </p>
                                    {video.views && (
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                                            {video.views}
                                        </p>
                                    )}

                                    {/* Play Options */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handlePlayInPage(video.id)}
                                            className="flex-1 px-3 py-2 bg-sky-500 text-white text-xs rounded-lg
                               hover:bg-sky-600 transition-all duration-200 flex items-center justify-center gap-1"
                                            title="Play in this page"
                                        >
                                            <Play size={14} />
                                            Play Here
                                        </button>
                                        <button
                                            onClick={() => handlePlayPersistent(video.id)}
                                            className="flex-1 px-3 py-2 bg-purple-500 text-white text-xs rounded-lg
                               hover:bg-purple-600 transition-all duration-200 flex items-center justify-center gap-1"
                                            title="Play in floating player (persists across pages)"
                                        >
                                            <Maximize2 size={14} />
                                            Float
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : hasSearched ? (
                    <div className="text-center py-12">
                        <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                            {`No results found for "${searchQuery}"`}
                        </p>
                        <p className="text-gray-500 dark:text-gray-500 text-sm">
                            {`Try different keywords or use the URL/ID option instead`}
                        </p>
                    </div>
                ) : null}
            </div>

            {/* Info Banner */}
            <div className="max-w-7xl mx-auto mt-12">
                <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 
                      rounded-lg p-6">
                    <h3 className="font-semibold text-sky-900 dark:text-sky-300 mb-2">
                        💡 Two Ways to Play
                    </h3>
                    <ul className="text-sky-800 dark:text-sky-400 text-sm space-y-2">
                        <li>• <strong>Play Here:</strong> {`Video plays on this page (stops when you leave)`}</li>
                        <li>• <strong>Float:</strong> {`Opens persistent floating player (keeps playing when you switch pages!)`}</li>
                        <li>• <strong>Keyword Search:</strong> {`Search from {songsData.length} curated songs by title or artist`}</li>
                        <li>• <strong>URL/ID Mode:</strong> Paste any YouTube URL or video ID to play directly</li>
                        <li>• <strong>Floating Player:</strong> Can be minimized and dragged anywhere on screen</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default YTPlayer;