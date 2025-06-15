"use client";

import VideoPlayer from "../components/video-player";
import useBroadcast from "../hooks/useBroadcast";

export default function LeftPage() {
    const { sceneNumber, category, categoryNumber } = useBroadcast();

    return (
        <main className="min-h-screen flex items-center justify-center overflow-hidden">
            <VideoPlayer sceneNumber={sceneNumber} category={category} categoryNumber={categoryNumber} direction="left" />
            {/* <div className="text-center">
                <h1 className="text-4xl font-bold text-blue-600 mb-4">Left Page</h1>
                <p className="text-gray-600">{category}</p>
            </div> */}
        </main>
    );
} 