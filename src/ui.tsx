import type { ApPushStatus, InvoiceMatchStatus, PoPushStatus } from "./types";

export function money(n?: number) {
  if (n == null) return "—";
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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
    none: ["未打包", "gray"],
    unsent: ["未推送", "orange"],
    success: ["推送成功", "green"],
    fail: ["推送失败", "red"],
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
}: {
  title: string;
  children: import("react").ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}
