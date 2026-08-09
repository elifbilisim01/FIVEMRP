"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Server,
  X,
  Loader2,
  Globe,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { runSqlCommand } from "../(islevler)/fonksiyonlar";
import useHataMesaji from "@/app/(stroage)/uyarimesaji";

interface Sunucu {
  sunucu_id: number;
  sunucu_adi: string;
  sunucu_aciklamasi: string | null;
  sunucu_pp: string | null;
  fivem_sunucu_id: string | null;
  liveData?: {
    hostname?: string;
    clients?: number;
    sv_maxclients?: number;
    icon?: string;
    description?: string;
  };
}

interface SunucularaKarakterEkleProps {
  children: React.ReactNode;
  karakterId: number;
  mevcutSunucuId?: number;
}

const ITEMS_PER_PAGE = 5;

// FiveM renk kodlarını (^1, ^2 vb.) temizleyici
const cleanFiveMString = (str?: string) => {
  if (!str) return "";
  return str.replace(/\^\d/g, "").trim();
};

const fetchFiveMServerData = async (fivemId: string) => {
  try {
    const res = await fetch(`/api/fivem?id=${fivemId}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();

    if (data && data.Data) {
      const serverData = data.Data;
      const vars = serverData.vars || {};

      const rawName = vars.sv_projectName || serverData.hostname || "";
      const rawDesc = vars.sv_projectDesc || "";

      return {
        hostname: cleanFiveMString(rawName),
        description: cleanFiveMString(rawDesc),
        clients: Number(serverData.clients) || 0,
        sv_maxclients: Number(serverData.sv_maxclients) || 0,
        icon: serverData.icon || undefined,
      };
    }
    return null;
  } catch (err) {
    console.error(`[FiveM Fetch Error - ID: ${fivemId}]`, err);
    return null;
  }
};

export function SunucularaKarakterEkle({
  children,
  karakterId,
  mevcutSunucuId,
}: SunucularaKarakterEkleProps) {
  const [open, setOpen] = useState(false);
  const [sunucular, setSunucular] = useState<Sunucu[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSunucuId, setSelectedSunucuId] = useState<number | null>(
    mevcutSunucuId || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { setmesaj, setmesajturu, setmesajbaslik } = useHataMesaji();

  // Veritabanı ve API Entegrasyonu
  const fetchSunucular = async () => {
    try {
      setIsFetching(true);
      const res = await runSqlCommand(
        `SELECT * FROM public."Sunucular" ORDER BY sunucu_id ASC`,
      );

      let dataList: Sunucu[] = [];
      if (Array.isArray(res)) {
        dataList = res;
      } else if (res?.data && Array.isArray(res.data)) {
        dataList = res.data;
      }

      // LiveData sorgusu bitene kadar yüklenme ekranını koruyoruz
      const updatedSunucular = await Promise.all(
        dataList.map(async (sunucu) => {
          const cfxId =
            sunucu.fivem_sunucu_id ||
            (sunucu as Record<string, unknown>).fivem_id;

          if (cfxId && typeof cfxId === "string") {
            const liveData = await fetchFiveMServerData(cfxId);
            if (liveData) {
              return { ...sunucu, liveData };
            }
          }
          return sunucu;
        }),
      );

      setSunucular(updatedSunucular);
    } catch (err) {
      console.error("Sunucular çekilirken hata oluştu:", err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (open) {
      setCurrentPage(1);
      fetchSunucular();
      if (mevcutSunucuId) {
        setSelectedSunucuId(mevcutSunucuId);
      }
    }
  }, [open, mevcutSunucuId]);

  // Arama filtresi değiştiğinde 1. sayfaya sıfırla
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Karakteri Sunucuya Aktar
  const handleSave = async () => {
    if (!selectedSunucuId) {
      setmesajbaslik("Uyarı");
      setmesaj("Lütfen bir sunucu seçin.");
      setmesajturu("warning");
      return;
    }

    try {
      setIsLoading(true);

      await runSqlCommand(
        `UPDATE public."ICBilgisi" SET sunucu_id = $1 WHERE id = $2`,
        [selectedSunucuId, karakterId],
      );

      setmesajbaslik("Başarılı");
      setmesaj("Karakter başarıyla seçilen sunucuya aktarıldı.");
      setmesajturu("success");

      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Sunucu güncelleme hatası:", error);
      setmesajbaslik("Hata");
      setmesaj("Sunucu atanırken bir hata oluştu.");
      setmesajturu("danger");
    } finally {
      setIsLoading(false);
    }
  };

  // Sunucu Filtreleme Mantığı
  const filteredSunucular = useMemo(() => {
    if (!searchQuery.trim()) return sunucular;
    const query = searchQuery.toLowerCase();
    return sunucular.filter((sunucu) => {
      const name = (
        sunucu.liveData?.hostname ||
        sunucu.sunucu_adi ||
        ""
      ).toLowerCase();
      const cfx = (sunucu.fivem_sunucu_id || "").toLowerCase();
      return name.includes(query) || cfx.includes(query);
    });
  }, [sunucular, searchQuery]);

  // Sayfalandırma (Pagination) Mantığı
  const totalPages = Math.ceil(filteredSunucular.length / ITEMS_PER_PAGE);

  const paginatedSunucular = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSunucular.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSunucular, currentPage]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !w-full !h-full !max-w-none !rounded-none !border-none !p-0 bg-zinc-950/80 text-zinc-900 flex flex-col justify-between overflow-hidden z-[99999]"
      >
        {/* Header */}
        <DialogHeader className="p-4 md:px-8 bg-white/95 border-b border-zinc-200/80 flex flex-row items-center justify-between space-y-0 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 text-zinc-800 rounded-xl border border-zinc-200/80 shadow-xs">
              <Globe className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-zinc-900 tracking-tight">
                Sunucuya Karakter Ekle / Aktar
              </DialogTitle>

              <p className="text-xs text-zinc-500 font-normal mt-0.5">
                Karakterinizin bulunmasını istediğiniz FiveM sunucusunu seçin.
              </p>
            </div>
          </div>

          <DialogClose asChild disabled={isLoading}>
            <button className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors active:scale-95 cursor-pointer disabled:opacity-50">
              <X className="size-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        {/* Ana İçerik */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Sunucu Arama Barı */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Sunucu adı veya CFX ID ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-white border-zinc-200 rounded-xl text-sm shadow-xs focus-visible:ring-zinc-900"
              />
            </div>

            {/* Sunucu Listesi Veya Spinner */}
            {isFetching ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
                <Loader2 className="size-9 animate-spin text-white" />
                <span className="text-sm text-zinc-300 font-medium">
                  Sunucular ve canlı veriler yükleniyor...
                </span>
              </div>
            ) : filteredSunucular.length === 0 ? (
              <div className="text-center text-zinc-400 py-16 text-sm bg-white/50 rounded-2xl border border-dashed border-zinc-300">
                Aramanıza veya sistemdeki kayıtlara uygun sunucu bulunamadı.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {paginatedSunucular.map((sunucu) => {
                  const isSelected = selectedSunucuId === sunucu.sunucu_id;

                  const displayImage =
                    sunucu.liveData?.icon || sunucu.sunucu_pp;
                  const displayName =
                    sunucu.liveData?.hostname || sunucu.sunucu_adi;
                  const displayDesc =
                    sunucu.liveData?.description ||
                    sunucu.sunucu_aciklamasi ||
                    "Açıklama bulunmuyor.";

                  return (
                    <div
                      key={sunucu.sunucu_id}
                      onClick={() =>
                        !isLoading && setSelectedSunucuId(sunucu.sunucu_id)
                      }
                      className={`group relative cursor-pointer rounded-2xl p-4 transition-all duration-200 bg-white border flex items-center gap-4 ${
                        isSelected
                          ? "border-zinc-900 ring-2 ring-zinc-900/20 shadow-lg scale-[1.005]"
                          : "border-zinc-200/80 hover:border-zinc-400 hover:shadow-md"
                      }`}
                    >
                      {/* Sunucu İkonu / Logo */}
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-zinc-900 border border-zinc-200 flex items-center justify-center">
                        {displayImage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={displayImage}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Server className="size-7 text-zinc-400" />
                        )}
                      </div>

                      {/* Sunucu Detayları */}
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-zinc-900 truncate">
                            {displayName}
                          </h3>

                          {sunucu.fivem_sunucu_id && (
                            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                              CFX: {sunucu.fivem_sunucu_id}
                            </span>
                          )}
                        </div>

                        {/* Açıklama */}
                        <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                          {displayDesc}
                        </p>

                        {/* Canlı Oyuncu Sayısı */}
                        {sunucu.liveData?.clients !== undefined && (
                          <div className="flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-emerald-600">
                            <span className="relative flex size-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                            </span>
                            <Users className="size-3.5" />
                            <span>
                              {sunucu.liveData.clients} /{" "}
                              {sunucu.liveData.sv_maxclients} Oyuncu
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Düğmeleri */}
            {!isFetching && totalPages > 1 && (
              <div className="flex items-center justify-end gap-1.5 pt-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg border-zinc-200 bg-white hover:bg-zinc-100"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="size-4 text-zinc-600" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      className={`size-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === pageNum
                          ? "bg-zinc-900 text-white hover:bg-zinc-800"
                          : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ),
                )}

                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg border-zinc-200 bg-white hover:bg-zinc-100"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="size-4 text-zinc-600" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="!m-0 p-4 md:px-8 border-t border-zinc-200/80 bg-white/95 flex flex-row items-center justify-between sm:justify-between gap-4 shrink-0 !rounded-none">
          <div className="text-xs text-zinc-500 hidden sm:block font-medium">
            Seçili Sunucu ID:{" "}
            <span className="text-zinc-900 font-mono font-bold">
              {selectedSunucuId ?? "Seçilmedi"}
            </span>
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
              disabled={isLoading || !selectedSunucuId}
              className="rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs h-9 px-6 shadow-sm transition-all flex items-center gap-2"
            >
              {isLoading && <Loader2 className="size-3.5 animate-spin" />}
              {isLoading ? "Kaydediliyor..." : "Sunucuyu Kaydet"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}