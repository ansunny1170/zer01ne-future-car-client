"use client";

import VideoPlayer from "./components/video-player";
import Scene1 from "./components/scenes/scene1";
import Scene2 from "./components/scenes/scene2";
import { useScene } from "./context/scene-context";

export default function Home() {
  const { sceneNumber, category, categoryNumber, setSceneNumber, setCategory, setCategoryNumber, lastSceneNumber } = useScene();

  const renderStep = () => {
    switch (sceneNumber) {
      case 1:
        return <Scene1/>;
      case 2:
        return <Scene2/>;
      // case 3:
      //   return <Scene3 setVideoPath={setVideoPath} />;
      // case 4:
      //   return <Scene4 setVideoPath={setVideoPath} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-start justify-center text-left h-screen cursor-none123 overflow-hidden">
      <VideoPlayer
        // sceneNumber={sceneNumber}
        // category={category}
        // categoryNumber={categoryNumber}
        direction="center"
      />

      {/* <div className="hidden">
        <audio 
          key={category}
          src={`/audios/${category}_music.m4a`} 
          autoPlay
          loop
        />
      </div> */}

      {renderStep()}

      <div>
        {
          sceneNumber > 0 && (
          <button
            className="absolute top-4 left-4 bg-white text-black px-4 py-2 rounded-md z-10"
            onClick={() => {
              setSceneNumber(sceneNumber - 1);
              setCategory("a");
              setCategoryNumber(1);
            }}
            disabled={sceneNumber === 1}
          >
            이전 스텝 / {sceneNumber} / {category} / {categoryNumber}
          </button>
        )}

        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-2xl font-bold">{sceneNumber}</span>

        <button className="absolute top-4 right-4 bg-white text-black px-4 py-2 rounded-md" onClick={() => setSceneNumber(sceneNumber + 1)}>
          {
            sceneNumber === lastSceneNumber ? "처음으로" : "다음 스텝"
          }
        </button>
      </div>
    </div>
  );
}
