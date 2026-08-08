import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Music, Play, Pause, Search, Check, Disc3 } from "lucide-react";
import useMusic from "../(stroage)/muzik";
import { runSqlCommand } from "../(islevler)/fonksiyonlar";

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
}

interface props {
  data: KarakterVerisi | null;
}

// Veritabanı güncelleme fonksiyonu (İçeriği backend/API çağrınıza göre doldurulabilir)
export const VTICMuzikdegistir = async (
  karakterId: number,
  yeniMuzikAdi: string,
) => {
  try {
    // "SET" eklendi, tablo tırnakları ve $1 etrafındaki tek tırnaklar düzeltildi.
    let data = await runSqlCommand(
      `UPDATE public."ICBilgisi" SET secilen_muzik = $1 WHERE id = $2`,
      [yeniMuzikAdi, karakterId],
    );

    console.log(
      `[VTICMuzikdegistir] Karakter ID: ${karakterId} için müzik "${yeniMuzikAdi}" olarak güncellendi.`,
    );
    
    return data;
  } catch (error) {
    console.error("Müzik veritabanında güncellenirken hata oluştu:", error);
    throw error;
  }
};

export function MusicSelectorModal({ data }: props) {
  const { musicName, uzanti, setmusic } = useMusic();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [previewingId, setPreviewingId] = useState<number | null>(null);

  const previousMusicRef = useRef<{ name: string; uzanti: string } | null>(
    null,
  );
  const [durations, setDurations] = useState<Record<number, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [musicList, setMusicList] = useState<
    Array<{ id: number; title: string; uzanti: string }>
  >([]);

  // Saniye cinsinden süreyi "Dakika:Saniye" formatına çeviren yardımcı fonksiyon
  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Müzikleri API'den çek ve gelen data.secilen_muzik verisi ile eşleştir
  useEffect(() => {
    fetch("/api/sounds")
      .then((res) => res.json())
      .then(
        (fetchedList: Array<{ id: number; title: string; uzanti: string }>) => {
          setMusicList(fetchedList);

          // 1. Gelen data.secilen_muzik bilgisine göre varsayılan seçimi ayarla
          if (data?.secilen_muzik) {
            // Dosya uzantılı gelme ihtimaline karşı temizleme yapıyoruz
            const dbMuzikIsmi = data.secilen_muzik.split(".")[0];
            const eslesenMuzik = fetchedList.find(
              (m) => m.title === dbMuzikIsmi,
            );

            if (eslesenMuzik) {
              setmusic(eslesenMuzik.title, eslesenMuzik.uzanti);
            }
          }

          // 2. Müzik sürelerini yükle
          fetchedList.forEach((item) => {
            const audio = new Audio(`/sounds/${item.title}.${item.uzanti}`);

            const handleLoadedMetadata = () => {
              setDurations((prev) => ({
                ...prev,
                [item.id]: formatDuration(audio.duration),
              }));
            };

            audio.addEventListener("loadedmetadata", handleLoadedMetadata);

            audio.onerror = () => {
              setDurations((prev) => ({
                ...prev,
                [item.id]: "--:--",
              }));
            };
          });
        },
      )
      .catch((err) => console.error("Müzikler yüklenemedi:", err));
  }, [data?.secilen_muzik]);

  // Dialog açılış/kapanış durumunu yönetme
  const handleOpenChange = (open: boolean) => {
    if (open) {
      previousMusicRef.current = { name: musicName, uzanti: uzanti };
      setIsOpen(true);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPreviewingId(null);

      // İptal edildiyse eski müziğe geri dön
      if (previousMusicRef.current) {
        setmusic(
          previousMusicRef.current.name,
          previousMusicRef.current.uzanti,
        );
      }

      setIsOpen(false);
    }
  };

  // Önizleme yönetimi
  const handlePreview = (e: React.MouseEvent, item: (typeof musicList)[0]) => {
    e.stopPropagation();

    if (previewingId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPreviewingId(null);
      if (previousMusicRef.current) {
        setmusic(
          previousMusicRef.current.name,
          previousMusicRef.current.uzanti,
        );
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      setmusic("", "");

      const audio = new Audio(`/sounds/${item.title}.${item.uzanti}`);
      audio.play().catch((err) => console.log("Ses oynatma hatası:", err));

      audio.onended = () => {
        setPreviewingId(null);
        audioRef.current = null;
        if (previousMusicRef.current) {
          setmusic(
            previousMusicRef.current.name,
            previousMusicRef.current.uzanti,
          );
        }
      };

      audioRef.current = audio;
      setPreviewingId(item.id);
    }
  };

  // "Seç" butonuna basıldığında
  const handleSelect = async (item: (typeof musicList)[0]) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPreviewingId(null);

    // 1. Local Store/State Güncellemesi
    setmusic(item.title, item.uzanti);
    previousMusicRef.current = { name: item.title, uzanti: item.uzanti };

    // 2. Veritabanı Güncelleme İşlemi
    if (data) {
      await VTICMuzikdegistir(data.id, item.title);
    }

    setIsOpen(false);
  };

  // Arama filtrelemesi
  const filteredMusic = musicList.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Music className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-white text-zinc-900 rounded-2xl p-6 shadow-2xl border border-zinc-200">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Disc3 className="size-5 text-indigo-600 animate-spin-slow" />
            Müziğini Seç
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Müzikleri dinleyebilir ve profilinde kullanmak için "Seç" butonuna
            basabilirsin.
          </DialogDescription>
        </DialogHeader>

        {/* Arama Çubuğu */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Müzik ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400 transition"
          />
        </div>

        {/* Müzik Listesi Alanı */}
        <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto mt-2 pr-1">
          {filteredMusic.length > 0 ? (
            filteredMusic.map((item) => {
              const isSelected = musicName === item.title;
              const isPreviewing = previewingId === item.id;
              const trackDuration = durations[item.id] || "Yükleniyor...";

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                      : "bg-zinc-50/60 hover:bg-zinc-100/80 border-zinc-200/60 text-zinc-800"
                  }`}
                >
                  {/* Sol Taraf */}
                  <div className="flex items-center gap-3 truncate">
                    <button
                      type="button"
                      onClick={(e) => handlePreview(e, item)}
                      className={`p-2 rounded-lg transition-transform active:scale-95 ${
                        isSelected
                          ? "bg-zinc-800 text-indigo-400 hover:bg-zinc-700"
                          : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
                      }`}
                      title={isPreviewing ? "Durdur" : "Önizle"}
                    >
                      {isPreviewing ? (
                        <Pause className="size-3.5 fill-current" />
                      ) : (
                        <Play className="size-3.5 fill-current" />
                      )}
                    </button>
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-semibold truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Süre: {trackDuration} • Uzantı: .{item.uzanti}
                      </span>
                    </div>
                  </div>

                  {/* Sağ Taraf */}
                  <div className="shrink-0 ml-2">
                    {isSelected ? (
                      <div className="flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
                        <Check className="size-3" />
                        Seçili
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelect(item)}
                        className="h-7 text-xs px-3 rounded-lg border-zinc-300 hover:bg-zinc-200 hover:text-zinc-900 transition"
                      >
                        Seç
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-xs text-zinc-400">
              Aradığın kriterlere uygun müzik bulunamadı.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
