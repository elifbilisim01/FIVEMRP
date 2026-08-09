"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useStore from "../../../(stroage)/arkaplan";
import React, { useEffect, useRef, useState, use } from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  ArrowLeftIcon,
  FileWarning,
  Globe2,
  LucideGlobeCheck,
  MailWarningIcon,
  MessageCircleWarning,
  Music,
  Music2,
  Notebook,
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
} from "lucide-react";
import { ICProfileEdit } from "../../../(components)/karakterprofilduzenle";
import useMusic from "../../../(stroage)/muzik";
import { Label } from "@/components/ui/label";
import {
  getDiscordUserId,
  runSqlCommand,
} from "../../../(islevler)/fonksiyonlar";
import { useSearchParams } from "next/navigation";
import useHataMesaji from "@/app/(stroage)/uyarimesaji";
import { Spinner } from "@/components/ui/spinner";
import {
  SunucuIconlarinigetir,
  URLYEGoreKarakterSunucuBilgileriGetir,
} from "@/app/(islevler)/sorgular";
import { MusicSelectorModal } from "@/app/(components)/profilmuzikduzenle";
import { WallpaperModal } from "@/app/(components)/WallpaperModal";
import { SunucularaKarakterEkle } from "@/app/(components)/SunucularaKarakterEkle";
export interface KarakterVerisi {
  user_id: number;
  discord_id: string;
  id: number;
  sunucu_id: number;
  karakter_adi: string;
  karakter_soyadi: string;
  karakter_rozet: string;
  karakter_ozellikler: string | null;
  karakter_pp: any;
  sunucu_adi: string;
  sunucu_aciklamasi: string;
  sunucu_pp: string | null;
  icon_baslik: string;
  icon_aciklama: string;
  icon_dosyayolu: string;
  secilen_muzik: string; // Örn: "Concrete_Alibi" veya "Beton_Labirent.mp3"
  paket: string; // Örn: "Concrete_Alibi" veya "Beton_Labirent.mp3"
  secilen_arkaplan: string;
}
interface ProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

type DiscordUserResponse = {
  success: boolean;
  data: {
    id: string;
    username: string;
    globalName: string;
    avatar: string;
    banner: string;
  };
};

export interface Icon_Rank {
  icon_id: number;
  icon_baslik: string;
  icon_aciklama: string;
  icon_dosyayolu: string;
}

