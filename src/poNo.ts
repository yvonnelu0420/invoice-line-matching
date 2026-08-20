/** 金蝶采购单号：KDCG + YYMMDD + 4 位当日流水。同一打包共用一号；解绑不回收号段。 */
export function nextKingdeePoNo(existing: string[], now = new Date()): string {
  const yy = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const prefix = `KDCG${yy}${m}${d}`;
  let max = 0;
  for (const no of existing) {
    if (!no.startsWith(prefix)) continue;
    const n = Number(no.slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export const PO_NO_RULE = {
  pattern: "KDCG + YYMMDD + 4位流水",
  example: "KDCG2608190001",
  note: "按自然日全组织递增；同一张发票或一次未配行打包共用一号；一次勾选多张票则拆成多个单号；解绑后原号作废不复用。",
};
