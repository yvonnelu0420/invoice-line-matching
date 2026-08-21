import { useMemo, useState } from "react";
import { contains, inDateRange, occupiedCdns, opLogs } from "../display";
import { Field, Kv, MemoCell, ModuleTabs, OpLog, PaneNav } from "../formKit";
import { useStore } from "../store";
import { MatchTag, money } from "../ui";

export function InvoicePage() {
  const s = useStore();
  const [mode, setMode] = useState<"list" | "regular">("list");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pane, setPane] = useState("基础信息");
  const [q, setQ] = useState({
    match: "all",
    dateFrom: "",
    dateTo: "",
    seller: "",
    no: "",
    status: "all",
    positive: "all",
  });
  const inv = s.invoices.find((i) => i.id === openId);

  const rows = useMemo(() => {
    return s.invoices.filter((i) => {
      const st = s.invoiceStatus(i.id);
      if (q.match === "unmatched" && st !== "unmatched") return false;
      if (q.match === "matched" && st === "unmatched") return false;
      if (q.match === "partial" && st !== "partial") return false;
      if (q.match === "full" && st !== "full") return false;
      if (!inDateRange(i.invoiceDate, q.dateFrom, q.dateTo)) return false;
      if (!contains(i.seller, q.seller)) return false;
      if (q.no && !contains(i.digitalNo, q.no) && !contains(i.paperNo, q.no)) return false;
      if (q.status !== "all" && (i.invoiceStatus || "正常") !== q.status) return false;
      if (q.positive === "yes" && i.isPositive === false) return false;
      if (q.positive === "no" && i.isPositive !== false) return false;
      return true;
    });
  }, [s, q]);

  function open(id: string) {
    setOpenId(id);
    setPane("基础信息");
    setMode("regular");
  }

  return (
    <div className="panel">
      <ModuleTabs mode={mode} onMode={setMode} />
      {mode === "list" ? (
        <>
          <div className="toolbar">
            <button className="btn ghost">列表导出</button>
            <button className="btn">数电发票导入</button>
            <button className="btn ghost">批量删除</button>
            <span style={{ color: "#6b7785" }}>匹配与解绑请到「采购明细发票匹配」操作。</span>
          </div>
          <div className="filters">
            <Field label="匹配状态">
              <select value={q.match} onChange={(e) => setQ({ ...q, match: e.target.value })}>
                <option value="all">全部</option>
                <option value="unmatched">未匹配</option>
                <option value="matched">已匹配</option>
                <option value="partial">部分匹配</option>
                <option value="full">全部匹配</option>
              </select>
            </Field>
            <Field label="开票日期">
              <div style={{ display: "flex", gap: 6 }}>
                <input type="date" value={q.dateFrom} onChange={(e) => setQ({ ...q, dateFrom: e.target.value })} />
                <input type="date" value={q.dateTo} onChange={(e) => setQ({ ...q, dateTo: e.target.value })} />
              </div>
            </Field>
            <Field label="销方名称">
              <input value={q.seller} onChange={(e) => setQ({ ...q, seller: e.target.value })} />
            </Field>
            <Field label="发票号">
              <input value={q.no} onChange={(e) => setQ({ ...q, no: e.target.value })} />
            </Field>
            <Field label="发票状态">
              <select value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value })}>
                <option value="all">全部</option>
                <option value="正常">正常</option>
                <option value="已红冲">已红冲</option>
              </select>
            </Field>
            <Field label="是否正数发票">
              <select value={q.positive} onChange={(e) => setQ({ ...q, positive: e.target.value })}>
                <option value="all">全部</option>
                <option value="yes">是</option>
                <option value="no">否</option>
              </select>
            </Field>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>发票代码</th>
                  <th>发票号码</th>
                  <th>数电发票号码</th>
                  <th>销方识别号</th>
                  <th>销方名称</th>
                  <th>购方识别号</th>
                  <th>购买方名称</th>
                  <th>开票日期</th>
                  <th>不含税金额</th>
                  <th>税额</th>
                  <th>价税合计</th>
                  <th>发票票种</th>
                  <th>发票状态</th>
                  <th>匹配状态</th>
                  <th>采购签收单号</th>
                  <th>是否正数发票</th>
                  <th>备注</th>
                  <th>创建人</th>
                  <th>创建日期</th>
                  <th>更新人</th>
                  <th>更新时间</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id}>
                    <td>{i.invoiceCode || "—"}</td>
                    <td>{i.paperNo}</td>
                    <td>{i.digitalNo}</td>
                    <td>{i.sellerTaxNo}</td>
                    <td>{i.seller}</td>
                    <td>{i.buyerTaxNo}</td>
                    <td>{i.buyer}</td>
                    <td>{i.invoiceDate}</td>
                    <td>{money(i.amountExcl)}</td>
                    <td>{money(i.tax)}</td>
                    <td>{money(i.totalIncl)}</td>
                    <td>{i.invoiceKind}</td>
                    <td>{i.invoiceStatus}</td>
                    <td>
                      <MatchTag v={s.invoiceStatus(i.id)} />
                    </td>
                    <td>{occupiedCdns(i, s.lines).join("、") || "—"}</td>
                    <td>{i.isPositive === false ? "否" : "是"}</td>
                    <MemoCell text={i.memo} />
                    <td>{i.createdBy}</td>
                    <td>{i.createdAt}</td>
                    <td>{i.updatedBy}</td>
                    <td>{i.updatedAt}</td>
                    <td>
                      <button className="btn ghost" onClick={() => open(i.id)}>
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : !inv ? (
        <div className="empty-regular">请从列表点击「查看」打开进项发票详情</div>
      ) : (
        <div className="detail" style={{ paddingTop: 0 }}>
          <div className="toolbar" style={{ paddingLeft: 0 }}>
            <button className="btn ghost" onClick={() => setMode("list")}>
              返回列表
            </button>
          </div>
          <PaneNav items={["基础信息", "发票明细", "操作日志"]} active={pane} onChange={setPane} />
          {pane === "基础信息" && (
            <div className="section">
              <h4>基础信息</h4>
              <Kv
                items={[
                  { label: "发票代码", value: inv.invoiceCode || "—" },
                  { label: "发票号码", value: inv.paperNo || "—" },
                  { label: "数电发票号码", value: inv.digitalNo },
                  { label: "销方识别号", value: inv.sellerTaxNo || "—" },
                  { label: "销方名称", value: inv.seller },
                  { label: "购方识别号", value: inv.buyerTaxNo || "—" },
                  { label: "购买方名称", value: inv.buyer },
                  { label: "开票日期", value: inv.invoiceDate || "—" },
                  { label: "不含税金额", value: money(inv.amountExcl) },
                  { label: "税额", value: money(inv.tax) },
                  { label: "价税合计", value: money(inv.totalIncl) },
                  { label: "发票票种", value: inv.invoiceKind || "—" },
                  { label: "发票状态", value: inv.invoiceStatus || "正常" },
                  { label: "是否正数发票", value: inv.isPositive === false ? "否" : "是" },
                  { label: "采购签收单号", value: occupiedCdns(inv, s.lines).join("、") || "—" },
                  { label: "匹配状态", value: <MatchTag v={s.invoiceStatus(inv.id)} /> },
                  { label: "创建人", value: inv.createdBy || "—" },
                  { label: "创建时间", value: inv.createdAt || "—" },
                  { label: "更新人", value: inv.updatedBy || "—" },
                  { label: "更新时间", value: inv.updatedAt || "—" },
                  { label: "备注", value: inv.memo || "—" },
                ]}
              />
            </div>
          )}
          {pane === "发票明细" && (
            <div className="section">
              <h4>发票明细</h4>
              <div className="table-wrap" style={{ maxHeight: "none" }}>
                <table>
                  <thead>
                    <tr>
                      <th>税收分类编码</th>
                      <th>货物或应税劳务名称</th>
                      <th>规格型号</th>
                      <th>产品名字</th>
                      <th>产品编码</th>
                      <th>单位</th>
                      <th>数量</th>
                      <th>单价（不含税）</th>
                      <th>金额（不含税）</th>
                      <th>税率（%）</th>
                      <th>税额</th>
                      <th>价税合计</th>
                      <th>费用金额</th>
                      <th>费用税额</th>
                      <th>费用价税合计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inv.lines.map((il) => (
                      <tr key={il.id}>
                        <td>{il.taxCode}</td>
                        <td>{il.name}</td>
                        <td>{il.model}</td>
                        <td>{il.productName || il.name}</td>
                        <td>{il.productCode || "—"}</td>
                        <td>{il.unit || "台"}</td>
                        <td>{il.qty}</td>
                        <td>{money(il.unitPriceExcl)}</td>
                        <td>{money(il.amountExcl)}</td>
                        <td>{il.taxRate ?? 13}</td>
                        <td>{money(il.tax)}</td>
                        <td>{money(il.amountIncl)}</td>
                        <td>{money(il.feeAmount)}</td>
                        <td>{money(il.feeTax)}</td>
                        <td>{money(il.feeIncl ?? il.feeAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {pane === "操作日志" && (
            <div className="section">
              <h4>操作日志</h4>
              <OpLog rows={opLogs({ createdAt: inv.createdAt, extra: "导入数电发票" })} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
