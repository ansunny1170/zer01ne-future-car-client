"use client";

import VideoPlayer from "./components/video-player";
import Scene1 from "./components/scenes/scene1";
import Scene2 from "./components/scenes/scene2";
import { useScene } from "./context/scene-context";
import Scene3 from "./components/scenes/scene3";
import Scene4 from "./components/scenes/scene4";
import Scene5 from "./components/scenes/scene5";
import Scene6 from "./components/scenes/scene6";
import Scene7 from "./components/scenes/scene7";

export default function Home() {
  const { sceneNumber, category, categoryNumber, setSceneNumber, setCategory, setCategoryNumber, lastSceneNumber } = useScene();

  const renderStep = () => {
    switch (sceneNumber) {
      case 0:
        return <Scene1/>;
      case 1:
        return <Scene1/>;
      case 2:
        return <Scene2/>;
      case 3:
        return <Scene3/>;
      case 4:
        return <Scene4 />;
      case 5:
        return <Scene5 />;
      case 6:
        return <Scene6 />;
      case 7:
        return <Scene7 />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-start justify-center text-left h-screen cursor-none123 overflow-hidden">
      <VideoPlayer
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

        {
          sceneNumber === lastSceneNumber && (
            <button
              className="absolute top-4 right-4 bg-white text-black px-4 py-2 rounded-md"
              onClick={() => {
                setSceneNumber(1);
              }}
            >
              처음으로
            </button>
          )
        }
      </div>
    </div>
  );
}
