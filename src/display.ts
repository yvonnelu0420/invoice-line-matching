import { aggApPush, aggPoPush, money } from "./ui";
import type { Invoice, PurchaseLine, SalesOutLine } from "./types";

export function contains(hay: string | undefined, needle: string) {
  if (!needle.trim()) return true;
  return (hay || "").includes(needle.trim());
}

export function inDateRange(stamp: string | undefined, from: string, to: string) {
  if (!from && !to) return true;
  const day = (stamp || "").slice(0, 10);
  if (!day) return false;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export function invoiceNos(lines: PurchaseLine[]) {
  return [...new Set(lines.map((l) => l.invoiceNo).filter(Boolean))] as string[];
}

export function invoiceMemos(lines: PurchaseLine[], invoices: Invoice[]) {
  const ids = [...new Set(lines.map((l) => l.invoiceId).filter(Boolean))] as string[];
  const memos = ids
    .map((id) => invoices.find((i) => i.id === id)?.memo)
    .filter((m): m is string => !!m);
  return [...new Set(memos)].join("；") || "—";
}

export function cdnBinaryMatch(lines: PurchaseLine[]): "unmatched" | "matched" {
  return lines.length > 0 && lines.every((l) => l.matchStatus === "matched") ? "matched" : "unmatched";
}

export function invoicingStatus(lines: PurchaseLine[]) {
  if (lines.some((l) => l.invoiceNo)) return "已开票";
  return "未开票";
}

export function matchStamp(lines: PurchaseLine[]) {
  const hit = lines.find((l) => l.matchedAt);
  return { at: hit?.matchedAt || "—", by: hit?.matchedBy || "—" };
}

export interface CdnHeader {
  cdn: string;
  lines: PurchaseLine[];
  first: PurchaseLine;
  invs: string[];
  pos: string[];
  binaryMatch: "unmatched" | "matched";
  invoicing: string;
  poPush: ReturnType<typeof aggPoPush>;
  apPush: ReturnType<typeof aggApPush>;
  amount: number;
  excl: number;
  tax: number;
  incl: number;
}

export function groupByCdn(lines: PurchaseLine[]): CdnHeader[] {
  const map = new Map<string, PurchaseLine[]>();
  for (const l of lines) {
    const arr = map.get(l.cdnSn) || [];
    arr.push(l);
    map.set(l.cdnSn, arr);
  }
  return [...map.entries()].map(([cdn, rows]) => ({
    cdn,
    lines: rows,
    first: rows[0],
    invs: invoiceNos(rows),
    pos: [...new Set(rows.map((x) => x.kingdeePoNo).filter(Boolean))] as string[],
    binaryMatch: cdnBinaryMatch(rows),
    invoicing: invoicingStatus(rows),
    poPush: aggPoPush(rows),
    apPush: aggApPush(rows),
    amount: rows.reduce((a, b) => a + b.policyAmount, 0),
    excl: rows.reduce((a, b) => a + (b.invoiceAmount || 0), 0),
    tax: rows.reduce((a, b) => a + (b.taxAmount || 0), 0),
    incl: rows.reduce((a, b) => a + (b.totalAmount || 0), 0),
  }));
}

export function inboundView(l: PurchaseLine) {
  const qty = l.qty;
  const ret = l.returnQty || 0;
  const actualQty = qty - ret;
  const policyAmt = l.policyAmount;
  const excl = l.invoiceAmount;
  const tax = l.taxAmount;
  const incl = l.totalAmount;
  const fee = l.feeAmount || 0;
  const actualAmt = incl != null ? Number((incl - fee).toFixed(2)) : undefined;
  return {
    productName: l.productName,
    productCode: l.productCode,
    model: l.model,
    policyAmt,
    actualAmt,
    excl,
    tax,
    incl,
    fee,
    invoiceUnit: incl != null && qty ? Number((incl / qty).toFixed(2)) : undefined,
    dPrice: Number(((policyAmt / qty) * 1.02).toFixed(2)),
    policyUnit: Number((policyAmt / qty).toFixed(2)),
    remark: l.remark || "—",
    actualUnit: actualAmt != null && actualQty ? Number((actualAmt / actualQty).toFixed(2)) : undefined,
    qty,
    ret: ret || "—",
    actualQty,
    warehouseCode: l.warehouseCode || "—",
    warehouseName: l.warehouseName || "—",
    inboundTime: l.shipTime || "—",
    orderSn: l.orderSn,
    cdnSn: l.cdnSn,
    batchNo: "—",
  };
}

export function salesView(r: SalesOutLine, salesOrderSn?: string) {
  return {
    ...r,
    invoiceUnitPrice: r.invoiceUnitPrice ?? r.unitPrice,
    invoiceAmount: r.invoiceAmount ?? r.amount,
    batchNo: r.batchNo || "—",
    remark: r.remark || "—",
    salesOrderSn: r.salesOrderSn || salesOrderSn || "—",
  };
}

export function occupiedCdns(inv: Invoice, lines: PurchaseLine[]) {
  return [
    ...new Set(
      inv.lines
        .map((l) => lines.find((p) => p.id === l.purchaseLineId)?.cdnSn)
        .filter(Boolean),
    ),
  ] as string[];
}

export function opLogs(opts: { createdAt?: string; matchedAt?: string; matchedBy?: string; extra?: string }) {
  const rows: { at: string; user: string; text: string }[] = [];
  if (opts.createdAt) rows.push({ at: opts.createdAt, user: "陆怡雯", text: "创建单据" });
  if (opts.matchedAt) rows.push({ at: opts.matchedAt, user: opts.matchedBy || "陆怡雯", text: opts.extra || "发票匹配" });
  if (!rows.length) rows.push({ at: "—", user: "—", text: "暂无操作日志" });
  return rows;
}

export { money };
