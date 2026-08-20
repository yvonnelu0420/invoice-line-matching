import { useMemo, useState } from "react";
import { useStore } from "../store";
import { ApTag, MatchTag, money, PoTag } from "../ui";

export function ThreeWayPage() {
  const s = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [salesPush, setSalesPush] = useState<Record<string, "none" | "success">>({});

  const headers = useMemo(() => {
    const map = new Map<string, typeof s.lines>();
    for (const l of s.lines.filter((x) => x.purchaseType === "随单采")) {
      const arr = map.get(l.cdnSn) || [];
      arr.push(l);
      map.set(l.cdnSn, arr);
    }
    return [...map.entries()].map(([cdn, lines]) => {
      const matched = lines.filter((x) => x.matchStatus === "matched").length;
      const headMatch: "unmatched" | "partial" | "full" =
        matched === 0 ? "unmatched" : matched === lines.length ? "full" : "partial";
      return {
        cdn,
        lines,
        first: lines[0],
        invs: [...new Set(lines.map((x) => x.invoiceNo).filter(Boolean))],
        pos: [...new Set(lines.map((x) => x.kingdeePoNo).filter(Boolean))],
        headMatch,
      };
    });
  }, [s.lines]);
  const detail = headers.find((h) => h.cdn === open);

  return (
    <div className="panel">
      <div className="toolbar">
        <button className="btn ghost">列表导出</button>
        <span className="removed">采购单批量推金蝶</span>
        <span className="removed">应付单批量推金蝶</span>
        <button
          className="btn green"
          onClick={() => {
            const next = { ...salesPush };
            for (const h of headers) next[h.cdn] = "success";
            setSalesPush(next);
            s.notify("销售单已批量推金蝶（销售侧逻辑不变）", "ok");
          }}
        >
          销售单批量推金蝶
        </button>
      </div>
      <div className="hint">
        采购匹配/下推与「采购送货单推金蝶」相同：只读展示新模块数据。销售单据推金蝶仍在本页操作。
      </div>
      {detail ? (
        <div className="detail">
          <button className="btn ghost" onClick={() => setOpen(null)}>
            返回列表
          </button>
          <div className="toolbar" style={{ border: 0, paddingLeft: 0 }}>
            <span className="removed">采购单推金蝶</span>
            <span className="removed">应付单推金蝶</span>
            <button
              className="btn green"
              onClick={() => {
                setSalesPush({ ...salesPush, [detail.cdn]: "success" });
                s.notify(`${detail.first.salesShipSn || detail.cdn} 销售单已推金蝶`, "ok");
              }}
            >
              销售单推金蝶
            </button>
          </div>
          <div className="section">
            <h4>基础信息</h4>
            <div className="kv">
              <div>
                <label>销售发货单号</label>
                {detail.first.salesShipSn || "—"}
              </div>
              <div>
                <label>采购送货单号</label>
                {detail.cdn}
              </div>
              <div>
                <label>客户</label>
                {detail.first.customer || "—"}
              </div>
              <div>
                <label>采购匹配（明细汇总）</label>
                <MatchTag v={detail.headMatch} />
              </div>
              <div>
                <label>关联发票号</label>
                {detail.invs.join("、") || "—"}
              </div>
              <div>
                <label>销售单推金蝶</label>
                {salesPush[detail.cdn] === "success" ? "推送成功" : "未推送"}
              </div>
            </div>
          </div>
          <div className="section">
            <h4>采购入库明细（只读匹配结果）</h4>
            <table>
              <thead>
                <tr>
                  <th>型号</th>
                  <th>政策价</th>
                  <th>开票含税</th>
                  <th>费用</th>
                  <th>发票</th>
                  <th>金蝶采购单</th>
                  <th>采购下推</th>
                  <th>应付下推</th>
                </tr>
              </thead>
              <tbody>
                {detail.lines.map((l) => (
                  <tr key={l.id}>
                    <td>{l.model}</td>
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
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>销售发货单号</th>
                <th>采购送货单号</th>
                <th>客户</th>
                <th>采购匹配</th>
                <th>关联发票</th>
                <th>金蝶采购单</th>
                <th>销售推金蝶</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {headers.map((h) => (
                <tr key={h.cdn}>
                  <td>{h.first.salesShipSn}</td>
                  <td>{h.cdn}</td>
                  <td>{h.first.customer}</td>
                  <td>
                    <MatchTag v={h.headMatch} />
                  </td>
                  <td>{h.invs.join("、") || "—"}</td>
                  <td>{h.pos.join("、") || "—"}</td>
                  <td>{salesPush[h.cdn] === "success" ? "推送成功" : "未推送"}</td>
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
