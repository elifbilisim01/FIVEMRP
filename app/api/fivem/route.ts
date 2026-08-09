import { NextResponse } from "next/server";

function cleanFiveMColorCodes(str: string = ""): string {
  if (!str) return "";
  return str.replace(/\^\d/g, "").trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID eksik" }, { status: 400 });
  }

  try {
    // Cloudflare engeline takılmayan resmi FiveM master list endpoint'i üzerinden arama yapıyoruz
    const masterListUrl = `https://servers-frontend.fivem.net/api/servers/single/${id}`;

    const response = await fetch(masterListUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Sunucuya ulaşılamadı veya ID geçersiz." },
        { status: 404 }
      );
    }

    const json = await response.json();
    const serverData = json.Data;

    if (!serverData) {
      return NextResponse.json({ error: "Sunucu verisi bulunamadı." }, { status: 404 });
    }

    const rawHostname = serverData.vars?.sv_projectName || serverData.hostname || "PWUC Roleplay";
    const cleanName = cleanFiveMColorCodes(rawHostname);
    const cleanDescription = cleanFiveMColorCodes(serverData.vars?.sv_projectDesc || "");

    return NextResponse.json({
      Data: {
        hostname: cleanName,
        clients: serverData.clients ?? 0,
        sv_maxclients: serverData.sv_maxclients ?? 700,
        icon: `https://frontend.cfx-services.net/api/servers/icon/${id}/-543792002.png`,
        vars: {
          sv_projectName: cleanName,
          sv_projectDesc: cleanDescription,
        },
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("API Hatası:", errorMessage);
    return NextResponse.json(
      { error: `Sunucu hatası: ${errorMessage}` },
      { status: 500 }
    );
  }
}