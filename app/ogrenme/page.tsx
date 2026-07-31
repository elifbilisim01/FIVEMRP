"use client";
import { Button } from "antd";
import { useEffect, useRef } from "react";

interface pageProps {}

const page: React.FC<pageProps> = () => {
  let audioref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let AudioElement = audioref.current as HTMLAudioElement;

    function keydownListener(param: KeyboardEvent) {
      switch (param.key) {
        case " ":
        case "Space": {
          param.preventDefault();

          if (AudioElement.paused === true) {
            AudioElement.play();
          } else {
            AudioElement.pause();
          }
          break;
        }

        default:
          param.preventDefault();
          break;
      }
    }

    document.addEventListener("keydown", keydownListener);

    return () => document.removeEventListener("keydown", keydownListener);
  }, []);

  return (
    <div className="text-black container  mx-auto my-2">
      <audio ref={audioref} controls autoPlay>
        <source
          src={"/sounds/GTA V OST Extended Welcome to Los Santos.m4a"}
          type="audio/mp3"
        />
      </audio>
      <div className="flex gap-1 my-2">
        <Button
          onClick={() => {
            audioref.current?.play();
            
          }}
        >
          Play
        </Button>
        <Button
          onClick={() => {
            audioref.current?.pause();
          }}
        >
          Pause
        </Button>
        <Button
          onClick={() => {
            if (audioref.current?.currentTime) {
              audioref.current.currentTime = audioref.current?.currentTime + 5;
            }
          }}
        >
          Ileri +5
        </Button>
        <Button
          onClick={() => {
            let AudioElement = audioref.current as HTMLAudioElement;

            AudioElement.currentTime -= 5;
          }}
        >
          Geri -5
        </Button>
      </div>
    </div>
  );
};

export default page;
