"use server";

import { runSqlCommand } from "../(islevler)/fonksiyonlar";


export const VTICArkaplandegistir = async (
  karakterId: number,
  yeniArkaplanAdi: string,
) => {
  try {
    let data = await runSqlCommand(
      `UPDATE public."ICBilgisi" SET secilen_arkaplan = $1 WHERE id = $2`,
      [yeniArkaplanAdi, karakterId],
    );

    console.log(
      `[VTICArkaplandegistir] Karakter ID: ${karakterId} için arkaplan "${yeniArkaplanAdi}" olarak güncellendi.`,
    );

    return data;
  } catch (error) {
    console.error("Arkaplan veritabanında güncellenirken hata oluştu:", error);
    throw error;
  }
};