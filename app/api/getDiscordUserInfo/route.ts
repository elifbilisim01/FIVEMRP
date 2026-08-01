import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const discordId = searchParams.get("discordId");

  if (!discordId) {
    return NextResponse.json({ error: "Discord ID belirtilmedi." }, { status: 400 });
  }

  try {
    // Bot Token ile Discord API'ye istek atıyoruz
    const response = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
      cache: "no-store", // Her seferinde güncel veriyi çekmesi için
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    const data = await response.json();

    // Profil resmi URL'ini oluşturuyoruz
    const avatarUrl = data.avatar
      ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.${data.avatar.startsWith("a_") ? "gif" : "png"}`
      : `https://cdn.discordapp.com/embed/avatars/${Number(data.discriminator || 0) % 5}.png`;

    // Banner URL'ini oluşturuyoruz (Kullanıcının banner'ı yoksa null döner)
    const bannerUrl = data.banner
      ? `https://cdn.discordapp.com/banners/${data.id}/${data.banner}.${data.banner.startsWith("a_") ? "gif" : "png"}?size=600`
      : null;

    const userInfo = {
      id: data.id,
      username: data.username,
      globalName: data.global_name || data.username, // Görünen adı
      avatar: avatarUrl,
      banner: bannerUrl,
      accentColor: data.accent_color, // Hex renk kodu (sayısal olarak gelir)
    };

    return NextResponse.json({ success: true, data: userInfo }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}