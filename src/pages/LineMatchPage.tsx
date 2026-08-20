import { useMemo, useState } from "react";
import { PO_NO_RULE } from "../poNo";
import { parseSoNos, useStore } from "../store";
import type { Invoice, PurchaseLine } from "../types";
import { ApTag, MatchTag, Modal, money, PoTag } from "../ui";

function contains(hay: string | undefined, needle: string) {
  if (!needle.trim()) return true;
  return (hay || "").includes(needle.trim());
}

function invoiceRecommend(inv: Invoice, selected: PurchaseLine[]) {
  const first = selected[0];
  if (!first) return "";
  const sos = parseSoNos(inv.memo);
  if (inv.supplierKind === "suhao" && inv.memo.includes(first.stShipSn)) return "Y2 命中";
  if (
    inv.supplierKind === "mitsubishi" &&
    sos.length &&
    selected.some((l) => l.supplierOrderNo && sos.includes(l.supplierOrderNo.toUpperCase()))
  )
    return `SO 命中 ${sos.length} 个`;
  if (inv.supplierKind !== "suhao" && inv.buyer === first.salesCompany && inv.seller === first.supplier) {
    return inv.supplierKind === "mitsubishi" && sos.length ? "购销方（SO未命中单据）" : "购销方命中";
  }
  return "";
}

function parseExactLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 对齐现网采购送货单「产品名称」：精确匹配，多个值回车隔开。 */
function BatchExactInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  return (
    <div className="batch-exact">
      <input
        readOnly
        value={value.join("、")}
        placeholder="精确匹配，回车隔开多个值"
        onClick={() => {
          setDraft(value.join("\n"));
          setOpen(true);
        }}
      />
      {open && (
        <div className="batch-pop">
          <p>注: 精确匹配搜索，多个值请用回车键隔开</p>
          <textarea
            autoFocus
            value={draft}
            placeholder="请输入"
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="modal-actions" style={{ marginTop: 8 }}>
            <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
              取消
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                onChange(parseExactLines(draft));
                setOpen(false);
              }}
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function LineMatchPage() {
  const s = useStore();
  const [q, setQ] = useState({
    cdn: "",
    stShip: "",
    supplier: "",
    salesCompany: "all",
    invoiceNo: "",
    match: "all",
    invHead: "all",
    kingdeePo: "",
    productNames: [] as string[],
    poPush: "all",
    apPush: "all",
  });
  const [openMatch, setOpenMatch] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);
  const [pickInv, setPickInv] = useState<string>("");

  const salesCompanies = useMemo(() => [...new Set(s.lines.map((l) => l.salesCompany))], [s.lines]);

  const rows = useMemo(() => {
    return s.lines.filter((l) => {
      if (!contains(l.cdnSn, q.cdn)) return false;
      if (!contains(l.stShipSn, q.stShip)) return false;
      if (!contains(l.supplier, q.supplier)) return false;
      if (q.salesCompany !== "all" && l.salesCompany !== q.salesCompany) return false;
      if (!contains(l.invoiceNo, q.invoiceNo)) return false;
      if (q.match === "matched" && l.matchStatus !== "matched") return false;
      if (q.match === "unmatched" && l.matchStatus !== "unmatched") return false;
      if (q.invHead !== "all") {
        if (!l.invoiceId || s.invoiceStatus(l.invoiceId) !== q.invHead) return false;
      }
      if (!contains(l.kingdeePoNo, q.kingdeePo)) return false;
      if (q.productNames.length && !q.productNames.includes(l.productName)) return false;
      if (q.poPush === "unsent" && l.poPushStatus !== "none" && l.poPushStatus !== "unsent") return false;
      if (q.poPush === "success" && l.poPushStatus !== "success") return false;
      if (q.poPush === "fail" && l.poPushStatus !== "fail") return false;
      if (q.apPush !== "all" && l.apPushStatus !== q.apPush) return false;
      return true;
    });
  }, [s.lines, s.invoices, q]);

  const selectedLines = s.lines.filter((l) => s.selected.includes(l.id));
  const selectedInv = [...new Set(selectedLines.map((l) => l.invoiceId).filter(Boolean))];
  const selectedPos = [...new Set(selectedLines.map((l) => l.kingdeePoNo).filter(Boolean))];
  const matchInvoices = s.invoices.filter((inv) => s.invoiceStatus(inv.id) !== "full");

  return (
    <div className="panel">
      <div className="toolbar">
        <button
          className="btn"
          onClick={() => {
            const rec = matchInvoices.find((inv) => invoiceRecommend(inv, selectedLines));
            setPickInv(rec?.id || "");
            setOpenMatch(true);
          }}
          disabled={!s.selected.length}
        >
          匹配发票
        </button>
        <button className="btn ghost" onClick={s.unbindInvoice} disabled={!s.selected.length}>
          解绑发票
        </button>
        <button className="btn green" onClick={s.pack} disabled={!s.selected.length}>
          打包金蝶采购单
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
          {selectedInv.length ? ` · ${selectedInv.length} 张发票` : ""}
          {selectedPos.length ? ` · ${selectedPos.length} 个金蝶单` : ""}
        </span>
      </div>
      <div className="hint">
        勾选：有发票则带出该票全部明细；无发票但有金蝶采购单号则带出该单全部明细。可同时勾多组，打包按票拆单，确认下推按金蝶采购单号拆分。发票明细全部匹配成功后，该票占用的采购行会自动打成一个金蝶采购单。应付未推送成功前可解绑并重新匹配发票（采购已下推不影响改票）。应付单由定时任务按金蝶采购单整单下推：无发票则跳过不推送、不报异常；发票不一致则推送异常。
      </div>
      <div className="demo">
        <span className="chip">人工核对：勾 CDN202608200051 → 匹配发票，弹窗看备注/明细产品与数量后配 INV-J</span>
        <span className="chip">场景：P1–P3 苏豪未匹配（用 INV-A / Y260819KT0024）</span>
        <span className="chip">三菱合并开票：勾 CDN140001 任一行 → 匹配 INV-G（两 SO）</span>
        <span className="chip">三菱拆分开票：CDN130001 先配 INV-H 再配 INV-I（同一 SO）</span>
        <span className="chip">三菱备注无 SO：P11/P12 走原购销方（INV-F）</span>
        <span className="chip">INV-B 已按两 SO 合并匹配（两张 CDN）</span>
        <span className="chip">KDCG2608160003 未推送可解绑</span>
        <span className="chip">KDCG2608150001 发票不一致 → 应付异常</span>
      </div>
      <div className="filters">
        <div className="field">
          <label>采购送货单号</label>
          <input value={q.cdn} onChange={(e) => setQ({ ...q, cdn: e.target.value })} placeholder="CDN" />
        </div>
        <div className="field">
          <label>舜天发货单号</label>
          <input value={q.stShip} onChange={(e) => setQ({ ...q, stShip: e.target.value })} placeholder="Y2 / 舜天单号" />
        </div>
        <div className="field">
          <label>供应商</label>
          <input value={q.supplier} onChange={(e) => setQ({ ...q, supplier: e.target.value })} />
        </div>
        <div className="field">
          <label>销售公司</label>
          <select value={q.salesCompany} onChange={(e) => setQ({ ...q, salesCompany: e.target.value })}>
            <option value="all">全部</option>
            {salesCompanies.map((name) => (
              <option key={name} value={name}>
                {name.replace("菱感电子商务（", "").replace("）有限公司", "")}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>发票号</label>
          <input value={q.invoiceNo} onChange={(e) => setQ({ ...q, invoiceNo: e.target.value })} placeholder="数电发票号码" />
        </div>
        <div className="field">
          <label>行匹配</label>
          <select value={q.match} onChange={(e) => setQ({ ...q, match: e.target.value })}>
            <option value="all">全部</option>
            <option value="unmatched">未匹配</option>
            <option value="matched">已匹配</option>
          </select>
        </div>
        <div className="field">
          <label>发票匹配</label>
          <select value={q.invHead} onChange={(e) => setQ({ ...q, invHead: e.target.value })}>
            <option value="all">全部</option>
            <option value="unmatched">未匹配</option>
            <option value="partial">部分匹配</option>
            <option value="full">全部匹配</option>
          </select>
        </div>
        <div className="field">
          <label>金蝶采购单号</label>
          <input value={q.kingdeePo} onChange={(e) => setQ({ ...q, kingdeePo: e.target.value })} placeholder="KDCG…" />
        </div>
        <div className="field">
          <label>产品名称</label>
          <BatchExactInput value={q.productNames} onChange={(productNames) => setQ({ ...q, productNames })} />
        </div>
        <div className="field">
          <label>采购下推</label>
          <select value={q.poPush} onChange={(e) => setQ({ ...q, poPush: e.target.value })}>
            <option value="all">全部</option>
            <option value="unsent">未推送</option>
            <option value="success">推送成功</option>
            <option value="fail">推送失败</option>
          </select>
        </div>
        <div className="field">
          <label>应付下推</label>
          <select value={q.apPush} onChange={(e) => setQ({ ...q, apPush: e.target.value })}>
            <option value="all">全部</option>
            <option value="none">未推送</option>
            <option value="success">推送成功</option>
            <option value="exception">推送异常</option>
          </select>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th />
              <th>采购送货单号</th>
              <th>供应商订单号</th>
              <th>行</th>
              <th>产品名称</th>
              <th>型号</th>
              <th>数量</th>
              <th>政策价</th>
              <th>供应商</th>
              <th>销售公司</th>
              <th>行匹配</th>
              <th>发票号</th>
              <th>发票匹配</th>
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
                <td>{l.supplierOrderNo || "—"}</td>
                <td>{l.lineNo}</td>
                <td>{l.productName}</td>
                <td>{l.model}</td>
                <td>{l.qty}</td>
                <td>{money(l.policyAmount)}</td>
                <td title={l.supplier}>{l.supplierKind === "suhao" ? "苏豪" : l.supplierKind === "mitsubishi" ? "三菱重工" : "其他物优家"}</td>
                <td>{l.salesCompany.replace("菱感电子商务（", "").replace("）有限公司", "")}</td>
                <td>
                  <MatchTag v={l.matchStatus} />
                </td>
                <td>{l.invoiceNo || "—"}</td>
                <td>{l.invoiceId ? <MatchTag v={s.invoiceStatus(l.invoiceId)} /> : "—"}</td>
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
        <Modal title="按行匹配进项发票" wide onClose={() => setOpenMatch(false)}>
          <p style={{ color: "#6b7785", marginTop: 0 }}>
            请对照下方采购行与发票明细的产品名称、型号、数量，以及发票备注（苏豪 Y2 / 三菱 SO）后再确认。确认后按型号+数量占用发票行并回写金额；发票明细全部匹配后自动打包一个金蝶采购单。
          </p>
          <div className="match-sub">本次勾选采购行</div>
          <div className="table-wrap" style={{ maxHeight: 140 }}>
            <table>
              <thead>
                <tr>
                  <th>采购送货单号</th>
                  <th>行号</th>
                  <th>产品名称</th>
                  <th>型号</th>
                  <th>数量</th>
                  <th>采购政策价</th>
                  <th>舜天发货单号</th>
                  <th>供应商订单号</th>
                </tr>
              </thead>
              <tbody>
                {selectedLines.map((l) => (
                  <tr key={l.id}>
                    <td>{l.cdnSn}</td>
                    <td>{l.lineNo}</td>
                    <td className="cell-wrap">{l.productName}</td>
                    <td>{l.model}</td>
                    <td>{l.qty}</td>
                    <td>{money(l.policyAmount)}</td>
                    <td>{l.stShipSn}</td>
                    <td>{l.supplierOrderNo || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="match-sub">进项发票</div>
          <div className="table-wrap" style={{ maxHeight: 220 }}>
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
                {!matchInvoices.length ? (
                  <tr>
                    <td colSpan={7} style={{ color: "#6b7785" }}>
                      没有可匹配的进项发票（全部匹配的发票已隐藏）
                    </td>
                  </tr>
                ) : (
                  [...matchInvoices]
                    .sort((a, b) => {
                      const ra = invoiceRecommend(a, selectedLines) ? 0 : 1;
                      const rb = invoiceRecommend(b, selectedLines) ? 0 : 1;
                      return ra - rb;
                    })
                    .map((inv) => {
                      const st = s.invoiceStatus(inv.id);
                      const rec = invoiceRecommend(inv, selectedLines);
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
                          <td className="cell-wrap">{inv.seller}</td>
                          <td>{inv.buyer.replace("菱感电子商务（", "").replace("）有限公司", "")}</td>
                          <td>{money(inv.totalIncl)}</td>
                          <td>
                            <MatchTag v={st} />
                          </td>
                          <td>{rec || "—"}</td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
          {(() => {
            const inv = matchInvoices.find((i) => i.id === pickInv);
            if (!inv) return <p style={{ color: "#6b7785" }}>请选择一张发票，核对备注与明细行后再确认。</p>;
            const keys = new Set(selectedLines.map((l) => `${l.model}|${l.qty}`));
            return (
              <>
                <div className="match-sub">所选发票明细行</div>
                <p style={{ color: "#6b7785", margin: "0 0 6px" }}>
                  开票金额即价税合计，已扣减费用金额。请对照采购政策价与开票金额、费用后再确认。
                </p>
                <div className="table-wrap" style={{ maxHeight: 180 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>货物或应税劳务名称</th>
                        <th>型号</th>
                        <th>数量</th>
                        <th>不含税</th>
                        <th>费用金额</th>
                        <th title="价税合计，已扣减费用金额">开票金额</th>
                        <th>已配采购行</th>
                        <th>与本次勾选</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.lines.map((il) => {
                        const pl = s.lines.find((l) => l.id === il.purchaseLineId);
                        const sameModelQty = keys.has(`${il.model}|${il.qty}`);
                        let vsSelected = "型号或数量不一致";
                        if (pl) vsSelected = "已配给其他采购行";
                        else if (sameModelQty) vsSelected = "一致，本次可配";
                        return (
                          <tr key={il.id}>
                            <td className="cell-wrap">{il.name}</td>
                            <td>{il.model}</td>
                            <td>{il.qty}</td>
                            <td>{money(il.amountExcl)}</td>
                            <td>{money(il.feeAmount)}</td>
                            <td>{money(il.amountIncl)}</td>
                            <td>{pl ? `${pl.cdnSn} 行${pl.lineNo}` : "未匹配"}</td>
                            <td>{vsSelected}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="match-sub">发票备注</div>
                <div className="memo-box">{inv.memo || "无备注"}</div>
              </>
            );
          })()}
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
