import type { ReactNode } from "react";

export function ModuleTabs({
  mode,
  onMode,
}: {
  mode: "list" | "regular";
  onMode: (m: "list" | "regular") => void;
}) {
  return (
    <div className="subtabs">
      <button className={mode === "regular" ? "active" : ""} onClick={() => onMode("regular")}>
        常规
      </button>
      <button className={mode === "list" ? "active" : ""} onClick={() => onMode("list")}>
        列表
      </button>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function Kv({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div className="kv kv-4">
      {items.map((it) => (
        <div key={it.label}>
          <label>{it.label}</label>
          {it.value}
        </div>
      ))}
    </div>
  );
}

export function PaneNav({
  items,
  active,
  onChange,
}: {
  items: string[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="pane-nav">
      {items.map((p) => (
        <button key={p} className={active === p ? "active" : ""} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
    </div>
  );
}

export function OpLog({ rows }: { rows: { at: string; user: string; text: string }[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>操作时间</th>
          <th>操作人员</th>
          <th>操作日志</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>{r.at}</td>
            <td>{r.user}</td>
            <td>{r.text}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function MemoCell({ text }: { text?: string }) {
  const v = text && text !== "—" ? text : "—";
  return (
    <td className="cell-ellipsis" title={v === "—" ? undefined : v}>
      {v}
    </td>
  );
}
