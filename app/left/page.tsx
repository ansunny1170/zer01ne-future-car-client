"use client";

import { useState } from "react";
import VideoPlayer from "../components/video-player";

export default function LeftPage() {
    const [message, setMessage] = useState<string>("a");

    // BroadcastChannel 에서 메시지 수신
    const channel = new BroadcastChannel("my-channel");

    channel.onmessage = (event) => {
        setMessage(event.data);
    };

    return (
        <main className="min-h-screen flex items-center justify-center overflow-hidden">
            <VideoPlayer message={message} direction="left" />
            <div className="text-center">
                <h1 className="text-4xl font-bold text-blue-600 mb-4">Left Page</h1>
                <p className="text-gray-600">{message}</p>
            </div>
        </main>
    );
} 