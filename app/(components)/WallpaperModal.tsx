"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Check, Image as ImageIcon, SlidersVertical, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import useStore from "../(stroage)/arkaplan";
import { runSqlCommand } from "../(islevler)/fonksiyonlar";

interface Wallpaper {
  id: string;
  name: string;
  filename: string;
}

interface WallpaperModalProps {
  children: React.ReactNode;
  karakterId: number;
}

export function WallpaperModal({ children, karakterId }: WallpaperModalProps) {
  const { wallpaper, setwallpaper } = useStore();
  const [selected, setSelected] = useState<string>(wallpaper || "bg1.jpg");
  const [open, setOpen] = useState(false);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(wallpaper);
    }
  }, [open, wallpaper]);

  // Görselleri sadece modal ilk açıldığında veya bileşen yüklendiğinde bir kez çek
  useEffect(() => {
    let isMounted = true;
    fetch("/api/wallpapers")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setWallpapers(data);
        }
      })
      .catch((err) => console.error("Duvar kağıtları yüklenemedi:", err));

    return () => {
      isMounted = false;
    };
  }, []);

  const updateProfileBackground = async (newWallpaper: string) => {
    try {
      setIsLoading(true);
      await runSqlCommand(
        `UPDATE public."ICBilgisi" SET secilen_arkaplan = $1 WHERE id = $2`,
        [newWallpaper, karakterId]
      );

      setwallpaper(newWallpaper);
      setOpen(false);
    } catch (error) {
      console.error("Arkaplan veritabanına kaydedilirken hata oluştu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    updateProfileBackground(selected);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent 
        showCloseButton={false}
        className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !w-full !h-full !max-w-none !rounded-none !border-none !p-0 bg-zinc-950/80 text-zinc-900 flex flex-col justify-between overflow-hidden z-[99999]"
      >
        {/* Header - Blur basitleştirildi */}
        <DialogHeader className="p-4 md:px-8 bg-white/95 border-b border-zinc-200/80 flex flex-row items-center justify-between space-y-0 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 text-zinc-800 rounded-xl border border-zinc-200/80 shadow-xs">
              <SlidersVertical className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-zinc-900 tracking-tight">
                Profil Arka Planı
              </DialogTitle>
              <p className="text-xs text-zinc-500 font-normal mt-0.5">
                Profilinizde görüntülenecek duvar kağıdını seçin.
              </p>
            </div>
          </div>

          <DialogClose asChild disabled={isLoading}>
            <button className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors active:scale-95 cursor-pointer disabled:opacity-50">
              <X className="size-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        {/* Görsel Galerisi */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6 text-xs font-medium text-zinc-200 bg-zinc-900/80 border border-white/10 w-fit px-3 py-1.5 rounded-full shadow-sm">
              <ImageIcon className="size-3.5 text-zinc-300" />
              <span>Görsel Konumu: /public/wallpapers/</span>
            </div>

            {wallpapers.length === 0 ? (
              <div className="text-center text-zinc-400 py-12 text-sm">
                Görseller yükleniyor veya klasörde bulunamadı...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {wallpapers.map((item) => {
                  const isSelected = selected === item.filename;
                  return (
                    <div
                      key={item.id}
                      onClick={() => !isLoading && setSelected(item.filename)}
                      /* transition-all yerine performanslı olan border ve shadow geçişleri */
                      className={`group relative cursor-pointer rounded-2xl p-2 transition-colors duration-150 bg-white border ${
                        isSelected
                          ? "border-zinc-900 ring-4 ring-zinc-900/10 shadow-xl"
                          : "border-zinc-200/80 hover:border-zinc-400 hover:shadow-md"
                      }`}
                    >
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-100 border border-zinc-100">
                        {/* OPTİMİZE EDİLMİŞ IMAGE BİLEŞENİ */}
                        <Image
                          src={`/wallpapers/${item.filename}`}
                          alt={item.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          quality={60} // Kaliteyi %60 yaparak yükü hafifletiyoruz
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                        />

                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 bg-zinc-900 text-white p-1 rounded-full shadow-md z-10">
                            <Check className="size-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5 px-1.5 flex items-center justify-between pb-0.5">
                        <span className="text-xs font-semibold text-zinc-800 truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono uppercase">
                          {item.filename}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="!m-0 p-4 md:px-8 border-t border-zinc-200/80 bg-white/95 flex flex-row items-center justify-between sm:justify-between gap-4 shrink-0 !rounded-none">
          <div className="text-xs text-zinc-500 hidden sm:block font-medium">
            Seçili Arkaplan: <span className="text-zinc-900 font-mono font-bold">{selected}</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <DialogClose asChild disabled={isLoading}>
              <Button 
                variant="outline" 
                className="rounded-full border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs h-9 px-5 font-medium shadow-xs"
              >
                İptal
              </Button>
            </DialogClose>
            
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs h-9 px-6 shadow-sm transition-all flex items-center gap-2"
            >
              {isLoading && <Loader2 className="size-3.5 animate-spin" />}
              {isLoading ? "Kaydedidediliyor..." : "Değişiklikleri Kaydet"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}