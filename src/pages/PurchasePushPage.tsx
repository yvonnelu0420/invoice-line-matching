import { useMemo, useState } from "react";
import { useStore } from "../store";
import { ApTag, MatchTag, money, PoTag } from "../ui";

export function PurchasePushPage() {
  const s = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const headers = useMemo(() => {
    const map = new Map<string, typeof s.lines>();
    for (const l of s.lines) {
      const arr = map.get(l.cdnSn) || [];
      arr.push(l);
      map.set(l.cdnSn, arr);
    }
    return [...map.entries()].map(([cdn, lines]) => {
      const matched = lines.filter((x) => x.matchStatus === "matched").length;
      const invs = [...new Set(lines.map((x) => x.invoiceNo).filter(Boolean))];
      const pos = [...new Set(lines.map((x) => x.kingdeePoNo).filter(Boolean))];
      const headMatch: "unmatched" | "partial" | "full" =
        matched === 0 ? "unmatched" : matched === lines.length ? "full" : "partial";
      return { cdn, lines, invs, pos, headMatch, first: lines[0] };
    });
  }, [s.lines]);
  const detail = headers.find((h) => h.cdn === open);

  return (
    <div className="panel">
      <div className="toolbar">
        <button className="btn ghost">列表导出</button>
        <span className="removed">采购单批量推金蝶</span>
        <span className="removed">应付单批量推金蝶</span>
        <span style={{ color: "#6b7785" }}>本页只读展示「采购明细发票匹配」结果，不再做发票关联/解绑，也不再下推采购单和应付单。</span>
      </div>
      {detail ? (
        <div className="detail">
          <button className="btn ghost" onClick={() => setOpen(null)}>
            返回列表
          </button>
          <div className="section">
            <h4>基础信息（只读）</h4>
            <div className="kv">
              <div>
                <label>采购送货单号</label>
                {detail.cdn}
              </div>
              <div>
                <label>供应商</label>
                {detail.first.supplier}
              </div>
              <div>
                <label>销售公司</label>
                {detail.first.salesCompany}
              </div>
              <div>
                <label>发票匹配（由明细汇总）</label>
                <MatchTag v={detail.headMatch} />
              </div>
              <div>
                <label>关联发票号</label>
                {detail.invs.join("、") || "—"}
              </div>
              <div>
                <label>金蝶采购单号</label>
                {detail.pos.join("、") || "—"}
              </div>
            </div>
          </div>
          <div className="section">
            <h4>采购入库明细</h4>
            <table>
              <thead>
                <tr>
                  <th>型号</th>
                  <th>数量</th>
                  <th>政策价</th>
                  <th>开票含税</th>
                  <th>费用</th>
                  <th>发票号</th>
                  <th>金蝶采购单</th>
                  <th>采购下推</th>
                  <th>应付下推</th>
                </tr>
              </thead>
              <tbody>
                {detail.lines.map((l) => (
                  <tr key={l.id}>
                    <td>{l.model}</td>
                    <td>{l.qty}</td>
                    <td>{money(l.policyAmount)}</td>
                    <td>{money(l.totalAmount)}</td>
                    <td>{money(l.feeAmount)}</td>
                    <td>{l.invoiceNo || "—"}</td>
                    <td>{l.kingdeePoNo || "—"}</td>
                    <td>
                      <PoTag v={l.poPushStatus} />
                    </td>
                    <td>
                      <ApTag v={l.apPushStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="removed">应付单推送金蝶　采购单推送金蝶　关联发票号（可编辑）</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>采购送货单号</th>
                <th>采购类型</th>
                <th>供应商</th>
                <th>销售公司</th>
                <th>单据金额</th>
                <th>匹配（明细）</th>
                <th>关联发票号</th>
                <th>金蝶采购单号</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {headers.map((h) => (
                <tr key={h.cdn}>
                  <td>{h.cdn}</td>
                  <td>{h.first.purchaseType}</td>
                  <td>{h.first.supplier.slice(0, 12)}…</td>
                  <td>{h.first.salesCompany.replace("菱感电子商务（", "").replace("）有限公司", "")}</td>
                  <td>{money(h.lines.reduce((a, b) => a + b.policyAmount, 0))}</td>
                  <td>
                    <MatchTag v={h.headMatch} />
                  </td>
                  <td>{h.invs.join("、") || "—"}</td>
                  <td>{h.pos.join("、") || "—"}</td>
                  <td>
                    <button className="btn ghost" onClick={() => setOpen(h.cdn)}>
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
