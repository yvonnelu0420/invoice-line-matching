import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { nextKingdeePoNo } from "./poNo";
import type {
  ApPushStatus,
  Invoice,
  InvoiceMatchStatus,
  PageId,
  PoPushStatus,
  PurchaseLine,
  SalesOutLine,
  Toast,
} from "./types";

const SUHAO = "江苏苏豪创新科技集团有限公司";
const MHI = "三菱重工空调系统（上海）有限公司";
const OTHER = "深圳市伟信环保科技有限公司";
const BJ = "菱感电子商务（北京）有限公司";
const CD = "菱感电子商务（成都）有限公司";
const SZ = "菱感电子商务（深圳）有限公司";

function invStatus(inv: Invoice): InvoiceMatchStatus {
  const n = inv.lines.filter((l) => l.purchaseLineId).length;
  if (n === 0) return "unmatched";
  if (n === inv.lines.length) return "full";
  return "partial";
}

/** 现网三菱进项发票备注：空格分隔，如 SO-260323-071-Q SO-260717-057-Q */
export function parseSoNos(memo: string): string[] {
  return [...new Set((memo.match(/\bSO-[A-Z0-9]+(?:-[A-Z0-9]+)*\b/gi) || []).map((s) => s.toUpperCase()))];
}

function pairByModelQty(purchase: PurchaseLine[], unused: Invoice["lines"]) {
  const usedIl = new Set<string>();
  const pairs: { p: PurchaseLine; il: Invoice["lines"][0] }[] = [];
  for (const p of purchase) {
    const il = unused.find((x) => !usedIl.has(x.id) && x.model === p.model && x.qty === p.qty);
    if (!il) continue;
    usedIl.add(il.id);
    pairs.push({ p, il });
  }
  return pairs;
}

/** SO → 采购订单号 → 该采购订单下未匹配采购送货单行 */
function soDocumentLines(inv: Invoice, lines: PurchaseLine[]): PurchaseLine[] {
  if (inv.supplierKind !== "mitsubishi") return [];
  const sos = new Set(parseSoNos(inv.memo));
  if (!sos.size) return [];
  const poSns = [...new Set(lines.filter((l) => l.supplierOrderNo && sos.has(l.supplierOrderNo.toUpperCase())).map((l) => l.orderSn))];
  if (!poSns.length) return [];
  const poSet = new Set(poSns);
  return lines.filter((l) => poSet.has(l.orderSn) && l.matchStatus === "unmatched");
}

