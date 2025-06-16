"use client";

import VideoPlayer from "../components/video-player";
import { useScene } from "../context/scene-context";

export default function LeftPage() {
    const { sceneNumber, category, categoryNumber } = useScene();

    return (
        <main className="min-h-screen flex items-center justify-center overflow-hidden">
            <VideoPlayer direction="left" />
            <div className="text-center">
                <h1 className="text-4xl font-bold text-blue-600 mb-4">Left Page</h1>
                <p className="text-gray-600">{sceneNumber} / {category} / {categoryNumber}</p>
            </div>
        </main>
    );
} 