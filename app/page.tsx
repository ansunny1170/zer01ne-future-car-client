"use client";

import { useState, useEffect } from "react";
import VideoPlayer from "./components/video-player";

export default function Home() {
  const options = ["a", "b", "c"];
  const [message, setMessage] = useState<string|null>(null);

  // 클라이언트 사이드에서만 랜덤 값 설정
  useEffect(() => {
    const randomMessage = options[Math.floor(Math.random() * options.length)];
    setMessage(randomMessage);
  }, []);

  // BroadcastChannel 이용해서 여러 탭에 메시지 전송
  const channel = new BroadcastChannel("my-channel");
  

  const handleClick = (value: string) => {
    channel.postMessage(value);
    setMessage(value);
  };

  const handleMessage = (event: MessageEvent) => {
    setMessage(event.data);
  };

  useEffect(() => {
    channel.addEventListener("message", handleMessage);
    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen cursor-none123 overflow-hidden">
      <VideoPlayer message={message || "a"} direction="center" />
      <div className="text-center p-4">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Center Page</h1>
          <p className="text-gray-600">{message}</p>
      </div>

      <div className="
        flex flex-row gap-4 
        *:p-2 *:bg-gray-200 *:text-gray-800 *:rounded-md *:transition-all *:duration-500 *:cursor-none123
        *:hover:bg-gray-400 *:hover:scale-110 *:hover:text-white *:hover:font-bold
        *:focus:bg-gray-400 *:focus:scale-110 *:focus:text-white *:focus:font-bold *:focus:outline-none
      ">
        <button
          className={`w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm`}
          onClick={() => handleClick("a")}
        >
          A
        </button>
        <button
          className={`w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm`}
          onClick={() => handleClick("b")}
        >
          B
        </button>
        <button
          className={`w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm`}
          onClick={() => handleClick("c")}
        >
          C
        </button>
      </div>

      <div className="hidden">
        <audio 
          key={message}
          src={`/audios/${message}_music.m4a`} 
          autoPlay
          loop 
          onError={(e) => console.error('Audio failed to load:', e)}
        />
      </div>
    </div>
  );
}