const seedInvoices: Invoice[] = [
  {
    id: "INV-A",
    digitalNo: "26952000003506216581",
    seller: SUHAO,
    buyer: BJ,
    totalIncl: 33334,
    memo: "Y260819KT0024/费用ZR单号：ZR26080024，总和：152622",
    supplierKind: "suhao",
    lines: [
      { id: "A1", invoiceId: "INV-A", taxCode: "2020000000000000000", name: "三菱空调机", model: "FDC224KXMEN1Q", qty: 1, amountExcl: 13539.82, tax: 1760.18, amountIncl: 15300, feeAmount: 0 },
      { id: "A2", invoiceId: "INV-A", taxCode: "2020000000000000000", name: "三菱空调机", model: "FDUCV18KXME1Q-D", qty: 2, amountExcl: 3504.42, tax: 455.58, amountIncl: 3960, feeAmount: 0 },
      { id: "A3", invoiceId: "INV-A", taxCode: "2020000000000000000", name: "有线遥控器", model: "RC-MBD2", qty: 6, amountExcl: 985.0, tax: 128.05, amountIncl: 1113.05, feeAmount: 200 },
    ],
  },
  {
    id: "INV-B",
    digitalNo: "26952000003459565756",
    seller: MHI,
    buyer: CD,
    totalIncl: 4614,
    memo: "SO-260818-011-Q SO-260818-012-Q",
    supplierKind: "mitsubishi",
    lines: [
      { id: "B1", invoiceId: "INV-B", taxCode: "109040501", name: "空调室内机", model: "FDTC50KXE6F", qty: 1, amountExcl: 2300.88, tax: 299.12, amountIncl: 2600, feeAmount: 0, purchaseLineId: "P4" },
      { id: "B2", invoiceId: "INV-B", taxCode: "109040501", name: "空调室内机", model: "FDTC60KXE6F", qty: 1, amountExcl: 1782.3, tax: 231.7, amountIncl: 2014, feeAmount: 50, purchaseLineId: "P6" },
    ],
  },
  {
    id: "INV-C",
    digitalNo: "25372000001122334455",
    seller: OTHER,
    buyer: SZ,
    totalIncl: 2260,
    memo: "",
    supplierKind: "other",
    lines: [
      { id: "C1", invoiceId: "INV-C", taxCode: "3040201", name: "*修理修配*维修费", model: "SVC-01", qty: 1, amountExcl: 2000, tax: 260, amountIncl: 2260, feeAmount: 0, purchaseLineId: "P8" },
    ],
  },
  {
    id: "INV-D",
    digitalNo: "25372000001122339900",
    seller: OTHER,
    buyer: SZ,
    totalIncl: 1130,
    memo: "",
    supplierKind: "other",
    lines: [
      { id: "D1", invoiceId: "INV-D", taxCode: "3040201", name: "配件", model: "PART-X", qty: 2, amountExcl: 1000, tax: 130, amountIncl: 1130, feeAmount: 0, purchaseLineId: "P9" },
    ],
  },
  {
    id: "INV-E",
    digitalNo: "26992000000011112222",
    seller: SUHAO,
    buyer: BJ,
    totalIncl: 8800,
    memo: "Y260810AA0001",
    supplierKind: "suhao",
    lines: [
      { id: "E1", invoiceId: "INV-E", taxCode: "109040501", name: "全热交换器", model: "SAFHD350BQ", qty: 1, amountExcl: 3628.32, tax: 471.68, amountIncl: 4100, feeAmount: 0, purchaseLineId: "P10" },
      { id: "E2", invoiceId: "INV-E", taxCode: "109040501", name: "全热交换器线控", model: "RC-SAFHD-MB1", qty: 1, amountExcl: 4159.29, tax: 540.71, amountIncl: 4700, feeAmount: 0 },
    ],
  },
  {
    id: "INV-F",
    digitalNo: "26992000000033334444",
    seller: MHI,
    buyer: BJ,
    totalIncl: 5000,
    memo: "",
    supplierKind: "mitsubishi",
    lines: [
      { id: "F1", invoiceId: "INV-F", taxCode: "109040501", name: "室外机", model: "FDC140KXEN6F", qty: 1, amountExcl: 2654.87, tax: 345.13, amountIncl: 3000, feeAmount: 0 },
      { id: "F2", invoiceId: "INV-F", taxCode: "109040501", name: "室内机", model: "FDUM71KXE6F", qty: 1, amountExcl: 1769.91, tax: 230.09, amountIncl: 2000, feeAmount: 0 },
    ],
  },
  {
    id: "INV-G",
    digitalNo: "26312000004862749426",
    seller: MHI,
    buyer: CD,
    totalIncl: 4100,
    memo: "SO-260814-021-Q SO-260814-022-Q",
    supplierKind: "mitsubishi",
    lines: [
      { id: "G1", invoiceId: "INV-G", taxCode: "109040501", name: "空调室内机", model: "FDTC40KXE6F", qty: 1, amountExcl: 1858.41, tax: 241.59, amountIncl: 2100, feeAmount: 0 },
      { id: "G2", invoiceId: "INV-G", taxCode: "109040501", name: "空调室内机", model: "FDTC71KXE6F", qty: 1, amountExcl: 1769.91, tax: 230.09, amountIncl: 2000, feeAmount: 0 },
    ],
  },
  {
    id: "INV-H",
    digitalNo: "26312000004862750001",
    seller: MHI,
    buyer: BJ,
    totalIncl: 2800,
    memo: "SO-260813-008-Q",
    supplierKind: "mitsubishi",
    lines: [{ id: "H1", invoiceId: "INV-H", taxCode: "109040501", name: "室外机", model: "FDC100KXEN6F", qty: 1, amountExcl: 2477.88, tax: 322.12, amountIncl: 2800, feeAmount: 0 }],
  },
  {
    id: "INV-I",
    digitalNo: "26312000004862750002",
    seller: MHI,
    buyer: BJ,
    totalIncl: 1900,
    memo: "SO-260813-008-Q",
    supplierKind: "mitsubishi",
    lines: [{ id: "I1", invoiceId: "INV-I", taxCode: "109040501", name: "室内机", model: "FDUM50KXE6F", qty: 1, amountExcl: 1681.42, tax: 218.58, amountIncl: 1900, feeAmount: 0 }],
  },
  {
    id: "INV-J",
    digitalNo: "26952000003611220011",
    seller: SUHAO,
    buyer: BJ,
    totalIncl: 4840,
    memo: "Y260820KT0051/费用ZR单号：ZR26080051，总和：4840",
    supplierKind: "suhao",
    lines: [
      { id: "J1", invoiceId: "INV-J", taxCode: "109040501", name: "*空调设备*多联式空调室内机", model: "FDTC32KXE6F", qty: 2, amountExcl: 3858.41, tax: 501.59, amountIncl: 4360, feeAmount: 0 },
      { id: "J2", invoiceId: "INV-J", taxCode: "109040501", name: "*电器电子产品*无线遥控器", model: "PAR-31MAA-RC", qty: 2, amountExcl: 424.78, tax: 55.22, amountIncl: 480, feeAmount: 80 },
    ],
  },
];

