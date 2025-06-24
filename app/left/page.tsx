"use client";

import { useEffect } from "react";
import VideoPlayer from "../components/video-player";
import { useScene } from "../context/scene-context";

export default function LeftPage() {
    const { sceneNumber, category, categoryNumber, channel, setSceneNumber, setCategory, setCategoryNumber } = useScene();

    useEffect(() => {
        if (channel) {
            channel.onmessage = (event: MessageEvent) => {
                setSceneNumber(event.data.sceneNumber);
                setCategory(event.data.category);
                setCategoryNumber(event.data.categoryNumber);
            }
        }
    }, [channel, setSceneNumber, setCategory, setCategoryNumber]);

    return (
        <main className="min-h-screen flex items-center justify-center overflow-hidden relative">
            <VideoPlayer direction="left" className="scale-150 blur-xs" />
            <div className="text-center">
                <h1 className="text-4xl font-bold text-blue-600 mb-4">Left Page</h1>
                <p className="text-gray-600">{sceneNumber} / {category} / {categoryNumber}</p>
            </div>
        </main>
    );
} 