import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    // Client'tan gönderilen JSON verisinden SQL kodunu alıyoruz
    const body = await request.json();
    const { sqlQuery, params } = body;

    if (!sqlQuery) {
        return NextResponse.json(
            { error: "Çalıştırılacak SQL sorgusu belirtilmedi." },
            { status: 400 }
        );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Veritabanı bağlantı adresi bulunamadı." },
        { status: 500 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);

    // Gelen SQL kodunu parametrelerle birlikte çalıştırıyoruz
    // Not: params dizisi varsa güvenli parametreli sorgu atar, yoksa direkt sorguyu çalıştırır.
// GÜNCELLENEN KISIM: Parametreli kullanım için sql.query() metodunu kullanıyoruz
// KESİN ÇÖZÜM: Parametreli olsun veya olmasın her zaman sql.query kullanıyoruz
    const result = params && params.length > 0 
      ? await sql.query(sqlQuery, params) 
      : await sql.query(sqlQuery);

    return NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("SQL Çalıştırma Hatası:", error);
    return NextResponse.json(
      { error: error.message || "SQL sorgusu çalıştırılırken bir hata oluştu." },
      { status: 500 }
    );
  }
}