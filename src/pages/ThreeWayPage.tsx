import { useMemo, useState } from "react";
import { contains, groupByCdn, inboundView, inDateRange, invoiceMemos, matchStamp, opLogs, salesView } from "../display";
import { Field, Kv, MemoCell, ModuleTabs, OpLog, PaneNav } from "../formKit";
import { useStore } from "../store";
import { BinaryMatchTag, HeadPushTag, InvoicingTag, money } from "../ui";

export function ThreeWayPage() {
  const s = useStore();
  const [mode, setMode] = useState<"list" | "regular">("list");
  const [open, setOpen] = useState<string | null>(null);
  const [pane, setPane] = useState("基础信息");
  const [salesPush, setSalesPush] = useState<Record<string, "none" | "success">>({});
  const [q, setQ] = useState({
    customer: "",
    salesShip: "",
    salesOrder: "",
    source: "",
    supplier: "",
    match: "all",
    invoicing: "all",
    cdn: "",
    invoice: "",
    salesCompany: "",
    from: "",
    to: "",
    po: "all",
    ap: "all",
    sales: "all",
    orderType: "all",
  });

  const headers = useMemo(
    () => groupByCdn(s.lines.filter((x) => x.purchaseType === "随单采")),
    [s.lines],
  );
  const filtered = useMemo(() => {
    return headers.filter((h) => {
      const salesSt = salesPush[h.cdn] === "success" ? "success" : "none";
      if (!contains(h.first.customer, q.customer)) return false;
      if (!contains(h.first.salesShipSn, q.salesShip)) return false;
      if (!contains(h.first.salesOrderSn, q.salesOrder)) return false;
      if (!contains(h.first.shipSourceSn, q.source)) return false;
      if (!contains(h.first.supplier, q.supplier)) return false;
      if (q.match !== "all" && h.binaryMatch !== q.match) return false;
      if (q.invoicing !== "all" && h.invoicing !== q.invoicing) return false;
      if (!contains(h.cdn, q.cdn)) return false;
      if (q.invoice && !h.invs.some((n) => n.includes(q.invoice))) return false;
      if (!contains(h.first.salesCompany, q.salesCompany)) return false;
      const salesTime = s.salesOutLines.find((r) => r.salesShipSn === h.first.salesShipSn)?.shipTime;
      if (!inDateRange(salesTime || h.first.shipTime, q.from, q.to)) return false;
      if (q.po === "none" && h.poPush !== "none") return false;
      if (q.po === "success" && h.poPush !== "full") return false;
      if (q.po === "fail" && h.poPush === "full") return false;
      if (q.ap === "none" && h.apPush !== "none") return false;
      if (q.ap === "success" && h.apPush !== "full") return false;
      if (q.ap === "fail" && !h.lines.some((l) => l.apPushStatus === "exception")) return false;
      if (q.sales !== "all" && salesSt !== q.sales) return false;
      if (q.orderType !== "all" && (h.first.orderType || "标品订单") !== q.orderType) return false;
      return true;
    });
  }, [headers, q, s.salesOutLines, salesPush]);

  const detail = headers.find((h) => h.cdn === open);
  const salesRows = detail ? s.salesOutLines.filter((r) => r.salesShipSn === detail.first.salesShipSn) : [];
  const stamp = detail ? matchStamp(detail.lines) : { at: "—", by: "—" };
  const memo = detail ? invoiceMemos(detail.lines, s.invoices) : "—";
  const salesAmt = salesRows.reduce((a, b) => a + b.amount, 0);

  function view(cdn: string) {
    setOpen(cdn);
    setPane("基础信息");
    setMode("regular");
  }

  function pushSales(cdn?: string) {
    if (cdn) {
      setSalesPush({ ...salesPush, [cdn]: "success" });
      const h = headers.find((x) => x.cdn === cdn);
      s.notify(`${h?.first.salesShipSn || cdn} 销售单已推金蝶`, "ok");
      return;
    }
    const next = { ...salesPush };
    for (const h of headers) next[h.cdn] = "success";
    setSalesPush(next);
    s.notify("销售单已批量推金蝶（销售侧逻辑不变）", "ok");
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
            <button className="btn green" onClick={() => pushSales()}>
              销售单批量推金蝶
            </button>
          </div>
          <div className="hint">采购匹配/下推与「采购送货单推金蝶」相同：只读展示新模块数据。销售单据推金蝶仍在本页操作。</div>
          <div className="filters">
            <Field label="客户">
              <input value={q.customer} onChange={(e) => setQ({ ...q, customer: e.target.value })} />
            </Field>
            <Field label="销售发货单号">
              <input value={q.salesShip} onChange={(e) => setQ({ ...q, salesShip: e.target.value })} />
            </Field>
            <Field label="销售订单号">
              <input value={q.salesOrder} onChange={(e) => setQ({ ...q, salesOrder: e.target.value })} />
            </Field>
            <Field label="发货单来源单号">
              <input value={q.source} onChange={(e) => setQ({ ...q, source: e.target.value })} />
            </Field>
            <Field label="供应商">
              <input value={q.supplier} onChange={(e) => setQ({ ...q, supplier: e.target.value })} />
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
            <Field label="采购发货单号">
              <input value={q.cdn} onChange={(e) => setQ({ ...q, cdn: e.target.value })} />
            </Field>
            <Field label="采购发票号">
              <input value={q.invoice} onChange={(e) => setQ({ ...q, invoice: e.target.value })} />
            </Field>
            <Field label="销售公司">
              <input value={q.salesCompany} onChange={(e) => setQ({ ...q, salesCompany: e.target.value })} />
            </Field>
            <Field label="销售出库时间">
              <div style={{ display: "flex", gap: 6 }}>
                <input type="date" value={q.from} onChange={(e) => setQ({ ...q, from: e.target.value })} />
                <input type="date" value={q.to} onChange={(e) => setQ({ ...q, to: e.target.value })} />
              </div>
            </Field>
            <Field label="采购单推金蝶">
              <select value={q.po} onChange={(e) => setQ({ ...q, po: e.target.value })}>
                <option value="all">全部</option>
                <option value="none">未推送</option>
                <option value="success">推送成功</option>
                <option value="fail">推送失败</option>
              </select>
            </Field>
            <Field label="应付单推金蝶">
              <select value={q.ap} onChange={(e) => setQ({ ...q, ap: e.target.value })}>
                <option value="all">全部</option>
                <option value="none">未推送</option>
                <option value="success">推送成功</option>
                <option value="fail">推送失败</option>
              </select>
            </Field>
            <Field label="销售单推金蝶">
              <select value={q.sales} onChange={(e) => setQ({ ...q, sales: e.target.value })}>
                <option value="all">全部</option>
                <option value="none">未推送</option>
                <option value="success">推送成功</option>
                <option value="fail">推送失败</option>
              </select>
            </Field>
            <Field label="订单类型">
              <select value={q.orderType} onChange={(e) => setQ({ ...q, orderType: e.target.value })}>
                <option value="all">全部</option>
                <option value="标品订单">标品订单</option>
                <option value="赠品订单">赠品订单</option>
              </select>
            </Field>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>销售订单号</th>
                  <th>订单类型</th>
                  <th>销售发货单号</th>
                  <th>发货单来源单号</th>
                  <th>采购发货单号</th>
                  <th>销售发货时间</th>
                  <th>采购总金额</th>
                  <th>销售总金额</th>
                  <th>不含税开票金额</th>
                  <th>税额</th>
                  <th>含税开票金额</th>
                  <th>客户</th>
                  <th>客户编号</th>
                  <th>供应商</th>
                  <th>供应商编号</th>
                  <th>销售公司</th>
                  <th>采购发票号</th>
                  <th>开票状态</th>
                  <th>采购单推金蝶</th>
                  <th>应付单推金蝶</th>
                  <th>销售单推金蝶</th>
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
                  const srows = s.salesOutLines.filter((r) => r.salesShipSn === h.first.salesShipSn);
                  const shipTime = srows[0]?.shipTime || h.first.shipTime;
                  return (
                    <tr key={h.cdn}>
                      <td>{h.first.salesOrderSn}</td>
                      <td>{h.first.orderType}</td>
                      <td>{h.first.salesShipSn}</td>
                      <td>{h.first.shipSourceSn || "—"}</td>
                      <td>{h.cdn}</td>
                      <td>{shipTime}</td>
                      <td>{money(h.amount)}</td>
                      <td>{money(srows.reduce((a, b) => a + b.amount, 0) || undefined)}</td>
                      <td>{money(h.excl || undefined)}</td>
                      <td>{money(h.tax || undefined)}</td>
                      <td>{money(h.incl || undefined)}</td>
                      <td>{h.first.customer}</td>
                      <td>{h.first.customerCode}</td>
                      <td>{h.first.supplier}</td>
                      <td>{h.first.supplierCode}</td>
                      <td>{h.first.salesCompany}</td>
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
                      <td>{salesPush[h.cdn] === "success" ? "推送成功" : "未推送"}</td>
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
        <div className="empty-regular">请从列表点击「查看」打开以销定采推送金蝶详情</div>
      ) : (
        <div className="detail" style={{ paddingTop: 0 }}>
          <div className="toolbar" style={{ paddingLeft: 0 }}>
            <button className="btn ghost" onClick={() => setMode("list")}>
              返回列表
            </button>
            <span className="removed">采购单推金蝶</span>
            <span className="removed">应付单推金蝶</span>
            <button className="btn green" onClick={() => pushSales(detail.cdn)}>
              销售单推金蝶
            </button>
          </div>
          <PaneNav items={["基础信息", "采购入库明细", "销售发货明细", "操作日志"]} active={pane} onChange={setPane} />
          {pane === "基础信息" && (
            <div className="section">
              <h4>基础信息</h4>
              <Kv
                items={[
                  { label: "销售发货单号", value: detail.first.salesShipSn || "—" },
                  { label: "销售发货时间", value: salesRows[0]?.shipTime || detail.first.shipTime || "—" },
                  { label: "销售公司", value: detail.first.salesCompany },
                  { label: "客户", value: detail.first.customer || "—" },
                  { label: "客户编号", value: detail.first.customerCode || "—" },
                  { label: "采购单据推金蝶", value: <HeadPushTag v={detail.poPush} /> },
                  { label: "采购送货单号", value: detail.cdn },
                  { label: "关联发票号", value: detail.invs.join("、") || "—" },
                  { label: "开票状态", value: <InvoicingTag v={detail.invoicing} /> },
                  { label: "销售单据推金蝶", value: salesPush[detail.cdn] === "success" ? "推送成功" : "未推送" },
                  { label: "供应商", value: detail.first.supplier },
                  { label: "供应商编码", value: detail.first.supplierCode || "—" },
                  { label: "应付单据推金蝶", value: <HeadPushTag v={detail.apPush} /> },
                  { label: "匹配状态", value: <BinaryMatchTag v={detail.binaryMatch} /> },
                  { label: "匹配时间", value: stamp.at },
                  { label: "匹配人", value: stamp.by },
                  { label: "订单类型", value: detail.first.orderType || "标品订单" },
                  { label: "发票备注", value: memo },
                ]}
              />
            </div>
          )}
          {pane === "采购入库明细" && (
            <div className="section">
              <h4>采购入库明细</h4>
              <div className="table-wrap" style={{ maxHeight: "none" }}>
                <table>
                  <thead>
                    <tr>
                      <th>产品名称</th>
                      <th>产品编号</th>
                      <th>产品型号</th>
                      <th>采购总金额（政策价）</th>
                      <th>实际采购总价</th>
                      <th>开票金额（不含税）</th>
                      <th>税额</th>
                      <th>开票总金额（含税）</th>
                      <th>使用费用金额</th>
                      <th>开票单价（含税）</th>
                      <th>标准价（D价）</th>
                      <th>采购单价（政策价）</th>
                      <th>备注</th>
                      <th>实际采购单价</th>
                      <th>入库数量</th>
                      <th>退货数量</th>
                      <th>实际入库数量</th>
                      <th>仓库编码</th>
                      <th>仓库名称</th>
                      <th>入库时间</th>
                      <th>订单编号</th>
                      <th>批次号</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lines.map((l) => {
                      const r = inboundView(l);
                      return (
                        <tr key={l.id}>
                          <td>{r.productName}</td>
                          <td>{r.productCode}</td>
                          <td>{r.model}</td>
                          <td>{money(r.policyAmt)}</td>
                          <td>{money(r.actualAmt)}</td>
                          <td>{money(r.excl)}</td>
                          <td>{money(r.tax)}</td>
                          <td>{money(r.incl)}</td>
                          <td>{money(r.fee)}</td>
                          <td>{money(r.invoiceUnit)}</td>
                          <td>{money(r.dPrice)}</td>
                          <td>{money(r.policyUnit)}</td>
                          <td>{r.remark}</td>
                          <td>{money(r.actualUnit)}</td>
                          <td>{r.qty}</td>
                          <td>{r.ret}</td>
                          <td>{r.actualQty}</td>
                          <td>{r.warehouseCode}</td>
                          <td>{r.warehouseName}</td>
                          <td>{r.inboundTime}</td>
                          <td>{r.orderSn}</td>
                          <td>{r.batchNo}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {pane === "销售发货明细" && (
            <div className="section">
              <h4>销售发货明细</h4>
              <div className="table-wrap" style={{ maxHeight: "none" }}>
                <table>
                  <thead>
                    <tr>
                      <th>产品名称</th>
                      <th>产品编号</th>
                      <th>产品型号</th>
                      <th>发货数量</th>
                      <th>退货数量</th>
                      <th>实际发货数量</th>
                      <th>发货时间</th>
                      <th>销售费用金额</th>
                      <th>销售单价(政策价)</th>
                      <th>销售总金额(政策价)</th>
                      <th>销售单价(开票价)</th>
                      <th>销售总金额(开票价)</th>
                      <th>发货仓编码</th>
                      <th>发货仓名称</th>
                      <th>批次号</th>
                      <th>备注</th>
                      <th>销售订单号</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesRows.map((row) => {
                      const r = salesView(row, detail.first.salesOrderSn);
                      return (
                        <tr key={row.id}>
                          <td>{r.productName}</td>
                          <td>{r.productCode}</td>
                          <td>{r.model}</td>
                          <td>{r.shipQty}</td>
                          <td>{r.returnQty || "—"}</td>
                          <td>{r.actualQty}</td>
                          <td>{r.shipTime}</td>
                          <td>{money(r.feeAmount)}</td>
                          <td>{money(r.unitPrice)}</td>
                          <td>{money(r.amount)}</td>
                          <td>{money(r.invoiceUnitPrice)}</td>
                          <td>{money(r.invoiceAmount)}</td>
                          <td>{r.warehouseCode}</td>
                          <td>{r.warehouseName}</td>
                          <td>{r.batchNo}</td>
                          <td>{r.remark}</td>
                          <td>{r.salesOrderSn}</td>
                        </tr>
                      );
                    })}
                    {salesRows.length > 0 && (
                      <tr>
                        <td colSpan={7}>合计</td>
                        <td>{money(salesRows.reduce((a, b) => a + b.feeAmount, 0))}</td>
                        <td />
                        <td>{money(salesAmt)}</td>
                        <td />
                        <td>{money(salesRows.reduce((a, b) => a + (b.invoiceAmount ?? b.amount), 0))}</td>
                        <td colSpan={5} />
                      </tr>
                    )}
                    {salesRows.length === 0 && (
                      <tr>
                        <td colSpan={17} style={{ color: "#6b7785" }}>
                          暂无销售发货明细
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {pane === "操作日志" && (
            <div className="section">
              <h4>操作日志</h4>
              <OpLog
                rows={opLogs({
                  createdAt: detail.first.shipTime,
                  matchedAt: stamp.at === "—" ? undefined : stamp.at,
                  matchedBy: stamp.by,
                })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
