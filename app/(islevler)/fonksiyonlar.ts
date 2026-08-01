import crypto from "crypto";

const algorithm = "aes-256-cbc";
const secretKey = crypto.createHash("sha256").update(process.env.DISCORD_CLIENT_SECRET || "gizli-anahtar").digest();

export  async function runSqlCommand(SqlCommand: string, parameter?: []) {
  /*
    
örnek kod 
    {
      sqlQuery: "INSERT INTO comments (comment) VALUES ($1)",
      params: ["Merhaba dünya"],
    }
    
    */

  const response = await fetch("/api/RunSQL", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sqlQuery: SqlCommand,
      params: parameter,
    }),
  });

  const data = await response.json();
  return data;
}

export async function getDiscordUserId(discord_user_id: string) {
  try {
    const res = await fetch(`/api/getDiscordUserInfo?discordId=${discord_user_id}`);
    
    if (!res.ok) {
      throw new Error("API isteği başarısız oldu.");
    }

    const result = await res.json();
    return result;

  } catch (error) {
    console.error("Discord veri çekme hatası:", error);
    return { success: false, error: "Sunucuya ulaşılamadı." };
  }
}






// Şifrelenmiş çerezi çözmek için yardımcı fonksiyon
function decrypt(encryptedText: string) {
  try {
    const parts = encryptedText.split(":");
    const iv = Buffer.from(parts.shift()!, "hex");
    const encrypted = parts.join(":");
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    return null; // Şifre çözülemezse veya düz metinse null döner
  }
}