const seedLines: PurchaseLine[] = [
  { id: "P19", cdnSn: "CDN202608200051", orderSn: "LGCX202608200030", stShipSn: "Y260820KT0051", lineNo: 1, productName: "三菱空调机_FDTC32KXE6F", model: "FDTC32KXE6F", qty: 2, policyAmount: 4360, supplier: SUHAO, supplierKind: "suhao", salesCompany: BJ, purchaseType: "随单采", salesShipSn: "DF202608200051", customer: "太原通达机电设备有限公司", matchStatus: "unmatched", poPushStatus: "none", apPushStatus: "none" },
  { id: "P20", cdnSn: "CDN202608200051", orderSn: "LGCX202608200030", stShipSn: "Y260820KT0051", lineNo: 2, productName: "无线遥控器_PAR-31MAA-RC", model: "PAR-31MAA-RC", qty: 2, policyAmount: 480, supplier: SUHAO, supplierKind: "suhao", salesCompany: BJ, purchaseType: "随单采", salesShipSn: "DF202608200051", customer: "太原通达机电设备有限公司", matchStatus: "unmatched", poPushStatus: "none", apPushStatus: "none" },
  { id: "P1", cdnSn: "CDN202608190039", orderSn: "LGCX202608190020", stShipSn: "Y260819KT0024", lineNo: 1, productName: "三菱空调机_FDC224KXMEN1Q", model: "FDC224KXMEN1Q", qty: 1, policyAmount: 15300, supplier: SUHAO, supplierKind: "suhao", salesCompany: BJ, purchaseType: "随单采", salesShipSn: "DF202608190107", customer: "山西舒安盛建设工程有限公司", matchStatus: "unmatched", poPushStatus: "none", apPushStatus: "none" },
  { id: "P2", cdnSn: "CDN202608190039", orderSn: "LGCX202608190020", stShipSn: "Y260819KT0024", lineNo: 2, productName: "三菱空调机_FDUCV18KXME1Q-D", model: "FDUCV18KXME1Q-D", qty: 2, policyAmount: 3960, supplier: SUHAO, supplierKind: "suhao", salesCompany: BJ, purchaseType: "随单采", salesShipSn: "DF202608190107", customer: "山西舒安盛建设工程有限公司", matchStatus: "unmatched", poPushStatus: "none", apPushStatus: "none" },
  { id: "P3", cdnSn: "CDN202608190039", orderSn: "LGCX202608190020", stShipSn: "Y260819KT0024", lineNo: 3, productName: "有线遥控器_RC-MBD2", model: "RC-MBD2", qty: 6, policyAmount: 1113, supplier: SUHAO, supplierKind: "suhao", salesCompany: BJ, purchaseType: "随单采", salesShipSn: "DF202608190107", customer: "山西舒安盛建设工程有限公司", matchStatus: "unmatched", poPushStatus: "none", apPushStatus: "none" },
  { id: "P4", cdnSn: "CDN202608180012", orderSn: "LGCX202608180008", stShipSn: "Y260818MH0011", supplierOrderNo: "SO-260818-011-Q", lineNo: 1, productName: "空调室内机_FDTC50KXE6F", model: "FDTC50KXE6F", qty: 1, policyAmount: 2680, supplier: MHI, supplierKind: "mitsubishi", salesCompany: CD, purchaseType: "直采", matchStatus: "matched", invoiceId: "INV-B", invoiceNo: "26952000003459565756", invoiceLineId: "B1", invoiceAmount: 2300.88, taxAmount: 299.12, totalAmount: 2600, feeAmount: 0, poPushStatus: "none", apPushStatus: "none" },
  { id: "P5", cdnSn: "CDN202608180012", orderSn: "LGCX202608180008", stShipSn: "Y260818MH0011", supplierOrderNo: "SO-260818-011-Q", lineNo: 2, productName: "过滤器", model: "FLT-01", qty: 4, policyAmount: 320, supplier: MHI, supplierKind: "mitsubishi", salesCompany: CD, purchaseType: "直采", matchStatus: "unmatched", poPushStatus: "none", apPushStatus: "none" },
  { id: "P6", cdnSn: "CDN202608180013", orderSn: "LGCX202608180009", stShipSn: "Y260818MH0012", supplierOrderNo: "SO-260818-012-Q", lineNo: 1, productName: "空调室内机_FDTC60KXE6F", model: "FDTC60KXE6F", qty: 1, policyAmount: 2100, supplier: MHI, supplierKind: "mitsubishi", salesCompany: CD, purchaseType: "直采", matchStatus: "matched", invoiceId: "INV-B", invoiceNo: "26952000003459565756", invoiceLineId: "B2", invoiceAmount: 1782.3, taxAmount: 231.7, totalAmount: 2014, feeAmount: 50, poPushStatus: "none", apPushStatus: "none" },
  { id: "P7", cdnSn: "CDN202608180013", orderSn: "LGCX202608180009", stShipSn: "Y260818MH0012", supplierOrderNo: "SO-260818-012-Q", lineNo: 2, productName: "铜管配件", model: "CU-PIPE", qty: 10, policyAmount: 500, supplier: MHI, supplierKind: "mitsubishi", salesCompany: CD, purchaseType: "直采", matchStatus: "unmatched", poPushStatus: "none", apPushStatus: "none" },
  { id: "P8", cdnSn: "CDN202608170001", orderSn: "LGCX202608170002", stShipSn: "ST170002", lineNo: 1, productName: "维修服务", model: "SVC-01", qty: 1, policyAmount: 2400, supplier: OTHER, supplierKind: "other", salesCompany: SZ, purchaseType: "直采", matchStatus: "matched", invoiceId: "INV-C", invoiceNo: "25372000001122334455", invoiceLineId: "C1", invoiceAmount: 2000, taxAmount: 260, totalAmount: 2260, feeAmount: 0, poPushStatus: "none", apPushStatus: "none" },
  { id: "P9", cdnSn: "CDN202608170001", orderSn: "LGCX202608170002", stShipSn: "ST170002", lineNo: 2, productName: "配件_PART-X", model: "PART-X", qty: 2, policyAmount: 1200, supplier: OTHER, supplierKind: "other", salesCompany: SZ, purchaseType: "直采", matchStatus: "matched", invoiceId: "INV-D", invoiceNo: "25372000001122339900", invoiceLineId: "D1", invoiceAmount: 1000, taxAmount: 130, totalAmount: 1130, feeAmount: 0, poPushStatus: "none", apPushStatus: "none" },
  { id: "P10", cdnSn: "CDN202608100044", orderSn: "LGCX202608100010", stShipSn: "Y260810AA0001", lineNo: 1, productName: "全热交换器_SAFHD350BQ", model: "SAFHD350BQ", qty: 1, policyAmount: 4095, supplier: SUHAO, supplierKind: "suhao", salesCompany: BJ, purchaseType: "随单采", salesShipSn: "DF202608100022", customer: "山西舒安盛建设工程有限公司", matchStatus: "matched", invoiceId: "INV-E", invoiceNo: "26992000000011112222", invoiceLineId: "E1", invoiceAmount: 3628.32, taxAmount: 471.68, totalAmount: 4100, feeAmount: 0, poPushStatus: "none", apPushStatus: "none" },
  { id: "P11", cdnSn: "CDN202608160008", orderSn: "LGCX202608160003", stShipSn: "Y260816KT0008", supplierOrderNo: "SO-260816-003-Q", lineNo: 1, productName: "室外机_FDC140", model: "FDC140KXEN6F", qty: 1, policyAmount: 3100, supplier: MHI, supplierKind: "mitsubishi", salesCompany: BJ, purchaseType: "直采", matchStatus: "unmatched", kingdeePoNo: "KDCG2608160003", poPushStatus: "unsent", apPushStatus: "none" },
  { id: "P12", cdnSn: "CDN202608160008", orderSn: "LGCX202608160003", stShipSn: "Y260816KT0008", supplierOrderNo: "SO-260816-003-Q", lineNo: 2, productName: "室内机_FDUM71", model: "FDUM71KXE6F", qty: 1, policyAmount: 2050, supplier: MHI, supplierKind: "mitsubishi", salesCompany: BJ, purchaseType: "直采", matchStatus: "unmatched", kingdeePoNo: "KDCG2608160003", poPushStatus: "unsent", apPushStatus: "none" },
  { id: "P13", cdnSn: "CDN202608150005", orderSn: "LGCX202608150001", stShipSn: "MIX150005", lineNo: 1, productName: "维修服务", model: "SVC-01", qty: 1, policyAmount: 2400, supplier: OTHER, supplierKind: "other", salesCompany: SZ, purchaseType: "直采", matchStatus: "matched", invoiceId: "INV-C", invoiceNo: "25372000001122334455",     invoiceLineId: "C1-hist", invoiceAmount: 2000, taxAmount: 260, totalAmount: 2260, feeAmount: 0, kingdeePoNo: "KDCG2608150001", poPushStatus: "success", apPushStatus: "exception" },
  { id: "P14", cdnSn: "CDN202608150006", orderSn: "LGCX202608150002", stShipSn: "MIX150006", lineNo: 1, productName: "配件_PART-X", model: "PART-X", qty: 2, policyAmount: 1200, supplier: OTHER, supplierKind: "other", salesCompany: SZ, purchaseType: "直采", matchStatus: "matched", invoiceId: "INV-D", invoiceNo: "25372000001122339900", invoiceLineId: "D1-hist", invoiceAmount: 1000, taxAmount: 130, totalAmount: 1130, feeAmount: 0, kingdeePoNo: "KDCG2608150001", poPushStatus: "success", apPushStatus: "exception" },
  { id: "P15", cdnSn: "CDN202608140001", orderSn: "LGCX202608140001", stShipSn: "Y260814MH0001", supplierOrderNo: "SO-260814-021-Q", lineNo: 1, productName: "空调室内机_FDTC40KXE6F", model: "FDTC40KXE6F", qty: 1, policyAmount: 2200, supplier: MHI, supplierKind: "mitsubishi", salesCompany: CD, purchaseType: "直采", matchStatus: "unmatched", poPushStatus: "none", apPushStatus: "none" },
  { id: "P16", cdnSn: "CDN202608140002", orderSn: "LGCX202608140002", stShipSn: "Y260814MH0002", supplierOrderNo: "SO-260814-022-Q", lineNo: 1, productName: "空调室内机_FDTC71KXE6F", model: "FDTC71KXE6F", qty: 1, policyAmount: 2050, supplier: MHI, supplierKind: "mitsubishi", salesCompany: CD, purchaseType: "直采", matchStatus: "unmatched", poPushStatus: "none", apPushStatus: "none" },
  { id: "P17", cdnSn: "CDN202608130001", orderSn: "LGCX202608130001", stShipSn: "Y260813MH0008", supplierOrderNo: "SO-260813-008-Q", lineNo: 1, productName: "室外机_FDC100", model: "FDC100KXEN6F", qty: 1, policyAmount: 2900, supplier: MHI, supplierKind: "mitsubishi", salesCompany: BJ, purchaseType: "直采", matchStatus: "unmatched", poPushStatus: "none", apPushStatus: "none" },
  { id: "P18", cdnSn: "CDN202608130001", orderSn: "LGCX202608130001", stShipSn: "Y260813MH0008", supplierOrderNo: "SO-260813-008-Q", lineNo: 2, productName: "室内机_FDUM50", model: "FDUM50KXE6F", qty: 1, policyAmount: 1980, supplier: MHI, supplierKind: "mitsubishi", salesCompany: BJ, purchaseType: "直采", matchStatus: "unmatched", poPushStatus: "none", apPushStatus: "none" },
];

