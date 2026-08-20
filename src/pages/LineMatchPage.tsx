import { useMemo, useState } from "react";
import { PO_NO_RULE } from "../poNo";
import { useStore } from "../store";
import { ApTag, MatchTag, Modal, money, PoTag } from "../ui";

export function LineMatchPage() {
  const s = useStore();
  const [q, setQ] = useState({ cdn: "", supplier: "", match: "all", po: "all" });
  const [openMatch, setOpenMatch] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);
  const [pickInv, setPickInv] = useState<string>("");

  const rows = useMemo(() => {
    return s.lines.filter((l) => {
      if (q.cdn && !l.cdnSn.includes(q.cdn) && !l.stShipSn.includes(q.cdn)) return false;
      if (q.supplier && !l.supplier.includes(q.supplier)) return false;
      if (q.match === "matched" && l.matchStatus !== "matched") return false;
      if (q.match === "unmatched" && l.matchStatus !== "unmatched") return false;
      if (q.po === "unsent" && l.poPushStatus !== "unsent") return false;
      if (q.po === "success" && l.poPushStatus !== "success") return false;
      if (q.po === "none" && l.poPushStatus !== "none") return false;
      return true;
    });
  }, [s.lines, q]);

  const selectedLines = s.lines.filter((l) => s.selected.includes(l.id));
  const selectedInv = [...new Set(selectedLines.map((l) => l.invoiceId).filter(Boolean))];

  return (
    <div className="panel">
      <div className="toolbar">
        <button className="btn" onClick={() => setOpenMatch(true)} disabled={!s.selected.length}>
          匹配发票
        </button>
        <button className="btn ghost" onClick={s.unbindInvoice} disabled={!s.selected.length}>
          解绑发票
        </button>
        <button className="btn green" onClick={s.pack} disabled={!s.selected.length}>
          打包下推金蝶采购订单
        </button>
        <button className="btn green" onClick={s.pushPo} disabled={!s.selected.length}>
          确认下推金蝶
        </button>
        <button className="btn danger" onClick={s.unbindPack} disabled={!s.selected.length}>
          解绑打包
        </button>
        <button className="btn orange" onClick={s.runApJob}>
          模拟应付单定时任务
        </button>
        <button className="btn ghost" onClick={() => setOpenHelp(true)}>
          单号规则
        </button>
        <span style={{ marginLeft: "auto", color: "#6b7785" }}>
          已选 {s.selected.length} 行
          {selectedInv.length === 1 ? ` · 整票 ${selectedInv[0]}` : ""}
        </span>
      </div>
      <div className="hint">
        行明细匹配。已匹配发票：勾一行即勾整票，且不能再勾其他行，必须整票打成一个金蝶采购订单。未匹配行可多选混包。应付单由定时任务按金蝶采购单整单下推，发票不一致则推送异常。
      </div>
      <div className="demo">
        <span className="chip">场景：P1–P3 苏豪未匹配（用 INV-A / Y260819KT0024）</span>
        <span className="chip">INV-B 为 1:N（两张 CDN）</span>
        <span className="chip">CDN170001 为 N:1（两张发票）</span>
        <span className="chip">KDCG202608160003 未推送可解绑</span>
        <span className="chip">KDCG202608150001 发票不一致 → 应付异常</span>
      </div>
      <div className="filters">
        <div className="field">
          <label>采购送货单号 / 舜天发货单号</label>
          <input value={q.cdn} onChange={(e) => setQ({ ...q, cdn: e.target.value })} placeholder="CDN / Y2" />
        </div>
        <div className="field">
          <label>供应商</label>
          <input value={q.supplier} onChange={(e) => setQ({ ...q, supplier: e.target.value })} />
        </div>
        <div className="field">
          <label>发票匹配</label>
          <select value={q.match} onChange={(e) => setQ({ ...q, match: e.target.value })}>
            <option value="all">全部</option>
            <option value="unmatched">未匹配</option>
            <option value="matched">已匹配</option>
          </select>
        </div>
        <div className="field">
          <label>金蝶采购单</label>
          <select value={q.po} onChange={(e) => setQ({ ...q, po: e.target.value })}>
            <option value="all">全部</option>
            <option value="none">未打包</option>
            <option value="unsent">未推送</option>
            <option value="success">推送成功</option>
          </select>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th />
              <th>采购送货单号</th>
              <th>行</th>
              <th>型号</th>
              <th>数量</th>
              <th>政策价</th>
              <th>供应商</th>
              <th>销售公司</th>
              <th>匹配</th>
              <th>发票号</th>
              <th>开票含税</th>
              <th>费用</th>
              <th>金蝶采购单号</th>
              <th>采购下推</th>
              <th>应付下推</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} className={s.selected.includes(l.id) ? "picked" : ""}>
                <td>
                  <input type="checkbox" checked={s.selected.includes(l.id)} onChange={() => s.toggle(l.id)} />
                </td>
                <td>{l.cdnSn}</td>
                <td>{l.lineNo}</td>
                <td>{l.model}</td>
                <td>{l.qty}</td>
                <td>{money(l.policyAmount)}</td>
                <td title={l.supplier}>{l.supplierKind === "suhao" ? "苏豪" : l.supplierKind === "mitsubishi" ? "三菱重工" : "其他物优家"}</td>
                <td>{l.salesCompany.replace("菱感电子商务（", "").replace("）有限公司", "")}</td>
                <td>
                  <MatchTag v={l.matchStatus} />
                </td>
                <td>{l.invoiceNo || "—"}</td>
                <td>{money(l.totalAmount)}</td>
                <td>{money(l.feeAmount)}</td>
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

      {openMatch && (
        <Modal title="按行匹配进项发票" onClose={() => setOpenMatch(false)}>
          <p style={{ color: "#6b7785", marginTop: 0 }}>
            推荐规则仍按现状：苏豪用备注 Y2=舜天发货单号；非苏豪用购方+销方+价税合计。确认后按型号+数量占用发票行并回写金额。
          </p>
          <div className="table-wrap" style={{ maxHeight: 280 }}>
            <table>
              <thead>
                <tr>
                  <th />
                  <th>发票号</th>
                  <th>销方</th>
                  <th>购方</th>
                  <th>价税合计</th>
                  <th>表头匹配</th>
                  <th>推荐</th>
                </tr>
              </thead>
              <tbody>
                {s.invoices.map((inv) => {
                  const st = s.invoiceStatus(inv.id);
                  const first = selectedLines[0];
                  let rec = "";
                  if (first && inv.supplierKind === "suhao" && inv.memo.includes(first.stShipSn)) rec = "Y2 命中";
                  if (
                    first &&
                    inv.supplierKind !== "suhao" &&
                    inv.buyer === first.salesCompany &&
                    inv.seller === first.supplier
                  )
                    rec = "购销方命中";
                  return (
                    <tr key={inv.id} className={pickInv === inv.id ? "picked" : ""}>
                      <td>
                        <input
                          type="radio"
                          name="inv"
                          checked={pickInv === inv.id}
                          onChange={() => setPickInv(inv.id)}
                        />
                      </td>
                      <td>{inv.digitalNo}</td>
                      <td>{inv.seller.slice(0, 10)}…</td>
                      <td>{inv.buyer.replace("菱感电子商务（", "").replace("）有限公司", "")}</td>
                      <td>{money(inv.totalIncl)}</td>
                      <td>
                        <MatchTag v={st} />
                      </td>
                      <td>{rec || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setOpenMatch(false)}>
              取消
            </button>
            <button
              className="btn"
              onClick={() => {
                if (!pickInv) return s.notify("请选择发票", "warn");
                s.matchToInvoice(pickInv);
                setOpenMatch(false);
              }}
            >
              确认按行匹配并回写
            </button>
          </div>
        </Modal>
      )}

      {openHelp && (
        <Modal title="金蝶采购单号生成规则" onClose={() => setOpenHelp(false)}>
          <p>
            编码：<strong>{PO_NO_RULE.pattern}</strong>
          </p>
          <p>
            示例：<strong>{PO_NO_RULE.example}</strong>
          </p>
          <p>{PO_NO_RULE.note}</p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setOpenHelp(false)}>
              知道了
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
