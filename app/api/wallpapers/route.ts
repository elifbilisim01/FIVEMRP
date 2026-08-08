import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const wallpapersDir = path.join(process.cwd(), "public/wallpapers");
  
  try {
    const filenames = fs.readdirSync(wallpapersDir);
    // Sadece resim dosyalarını filtrele
    const imageFiles = filenames.filter((file) => 
      /\.(jpg|jpeg|png|webp)$/i.test(file)
    );

    const wallpapers = imageFiles.map((filename, index) => {
      // İsmi ve uzantıyı dinamik ayır (örn: "bg1.jpg" -> name: "Bg1", filename: "bg1.jpg")
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
      const formattedName = nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1);

      return {
        id: String(index + 1),
        name: `Duvar Kağıdı ${formattedName}`,
        filename: filename,
      };
    });

    return NextResponse.json(wallpapers);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}