const seedSalesOut: SalesOutLine[] = [
  { id: "S1", salesShipSn: "DF202608190107", productName: "三菱空调机_FDC224KXMEN1Q", productCode: "A01835555", model: "FDC224KXMEN1Q", shipQty: 1, returnQty: 0, actualQty: 1, shipTime: "2026-08-19 16:21:35", feeAmount: 0, unitPrice: 15555, amount: 15555, warehouseCode: "011001", warehouseName: "北京菱感仓" },
  { id: "S2", salesShipSn: "DF202608190107", productName: "三菱空调机_FDUCV18KXME1Q-D", productCode: "A01835616", model: "FDUCV18KXME1Q-D", shipQty: 2, returnQty: 0, actualQty: 2, shipTime: "2026-08-19 16:21:35", feeAmount: 0, unitPrice: 2013, amount: 4026, warehouseCode: "011001", warehouseName: "北京菱感仓" },
  { id: "S3", salesShipSn: "DF202608190107", productName: "有线遥控器_RC-MBD2", productCode: "A01290064", model: "RC-MBD2", shipQty: 6, returnQty: 0, actualQty: 6, shipTime: "2026-08-19 16:21:35", feeAmount: 0, unitPrice: 213.5, amount: 1281, warehouseCode: "011001", warehouseName: "北京菱感仓" },
  { id: "S4", salesShipSn: "DF202608100022", productName: "全热交换器_SAFHD350BQ", productCode: "A01855991", model: "SAFHD350BQ", shipQty: 1, returnQty: 0, actualQty: 1, shipTime: "2026-08-10 11:06:20", feeAmount: 0, unitPrice: 4410, amount: 4410, warehouseCode: "011001", warehouseName: "北京菱感仓" },
];

