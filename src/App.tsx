import { StoreProvider, useStore } from "./store";
import { InvoicePage } from "./pages/InvoicePage";
import { LineMatchPage } from "./pages/LineMatchPage";
import { PurchasePushPage } from "./pages/PurchasePushPage";
import { ThreeWayPage } from "./pages/ThreeWayPage";
import type { PageId } from "./types";

const NAV: { id: PageId; label: string }[] = [
  { id: "line-match", label: "采购明细发票匹配" },
  { id: "invoice", label: "进项发票" },
  { id: "purchase-push", label: "采购送货单推金蝶" },
  { id: "three-way", label: "随单采推金蝶（三单匹配）" },
];

function Shell() {
  const s = useStore();
  return (
    <div className="app">
      <aside className="sider">
        <div className="sider-user">
          <strong>陆怡雯</strong>
          <span>财务管理 / 结算管理</span>
        </div>
        <nav className="nav">
          <div className="nav-label">结算管理 · 原型</div>
          {NAV.map((n) => (
            <button key={n.id} className={s.page === n.id ? "active" : ""} onClick={() => s.setPage(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>
      </aside>
      <section className="main">
        <div className="tabs">
          {NAV.map((n) => (
            <button key={n.id} className={`tab ${s.page === n.id ? "active" : ""}`} onClick={() => s.setPage(n.id)}>
              {n.label}
            </button>
          ))}
        </div>
        <div className="workspace">
          {s.page === "line-match" && <LineMatchPage />}
          {s.page === "invoice" && <InvoicePage />}
          {s.page === "purchase-push" && <PurchasePushPage />}
          {s.page === "three-way" && <ThreeWayPage />}
        </div>
      </section>
      <div className="toasts">
        {s.toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`} onClick={() => s.dismiss(t.id)}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
