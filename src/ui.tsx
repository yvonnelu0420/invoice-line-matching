import type { ApPushStatus, InvoiceMatchStatus, PoPushStatus, PurchaseLine } from "./types";

export type HeadPushStatus = "none" | "partial" | "full";

export function aggPoPush(lines: PurchaseLine[]): HeadPushStatus {
  const n = lines.filter((l) => l.poPushStatus === "success").length;
  if (n === 0) return "none";
  if (n === lines.length) return "full";
  return "partial";
}

export function aggApPush(lines: PurchaseLine[]): HeadPushStatus {
  const n = lines.filter((l) => l.apPushStatus === "success").length;
  if (n === 0) return "none";
  if (n === lines.length) return "full";
  return "partial";
}

export function money(n?: number) {
  if (n == null) return "—";
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function BinaryMatchTag({ v }: { v: "matched" | "unmatched" }) {
  return v === "matched" ? <span className="tag green">已匹配</span> : <span className="tag gray">未匹配</span>;
}

export function InvoicingTag({ v }: { v: string }) {
  const map: Record<string, string> = { 未开票: "gray", 已开票: "green", 开票红冲: "orange", 开票退货: "red" };
  return <span className={`tag ${map[v] || "gray"}`}>{v}</span>;
}

export function MatchTag({ v }: { v: InvoiceMatchStatus | "matched" | "unmatched" }) {
  const map = {
    unmatched: ["未匹配", "gray"],
    partial: ["部分匹配", "orange"],
    full: ["全部匹配", "green"],
    matched: ["已匹配", "green"],
  } as const;
  const [t, c] = map[v];
  return <span className={`tag ${c}`}>{t}</span>;
}

export function PoTag({ v }: { v: PoPushStatus }) {
  const map = {
    none: ["未推送", "gray"],
    unsent: ["未推送", "orange"],
    success: ["推送成功", "green"],
    fail: ["推送失败", "red"],
  } as const;
  const [t, c] = map[v];
  return <span className={`tag ${c}`}>{t}</span>;
}

export function HeadPushTag({ v }: { v: HeadPushStatus }) {
  const map = {
    none: ["未推送", "gray"],
    partial: ["部分推送", "orange"],
    full: ["全部推送", "green"],
  } as const;
  const [t, c] = map[v];
  return <span className={`tag ${c}`}>{t}</span>;
}

export function ApTag({ v }: { v: ApPushStatus }) {
  const map = {
    none: ["未推送", "gray"],
    success: ["推送成功", "green"],
    exception: ["推送异常", "red"],
  } as const;
  const [t, c] = map[v];
  return <span className={`tag ${c}`}>{t}</span>;
}

export function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: import("react").ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="modal-mask" onClick={onClose}>
      <div className={wide ? "modal wide" : "modal"} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}
