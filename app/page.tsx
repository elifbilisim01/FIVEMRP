"use client";
import Image from "next/image";
import useStore from "./(stroage)/arkaplan";
import { useEffect, useRef, useState } from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  FileWarning,
  Globe2,
  MailWarningIcon,
  MessageCircleWarning,
  Music,
  PersonStandingIcon,
  PlayIcon,
  Search,
  Server,
  Settings,
  SkipBack,
  SkipForward,
  SlidersVertical,
  StarCheck,
  TriangleAlert,
  User,
  UserCheck2Icon,
  UserCog,
  UserRoundPen,
  WallpaperIcon,
  X,
} from "lucide-react";
import { ICProfileEdit } from "./(components)/karakterprofilduzenle";
import useMusic from "./(stroage)/muzik";
import { Label } from "@/components/ui/label";
import { getDiscordUserId } from "./(islevler)/fonksiyonlar";
import useHataMesaji from "./(stroage)/uyarimesaji";
import { useRouter } from "next/navigation";

export default function Home() {
  const { wallpaper } = useStore();
  const audioPlayerRef = useRef<AudioPlayer>(null);
  const [isFocused, setIsFocused] = useState(false);
  const {
    hatamesajibaslik,
    hatamesaji,
    setmesaj,
    setmesajturu,
    setmesajbaslik,
  } = useHataMesaji();
  let router = useRouter();
  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      "http://localhost:3000/api/auth/discord/callback",
    );

    // Kullanıcıyı Discord'un yetkilendirme sayfasına yönlendiriyoruz
    const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify`;

    window.location.href = discordUrl;
  };

  //#region useEffects

  useEffect(() => {
    // 370631807504351232

    async function run() {
      let _data = await getDiscordUserId("370631807504351232");
      if (_data) {
        console.log(JSON.stringify(_data));
      }
    }

    run();

    router.push("/user/profile/485187508808843275?Server=PWUC")
  }, []);

  // Sağ tık engeli
  useEffect(() => {
    const handleContextmenu = (e: any) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handleContextmenu);
    return () => document.removeEventListener("contextmenu", handleContextmenu);
  }, []);

  // Global Klavye Kısayolları (AudioPlayer)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.tagName === "SELECT"
      ) {
        return;
      }

      const audio = audioPlayerRef.current?.audio?.current;
      if (!audio) return;

      switch (event.key) {
        case " ":
        case "Space":
          event.preventDefault();
          setIsFocused(true);
          if (audio.paused) {
            audio.play().catch((err) => console.log("Play error:", err));
          } else {
            audio.pause();
          }
          setTimeout(() => setIsFocused(false), 2000);
          break;
        case "ArrowRight":
          event.preventDefault();
          audio.currentTime = Math.min(
            audio.currentTime + 5,
            audio.duration || 0,
          );
          break;
        case "ArrowLeft":
          event.preventDefault();
          audio.currentTime = Math.max(audio.currentTime - 5, 0);
          break;
        case "ArrowUp":
          event.preventDefault();
          audio.volume = Math.min(audio.volume + 0.1, 1);
          break;
        case "ArrowDown":
          event.preventDefault();
          audio.volume = Math.max(audio.volume - 0.1, 0);
          break;
        case "m":
        case "M":
          audio.muted = !audio.muted;
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Wallpaper Effect - Optimize edildi
  useEffect(() => {
    const styleId = "body-blur-background";
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
      body::before {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url("/wallpapers/${wallpaper}");
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        filter: brightness(50%);
        z-index: -2;
      }
      body {
        background-color: #000;
        overflow-x: hidden;
      }
    `;

    return () => {
      document.getElementById(styleId)?.remove();
    };
  }, [wallpaper]);
  //#endregion

  const { musicName, volume, setmusic, uzanti } = useMusic();

  useEffect(() => {
    if (audioPlayerRef.current) {
      let playerRef = audioPlayerRef.current as AudioPlayer;
      let audioDom = playerRef.audio.current as HTMLAudioElement;
      if (audioDom) {
        // 0-100 arasındaki değeri 0-1 arasına dönüştürüyoruz
        audioDom.volume = Math.max(0, Math.min(100, volume)) / 100;
      }
    }
  }, [volume]);

  return (
    <main className="overflow-hidden fixed z-1">
      <div className="fixed flex flex-col gap-4 z-2 right-[11px] top-4">
        <Tooltip>
          <TooltipContent side="left">
            <p>Arkaplanı Ayarla</p>
          </TooltipContent>
          {/* TooltipTrigger'ı Button'a değil, etrafını saran span'e veriyoruz */}
          <TooltipTrigger asChild>
            <span>
              <ICProfileEdit>
                <Button variant="outline" size="icon" className="rounded-full">
                  <SlidersVertical className="size-4" />
                </Button>
              </ICProfileEdit>
            </span>
          </TooltipTrigger>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full ">
              <Music className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Müziği Ayarla</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipContent side="left">
            <p>Karakteri Düzenle</p>
          </TooltipContent>
          {/* TooltipTrigger'ı Button'a değil, etrafını saran span'e veriyoruz */}
          <TooltipTrigger asChild>
            <span>
              <ICProfileEdit>
                <Button variant="outline" size="icon" className="rounded-full">
                  <UserRoundPen className="size-4" />
                </Button>
              </ICProfileEdit>
            </span>
          </TooltipTrigger>
        </Tooltip>
      </div>

      <div className="fixed flex flex-col gap-4 z-2 right-[11px] bottom-4">
        <Tooltip>
          <TooltipContent side="left">
            <p>Discord ile giriş yap</p>
          </TooltipContent>
          {/* TooltipTrigger'ı Button'a değil, etrafını saran span'e veriyoruz */}
          <TooltipTrigger asChild>
            <span>
              <Button
                variant="default"
                size="icon"
                className="rounded-full size-10"
                onClick={handleLogin}
              >
                <svg
                  viewBox="0 0 127.14 96.36"
                  width="300%"
                  height="300%"
                  className="w-52!"
                  xmlns="http://w3.org"
                >
                  <path
                    fill="#5865F2"
                    d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.79,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.68,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.81,11.1,105.25,105.25,0,0,0,32.22-16.15c2.62-27.28-4.48-51.2-21.15-75.14ZM42.45,65.69C36.18,65.69,31,60,31,53s5.18-12.71,11.45-12.71S53.9,46,53.88,53,48.71,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.18-12.71,11.44-12.71S96.15,46,96.13,53,90.95,65.69,84.69,65.69Z"
                  />
                </svg>
              </Button>
            </span>
          </TooltipTrigger>
        </Tooltip>
      </div>

      <div className="fixed flex flex-col gap-4 z-2 left-[12px] top-4">
        <Tooltip>
          <TooltipContent side="left">
            <p>Discord ile giriş yap</p>
          </TooltipContent>
          {/* TooltipTrigger'ı Button'a değil, etrafını saran span'e veriyoruz */}
          <TooltipTrigger asChild>
            <span>
              <ICProfileEdit>
                <Button variant="default" className="rounded-full  ">
                  <svg
                    viewBox="0 0 127.14 96.36"
                    width="300%"
                    height="300%"
                    className=" "
                    xmlns="http://w3.org"
                  >
                    <path
                      fill="#5865F2"
                      d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.79,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.68,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.81,11.1,105.25,105.25,0,0,0,32.22-16.15c2.62-27.28-4.48-51.2-21.15-75.14ZM42.45,65.69C36.18,65.69,31,60,31,53s5.18-12.71,11.45-12.71S53.9,46,53.88,53,48.71,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.18-12.71,11.44-12.71S96.15,46,96.13,53,90.95,65.69,84.69,65.69Z"
                    />
                  </svg>

                  <span>
                    <span className="p-0 m-0 text-[#739373]!">@</span>
                    <span className="p-0 m-0 text-[#737373]!">EhilX</span>
                  </span>
                </Button>
              </ICProfileEdit>
            </span>
          </TooltipTrigger>
        </Tooltip>
      </div>

      <div className="min-h-[calc(100vh-220px)] w-screen flex flex-col items-center justify-center">
        <Card className="relative w-[430px] gap-1 overflow-hidden bg-white/95 backdrop-blur-sm ">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Giriş Yapın{" "}
            </CardTitle>
            <CardDescription>{musicName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl text-black w-full p-4  pb-0 mb-0! px-1 pt-0">
              <div className="title mb-2 border-b pb-1 flex items-center justify-between">
                <button className="flex items-center gap-1 duration-300 hover:pl-1 pl-0 hover:bg-[#d8d8d8b2] px-2 py-[6px] rounded-sm">
                  <ArrowLeftIcon size={15} />
                  <span className="font-mono leading-0">Geri</span>
                </button>

                <h2 className="font-semibold font-mono flex items-center gap-1">
                  <div className="">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full items-center justify-center flex pl-[2.5px]"
                    >
                      <TriangleAlert className="size-4 " />
                    </Button>
                  </div>
                </h2>
              </div>

              {hatamesaji ? (
                <Alert variant={"default"} className="my-4">
                  <TriangleAlert className="mt-0.5" size={12} />
                  <AlertTitle className="flex justify-between items-center">
                    {hatamesajibaslik}{" "}
                    <Button variant={"secondary"} size={"icon-xs"}  onClick={() => {
                          setmesaj("");
                          setmesajturu("");
                          setmesajbaslik("");
                        }}>
                      {" "}
                      <X
                       
                      />
                    </Button>
                  </AlertTitle>
                  <AlertDescription>{hatamesaji}</AlertDescription>
                </Alert>
              ) : (
                <></>
              )}

              <div className="flex flex-col gap-[10px] mb-3">
                <div className="flex justify-center items-center bg-[#f2eeeecc] py-4 px-2 rounded-xl border-[#dbdbdba6] border-4">
                  {/* Görsel boyutları optimize edildi */}
                  <Image
                    alt="Photo"
                    width={350}
                    height={200}
                    priority
                    className="rounded-xl object-cover h-[200px] w-[350px]"
                    src={"/cpp/12.avif"}
                  />
                </div>

                <div className="flex flex-col w-full gap-1">
                  <div className="font-bold flex gap-1 items-center">
                    <Button variant={"outline"} className="rounded-none">
                      IC :
                    </Button>{" "}
                    <Button variant={"outline"} className="rounded-none">
                      Pedro Duarte <StarCheck fill="yellow" />
                    </Button>
                  </div>
                  <h3 className="font-bold text-sm font-bold flex gap-1 items-center">
                    <Button variant={"outline"} className="rounded-none">
                      Server :
                    </Button>{" "}
                    <Button variant={"outline"} className="rounded-none">
                      PWUC <Server fill="white" />
                    </Button>
                  </h3>

                  <div className="flex flex-col items-start gap-1">
                    <Button
                      variant={"outline"}
                      className="rounded-none font-semibold uppercase brightness-110  w-full"
                    >
                      Karakter Özellikleri
                      <User />
                    </Button>{" "}
                    <Button variant={"outline"} className="rounded-none  w-full">
                      Sunucuya Katıl
                    </Button>{" "}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button variant="outline" size="icon" className="rounded-full">
              <Globe2 className="size-4" />
            </Button>
            <Button
              size="icon"
              className="rounded-full"
              onClick={() => {
                setmusic("GTA V OST Extended Welcome to Los Santos", "m4a");
              }}
            >
              <PlayIcon className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <SkipForward className="size-4" />
            </Button>
          </CardFooter>

          {/* BorderBeam süresi artırılarak GPU yükü düşürüldü */}
        </Card>
      </div>
      {/* 🎵 AUDIO PLAYER */}
    </main>
  );
}
