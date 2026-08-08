import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const soundsDirectory = path.join(process.cwd(), 'public/sounds');
  
  try {
    const filenames = fs.readdirSync(soundsDirectory);
    
    // Desteklenen ses uzantıları
    const validExtensions = ['mp3', 'm4a', 'wav', 'ogg', 'aac', 'flac'];

    const musicList = filenames
      .filter((file) => {
        const ext = path.extname(file).substring(1).toLowerCase();
        return validExtensions.includes(ext);
      })
      .map((file, index) => {
        const ext = path.extname(file).substring(1);
        const title = path.basename(file, `.${ext}`);

        return {
          id: index + 1,
          title: title,
          uzanti: ext,
        };
      });

    return NextResponse.json(musicList);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}