export default function Home({ params }: ProfilePageProps) {
  const { wallpaper, setwallpaper } = useStore();
  let router = useRouter();
  const { setmesaj, setmesajturu, setmesajbaslik } = useHataMesaji();
  const audioPlayerRef = useRef<AudioPlayer>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [discordData, setDiscordData] =
    React.useState<DiscordUserResponse | null>(null);
  const [ic, seticData] = React.useState<KarakterVerisi | null>(null);
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);
  const { musicName, volume, setmusic, uzanti } = useMusic();
  const [Icon_Rank, setIcon_Rank] = React.useState<Icon_Rank[] | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");

  // 1. Dinamik ID'yi buradan alıyoruz (Örn: 3948509438504)
  const resolvedParams = use(params);
  const profileId = resolvedParams.id;

  // 2. Query parametresindeki Server değerini buradan alıyoruz (Örn: PWUC)
  const searchParams = useSearchParams();
  const serverName = searchParams.get("Server") || "Bilinmiyor";

  //#region fonksiyonlar

  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      "http://localhost:3000/api/auth/discord/callback",
    );

    const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify`;

    window.location.href = discordUrl;
  };

  //#endregion

  //#region useEffects

  useEffect(() => {
    if (ic?.secilen_arkaplan) {
      setwallpaper(ic.secilen_arkaplan);
    }
  }, [ic?.secilen_arkaplan]);

  useEffect(() => {
    if (ic?.karakter_pp) {
      // Artık burası veri geldiği an çalışacaktır
      //  alert(JSON.stringify(ic.karakter_pp));

      const formattedUrl = formatProfilePhoto(ic.karakter_pp);
      setProfilePhotoUrl(formattedUrl);
    }
  }, [ic?.karakter_pp]);

  // YENİ HALİ
  useEffect(() => {
    if (musicName && musicName.trim() !== "") {
      audioPlayerRef.current?.audio.current.play().catch((err) => {
        console.log("Oynatma engellendi veya hata oluştu:", err);
      });
    }
  }, [musicName]); // musicName değiştiğinde de tetiklenmesi için bağımlılığa eklendi

  useEffect(() => {
    //  alert(profilePhotoUrl)
  }, [profilePhotoUrl]);

  useEffect(() => {
    if (audioPlayerRef.current) {
      let playerRef = audioPlayerRef.current as AudioPlayer;
      let audioDom = playerRef.audio.current as HTMLAudioElement;
      if (audioDom) {
        audioDom.volume = Math.max(0, Math.min(100, volume)) / 100;
      }
    }
  }, [volume]);
  function formatProfilePhoto(pp: any): string {
    if (!pp) return "";

    try {
      // Zaten data URL formatındaysa
      if (typeof pp === "string" && pp.startsWith("data:image")) {
        // İç içe geçmiş data URL hatalarını temizle
        if (pp.includes("data:image/webp;base64,data:image")) {
          const cleanBase64 = pp.split(",").pop();
          return `data:image/webp;base64,${cleanBase64}`;
        }
        return pp;
      }

      let base64Data = "";

      // Eğer string olarak geldiyse
      if (typeof pp === "string") {
        const base64Clean = pp.includes(",") ? pp.split(",")[1] : pp;

        try {
          const decoded = atob(base64Clean);
          if (decoded.startsWith("data:image")) {
            return decoded;
          }
        } catch (e) {
          // Normal base64, devam et
        }

        base64Data = base64Clean;
      } else {
        // Bytea / Buffer / Uint8Array formatındakiler için
        let rawValues: number[] = [];

        if (pp instanceof Uint8Array) {
          rawValues = Array.from(pp);
        } else if (Array.isArray(pp)) {
          rawValues = pp;
        } else if (typeof pp === "object" && pp !== null) {
          rawValues = Array.isArray(pp.data) ? pp.data : Object.values(pp);
        }

        if (rawValues.length === 0) {
          return "";
        }

        const safeUint8 = new Uint8Array(rawValues);
        let binary = "";
        const chunkSize = 8192;

        for (let i = 0; i < safeUint8.length; i += chunkSize) {
          const chunk = safeUint8.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }

        base64Data = btoa(binary);
      }

      // Eski data:image kalıntılarını kontrol et
      if (base64Data.startsWith("ZGF0YTppbWFnZS")) {
        const fullyDecoded = atob(base64Data);
        if (fullyDecoded.startsWith("data:image")) {
          return fullyDecoded;
        }
      }

      return `data:image/webp;base64,${base64Data}`;
    } catch (e) {
      console.error("❌ Fotoğraf dönüştürme hatası:", e);
      return "";
    }
  }
  useEffect(() => {
    async function runsql() {
      let query = `select * from users where discord_id = '${profileId.toString()}' `;
      console.log(query);
      let data = await runSqlCommand(query);

      if (data.data.length === 0) {
        setmesajbaslik("Geçersiz Aratma");
        setmesaj(
          "Profil sahibi sunucuyu sistemden silmiş olabilir yada sitemize daha kaydı gerçekleşmedi.",
        );
        setmesajturu("danger");
        router.push("/");
      } else {
        console.log("Veritabanında hesapla eşleşildi :).");
      }
      console.log(JSON.stringify(data));
    }

    runsql();
  }, []);

  useEffect(() => {
    async function run() {
      try {
        let _data = await getDiscordUserId(profileId.toString());
        if (_data) {
          console.log("discord data : ", JSON.stringify(_data));
          setDiscordData(_data);
        }

        let ic_data = await runSqlCommand(
          URLYEGoreKarakterSunucuBilgileriGetir(profileId, serverName),
        );

        console.log("Ham ic_data:", ic_data);

        if (ic_data) {
          const parsedData =
            typeof ic_data === "string" ? JSON.parse(ic_data) : ic_data;

          const karakterBilgisi = Array.isArray(parsedData)
            ? parsedData[0]
            : parsedData.data?.[0];

          if (karakterBilgisi) {
            seticData(karakterBilgisi);
          }

          let icon_rank_data = await runSqlCommand(SunucuIconlarinigetir());

          setIcon_Rank(icon_rank_data);

          if (parsedData.data.length === 0) {
            setmesaj(
              "Bu profil ilgili sunucuda değil veya sistemde kaydı gerçekleşmemiş.",
            );
            setmesajbaslik("Hata mesajı.");
            setmesajturu("danger");
            router.push("/");
          }
        } else {
          console.log("ic data : ", JSON.stringify(ic_data));
        }
      } catch {}
    }

    run();
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

  return (
    <main className="overflow-hidden fixed z-1">
      <div className="fixed flex flex-col gap-4 z-2 right-[11px] top-4">
        {ic?.id && (
          <Tooltip>
            <TooltipContent side="left">
              <p>Arkaplanı Ayarla</p>
            </TooltipContent>
            <TooltipTrigger asChild>
              <span>
                <WallpaperModal karakterId={ic.id}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                  >
                    <SlidersVertical className="size-4" />
                  </Button>
                </WallpaperModal>
              </span>
            </TooltipTrigger>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <span>{ic ? <MusicSelectorModal data={ic} /> : ""}</span>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Müziği Ayarla</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipContent side="left">
            <p>Karakteri Düzenle</p>
          </TooltipContent>
          <TooltipTrigger asChild>
            <span>
              <ICProfileEdit data={ic} allRanks={Icon_Rank || []}>
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

      <div className="fixed flex flex-col gap-1.5 z-2 left-[12px] top-4">
        <Tooltip>
          <TooltipContent side="left">
            <p>Discord Bilgilerini Gör</p>
          </TooltipContent>
          <TooltipTrigger asChild>
            <span className="w-fit">
              <Button
                variant="default"
                size={"lg"}
                className="rounded-full pl-0 cursor-pointer gap-0"
                onClick={() => setIsDiscordModalOpen(true)}
              >
                {discordData?.data?.avatar ? (
                  <Image
                    alt="Profile Picture"
                    width={32}
                    height={32}
                    loading="eager"
                    src={discordData.data.avatar}
                    className="rounded-full"
                  />
                ) : null}

                <span className="w-fit flex items-center px-2">
                  <span className="p-0 m-0 text-[#739373]!">@</span>
                  <span className="p-0 m-0 text-[#737373]!">
                    {discordData ? (
                      discordData?.data?.username + "."
                    ) : (
                      <Spinner />
                    )}
                  </span>
                </span>
              </Button>
            </span>
          </TooltipTrigger>
        </Tooltip>

        <Tooltip>
          <TooltipContent side="right">
            <p>Sunuculara Karakterini Ekle</p>
          </TooltipContent>
          <TooltipTrigger asChild>
            <span className="w-fit">
              {ic ? (
                <SunucularaKarakterEkle karakterId={ic.id}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                  >
                    <LucideGlobeCheck size={30} />
                  </Button>
                </SunucularaKarakterEkle>
              ) : (
                <Button variant="outline" size="icon" className="rounded-full">
                  <Spinner  />
                </Button>
              )}
            </span>
          </TooltipTrigger>
        </Tooltip>
      </div>

      {/* DISCORD BİLGİLERİ MODALI */}
      <Dialog open={isDiscordModalOpen} onOpenChange={setIsDiscordModalOpen}>
        <DialogContent className="sm:max-w-md bg-white text-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg
                viewBox="0 0 127.14 96.36"
                width="24px"
                height="24px"
                xmlns="http://w3.org"
              >
                <path
                  fill="#5865F2"
                  d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.79,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.68,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.81,11.1,105.25,105.25,0,0,0,32.22-16.15c2.62-27.28-4.48-51.2-21.15-75.14ZM42.45,65.69C36.18,65.69,31,60,31,53s5.18-12.71,11.45-12.71S53.9,46,53.88,53,48.71,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.18-12.71,11.44-12.71S96.15,46,96.13,53,90.95,65.69,84.69,65.69Z"
                />
              </svg>
              Discord Kullanıcı Bilgileri
            </DialogTitle>
            <DialogDescription>
              Sistemde kayıtlı olan Discord profil detayları aşağıdadır.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 pt-0">
            <div className="relative w-full flex flex-col items-center ">
              {/* Banner Bölümü */}
              {discordData?.data?.banner ? (
                <Image
                  alt="Banner"
                  width={600}
                  height={200}
                  src={discordData.data.banner}
                  className="w-full h-32 object-cover rounded-sm"
                />
              ) : (
                /* Banner yoksa şık bir düz renk veya boş alan arkaplanı */
                <div className="w-full h-32 bg-black/90 rounded-t-xl" />
              )}

              {/* Avatar Bölümü (Tam Ortada ve Sınırda) */}
              {discordData?.data?.avatar ? (
                <Image
                  alt="Avatar"
                  width={100}
                  height={100}
                  src={discordData.data.avatar}
                  className=" rounded-full border-4 border-white dark:border-zinc-900 absolute left-1/2 -translate-x-1/2 top-4 object-cover shadow-lg"
                />
              ) : (
                <div className="absolute left-1/2 -translate-x-1/2 top-16">
                  <Spinner />
                </div>
              )}
            </div>
            <div className="flex flex-col w-full gap-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-500">
                  Kullanıcı Adı:
                </span>
                <span className="font-mono">
                  {discordData?.data?.globalName || <Spinner />}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-500">Hesap Adı:</span>
                <span className="font-mono">
                  {discordData?.data?.username || "-"}
                </span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="font-semibold text-gray-500">Discord ID:</span>
                <span className="font-mono">
                  {discordData?.data?.id || profileId}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-[calc(100vh-200px)] w-screen flex flex-col items-center justify-center">
        <Card className="relative w-[370px] md:w-[430px] rounded-2xl shadow-xl border border-zinc-200/80 bg-white/90 pt-0! overflow-hidden gap-0! transition-all duration-300">
          {/* Üst Başlık Alanı */}
          <CardHeader className="pt-4 gap-1 pb-0 border-b border-zinc-100 bg-white/95">
            <div className="flex items-center  justify-between">
              <CardTitle className="text-xl  tracking-tight font-playball! font-thin  text-zinc-900">
                IC Inspect Screen
              </CardTitle>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                {ic?.paket.trimStart().substring(0, 1).toLocaleUpperCase()}
                {ic?.paket.trimStart().substring(1).toLocaleLowerCase()}
              </span>
            </div>
            <CardDescription className="text-xs text-zinc-500 mt-0.5 truncate ">
              <div className="flex gap-1.5  justify-start">
                {musicName}
                <Music2 size={15} />
              </div>
            </CardDescription>
          </CardHeader>

          {/* İçerik Alanı */}
          <CardContent className=" pt-0 space-y-4">
            {/* Geri Butonu ve Başlık Navigasyonu */}
          
            {/* Fotoğraf / Medya Alanı */}
            <div className="relative flex justify-center items-center bg-zinc-900 p-2 rounded-xl overflow-hidden shadow-inner aspect-[16/9]">
              {ic === null ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-6">
                  <Spinner />
                  <span className="text-xs text-zinc-400 font-medium">
                    Yükleniyor...
                  </span>
                </div>
              ) : profilePhotoUrl ? (
                <Image
                  alt="Karakter Fotoğrafı"
                  width={350}
                  height={200}
                  className="rounded-lg object-cover h-full p-1.5 w-full"
                  src={profilePhotoUrl}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-zinc-400 py-6">
                  <User className="size-8 opacity-50" />
                  <span className="text-xs">Fotoğraf Bulunamadı</span>
                </div>
              )}
            </div>
            <div className="flex justify-center w-full">
              <hr className=" bg-black w-[calc(100%-40px)]!   h-0.5 opacity-25"></hr>
            </div>
            {/* Bilgi Kartları Grubu */}
            <div className="grid grid-cols-2 gap-2.5 bg-[#f9f9f9]/40 p-3 rounded-sm py-5 gap-y-2.5 mb-2.5 ">
              {/* IC Bilgisi */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  ISIM
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-xs text-zinc-800 truncate">
                  {ic ? (
                    <>
                      <span className="truncate">{ic.karakter_adi}</span>
                      <StarCheck fill="yellow" className="size-3.5 shrink-0" />
                    </>
                  ) : (
                    <Spinner />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Soyisim
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-xs text-zinc-800 truncate">
                  {ic ? (
                    <>
                      <span className="truncate">{ic.karakter_soyadi}</span>
                      <StarCheck fill="yellow" className="size-3.5 shrink-0" />
                    </>
                  ) : (
                    <Spinner />
                  )}
                </div>
              </div>

              {/* Server Bilgisi */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Server
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-xs text-zinc-800 truncate">
                  {ic?.sunucu_adi ? (
                    <span className="truncate">{ic.sunucu_adi}</span>
                  ) : (
                    <Spinner />
                  )}
                  <Server className="size-3.5 text-zinc-600 shrink-0" />
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/60">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Rütbe
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-xs  text-zinc-800 truncate">
                  {ic ? (
                    <>
                      <span className="truncate w-20 overflow-clip">
                        {ic?.icon_baslik}
                      </span>
                    </>
                  ) : (
                    <Spinner />
                  )}

                  {ic?.icon_dosyayolu ? (
                    <img
                      src={ic?.icon_dosyayolu.substring(1) || ""}
                      alt="rutbe"
                      className="size-4 rounded-sm text-zinc-600 shrink-0"
                      width={500}
                      height={500}
                    />
                  ) : (
                    <TriangleAlert className="size-3.5 text-zinc-600 shrink-0" />
                  )}
                </div>
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex flex-col gap-2 pt-1">
              <button className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 transition-all border border-zinc-200/60">
                Sunucuya Katıl
                <Server className="size-4" />
              </button>
            </div>
          </CardContent>

          {/* Alt Footer ve Müzik Kontrolleri */}
          <CardFooter className="flex justify-center items-center gap-2.5 pt-4 pb-4 border-t border-zinc-100 bg-zinc-50/50">
            {/* Hikaye Butonu */}
            <Button
              variant="outline"
              className="rounded-full px-4 h-10 text-xs font-medium gap-2 border-zinc-200 bg-white hover:bg-zinc-100/80 hover:text-zinc-900 transition-all shadow-xs"
              onClick={() => {
                setmusic("GTA V OST Extended Welcome to Los Santos", "m4a");
              }}
            >
              <Notebook className="size-4 text-zinc-500" />
              <span>Hikaye</span>
            </Button>

            {/* Sunucular Butonu (Vurgulu/Ana Buton Yapıldı) */}
            <Button className="rounded-full px-5 h-10 text-xs font-medium gap-2 bg-zinc-900 text-white hover:bg-zinc-800 transition-all shadow-sm">
              <Globe2 className="size-4 text-zinc-300" />
              <span>Sunucular</span>
            </Button>

            {/* Kimlik Butonu */}
            <Button
              variant="outline"
              className="rounded-full px-4 h-10 text-xs font-medium gap-2 border-zinc-200 bg-white hover:bg-zinc-100/80 hover:text-zinc-900 transition-all shadow-xs"
              onClick={() => {
                setmusic("GTA V OST Extended Welcome to Los Santos", "m4a");
              }}
            >
              <User className="size-4 text-zinc-500" />
              <span>Kimlik</span>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* 🎵 AUDIO PLAYER */}
      <div className="min-h-[12%] fixed bottom-[50px] flex flex-col w-full items-center">
        <div className="w-full max-w-[90%] md:max-w-[60%]">
          <AudioPlayer
            ref={audioPlayerRef}
            autoPlay
            src={`/sounds/${musicName}.${uzanti}`}
          />
          <div className="text-center text-white/60 text-xs mt-6 select-none flex gap-3 justify-center">
            <div>
              <kbd className="px-2 py-1 mr-1 bg-white/10 rounded">Space</kbd>{" "}
              Play/Pause •
            </div>
            <div>
              <kbd className="px-2 py-1 mr-1 bg-white/10 rounded ml-1">← →</kbd>{" "}
              5s •
            </div>
            <div>
              <kbd className="px-2 py-1 mr-1 bg-white/10 rounded ml-1">↑ ↓</kbd>{" "}
              Volume •
            </div>
            <div>
              <kbd className="px-2 py-1 mr-1 bg-white/10 rounded ml-1">M</kbd>{" "}
              Mute
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
