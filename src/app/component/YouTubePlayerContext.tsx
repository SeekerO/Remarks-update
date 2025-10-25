"use client";
import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface YouTubePlayerContextType {
    playVideo: (videoId: string) => void;
    closePlayer: () => void;
    isPlayerVisible: boolean;
}

const YouTubePlayerContext = createContext<YouTubePlayerContextType | undefined>(undefined);

export const useYouTubePlayer = () => {
    const context = useContext(YouTubePlayerContext);
    if (!context) {
        throw new Error('useYouTubePlayer must be used within YouTubePlayerProvider');
    }
    return context;
};

interface YouTubePlayerProviderProps {
    children: ReactNode;
}

export const YouTubePlayerProvider: React.FC<YouTubePlayerProviderProps> = ({ children }) => {
    const [videoId, setVideoId] = useState<string>('');
    const [isPlayerVisible, setIsPlayerVisible] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [playerPosition, setPlayerPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const playerRef = useRef<HTMLDivElement>(null);

    const playVideo = (id: string) => {
        setVideoId(id);
        setIsPlayerVisible(true);
        setIsMinimized(false);
    };

    const closePlayer = () => {
        setIsPlayerVisible(false);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isMinimized && e.currentTarget.classList.contains('drag-handle')) {
            setIsDragging(true);
            const rect = playerRef.current?.getBoundingClientRect();
            if (rect) {
                dragOffset.current = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
            }
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging && isMinimized) {
            setPlayerPosition({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging]);

    return (
        <YouTubePlayerContext.Provider value={{ playVideo, closePlayer, isPlayerVisible }}>
            {children}

            {/* Persistent YouTube Player */}
            {isPlayerVisible && (
                <div
                    ref={playerRef}
                    className={`fixed shadow-2xl transition-all z-[9999] ${isMinimized
                        ? 'w-80 h-52 cursor-move'
                        : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[500px]'
                        }`}
                    style={isMinimized ? { top: `${playerPosition.y}px`, left: `${playerPosition.x}px` } : {}}
                >
                    <div className="bg-black rounded-lg overflow-hidden h-full flex flex-col">
                        <div
                            className={`drag-handle bg-gray-900 px-4 py-2 flex justify-between items-center ${isMinimized ? 'cursor-move' : ''}`}
                            onMouseDown={handleMouseDown}
                        >
                            <span className="text-white text-sm font-medium">Now Playing</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="text-white hover:text-gray-300 transition-colors"
                                    title={isMinimized ? "Maximize" : "Minimize"}
                                >
                                    {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                                </button>
                                <button
                                    onClick={closePlayer}
                                    className="text-white hover:text-gray-300 transition-colors"
                                    title="Close"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}
        </YouTubePlayerContext.Provider>
    );
};