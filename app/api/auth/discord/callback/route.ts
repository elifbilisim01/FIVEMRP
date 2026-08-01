import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

// Güvenli şifreleme için gizli anahtar ve algoritma ayarları
const algorithm = "aes-256-cbc";
// ENV'den gelen secret'ı 32 byte'a sabitliyoruz
const secretKey = crypto.createHash("sha256").update(process.env.DISCORD_CLIENT_SECRET || "gizli-anahtar").digest();

// Discord ID'sini Şifreleme (Encrypt) Fonksiyonu
function encrypt(text: string) {
  const iv = crypto.randomBytes(16); // Rastgele iv vektörü
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted; // iv ve şifreyi birlikte saklıyoruz
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "http://localhost:3000/api/auth/discord/callback",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("Discord Token Hatası Detayı:", tokenData);
      throw new Error("Token alınamadı");
    }

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const discordUser = await userResponse.json();

    // Kullanıcının gerçek Discord ID'sini şifreliyoruz
    const encryptedDiscordId = encrypt(discordUser.id);

    // Tarayıcıya sadece şifrelenmiş güvenli çerezi kaydediyoruz
    const cookieStore = await cookies();
    cookieStore.set({
      name: "discord_user_session",
      value: encryptedDiscordId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 hafta
      path: "/",
    });

    return NextResponse.redirect(new URL("/", request.url));

  } catch (error) {
    console.error("Discord Giriş Hatası:", error);
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }
}