interface State {
  page: PageId;
  lines: PurchaseLine[];
  invoices: Invoice[];
  selected: string[];
  toasts: Toast[];
  toastSeq: number;
  poSeqExisting: string[];
}

type Action =
  | { type: "page"; page: PageId }
  | { type: "toast"; text: string; tone: Toast["tone"] }
  | { type: "dismiss"; id: number }
  | { type: "toggle"; id: string }
  | { type: "clearSelect" }
  | { type: "match"; purchaseIds: string[]; invoiceId: string }
  | { type: "unbindInvoice" }
  | { type: "pack" }
  | { type: "pushPo" }
  | { type: "unbindPack" }
  | { type: "runApJob" };

function toast(state: State, text: string, tone: Toast["tone"]): State {
  const id = state.toastSeq + 1;
  return {
    ...state,
    toastSeq: id,
    toasts: [...state.toasts.slice(-4), { id, text, tone }],
  };
}

/** 勾选联动：有发票 → 整票；无发票但有金蝶采购单号 → 整单；否则只勾本行。 */
function selectionGroupIds(line: PurchaseLine, lines: PurchaseLine[]): string[] {
  if (line.invoiceId) return lines.filter((l) => l.invoiceId === line.invoiceId).map((l) => l.id);
  if (line.kingdeePoNo) return lines.filter((l) => l.kingdeePoNo === line.kingdeePoNo).map((l) => l.id);
  return [line.id];
}

function toggleGroup(selected: string[], group: string[]): string[] {
  const allOn = group.every((id) => selected.includes(id));
  if (allOn) return selected.filter((id) => !group.includes(id));
  const set = new Set(selected);
  for (const id of group) set.add(id);
  return [...set];
}

function packGroups(unpacked: PurchaseLine[], allLines: PurchaseLine[]): { ok: PurchaseLine[][] } | { err: string } {
  const groups: PurchaseLine[][] = [];
  const invIds = [...new Set(unpacked.filter((l) => l.invoiceId).map((l) => l.invoiceId!))];
  for (const invId of invIds) {
    const allOfInv = allLines.filter((l) => l.invoiceId === invId);
    if (allOfInv.some((l) => l.kingdeePoNo)) {
      return { err: `发票 ${allOfInv[0].invoiceNo} 存在已打包明细，请先解绑或改选` };
    }
    if (allOfInv.some((l) => !unpacked.some((x) => x.id === l.id))) {
      return { err: `必须勾选发票 ${allOfInv[0].invoiceNo} 的全部采购明细后再打包` };
    }
    groups.push(allOfInv);
  }
  const unmatched = unpacked.filter((l) => !l.invoiceId);
  if (unmatched.length) groups.push(unmatched);
  return { ok: groups };
}

