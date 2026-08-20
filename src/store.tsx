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
    memo: "",
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
];

const seedLines: PurchaseLine[] = [
  { id: "P1", cdnSn: "CDN202608190039", orderSn: "LGCX202608190020", stShipSn: "Y260819KT0024", lineNo: 1, productName: "三菱空调机_FDC224KXMEN1Q", model: "FDC224KXMEN1Q", qty: 1, policyAmount: 15300, supplier: SUHAO, supplierKind: "suhao", salesCompany: BJ, purchaseType: "随单采", salesShipSn: "DF202608190107", customer: "山西舒安盛建设工程有限公司", matchStatus: "unmatched", poPushStatus: "none", apPushStatus: "none" },
  { id: "P2", cdnSn: "CDN202608190039", orderSn: "LGCX202608190020", stShipSn: "Y260819KT0024", lineNo: 2, productName: "三菱空调机_FDUCV18KXME1Q-D", model: "FDUCV18KXME1Q-D", qty: 2, policyAmount: 3960, supplier: SUHAO, supplierKind: "suhao", salesCompany: BJ, purchaseType: "随单采", salesShipSn: "DF202608190107", customer: "山西舒安盛建设工程有限公司", matchStatus: "unmatched", poPushStatus: "none", apPushStatus: "none" },
  { id: "P3", cdnSn: "CDN202608190039", orderSn: "LGCX202608190020", stShipSn: "Y260819KT0024", lineNo: 3, productName: "有线遥控器_RC-MBD2", model: "RC-MBD2", qty: 6, policyAmount: 1113, supplier: SUHAO, supplierKind: "suhao", salesCompany: BJ, purchaseType: "随单采", salesShipSn: "DF202608190107", customer: "山西舒安盛建设工程有限公司", matchStatus: "unmatched", poPushStatus: "none", apPushStatus: "none" },
  { id: "P4", cdnSn: "CDN202608180012", orderSn: "LGCX202608180008", stShipSn: "Y260818MH0011", lineNo: 1, productName: "空调室内机_FDTC50KXE6F", model: "FDTC50KXE6F", qty: 1, policyAmount: 2680, supplier: MHI, supplierKind: "mitsubishi", salesCompany: CD, purchaseType: "直采", matchStatus: "matched", invoiceId: "INV-B", invoiceNo: "26952000003459565756", invoiceLineId: "B1", invoiceAmount: 2300.88, taxAmount: 299.12, totalAmount: 2600, feeAmount: 0, poPushStatus: "none", apPushStatus: "none" },
  { id: "P5", cdnSn: "CDN202608180012", orderSn: "LGCX202608180008", stShipSn: "Y260818MH0011", lineNo: 2, productName: "过滤器", model: "FLT-01", qty: 4, policyAmount: 320, supplier: MHI, supplierKind: "mitsubishi", salesCompany: CD, purchaseType: "直采", matchStatus: "unmatched", poPushStatus: "none", apPushStatus: "none" },
  { id: "P6", cdnSn: "CDN202608180013", orderSn: "LGCX202608180009", stShipSn: "Y260818MH0012", lineNo: 1, productName: "空调室内机_FDTC60KXE6F", model: "FDTC60KXE6F", qty: 1, policyAmount: 2100, supplier: MHI, supplierKind: "mitsubishi", salesCompany: CD, purchaseType: "直采", matchStatus: "matched", invoiceId: "INV-B", invoiceNo: "26952000003459565756", invoiceLineId: "B2", invoiceAmount: 1782.3, taxAmount: 231.7, totalAmount: 2014, feeAmount: 50, poPushStatus: "none", apPushStatus: "none" },
  { id: "P7", cdnSn: "CDN202608180013", orderSn: "LGCX202608180009", stShipSn: "Y260818MH0012", lineNo: 2, productName: "铜管配件", model: "CU-PIPE", qty: 10, policyAmount: 500, supplier: MHI, supplierKind: "mitsubishi", salesCompany: CD, purchaseType: "直采", matchStatus: "unmatched", poPushStatus: "none", apPushStatus: "none" },
  { id: "P8", cdnSn: "CDN202608170001", orderSn: "LGCX202608170002", stShipSn: "ST170002", lineNo: 1, productName: "维修服务", model: "SVC-01", qty: 1, policyAmount: 2400, supplier: OTHER, supplierKind: "other", salesCompany: SZ, purchaseType: "直采", matchStatus: "matched", invoiceId: "INV-C", invoiceNo: "25372000001122334455", invoiceLineId: "C1", invoiceAmount: 2000, taxAmount: 260, totalAmount: 2260, feeAmount: 0, poPushStatus: "none", apPushStatus: "none" },
  { id: "P9", cdnSn: "CDN202608170001", orderSn: "LGCX202608170002", stShipSn: "ST170002", lineNo: 2, productName: "配件_PART-X", model: "PART-X", qty: 2, policyAmount: 1200, supplier: OTHER, supplierKind: "other", salesCompany: SZ, purchaseType: "直采", matchStatus: "matched", invoiceId: "INV-D", invoiceNo: "25372000001122339900", invoiceLineId: "D1", invoiceAmount: 1000, taxAmount: 130, totalAmount: 1130, feeAmount: 0, poPushStatus: "none", apPushStatus: "none" },
  { id: "P10", cdnSn: "CDN202608100044", orderSn: "LGCX202608100010", stShipSn: "Y260810AA0001", lineNo: 1, productName: "全热交换器_SAFHD350BQ", model: "SAFHD350BQ", qty: 1, policyAmount: 4095, supplier: SUHAO, supplierKind: "suhao", salesCompany: BJ, purchaseType: "随单采", salesShipSn: "DF202608100022", customer: "山西舒安盛建设工程有限公司", matchStatus: "matched", invoiceId: "INV-E", invoiceNo: "26992000000011112222", invoiceLineId: "E1", invoiceAmount: 3628.32, taxAmount: 471.68, totalAmount: 4100, feeAmount: 0, poPushStatus: "none", apPushStatus: "none" },
  { id: "P11", cdnSn: "CDN202608160008", orderSn: "LGCX202608160003", stShipSn: "Y260816KT0008", lineNo: 1, productName: "室外机_FDC140", model: "FDC140KXEN6F", qty: 1, policyAmount: 3100, supplier: MHI, supplierKind: "mitsubishi", salesCompany: BJ, purchaseType: "直采", matchStatus: "unmatched", kingdeePoNo: "KDCG202608160003", poPushStatus: "unsent", apPushStatus: "none" },
  { id: "P12", cdnSn: "CDN202608160008", orderSn: "LGCX202608160003", stShipSn: "Y260816KT0008", lineNo: 2, productName: "室内机_FDUM71", model: "FDUM71KXE6F", qty: 1, policyAmount: 2050, supplier: MHI, supplierKind: "mitsubishi", salesCompany: BJ, purchaseType: "直采", matchStatus: "unmatched", kingdeePoNo: "KDCG202608160003", poPushStatus: "unsent", apPushStatus: "none" },
  { id: "P13", cdnSn: "CDN202608150005", orderSn: "LGCX202608150001", stShipSn: "MIX150005", lineNo: 1, productName: "维修服务", model: "SVC-01", qty: 1, policyAmount: 2400, supplier: OTHER, supplierKind: "other", salesCompany: SZ, purchaseType: "直采", matchStatus: "matched", invoiceId: "INV-C", invoiceNo: "25372000001122334455",     invoiceLineId: "C1-hist", invoiceAmount: 2000, taxAmount: 260, totalAmount: 2260, feeAmount: 0, kingdeePoNo: "KDCG202608150001", poPushStatus: "success", apPushStatus: "exception" },
  { id: "P14", cdnSn: "CDN202608150006", orderSn: "LGCX202608150002", stShipSn: "MIX150006", lineNo: 1, productName: "配件_PART-X", model: "PART-X", qty: 2, policyAmount: 1200, supplier: OTHER, supplierKind: "other", salesCompany: SZ, purchaseType: "直采", matchStatus: "matched", invoiceId: "INV-D", invoiceNo: "25372000001122339900", invoiceLineId: "D1-hist", invoiceAmount: 1000, taxAmount: 130, totalAmount: 1130, feeAmount: 0, kingdeePoNo: "KDCG202608150001", poPushStatus: "success", apPushStatus: "exception" },
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
      if (line.matchStatus === "matched" && line.invoiceId) {
        const group = state.lines.filter((l) => l.invoiceId === line.invoiceId).map((l) => l.id);
        const allOn = group.every((id) => state.selected.includes(id));
        return { ...state, selected: allOn ? [] : group };
      }
      const selectedMatched = state.selected
        .map((id) => state.lines.find((l) => l.id === id))
        .filter((l) => l?.matchStatus === "matched");
      if (selectedMatched.length) {
        return toast(state, "已勾选整票明细，不能再勾选其他行", "warn");
      }
      const on = state.selected.includes(action.id);
      return {
        ...state,
        selected: on ? state.selected.filter((id) => id !== action.id) : [...state.selected, action.id],
      };
    }
    case "match": {
      const inv = state.invoices.find((i) => i.id === action.invoiceId);
      if (!inv) return toast(state, "发票不存在", "err");
      const targets = state.lines.filter((l) => action.purchaseIds.includes(l.id));
      if (targets.some((l) => l.matchStatus === "matched")) {
        return toast(state, "所选明细已匹配，请先解绑", "warn");
      }
      if (targets.some((l) => l.poPushStatus === "success")) {
        return toast(state, "已推送成功的金蝶采购单明细不可再匹配", "warn");
      }
      const unused = inv.lines.filter((il) => !il.purchaseLineId);
      const usedIl = new Set<string>();
      const pairs: { p: PurchaseLine; il: (typeof unused)[0] }[] = [];
      for (const p of targets) {
        const il = unused.find((x) => !usedIl.has(x.id) && x.model === p.model && x.qty === p.qty);
        if (!il) continue;
        usedIl.add(il.id);
        pairs.push({ p, il });
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
      const miss = targets.length - n;
      return toast(
        { ...state, lines, invoices, selected: [] },
        miss
          ? `已匹配 ${n} 行，${miss} 行型号数量未对齐（发票将显示部分匹配）`
          : `已匹配 ${n} 行，金额/费用已回写采购送货单`,
        miss ? "warn" : "ok",
      );
    }
    case "unbindInvoice": {
      const selected = state.lines.filter((l) => state.selected.includes(l.id));
      if (!selected.length) return toast(state, "请先勾选明细", "warn");
      if (selected.some((l) => l.poPushStatus === "success")) {
        return toast(state, "已推送金蝶采购单的明细不可解绑发票", "err");
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
      if (selected.some((l) => l.kingdeePoNo)) {
        return toast(state, "所选含已打包明细，请先解绑或改选", "warn");
      }
      const matched = selected.filter((l) => l.matchStatus === "matched");
      const unmatched = selected.filter((l) => l.matchStatus === "unmatched");
      if (matched.length && unmatched.length) {
        return toast(state, "整票明细不能与未匹配明细混包", "err");
      }
      if (matched.length) {
        const invIds = [...new Set(matched.map((l) => l.invoiceId))];
        if (invIds.length !== 1) return toast(state, "一次只能按一张发票整票下推", "err");
        const allOfInv = state.lines.filter((l) => l.invoiceId === invIds[0]);
        if (allOfInv.some((l) => !state.selected.includes(l.id)) || selected.length !== allOfInv.length) {
          return toast(state, "必须勾选该发票对应的全部采购明细后再下推", "err");
        }
      }
      const poNo = nextKingdeePoNo([...state.poSeqExisting, ...state.lines.map((l) => l.kingdeePoNo || "")]);
      const ids = new Set(selected.map((l) => l.id));
      const lines = state.lines.map((l) =>
        ids.has(l.id) ? { ...l, kingdeePoNo: poNo, poPushStatus: "unsent" as PoPushStatus } : l,
      );
      return toast(
        { ...state, lines, poSeqExisting: [...state.poSeqExisting, poNo], selected: [] },
        `已打包生成金蝶采购单号 ${poNo}（未推送，可解绑或确认下推）`,
        "ok",
      );
    }
    case "pushPo": {
      const selected = state.lines.filter((l) => state.selected.includes(l.id));
      const poNos = [...new Set(selected.map((l) => l.kingdeePoNo).filter(Boolean))] as string[];
      if (poNos.length !== 1) return toast(state, "请勾选同一金蝶采购单号且状态为未推送的明细", "warn");
      const group = state.lines.filter((l) => l.kingdeePoNo === poNos[0]);
      if (group.some((l) => l.poPushStatus !== "unsent")) {
        return toast(state, "仅未推送的打包可确认下推", "warn");
      }
      const lines = state.lines.map((l) =>
        l.kingdeePoNo === poNos[0] ? { ...l, poPushStatus: "success" as PoPushStatus } : l,
      );
      return toast({ ...state, lines, selected: [] }, `${poNos[0]} 已下推金蝶采购订单`, "ok");
    }
    case "unbindPack": {
      const selected = state.lines.filter((l) => state.selected.includes(l.id));
      const poNos = [...new Set(selected.map((l) => l.kingdeePoNo).filter(Boolean))] as string[];
      if (poNos.length !== 1) return toast(state, "请勾选同一打包的明细再解绑", "warn");
      const group = state.lines.filter((l) => l.kingdeePoNo === poNos[0]);
      if (group.some((l) => l.poPushStatus === "success")) {
        return toast(state, "已推送成功的金蝶采购单不可解绑", "err");
      }
      const lines = state.lines.map((l) =>
        l.kingdeePoNo === poNos[0]
          ? { ...l, kingdeePoNo: undefined, poPushStatus: "none" as PoPushStatus, apPushStatus: "none" as ApPushStatus }
          : l,
      );
      return toast({ ...state, lines, selected: [] }, `${poNos[0]} 已解绑，可重新勾选打包`, "ok");
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
      let bad = 0;
      const next = state.lines.map((l) => ({ ...l }));
      for (const [poNo, group] of groups) {
        if (group.every((g) => g.apPushStatus === "success")) continue;
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
      return toast(
        { ...state, lines: next },
        `应付单定时任务完成：成功 ${ok} 单，推送异常 ${bad} 单（发票不一致或未全部匹配）`,
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
    poSeqExisting: ["KDCG202608160003", "KDCG202608150001"],
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
