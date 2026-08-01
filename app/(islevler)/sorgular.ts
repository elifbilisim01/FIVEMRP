export function URLYEGoreKarakterSunucuBilgileriGetir(discord_id : string,serverParam : string) {
  let query = `SELECT * 
FROM users 
INNER JOIN public."ICBilgisi" ic ON ic.user_id = users.user_id
INNER JOIN public."Sunucular" servers ON servers.sunucu_id = ic.sunucu_id
WHERE users.discord_id = '${discord_id}' 
  AND TRIM(servers.sunucu_adi) ILIKE '%${serverParam}%';`;
  return query;
}
