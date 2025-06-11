"use client";

export default function Home() {
  // BroadcastChannel 이용해서 여러 탭에 메시지 전송
  const channel = new BroadcastChannel("my-channel");
  

  channel.onmessage = (event) => {
    console.log(event.data);
  };

  channel.postMessage("Hello from page 1");

  return (
    <div className="flex flex-col items-center justify-center h-screen cursor-none">
      <h1>Hello World</h1>
      <p>This is a test</p>

      <div className="flex flex-row gap-4 *:p-2 *:bg-gray-200 *:text-gray-800 *:rounded-md *:cursor-none *:hover:bg-gray-400 *:transition-colors">
        <button onClick={() => channel.postMessage("A")}>A</button>
        <button onClick={() => channel.postMessage("B")}>B</button>
        <button onClick={() => channel.postMessage("C")}>C</button>
      </div>
    </div>
  );
}
