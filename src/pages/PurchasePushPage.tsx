import { useMemo, useState } from "react";
import { contains, groupByCdn, inboundView, inDateRange, invoiceMemos, matchStamp, opLogs } from "../display";
import { Field, Kv, MemoCell, ModuleTabs, OpLog, PaneNav } from "../formKit";
import { useStore } from "../store";
import { BinaryMatchTag, HeadPushTag, InvoicingTag, money } from "../ui";

export function PurchasePushPage() {
  const s = useStore();
  const [mode, setMode] = useState<"list" | "regular">("list");
  const [open, setOpen] = useState<string | null>(null);
  const [pane, setPane] = useState("基础信息");
  const [q, setQ] = useState({
    cdn: "",
    order: "",
    type: "all",
    match: "all",
    invoicing: "all",
    st: "",
    invoice: "",
    from: "",
    to: "",
    po: "all",
    ap: "all",
  });

  const headers = useMemo(() => groupByCdn(s.lines), [s.lines]);
  const filtered = useMemo(() => {
    return headers.filter((h) => {
      if (!contains(h.cdn, q.cdn)) return false;
      if (!contains(h.first.orderSn, q.order)) return false;
      if (q.type !== "all" && h.first.purchaseType !== q.type) return false;
      if (q.match !== "all" && h.binaryMatch !== q.match) return false;
      if (q.invoicing !== "all" && h.invoicing !== q.invoicing) return false;
      if (!contains(h.first.stShipSn, q.st)) return false;
      if (q.invoice && !h.invs.some((n) => n.includes(q.invoice))) return false;
      if (!inDateRange(h.first.shipTime, q.from, q.to)) return false;
      if (q.po === "none" && h.poPush !== "none") return false;
      if (q.po === "success" && h.poPush !== "full") return false;
      if (q.po === "fail" && h.poPush === "full") return false;
      if (q.ap === "none" && h.apPush !== "none") return false;
      if (q.ap === "success" && h.apPush !== "full") return false;
      if (q.ap === "fail" && !h.lines.some((l) => l.apPushStatus === "exception")) return false;
      return true;
    });
  }, [headers, q]);
  const detail = headers.find((h) => h.cdn === open);
  const stamp = detail ? matchStamp(detail.lines) : { at: "—", by: "—" };
  const memo = detail ? invoiceMemos(detail.lines, s.invoices) : "—";

  function view(cdn: string) {
    setOpen(cdn);
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
            <span className="removed">采购单批量推金蝶</span>
            <span className="removed">应付单批量推金蝶</span>
            <span style={{ color: "#6b7785" }}>本页只读展示「采购明细发票匹配」结果，不再做发票关联/解绑，也不再下推采购单和应付单。</span>
          </div>
          <div className="filters">
            <Field label="采购发货单号">
              <input value={q.cdn} onChange={(e) => setQ({ ...q, cdn: e.target.value })} />
            </Field>
            <Field label="采购订单号">
              <input value={q.order} onChange={(e) => setQ({ ...q, order: e.target.value })} />
            </Field>
            <Field label="采购类型">
              <select value={q.type} onChange={(e) => setQ({ ...q, type: e.target.value })}>
                <option value="all">全部</option>
                <option value="直采">直采</option>
                <option value="随单采">随单采</option>
              </select>
            </Field>
            <Field label="匹配状态">
              <select value={q.match} onChange={(e) => setQ({ ...q, match: e.target.value })}>
                <option value="all">全部</option>
                <option value="unmatched">未匹配</option>
                <option value="matched">已匹配</option>
              </select>
            </Field>
            <Field label="开票状态">
              <select value={q.invoicing} onChange={(e) => setQ({ ...q, invoicing: e.target.value })}>
                <option value="all">全部</option>
                <option value="未开票">未开票</option>
                <option value="已开票">已开票</option>
                <option value="开票红冲">开票红冲</option>
                <option value="开票退货">开票退货</option>
              </select>
            </Field>
            <Field label="舜天发货单号">
              <input value={q.st} onChange={(e) => setQ({ ...q, st: e.target.value })} />
            </Field>
            <Field label="关联发票号">
              <input value={q.invoice} onChange={(e) => setQ({ ...q, invoice: e.target.value })} />
            </Field>
            <Field label="采购发货时间">
              <div style={{ display: "flex", gap: 6 }}>
                <input type="date" value={q.from} onChange={(e) => setQ({ ...q, from: e.target.value })} />
                <input type="date" value={q.to} onChange={(e) => setQ({ ...q, to: e.target.value })} />
              </div>
            </Field>
            <Field label="采购单推金蝶状态">
              <select value={q.po} onChange={(e) => setQ({ ...q, po: e.target.value })}>
                <option value="all">全部</option>
                <option value="none">未推送</option>
                <option value="success">推送成功</option>
                <option value="fail">推送失败</option>
              </select>
            </Field>
            <Field label="应付单推金蝶状态">
              <select value={q.ap} onChange={(e) => setQ({ ...q, ap: e.target.value })}>
                <option value="all">全部</option>
                <option value="none">未推送</option>
                <option value="success">推送成功</option>
                <option value="fail">推送失败</option>
              </select>
            </Field>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>采购发货单号</th>
                  <th>采购订单号</th>
                  <th>采购发货时间</th>
                  <th>采购类型</th>
                  <th>供应商</th>
                  <th>供应商编号</th>
                  <th>销售公司</th>
                  <th>单据金额</th>
                  <th>舜天发货单号</th>
                  <th>关联发票号</th>
                  <th>开票状态</th>
                  <th>采购单推金蝶状态</th>
                  <th>应付单推金蝶状态</th>
                  <th>匹配状态</th>
                  <th>匹配时间</th>
                  <th>匹配人</th>
                  <th>发票备注</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => {
                  const ms = matchStamp(h.lines);
                  return (
                    <tr key={h.cdn}>
                      <td>{h.cdn}</td>
                      <td>{h.first.orderSn}</td>
                      <td>{h.first.shipTime}</td>
                      <td>{h.first.purchaseType}</td>
                      <td>{h.first.supplier}</td>
                      <td>{h.first.supplierCode}</td>
                      <td>{h.first.salesCompany}</td>
                      <td>{money(h.amount)}</td>
                      <td>{h.first.stShipSn}</td>
                      <td>{h.invs.join("、") || "—"}</td>
                      <td>
                        <InvoicingTag v={h.invoicing} />
                      </td>
                      <td>
                        <HeadPushTag v={h.poPush} />
                      </td>
                      <td>
                        <HeadPushTag v={h.apPush} />
                      </td>
                      <td>
                        <BinaryMatchTag v={h.binaryMatch} />
                      </td>
                      <td>{ms.at}</td>
                      <td>{ms.by}</td>
                      <MemoCell text={invoiceMemos(h.lines, s.invoices)} />
                      <td>
                        <button className="btn ghost" onClick={() => view(h.cdn)}>
                          查看
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : !detail ? (
        <div className="empty-regular">请从列表点击「查看」打开囤货采推送金蝶详情</div>
      ) : (
        <div className="detail" style={{ paddingTop: 0 }}>
          <div className="toolbar" style={{ paddingLeft: 0 }}>
            <button className="btn ghost" onClick={() => setMode("list")}>
              返回列表
            </button>
            <span className="removed">应付单推送金蝶</span>
            <span className="removed">采购单推送金蝶</span>
          </div>
          <PaneNav items={["基础信息", "采购入库明细", "操作日志"]} active={pane} onChange={setPane} />
          {pane === "基础信息" && (
            <div className="section">
              <h4>基础信息</h4>
              <Kv
                items={[
                  { label: "采购送货单号", value: detail.cdn },
                  { label: "采购类型", value: detail.first.purchaseType },
                  { label: "采购签收时间", value: detail.first.shipTime || "—" },
                  { label: "采购单据推金蝶", value: <HeadPushTag v={detail.poPush} /> },
                  { label: "供应商", value: detail.first.supplier },
                  { label: "供应商编码", value: detail.first.supplierCode || "—" },
                  { label: "应付单据推金蝶", value: <HeadPushTag v={detail.apPush} /> },
                  { label: "销售公司", value: detail.first.salesCompany },
                  { label: "舜天发货单号", value: detail.first.stShipSn || "—" },
                  { label: "关联发票号", value: detail.invs.join("、") || "—" },
                  { label: "开票状态", value: <InvoicingTag v={detail.invoicing} /> },
                  { label: "单据金额", value: money(detail.amount) },
                  { label: "匹配状态", value: <BinaryMatchTag v={detail.binaryMatch} /> },
                  { label: "匹配时间", value: stamp.at },
                  { label: "匹配人", value: stamp.by },
                  { label: "发票备注", value: memo },
                ]}
              />
            </div>
          )}
          {pane === "采购入库明细" && (
            <div className="section">
              <h4>采购入库明细</h4>
              <InboundTable lines={detail.lines} />
            </div>
          )}
          {pane === "操作日志" && (
            <div className="section">
              <h4>操作日志</h4>
              <OpLog rows={opLogs({ createdAt: detail.first.shipTime, matchedAt: stamp.at === "—" ? undefined : stamp.at, matchedBy: stamp.by })} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InboundTable({ lines }: { lines: ReturnType<typeof groupByCdn>[0]["lines"] }) {
  return (
    <div className="table-wrap" style={{ maxHeight: "none" }}>
      <table>
        <thead>
          <tr>
            <th>产品名称</th>
            <th>产品编号</th>
            <th>产品型号</th>
            <th>采购总金额（政策价）</th>
            <th>开票金额（不含税）</th>
            <th>税额</th>
            <th>开票总金额（含税）</th>
            <th>使用费用金额</th>
            <th>实际采购总价</th>
            <th>采购单价（政策价）</th>
            <th>开票单价（含税）</th>
            <th>标准价（D价）</th>
            <th>入库数量</th>
            <th>退货数量</th>
            <th>实际入库数量</th>
            <th>实际采购单价</th>
            <th>仓库编码</th>
            <th>仓库名称</th>
            <th>入库时间</th>
            <th>备注</th>
            <th>采购订单号</th>
            <th>采购送货单号</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => {
            const r = inboundView(l);
            return (
              <tr key={l.id}>
                <td>{r.productName}</td>
                <td>{r.productCode}</td>
                <td>{r.model}</td>
                <td>{money(r.policyAmt)}</td>
                <td>{money(r.excl)}</td>
                <td>{money(r.tax)}</td>
                <td>{money(r.incl)}</td>
                <td>{money(r.fee)}</td>
                <td>{money(r.actualAmt)}</td>
                <td>{money(r.policyUnit)}</td>
                <td>{money(r.invoiceUnit)}</td>
                <td>{money(r.dPrice)}</td>
                <td>{r.qty}</td>
                <td>{r.ret}</td>
                <td>{r.actualQty}</td>
                <td>{money(r.actualUnit)}</td>
                <td>{r.warehouseCode}</td>
                <td>{r.warehouseName}</td>
                <td>{r.inboundTime}</td>
                <td>{r.remark}</td>
                <td>{r.orderSn}</td>
                <td>{r.cdnSn}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
