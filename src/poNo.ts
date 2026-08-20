/** 金蝶采购单号：KDCG + 年月日 + 4 位当日流水。同一打包共用一号；解绑不回收号段。 */
export function nextKingdeePoNo(existing: string[], now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const prefix = `KDCG${y}${m}${d}`;
  let max = 0;
  for (const no of existing) {
    if (!no.startsWith(prefix)) continue;
    const n = Number(no.slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export const PO_NO_RULE = {
  pattern: "KDCG + YYYYMMDD + 4位流水",
  example: "KDCG202608190001",
  note: "按自然日全组织递增；整票/多行一次打包共用同一单号；解绑后原号作废不复用。",
};
