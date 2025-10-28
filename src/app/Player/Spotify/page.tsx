'use client'
// eslint-disable-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, Heart, Music } from 'lucide-react';

interface Track {
    name: string;
    artists: { name: string }[];
    album: {
        name: string;
        images: { url: string }[];
    };
    duration_ms: number;
    id: string;
}

interface PlaybackState {
    is_playing: boolean;
    progress_ms: number;
    item: Track | null;
    device: { volume_percent: number } | null;
    shuffle_state: boolean;
    repeat_state: string;
}

const SpotifyPlayer = () => {
    const [accessToken, setAccessToken] = useState('');
    const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [error, setError] = useState('');
    // const [isConnecting, setIsConnecting] = useState(false);

    // Spotify API configuration
    const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000';
    const SCOPES = [
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
        'user-library-read',
        'user-library-modify',
        'streaming'
    ].join('%20');

    useEffect(() => {
        // Check for access token in URL hash
        const hash = window.location.hash;
        if (hash) {
            const token = hash.substring(1).split('&').find(elem => elem.startsWith('access_token'))?.split('=')[1];
            if (token) {
                setAccessToken(token);
                window.location.hash = '';
            }
        }
    }, []);

    useEffect(() => {
        if (accessToken) {
            fetchPlaybackState();
            const interval = setInterval(fetchPlaybackState, 1000);
            return () => clearInterval(interval);
        }
    }, [accessToken]);

    const handleLogin = () => {
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}&response_type=token&show_dialog=true`;
        window.location.href = authUrl;
    };

    const fetchPlaybackState = async () => {
        try {
            const response = await fetch('https://api.spotify.com/v1/me/player', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (response.status === 204) {
                setPlaybackState(null);
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setPlaybackState(data);

                // Check if track is liked
                if (data.item) {
                    checkIfLiked(data.item.id);
                }
            } else if (response.status === 401) {
                setError('Session expired. Please login again.');
                setAccessToken('');
            }
        } catch (err) {
            console.error('Error fetching playback state:', err);
        }
    };

    const checkIfLiked = async (trackId: string) => {
        try {
            const response = await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${trackId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                setIsLiked(data[0]);
            }
        } catch (err) {
            console.error('Error checking if liked:', err);
        }
    };

    const togglePlayback = async () => {
        const endpoint = playbackState?.is_playing ? 'pause' : 'play';
        try {
            await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
        } catch (err) {
            setError('Error toggling playback');
        }
    };

    const skipTrack = async (direction: 'next' | 'previous') => {
        try {
            await fetch(`https://api.spotify.com/v1/me/player/${direction}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
        } catch (err) {
            setError(`Error skipping ${direction}`);
        }
    };

    const setVolume = async (volume: number) => {
        try {
            await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
        } catch (err) {
            setError('Error setting volume');
        }
    };

    const toggleShuffle = async () => {
        try {
            await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${!playbackState?.shuffle_state}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
        } catch (err) {
            setError('Error toggling shuffle');
        }
    };

    const toggleRepeat = async () => {
        const modes = ['off', 'context', 'track'];
        const currentIndex = modes.indexOf(playbackState?.repeat_state || 'off');
        const nextMode = modes[(currentIndex + 1) % modes.length];

        try {
            await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${nextMode}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
        } catch (err) {
            setError('Error toggling repeat');
        }
    };

    const toggleLike = async () => {
        if (!playbackState?.item) return;

        const method = isLiked ? 'DELETE' : 'PUT';
        try {
            await fetch(`https://api.spotify.com/v1/me/tracks?ids=${playbackState.item.id}`, {
                method,
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            setIsLiked(!isLiked);
        } catch (err) {
            setError('Error toggling like');
        }
    };

    const seekToPosition = async (position: number) => {
        try {
            await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${position}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
        } catch (err) {
            setError('Error seeking position');
        }
    };

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!accessToken) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-12 border border-gray-700 text-center max-w-md">
                    <Music size={64} className="text-green-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-white mb-4">Spotify Web Player</h1>
                    <p className="text-gray-400 mb-8">Connect your Spotify account to control playback</p>

                    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
                        <p className="text-yellow-500 text-sm">
                            <strong>Setup Required:</strong> Replace CLIENT_ID in the code with your Spotify Client ID from the Spotify Developer Dashboard
                        </p>
                    </div>

                    <button
                        onClick={handleLogin}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105"
                    >
                        Connect Spotify
                    </button>

                    {error && (
                        <p className="text-red-500 mt-4 text-sm">{error}</p>
                    )}
                </div>
            </div>
        );
    }

    if (!playbackState || !playbackState.item) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-12 border border-gray-700 text-center max-w-md">
                    <Music size={64} className="text-gray-600 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-4">No Active Playback</h2>
                    <p className="text-gray-400 mb-6">Start playing music on Spotify to control it here</p>
                    <button
                        onClick={() => setAccessToken('')}
                        className="text-green-500 hover:text-green-400 text-sm"
                    >
                        Disconnect
                    </button>
                </div>
            </div>
        );
    }

    const track = playbackState.item;
    const progress = (playbackState.progress_ms / track.duration_ms) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
                {/* Album Art and Info */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-6 group">
                        <img
                            src={track.album.images[0]?.url || ''}
                            alt={track.album.name}
                            className="w-64 h-64 rounded-lg shadow-2xl object-cover"
                        />
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity rounded-lg" />
                    </div>

                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white mb-2">{track.name}</h2>
                        <p className="text-lg text-gray-400">{track.artists.map(a => a.name).join(', ')}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <input
                        type="range"
                        min="0"
                        max={track.duration_ms}
                        value={playbackState.progress_ms}
                        onChange={(e) => seekToPosition(Number(e.target.value))}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, #1db954 0%, #1db954 ${progress}%, #374151 ${progress}%, #374151 100%)`
                        }}
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-2">
                        <span>{formatTime(playbackState.progress_ms)}</span>
                        <span>{formatTime(track.duration_ms)}</span>
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-6 mb-6">
                    <button
                        onClick={toggleShuffle}
                        className={`p-2 rounded-full transition-all ${playbackState.shuffle_state ? 'text-green-500' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Shuffle size={20} />
                    </button>

                    <button onClick={() => skipTrack('previous')} className="p-3 text-gray-400 hover:text-white transition-colors">
                        <SkipBack size={28} fill="currentColor" />
                    </button>

                    <button
                        onClick={togglePlayback}
                        className="p-5 bg-white rounded-full hover:scale-105 transition-transform"
                    >
                        {playbackState.is_playing ? (
                            <Pause size={32} className="text-black" fill="currentColor" />
                        ) : (
                            <Play size={32} className="text-black ml-1" fill="currentColor" />
                        )}
                    </button>

                    <button onClick={() => skipTrack('next')} className="p-3 text-gray-400 hover:text-white transition-colors">
                        <SkipForward size={28} fill="currentColor" />
                    </button>

                    <button
                        onClick={toggleRepeat}
                        className={`p-2 rounded-full transition-all relative ${playbackState.repeat_state !== 'off' ? 'text-green-500' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Repeat size={20} />
                        {playbackState.repeat_state === 'track' && (
                            <span className="absolute -top-1 -right-1 text-xs font-bold">1</span>
                        )}
                    </button>
                </div>

                {/* Bottom Controls */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={toggleLike}
                        className={`p-2 transition-colors ${isLiked ? 'text-green-500' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>

                    <div className="flex items-center gap-3 flex-1 max-w-xs ml-auto">
                        <button onClick={() => setVolume(0)} className="text-gray-400 hover:text-white transition-colors">
                            {playbackState.device?.volume_percent === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={playbackState.device?.volume_percent || 0}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #1db954 0%, #1db954 ${playbackState.device?.volume_percent || 0}%, #374151 ${playbackState.device?.volume_percent || 0}%, #374151 100%)`
                            }}
                        />
                        <span className="text-xs text-gray-400 w-8 text-right">{playbackState.device?.volume_percent || 0}</span>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500 rounded-lg">
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    </div>
                )}

                <button
                    onClick={() => setAccessToken('')}
                    className="mt-6 w-full text-gray-500 hover:text-gray-400 text-sm"
                >
                    Disconnect Spotify
                </button>
            </div>
        </div>
    );
};

export default SpotifyPlayer;