function tryAutoPackFullInvoice(
  lines: PurchaseLine[],
  invoices: Invoice[],
  invoiceId: string,
  poSeqExisting: string[],
): { lines: PurchaseLine[]; poSeqExisting: string[]; poNo?: string; skip?: string } {
  const inv = invoices.find((i) => i.id === invoiceId);
  if (!inv || invStatus(inv) !== "full") return { lines, poSeqExisting };
  const ofInv = lines.filter((l) => l.invoiceId === invoiceId);
  if (!ofInv.length) return { lines, poSeqExisting };
  if (ofInv.some((l) => l.kingdeePoNo)) {
    return { lines, poSeqExisting, skip: "该票明细已有金蝶采购单号，未重复打包" };
  }
  const poNo = nextKingdeePoNo([...poSeqExisting, ...lines.map((l) => l.kingdeePoNo || "")]);
  const ids = new Set(ofInv.map((l) => l.id));
  return {
    lines: lines.map((l) =>
      ids.has(l.id) ? { ...l, kingdeePoNo: poNo, poPushStatus: "unsent" as PoPushStatus } : l,
    ),
    poSeqExisting: [...poSeqExisting, poNo],
    poNo,
  };
}

function syncInvoiceLinks(invoices: Invoice[], lines: PurchaseLine[]): Invoice[] {
  return invoices.map((inv) => ({
    ...inv,
    lines: inv.lines.map((il) => {
      const pl = lines.find((l) => l.invoiceLineId === il.id);
      return { ...il, purchaseLineId: pl?.id };
    }),
  }));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "page":
      return { ...state, page: action.page, selected: [] };
    case "toast":
      return toast(state, action.text, action.tone);
    case "dismiss":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case "clearSelect":
      return { ...state, selected: [] };
    case "toggle": {
      const line = state.lines.find((l) => l.id === action.id);
      if (!line) return state;
      return { ...state, selected: toggleGroup(state.selected, selectionGroupIds(line, state.lines)) };
    }
    case "match": {
      const inv = state.invoices.find((i) => i.id === action.invoiceId);
      if (!inv) return toast(state, "发票不存在", "err");
      const targets = state.lines.filter((l) => action.purchaseIds.includes(l.id));
      if (targets.some((l) => l.matchStatus === "matched")) {
        return toast(state, "所选明细已匹配，请先解绑", "warn");
      }
      if (targets.some((l) => l.apPushStatus === "success")) {
        return toast(state, "应付单已推送成功的明细不可再匹配", "warn");
      }
      const unused = inv.lines.filter((il) => !il.purchaseLineId);
      const docs = soDocumentLines(inv, state.lines);
      const selectedOnDocs = targets.filter((t) => docs.some((d) => d.id === t.id || d.orderSn === t.orderSn));
      let path: "so" | "fallback" = "fallback";
      let candidates = targets.filter((l) => l.matchStatus === "unmatched");
      if (docs.length && selectedOnDocs.length) {
        path = "so";
        candidates = docs;
      }
      let pairs = pairByModelQty(candidates, unused);
      if (!pairs.length && path === "so") {
        path = "fallback";
        candidates = targets.filter((l) => l.matchStatus === "unmatched");
        pairs = pairByModelQty(candidates, unused);
      }
      if (!pairs.length) return toast(state, "型号+数量无法与该发票未占用行对齐", "err");
      const lines = state.lines.map((l) => {
        const hit = pairs.find((x) => x.p.id === l.id);
        if (!hit) return l;
        return {
          ...l,
          matchStatus: "matched" as const,
          invoiceId: inv.id,
          invoiceNo: inv.digitalNo,
          invoiceLineId: hit.il.id,
          invoiceAmount: hit.il.amountExcl,
          taxAmount: hit.il.tax,
          totalAmount: hit.il.amountIncl,
          feeAmount: hit.il.feeAmount,
        };
      });
      const invoices = syncInvoiceLinks(state.invoices, lines);
      const n = pairs.length;
      const leftoverInv = invoices.find((i) => i.id === inv.id)!.lines.filter((il) => !il.purchaseLineId).length;
      const cdns = [...new Set(pairs.map((x) => x.p.cdnSn))];
      const prefix = path === "so" ? `SO路径（${parseSoNos(inv.memo).join("、")}）` : "原路径";
      const packed = tryAutoPackFullInvoice(lines, invoices, inv.id, state.poSeqExisting);
      const packNote = packed.poNo
        ? `；发票全部匹配，已自动打包金蝶采购单 ${packed.poNo}（未推送）`
        : packed.skip
          ? `；${packed.skip}`
          : "";
      const selected = packed.poNo
        ? packed.lines.filter((l) => l.invoiceId === inv.id).map((l) => l.id)
        : [];
      return toast(
        { ...state, lines: packed.lines, invoices, poSeqExisting: packed.poSeqExisting, selected },
        leftoverInv
          ? `${prefix}已匹配 ${n} 行，发票仍有 ${leftoverInv} 行未占用（部分匹配）${packNote}`
          : `${prefix}已匹配 ${n} 行${cdns.length > 1 ? `，跨 ${cdns.length} 张采购送货单` : ""}，金额/费用已回写${packNote}`,
        leftoverInv ? "warn" : "ok",
      );
    }
    case "unbindInvoice": {
      const selected = state.lines.filter((l) => state.selected.includes(l.id));
      if (!selected.length) return toast(state, "请先勾选明细", "warn");
      if (selected.some((l) => l.apPushStatus === "success")) {
        return toast(state, "应付单已推送成功的明细不可解绑发票", "err");
      }
      const ids = new Set(selected.map((l) => l.id));
      const lines = state.lines.map((l) => {
        if (!ids.has(l.id) || l.matchStatus !== "matched") return l;
        return {
          ...l,
          matchStatus: "unmatched" as const,
          invoiceId: undefined,
          invoiceNo: undefined,
          invoiceLineId: undefined,
          invoiceAmount: undefined,
          taxAmount: undefined,
          totalAmount: undefined,
          feeAmount: undefined,
          apPushStatus: "none" as ApPushStatus,
        };
      });
      return toast(
        { ...state, lines, invoices: syncInvoiceLinks(state.invoices, lines), selected: [] },
        "已解绑发票匹配并清空回写金额",
        "ok",
      );
    }
    case "pack": {
      const selected = state.lines.filter((l) => state.selected.includes(l.id));
      if (!selected.length) return toast(state, "请先勾选明细", "warn");
      const unpacked = selected.filter((l) => !l.kingdeePoNo);
      if (!unpacked.length) return toast(state, "所选明细均已有金蝶采购单号，请直接确认下推", "warn");
      const grouped = packGroups(unpacked, state.lines);
      if ("err" in grouped) return toast(state, grouped.err, "err");
      let existing = [...state.poSeqExisting, ...state.lines.map((l) => l.kingdeePoNo || "")];
      const idToPo = new Map<string, string>();
      const poNos: string[] = [];
      for (const group of grouped.ok) {
        const poNo = nextKingdeePoNo(existing);
        existing = [...existing, poNo];
        poNos.push(poNo);
        for (const l of group) idToPo.set(l.id, poNo);
      }
      const lines = state.lines.map((l) => {
        const poNo = idToPo.get(l.id);
        return poNo ? { ...l, kingdeePoNo: poNo, poPushStatus: "unsent" as PoPushStatus } : l;
      });
      const skipped = selected.length - unpacked.length;
      return toast(
        { ...state, lines, poSeqExisting: [...state.poSeqExisting, ...poNos] },
        `已按票/未配行拆分打包 ${poNos.length} 单：${poNos.join("、")}（未推送）${skipped ? `；${skipped} 行已有单号未重复打包` : ""}`,
        "ok",
      );
    }
    case "pushPo": {
      const selected = state.lines.filter((l) => state.selected.includes(l.id));
      if (!selected.length) return toast(state, "请先勾选明细", "warn");
      const poNos = [...new Set(selected.map((l) => l.kingdeePoNo).filter(Boolean))] as string[];
      if (!poNos.length) return toast(state, "所选没有金蝶采购单号，请先打包", "warn");
      const ok: string[] = [];
      const skip: string[] = [];
      const fail: string[] = [];
      const pushSet = new Set<string>();
      for (const poNo of poNos) {
        const group = state.lines.filter((l) => l.kingdeePoNo === poNo);
        if (group.every((l) => l.poPushStatus === "success")) {
          skip.push(poNo);
          continue;
        }
        if (group.some((l) => l.poPushStatus !== "unsent")) {
          fail.push(poNo);
          continue;
        }
        ok.push(poNo);
        pushSet.add(poNo);
      }
      const lines = state.lines.map((l) =>
        l.kingdeePoNo && pushSet.has(l.kingdeePoNo) ? { ...l, poPushStatus: "success" as PoPushStatus } : l,
      );
      const noPo = selected.filter((l) => !l.kingdeePoNo).length;
      const parts = [
        ok.length ? `成功 ${ok.join("、")}` : "",
        skip.length ? `已成功跳过 ${skip.join("、")}` : "",
        fail.length ? `不可下推 ${fail.join("、")}` : "",
        noPo ? `${noPo} 行无单号未下推` : "",
      ].filter(Boolean);
      if (!ok.length) return toast(state, `未下推：${parts.join("；") || "没有未推送的金蝶采购单"}`, "warn");
      return toast({ ...state, lines, selected: [] }, `已按金蝶采购单号拆分下推：${parts.join("；")}`, fail.length ? "warn" : "ok");
    }
    case "unbindPack": {
      const selected = state.lines.filter((l) => state.selected.includes(l.id));
      const poNos = [...new Set(selected.map((l) => l.kingdeePoNo).filter(Boolean))] as string[];
      if (!poNos.length) return toast(state, "请勾选已打包的明细再解绑", "warn");
      const ok: string[] = [];
      const blocked: string[] = [];
      const clearSet = new Set<string>();
      for (const poNo of poNos) {
        const group = state.lines.filter((l) => l.kingdeePoNo === poNo);
        if (group.some((l) => l.poPushStatus === "success")) {
          blocked.push(poNo);
          continue;
        }
        ok.push(poNo);
        clearSet.add(poNo);
      }
      if (!ok.length) return toast(state, `已推送成功的金蝶采购单不可解绑：${blocked.join("、")}`, "err");
      const lines = state.lines.map((l) =>
        l.kingdeePoNo && clearSet.has(l.kingdeePoNo)
          ? { ...l, kingdeePoNo: undefined, poPushStatus: "none" as PoPushStatus, apPushStatus: "none" as ApPushStatus }
          : l,
      );
      return toast(
        { ...state, lines, selected: [] },
        `已解绑 ${ok.join("、")}${blocked.length ? `；已成功单号未解绑：${blocked.join("、")}` : ""}`,
        blocked.length ? "warn" : "ok",
      );
    }
    case "runApJob": {
      const groups = new Map<string, PurchaseLine[]>();
      for (const l of state.lines) {
        if (!l.kingdeePoNo || l.poPushStatus !== "success") continue;
        const arr = groups.get(l.kingdeePoNo) || [];
        arr.push(l);
        groups.set(l.kingdeePoNo, arr);
      }
      let ok = 0;
      let skipped = 0;
      let bad = 0;
      const next = state.lines.map((l) => ({ ...l }));
      for (const [poNo, group] of groups) {
        if (group.every((g) => g.apPushStatus === "success")) continue;
        const noInvoice = group.every((g) => !g.invoiceId);
        if (noInvoice) {
          skipped += 1;
          for (const row of next) {
            if (row.kingdeePoNo === poNo) row.apPushStatus = "none";
          }
          continue;
        }
        const invs = [...new Set(group.map((g) => g.invoiceId || ""))];
        const allMatched = group.every((g) => g.matchStatus === "matched" && g.invoiceId);
        const consistent = allMatched && invs.length === 1 && invs[0] !== "";
        const status: ApPushStatus = consistent ? "success" : "exception";
        if (consistent) ok += 1;
        else bad += 1;
        for (const row of next) {
          if (row.kingdeePoNo === poNo) row.apPushStatus = status;
        }
      }
      const parts = [
        `成功 ${ok} 单`,
        skipped ? `跳过 ${skipped} 单（无发票不推送）` : "",
        bad ? `推送异常 ${bad} 单（发票不一致或未全部匹配）` : "",
      ].filter(Boolean);
      return toast(
        { ...state, lines: next },
        `应付单定时任务完成：${parts.join("，")}`,
        bad ? "warn" : "ok",
      );
    }
    default:
      return state;
  }
}

