"use client";

import { useState } from "react";

export default function LeftPage() {
    const [message, setMessage] = useState<string>("");

    // BroadcastChannel 에서 메시지 수신
    const channel = new BroadcastChannel("my-channel");

    channel.onmessage = (event) => {
        setMessage(event.data);
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-blue-50">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-blue-600 mb-4">Left Page</h1>
                <p className="text-gray-600">{message}</p>
            </div>
        </main>
    );
} 