export type SupplierKind = "suhao" | "mitsubishi" | "other";
export type LineMatchStatus = "unmatched" | "matched";
export type InvoiceMatchStatus = "unmatched" | "partial" | "full";
export type PoPushStatus = "none" | "unsent" | "success" | "fail";
export type ApPushStatus = "none" | "success" | "exception";

export type PageId =
  | "line-match"
  | "invoice"
  | "purchase-push"
  | "three-way";

export interface PurchaseLine {
  id: string;
  cdnSn: string;
  orderSn: string;
  stShipSn: string;
  lineNo: number;
  productName: string;
  productCode: string;
  model: string;
  qty: number;
  policyAmount: number;
  supplier: string;
  supplierKind: SupplierKind;
  salesCompany: string;
  purchaseType: "直采" | "随单采";
  supplierCode?: string;
  /** 采购发货时间 */
  shipTime?: string;
  /** 供应商订单号（三菱 SO，对应采购订单 f_as_purchase_no） */
  supplierOrderNo?: string;
  salesShipSn?: string;
  customer?: string;
  customerCode?: string;
  salesOrderSn?: string;
  shipSourceSn?: string;
  orderType?: "标品订单" | "赠品订单";
  warehouseCode?: string;
  warehouseName?: string;
  returnQty?: number;
  remark?: string;
  invoiceId?: string;
  invoiceNo?: string;
  invoiceLineId?: string;
  invoiceAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  feeAmount?: number;
  kingdeePoNo?: string;
  poPushStatus: PoPushStatus;
  apPushStatus: ApPushStatus;
  matchStatus: LineMatchStatus;
  matchedAt?: string;
  matchedBy?: string;
}

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  taxCode: string;
  name: string;
  model: string;
  qty: number;
  amountExcl: number;
  tax: number;
  amountIncl: number;
  feeAmount: number;
  purchaseLineId?: string;
  unit?: string;
  unitPriceExcl?: number;
  taxRate?: number;
  productName?: string;
  productCode?: string;
  feeTax?: number;
  feeIncl?: number;
}

export interface Invoice {
  id: string;
  digitalNo: string;
  seller: string;
  buyer: string;
  totalIncl: number;
  memo: string;
  supplierKind: SupplierKind;
  lines: InvoiceLine[];
  invoiceCode?: string;
  paperNo?: string;
  sellerTaxNo?: string;
  buyerTaxNo?: string;
  invoiceDate?: string;
  invoiceKind?: string;
  invoiceStatus?: "正常" | "已红冲" | "已作废";
  isPositive?: boolean;
  amountExcl?: number;
  tax?: number;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface Toast {
  id: number;
  text: string;
  tone: "ok" | "warn" | "err" | "info";
}

export interface SalesOutLine {
  id: string;
  salesShipSn: string;
  productName: string;
  productCode: string;
  model: string;
  shipQty: number;
  returnQty: number;
  actualQty: number;
  shipTime: string;
  feeAmount: number;
  unitPrice: number;
  amount: number;
  warehouseCode: string;
  warehouseName: string;
  invoiceUnitPrice?: number;
  invoiceAmount?: number;
  batchNo?: string;
  remark?: string;
  salesOrderSn?: string;
}
