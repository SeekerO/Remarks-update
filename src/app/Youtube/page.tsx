"use client";
import YTPlayer from '../component/YTPlayer';
import { useYouTubePlayer } from '../component/YouTubePlayerContext';

export default function YTPlayerPage() {
    const { playVideo } = useYouTubePlayer();

    return <YTPlayer onPlayVideo={playVideo} />;
}