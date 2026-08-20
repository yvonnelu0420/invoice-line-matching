import { useState } from "react";
import { useStore } from "../store";
import { MatchTag, money } from "../ui";

export function InvoicePage() {
  const s = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const inv = s.invoices.find((i) => i.id === openId);

  return (
    <div className="panel">
      <div className="toolbar">
        <button className="btn ghost">列表导出</button>
        <button className="btn">数电发票导入</button>
        <span style={{ color: "#6b7785" }}>表头匹配状态由明细汇总：全部 / 部分 / 未匹配。不再按整张 CDN 匹配。</span>
      </div>
      <div className="hint">
        进项发票改为明细行匹配。采购签收单号展示该发票行占用的采购送货单号（可跨多张 CDN）。匹配与解绑请到「采购明细发票匹配」操作。
      </div>
      {openId && inv ? (
        <div className="detail">
          <button className="btn ghost" onClick={() => setOpenId(null)}>
            返回列表
          </button>
          <div className="section">
            <h4>基础信息</h4>
            <div className="kv">
              <div>
                <label>数电发票号码</label>
                {inv.digitalNo}
              </div>
              <div>
                <label>销方名称</label>
                {inv.seller}
              </div>
              <div>
                <label>购买方名称</label>
                {inv.buyer}
              </div>
              <div>
                <label>价税合计</label>
                {money(inv.totalIncl)}
              </div>
              <div>
                <label>表头匹配状态</label>
                <MatchTag v={s.invoiceStatus(inv.id)} />
              </div>
              <div>
                <label>备注</label>
                {inv.memo || "—"}
              </div>
            </div>
          </div>
          <div className="section">
            <h4>发票明细（行匹配）</h4>
            <table>
              <thead>
                <tr>
                  <th>型号</th>
                  <th>数量</th>
                  <th>不含税</th>
                  <th>税额</th>
                  <th>含税</th>
                  <th>费用</th>
                  <th>匹配采购送货单</th>
                  <th>采购行</th>
                </tr>
              </thead>
              <tbody>
                {inv.lines.map((il) => {
                  const pl = s.lines.find((l) => l.id === il.purchaseLineId);
                  return (
                    <tr key={il.id}>
                      <td>{il.model}</td>
                      <td>{il.qty}</td>
                      <td>{money(il.amountExcl)}</td>
                      <td>{money(il.tax)}</td>
                      <td>{money(il.amountIncl)}</td>
                      <td>{money(il.feeAmount)}</td>
                      <td>{pl?.cdnSn || "未匹配"}</td>
                      <td>{pl ? `${pl.lineNo} / ${pl.model}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>数电发票号码</th>
                <th>销方</th>
                <th>购方</th>
                <th>价税合计</th>
                <th>匹配状态</th>
                <th>已配行/总行</th>
                <th>关联采购送货单</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {s.invoices.map((i) => {
                const st = s.invoiceStatus(i.id);
                const hit = i.lines.filter((l) => l.purchaseLineId).length;
                const cdns = [
                  ...new Set(
                    i.lines
                      .map((l) => s.lines.find((p) => p.id === l.purchaseLineId)?.cdnSn)
                      .filter(Boolean),
                  ),
                ];
                return (
                  <tr key={i.id}>
                    <td>{i.digitalNo}</td>
                    <td>{i.seller}</td>
                    <td>{i.buyer}</td>
                    <td>{money(i.totalIncl)}</td>
                    <td>
                      <MatchTag v={st} />
                    </td>
                    <td>
                      {hit}/{i.lines.length}
                    </td>
                    <td>{cdns.join("、") || "—"}</td>
                    <td>
                      <button className="btn ghost" onClick={() => setOpenId(i.id)}>
                        查看
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
