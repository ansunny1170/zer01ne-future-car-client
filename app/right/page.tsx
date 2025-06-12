"use client";

import VideoPlayer from "../components/video-player";
import useBroadcast from "../hooks/useBroadcast";

export default function RightPage() {
    const { step, category } = useBroadcast();

    return (
        <main className="min-h-screen flex items-center justify-center overflow-hidden">
            <VideoPlayer step={step} category={category} direction="right" />
            <div className="text-center">
                <h1 className="text-4xl font-bold text-blue-600 mb-4">Right Page</h1>
                <p className="text-gray-600">{category}</p>
            </div>
        </main>
    );
} 