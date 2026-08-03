import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { runSqlCommand } from "../(islevler)/fonksiyonlar";

interface FCProps {
  children: ReactNode;
  data: any;
  allRanks: RankIcon[];
}

interface RankIcon {
  icon_id: number;
  icon_baslik: string;
  icon_aciklama: string;
  icon_dosyayolu: string;
}

export function ICProfileEdit({ children, data, allRanks }: FCProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [iconId, setIconId] = useState<number | null>(data?.icon_id ?? null);

  const [open, setOpen] = useState(false);

  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");

  const [_username, _setUsername] = React.useState<
    string | number | readonly string[] | undefined
  >(undefined);

  const [_surname, _setSurname] = React.useState<
    string | number | readonly string[] | undefined
  >(undefined);

  // --------------------------------------------------
  // Kullanıcı Bilgileri
  // --------------------------------------------------

  useEffect(() => {
    if (data) {
      _setUsername(data.karakter_adi);
      _setSurname(data.karakter_soyadi);
    }
  }, [data]);

  // --------------------------------------------------
  // Profil Fotoğrafı State'leri
  // --------------------------------------------------

  const [avatarOpen, setAvatarOpen] = useState(false);

  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const [croppedImageBytes, setCroppedImageBytes] = useState<string | null>(
    data?.karakter_pp || null,
  );

  // Kullanıcının ekstra zoom değeri
  // 1 = minimum başlangıç cover ölçeği
  const [zoom, setZoom] = useState(1);

  // Fotoğrafın crop alanına ilk sığdırılması için
  // gereken otomatik ölçek
  const [imageScale, setImageScale] = useState(1);

  // Fotoğrafın konumu
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  const [isDragging, setIsDragging] = useState(false);

  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // --------------------------------------------------
  // Rütbeler
  // --------------------------------------------------

  const ranksArray = Array.isArray(allRanks)
    ? allRanks
    : (allRanks as any)?.data || [];

  // --------------------------------------------------
  // Veritabanına Değişiklikleri Gönder
  // --------------------------------------------------

  async function sendDBChangesHandle() {
    const sql =
      `UPDATE public."ICBilgisi" SET karakter_adi = $1, karakter_soyadi = $2, icon_id = $3, karakter_pp = $4 WHERE user_id = ` +
      data.user_id +
      ` and sunucu_id = ` +
      data.sunucu_id;

    const params = [_username, _surname, iconId, croppedImageBytes];

    await runSqlCommand(sql, params);
  }

  // --------------------------------------------------
  // Profil Fotoğrafını Formatla
  // --------------------------------------------------

  function formatProfilePhoto(pp: any): string {
    if (!pp) return "";

    try {
      // Zaten data URL ise
      if (typeof pp === "string" && pp.startsWith("data:image")) {
        // İç içe geçmiş data URL düzeltmesi
        if (pp.includes("data:image/webp;base64,data:image")) {
          const cleanBase64 = pp.split(",").pop();

          return `data:image/webp;base64,${cleanBase64}`;
        }

        return pp;
      }

      let base64Data = "";

      // String veri
      if (typeof pp === "string") {
        const base64Clean = pp.includes(",") ? pp.split(",")[1] : pp;

        // İçinde başka bir data URL olabilir
        try {
          const decoded = atob(base64Clean);

          if (decoded.startsWith("data:image")) {
            return decoded;
          }
        } catch (e) {
          // Normal base64
        }

        base64Data = base64Clean;
      } else {
        // Bytea / Buffer / Uint8Array
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

      // Eski data:image kalıntısı
      if (base64Data.startsWith("ZGF0YTppbWFnZS")) {
        const fullyDecoded = atob(base64Data);

        if (fullyDecoded.startsWith("data:image")) {
          return fullyDecoded;
        }
      }

      return `data:image/webp;base64,${base64Data}`;
    } catch (e) {
      console.error("❌ [PP Debug] Fotoğraf dönüştürme hatası:", e);

      return "";
    }
  }

  // --------------------------------------------------
  // Icon ID Güncelle
  // --------------------------------------------------

  useEffect(() => {
    if (data?.icon_id) {
      setIconId(data.icon_id);
    }
  }, [data]);

  // --------------------------------------------------
  // Veritabanından Gelen Profil Fotoğrafı
  // --------------------------------------------------

  useEffect(() => {
    if (data?.karakter_pp) {
      const url = formatProfilePhoto(data.karakter_pp);

      setProfilePhotoUrl(url);
    }
  }, [data]);

  // --------------------------------------------------
  // Seçilen Rütbe
  // --------------------------------------------------

  const selectedRank = ranksArray.find((r: any) => r.icon_id === iconId);

  // --------------------------------------------------
  // Filtrelenmiş Rütbeler
  // --------------------------------------------------

  const filteredRanks = ranksArray.filter((item: any) => {
    if (selectedCategory === "sivil") {
      return item.icon_dosyayolu.includes("civilian");
    }

    if (selectedCategory === "polis") {
      return item.icon_dosyayolu.includes("police");
    }

    return true;
  });

  // ==================================================
  // FOTOĞRAF SEÇME
  // ==================================================

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) {
      return;
    }

    const file = e.target.files[0];

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        setImageObj(img);
        setImageSrc(img.src);

        // İlk zoom değeri
        setZoom(1);

        // Pozisyonu sıfırla
        setPosition({
          x: 0,
          y: 0,
        });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  };

  // ==================================================
  // FOTOĞRAF SCALE HESAPLAMA
  // ==================================================

  useEffect(() => {
    if (!imageObj || !containerRef.current) {
      return;
    }

    const containerWidth = containerRef.current.clientWidth;

    const containerHeight = containerRef.current.clientHeight;

    if (!containerWidth || !containerHeight) {
      return;
    }

    const imageWidth = imageObj.naturalWidth || imageObj.width;

    const imageHeight = imageObj.naturalHeight || imageObj.height;

    if (!imageWidth || !imageHeight) {
      return;
    }

    // Fotoğrafın crop alanını tamamen
    // doldurması için gereken ölçek
    //
    // Math.max kullanıyoruz çünkü
    // boşluk istemiyoruz.
    const scaleX = containerWidth / imageWidth;

    const scaleY = containerHeight / imageHeight;

    const coverScale = Math.max(scaleX, scaleY);

    setImageScale(coverScale);
  }, [imageObj, avatarOpen]);

  // ==================================================
  // FARE SÜRÜKLEME BAŞLANGICI
  // ==================================================

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    setIsDragging(true);

    setDragStart({
      x: e.clientX - position.x,

      y: e.clientY - position.y,
    });
  };

  // ==================================================
  // FARE SÜRÜKLEME
  // ==================================================

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) {
      return;
    }

    setPosition({
      x: e.clientX - dragStart.x,

      y: e.clientY - dragStart.y,
    });
  };

  // ==================================================
  // FARE SÜRÜKLEME BİTİŞİ
  // ==================================================

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ==================================================
  // MOUSE WHEEL ZOOM
  // ==================================================

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const zoomFactor = e.deltaY < 0 ? 0.1 : -0.1;

    setZoom((prevZoom) => Math.min(Math.max(prevZoom + zoomFactor, 1), 4));
  };

  // ==================================================
  // FOTOĞRAFI KIRP VE KAYDET
  // ==================================================

  const handleCropAndSave = () => {
    if (!imageObj || !canvasRef.current || !containerRef.current) {
      return;
    }

    const canvas = canvasRef.current;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    // -----------------------------------------------
    // ÇIKTI BOYUTU
    // 4:3 DİKDÖRTGEN
    // -----------------------------------------------

    const outWidth = 640;
    const outHeight = 360;

    canvas.width = outWidth;

    canvas.height = outHeight;

    // Canvas temizle
    ctx.clearRect(0, 0, outWidth, outHeight);

    // -----------------------------------------------
    // PREVIEW BOYUTU
    // -----------------------------------------------

    const previewWidth = containerRef.current.clientWidth;

    const previewHeight = containerRef.current.clientHeight;

    if (!previewWidth || !previewHeight) {
      return;
    }

    // -----------------------------------------------
    // GERÇEK RESİM BOYUTU
    // -----------------------------------------------

    const imageWidth = imageObj.naturalWidth;

    const imageHeight = imageObj.naturalHeight;

    // -----------------------------------------------
    // PREVIEW -> CANVAS ORANI
    // -----------------------------------------------

    const scaleX = outWidth / previewWidth;

    const scaleY = outHeight / previewHeight;

    // -----------------------------------------------
    // PREVIEW'DE KULLANILAN GERÇEK SCALE
    // -----------------------------------------------

    const finalScale = imageScale * zoom;

    // -----------------------------------------------
    // CANVAS'TA RESMİN BOYUTU
    // -----------------------------------------------

    const drawWidth = imageWidth * finalScale * scaleX;

    const drawHeight = imageHeight * finalScale * scaleY;

    // -----------------------------------------------
    // POZİSYON
    // -----------------------------------------------

    const offsetX = position.x * scaleX;

    const offsetY = position.y * scaleY;

    // -----------------------------------------------
    // RESMİ MERKEZE AL
    // -----------------------------------------------

    ctx.save();

    ctx.translate(
      outWidth / 2 + offsetX,

      outHeight / 2 + offsetY,
    );

    // -----------------------------------------------
    // RESMİ ÇİZ
    // -----------------------------------------------

    ctx.drawImage(
      imageObj,

      -drawWidth / 2,

      -drawHeight / 2,

      drawWidth,

      drawHeight,
    );

    ctx.restore();

    // -----------------------------------------------
    // WEBP OLARAK KAYDET
    // -----------------------------------------------

    const webpDataUrl = canvas.toDataURL("image/webp", 0.9);

    setCroppedImageBytes(webpDataUrl);

    setProfilePhotoUrl(webpDataUrl);

    setAvatarOpen(false);
  };

  // ==================================================
  // PROFİL FOTOĞRAFI DIALOG AÇILDIĞINDA
  // ==================================================

  useEffect(() => {
    if (avatarOpen) {
      // Kayıtlı fotoğraf varsa
      // ve yeni fotoğraf seçilmediyse
      if (croppedImageBytes && !imageSrc) {
        const img = new Image();

        img.onload = () => {
          setImageObj(img);

          setImageSrc(croppedImageBytes);

          setZoom(1);

          setPosition({
            x: 0,
            y: 0,
          });
        };

        img.src = croppedImageBytes;
      }
    }
  }, [avatarOpen, croppedImageBytes, imageSrc]);

  // ==================================================
  // JSX
  // ==================================================

  return (
    <Sheet >
      <SheetTrigger  asChild>{children}</SheetTrigger>

      <SheetContent  className="overflow-y-auto ">
        <SheetHeader>
          <SheetTitle>Karakteri Düzenle</SheetTitle>

          <SheetDescription>
            Sunucu içerisindeki karakterinizi düzenleyerek insanlara
            karakterinizin kimliğini tanıtabilirsiniz.
          </SheetDescription>

          <div>
            <hr className="mt-4" />
          </div>
        </SheetHeader>

        <div className="grid flex-1 auto-rows-min gap-4 px-4 py-4 pt-0.5">
          {/* ==================================================
              KULLANICI ADI
          ================================================== */}

          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-name">Name</Label>

            <Input
              defaultValue={_username}
              onChange={(e) => _setUsername(e.currentTarget.value.toString())}
            />
          </div>

          {/* ==================================================
              SOYADI
          ================================================== */}

          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-name">Surname</Label>

            <Input
              defaultValue={_surname}
              onChange={(e) => _setSurname(e.currentTarget.value.toString())}
            />
          </div>
          <div className="flex flex-col gap-2">
            {/* ==================================================
              STATÜ DÜZENLEME
          ================================================== */}

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Statü Düzenle</Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[650px]">
                <DialogHeader>
                  <DialogTitle>Rütbe Seç</DialogTitle>

                  <DialogDescription>
                    Rütbeyi seçtikten sonra pencereyi kapatın ve değişiklikleri
                    kaydedin.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col md:flex-row gap-5">
                  {/* SEÇİLEN STATÜ */}

                  <div className="flex flex-col items-center justify-between md:w-[250px] h-fit rounded-md gap-3">
                    <div className="border border-slate-200 bg-slate-50 p-4 md:p-4 md:pt-2 gap-1 w-full md:min-w-[192px] h-fit flex flex-col items-center">
                      <span className="text-sm font-medium text-slate-600">
                        Seçilen Statü
                      </span>

                      {selectedRank ? (
                        <div className="flex flex-col items-center text-center gap-2">
                          <div className="md:w-32 md:h-32 border rounded-lg bg-white flex items-center justify-center p-2 shadow-sm">
                            <img
                              src={selectedRank.icon_dosyayolu.replace(
                                /^\./,
                                "",
                              )}
                              alt={selectedRank.icon_baslik}
                              className="object-contain w-16 h-16 md:w-[110px] md:h-[110px]"
                            />
                          </div>

                          <span className="text-xs font-semibold text-slate-800">
                            {selectedRank.icon_baslik}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 text-center py-8">
                          Henüz bir rütbe seçilmedi.
                        </div>
                      )}
                    </div>

                    <div className="w-full flex-col gap-2 hidden md:flex">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setOpen(false)}
                      >
                        Seç
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setOpen(false);

                          setTimeout(() => {
                            setIconId(data.icon_id);
                          }, 1000);
                        }}
                      >
                        İptal
                      </Button>
                    </div>
                  </div>

                  {/* RÜTBE LİSTESİ */}

                  <div className="grid gap-3 flex-1">
                    <div className="grid gap-6">
                      <div className="grid gap-2 md:gap-3">
                        <Label
                          htmlFor="rank_baslik"
                          className="hidden md:block"
                        >
                          Rütbe Bilgileri
                        </Label>

                        <Input
                          id="rank_baslik"
                          value={selectedRank?.icon_baslik || ""}
                          className="text-sm md:text-[16px] hidden"
                          disabled
                        />

                        <Textarea
                          id="rank_aciklama"
                          value={selectedRank?.icon_aciklama || ""}
                          className="text-sm md:text-[14.5px]"
                          disabled
                        />
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <Select
                        defaultValue="all"
                        onValueChange={(val) => setSelectedCategory(val)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Filtrele" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Statü Kategorileri</SelectLabel>

                            <SelectItem value="all">Tümü</SelectItem>

                            <SelectItem value="sivil">Sivil</SelectItem>

                            <SelectItem value="polis">Polis</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-[#ffffff] h-[180px] w-full border overflow-y-auto border-[#e5e5e5] rounded-md p-2">
                      <div className="grid grid-cols-4 gap-2">
                        {filteredRanks.map((rank: any) => {
                          const imagePath = rank.icon_dosyayolu.replace(
                            /^\./,
                            "",
                          );

                          const isSelected = iconId === rank.icon_id;

                          return (
                            <div
                              key={rank.icon_id}
                              onClick={() => setIconId(rank.icon_id)}
                              className={`cursor-pointer flex flex-col items-center justify-center p-1 border rounded transition-all hover:bg-slate-100 ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-400"
                                  : "border-slate-200"
                              }`}
                              title={rank.icon_baslik}
                            >
                              <img
                                src={imagePath}
                                alt={rank.icon_baslik}
                                className="w-10 h-10 object-contain"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="w-full flex-col gap-2 flex md:hidden">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setOpen(false)}
                      >
                        Seç
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setOpen(false);

                          setTimeout(() => {
                            setIconId(data.icon_id);
                          }, 1000);
                        }}
                      >
                        İptal
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* ==================================================
              PROFİL FOTOĞRAFI DÜZENLE
          ================================================== */}

            <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Profil Fotoğrafı Düzenle</Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle>Profil Fotoğrafını Ayarla</DialogTitle>

                  <DialogDescription>
                    Fotoğrafı sürükleyerek konumlandırabilir, tekerlek ile
                    yakınlaştırıp uzaklaştırabilirsiniz.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-2">
                  {/* ==================================================
                    4:3 DİKDÖRTGEN CROP ALANI
                ================================================== */}

                  <div
                    ref={containerRef}
                    className="relative w-full aspect-[16/9] border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center shadow-inner cursor-grab active:cursor-grabbing select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                  >
                    {imageSrc && imageObj ? (
                      <div className="absolute inset-0 overflow-hidden">
                        <img
                          src={imageSrc}
                          alt="Crop preview"
                          style={{
                            width: `${imageObj.naturalWidth}px`,
                            height: `${imageObj.naturalHeight}px`,

                            maxWidth: "none",
                            maxHeight: "none",

                            position: "absolute",

                            left: "50%",
                            top: "50%",

                            transform: `
                            translate(
                              calc(-50% + ${position.x}px),
                              calc(-50% + ${position.y}px)
                            )
                            scale(${imageScale * zoom})
                          `,

                            transformOrigin: "center center",
                          }}
                          className="pointer-events-none select-none"
                          draggable={false}
                        />
                      </div>
                    ) : (
                      <img
                        src={profilePhotoUrl || "/wallpapers/2.avif"}
                        alt="Mevcut Profil"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* ==================================================
                    DOSYA SEÇİCİ
                ================================================== */}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    Bilgisayardan Fotoğraf Seç
                  </Button>

                  {/* ==================================================
                    ZOOM
                ================================================== */}

                  {imageSrc && (
                    <div className="w-full flex flex-col gap-1">
                      <Label className="text-xs text-slate-600">
                        Yakınlaştır / Uzaklaştır (veya Fare Tekerleği)
                      </Label>

                      <input
                        type="range"
                        min="1"
                        max="4"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* ==================================================
                    GİZLİ CANVAS
                ================================================== */}

                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* ==================================================
                  BUTONLAR
              ================================================== */}

                <div className="flex gap-2 justify-end mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setAvatarOpen(false)}
                  >
                    İptal
                  </Button>

                  <Button
                  variant={"outline"}
                    onClick={handleCropAndSave}
                    disabled={!imageSrc && !croppedImageBytes}
                  >
                    Uygula
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ==================================================
            SHEET FOOTER
        ================================================== */}

        <SheetFooter>
          <Button
            type="submit"
            onClick={() => {
              sendDBChangesHandle();
              location.reload();
            }}
          >
            Değişikliği Kaydet
          </Button>

          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