interface StoreValue {
  page: PageId;
  lines: PurchaseLine[];
  invoices: Invoice[];
  salesOutLines: SalesOutLine[];
  selected: string[];
  toasts: Toast[];
  invoiceStatus: (id: string) => InvoiceMatchStatus;
  setPage: (page: PageId) => void;
  toggle: (id: string) => void;
  clearSelect: () => void;
  matchToInvoice: (invoiceId: string) => void;
  unbindInvoice: () => void;
  pack: () => void;
  pushPo: () => void;
  unbindPack: () => void;
  runApJob: () => void;
  dismiss: (id: number) => void;
  notify: (text: string, tone?: Toast["tone"]) => void;
}

const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    page: "line-match",
    lines: seedLines,
    invoices: seedInvoices,
    selected: [],
    toasts: [],
    toastSeq: 0,
    poSeqExisting: ["KDCG2608160003", "KDCG2608150001"],
  });

  const invoiceStatus = useCallback(
    (id: string) => {
      const inv = state.invoices.find((i) => i.id === id);
      return inv ? invStatus(inv) : "unmatched";
    },
    [state.invoices],
  );

  const value = useMemo<StoreValue>(
    () => ({
      page: state.page,
      lines: state.lines,
      invoices: state.invoices,
      salesOutLines: seedSalesOut,
      selected: state.selected,
      toasts: state.toasts,
      invoiceStatus,
      setPage: (page) => dispatch({ type: "page", page }),
      toggle: (id) => dispatch({ type: "toggle", id }),
      clearSelect: () => dispatch({ type: "clearSelect" }),
      matchToInvoice: (invoiceId) =>
        dispatch({ type: "match", purchaseIds: state.selected, invoiceId }),
      unbindInvoice: () => dispatch({ type: "unbindInvoice" }),
      pack: () => dispatch({ type: "pack" }),
      pushPo: () => dispatch({ type: "pushPo" }),
      unbindPack: () => dispatch({ type: "unbindPack" }),
      runApJob: () => dispatch({ type: "runApJob" }),
      dismiss: (id) => dispatch({ type: "dismiss", id }),
      notify: (text, tone = "info") => dispatch({ type: "toast", text, tone }),
    }),
    [state, invoiceStatus],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("store");
  return ctx;
}
