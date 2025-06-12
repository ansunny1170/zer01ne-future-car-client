"use client";

import { useState } from "react";
import VideoPlayer from "./components/video-player";

export default function Home() {
  const [message, setMessage] = useState<string>("a");
  // BroadcastChannel 이용해서 여러 탭에 메시지 전송
  const channel = new BroadcastChannel("my-channel");
  

  channel.onmessage = (event) => {
    setMessage(event.data);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen cursor-none">
      <VideoPlayer message={message} direction="center" />
      <h1>Hello World</h1>
      <p>This is a test</p>

      <div className="flex flex-row gap-4 *:p-2 *:bg-gray-200 *:text-gray-800 *:rounded-md *:cursor-none *:hover:bg-gray-400 *:transition-colors">
        <button onClick={() => channel.postMessage("a")}>A</button>
        <button onClick={() => channel.postMessage("b")}>B</button>
        <button onClick={() => channel.postMessage("c")}>C</button>
      </div>
    </div>
  );
}
