import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  BarChart2,
  Clock,
  Download,
  Plus,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  T,
  Panel,
  PanelHead,
  Ava,
  thStyle,
  tdStyle,
} from "./loanShared";
import { LoanSubNav } from "./LoanSubNav";
import { NewLoanApplicationDialog } from "@/components/loans/NewLoanApplicationDialog";
import { loansAPI } from "@/services/loans/loansAPI";

// ── Helpers ───────────────────────────────────────────────────────────────────

function text(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return fallback;
}

function formatCurrencyK(amount: number): string {
  if (amount >= 1_000_000) return `GH₵ ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `GH₵ ${(amount / 1_000).toFixed(1)}K`;
  return `GH₵ ${amount.toLocaleString("en-GH")}`;
}

function formatCurrencyFull(amount: number): string {
  return `GH₵ ${amount.toLocaleString("en-GH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "NA";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const COLORS = ["#0A2F6D", "#B45309", "#059669", "#7C3AED", "#DC2626", "#0891B2"];
function getColor(id: unknown): string {
  const num = typeof id === "number" ? id : parseInt(String(id), 10) || 0;
  return COLORS[Math.abs(num) % COLORS.length];
}

function extractLoans(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.pageItems)) return d.pageItems as Record<string, unknown>[];
    if (Array.isArray(d.content)) return d.content as Record<string, unknown>[];
    if (Array.isArray(d.data)) return d.data as Record<string, unknown>[];
  }
  return [];
}

function getStatusId(loan: Record<string, unknown>): number {
  const s = loan.status as Record<string, unknown> | undefined;
  return Number(s?.id ?? 0);
}

function getLoanStage(loan: Record<string, unknown>): string {
  const id = getStatusId(loan);
  if (id === 500) return "Rejected";
  if (id === 200) return "Approved";
  if (id === 300) return "To Disburse";
  return "Submitted";
}

interface RecentApp {
  id: string;
  clientName: string;
  initials: string;
  color: string;
  product: string;
  amount: string;
  stage: string;
}

function toRecentApp(loan: Record<string, unknown>): RecentApp {
  const id = text(loan.accountNo) || `LN-${text(loan.id)}`;
  const clientName = text(loan.clientName) || text(loan.clientDisplayName) || `Client #${text(loan.clientId)}`;
  const initials = getInitials(clientName);
  const color = getColor(loan.id);
  const product = text(loan.loanProductName) || "—";
  const principal = Number(loan.principal ?? 0);
  const amount = formatCurrencyFull(principal);
  const stage = getLoanStage(loan);
  return { id, clientName, initials, color, product, amount, stage };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoanOverviewPage() {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);

  const [allLoans, setAllLoans] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loansAPI
      .getApplications({ limit: 500, offset: 0 }, { _skipAuthRedirect: true })
      .then((res) => setAllLoans(extractLoans(res.data)))
      .catch(() => setAllLoans([]))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const activeLoans   = allLoans.filter((l) => getStatusId(l) === 300);
  const pendingDisb   = allLoans.filter((l) => getStatusId(l) === 200);
  const submittedLoans = allLoans.filter((l) => getStatusId(l) === 100);
  const approvedLoans  = allLoans.filter((l) => getStatusId(l) === 200);
  const rejectedLoans  = allLoans.filter((l) => getStatusId(l) === 500);

  const totalOutstanding = activeLoans.reduce((sum, l) => {
    const summary = l.summary as Record<string, unknown> | undefined;
    return sum + Number(summary?.principalOutstanding ?? l.principalOutstanding ?? 0);
  }, 0);

  const pendingAmount = pendingDisb.reduce(
    (sum, l) => sum + Number(l.approvedPrincipal ?? l.principal ?? 0),
    0
  );

  const recentApps = allLoans.slice(0, 5).map(toRecentApp);

  const pipeline = [
    { label: "Submitted",    color: T.muted,  count: submittedLoans.length, amount: formatCurrencyK(submittedLoans.reduce((s,l) => s + Number(l.principal ?? 0), 0)) },
    { label: "Under Review", color: T.blue,   count: 0,                     amount: "—" },
    { label: "Approved",     color: T.amber,  count: approvedLoans.length,  amount: formatCurrencyK(approvedLoans.reduce((s,l) => s + Number(l.approvedPrincipal ?? l.principal ?? 0), 0)) },
    { label: "To Disburse",  color: T.green,  count: pendingDisb.length,    amount: formatCurrencyK(pendingAmount) },
    { label: "Rejected",     color: T.red,    count: rejectedLoans.length,  amount: formatCurrencyK(rejectedLoans.reduce((s,l) => s + Number(l.principal ?? 0), 0)) },
  ];

  const stats = [
    {
      icon: <DollarSign style={{ width: 16, height: 16 }} />,
      iconBg: T.blueBg,
      iconColor: T.blue,
      label: "Active Loans",
      value: loading ? "…" : String(activeLoans.length),
      meta: loading ? "" : formatCurrencyK(totalOutstanding) + " out",
      metaColor: T.muted,
    },
    {
      icon: <Clock style={{ width: 16, height: 16 }} />,
      iconBg: T.amberBg,
      iconColor: T.amber,
      label: "Pending Disb.",
      value: loading ? "…" : String(pendingDisb.length),
      meta: loading ? "" : formatCurrencyK(pendingAmount),
      metaColor: T.muted,
    },
    {
      icon: <AlertTriangle style={{ width: 16, height: 16 }} />,
      iconBg: T.redBg,
      iconColor: T.red,
      label: "Submitted",
      value: loading ? "…" : String(submittedLoans.length),
      meta: "Awaiting review",
      metaColor: T.amber,
    },
    {
      icon: <TrendingUp style={{ width: 16, height: 16 }} />,
      iconBg: T.purpleBg,
      iconColor: T.purple,
      label: "Total Applications",
      value: loading ? "…" : String(allLoans.length),
      meta: `${rejectedLoans.length} rejected`,
      metaColor: T.muted,
    },
    {
      icon: <BarChart2 style={{ width: 16, height: 16 }} />,
      iconBg: T.greenBg,
      iconColor: T.green,
      label: "Approved",
      value: loading ? "…" : String(approvedLoans.length),
      meta: "Ready to disburse",
      metaColor: T.green,
    },
  ];

  const aging = [
    { label: "1–30 days", amount: "GH₵ 248K", pct: 62, color: T.amber },
    { label: "31–60 days", amount: "GH₵ 190K", pct: 46, color: "#E07B39" },
    { label: "61–90 days", amount: "GH₵ 102K", pct: 28, color: T.red },
    { label: "90+ days", amount: "GH₵ 72K", pct: 18, color: "#9B1C1C" },
  ];

  return (
    <div
      style={{
        padding: "0px 28px",
        minHeight: "100%",
        background: T.pageBg,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <LoanSubNav />

      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: T.muted,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          LOAN MANAGEMENT
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: T.ink,
              margin: 0,
              fontFamily: "'Sora', sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            Overview
          </h1>
          <div style={{ display: "flex", gap: 9 }}>
            <Button variant="outline" style={{ fontSize: 13 }}>
              <Download style={{ width: 14, height: 14 }} />
              Export
            </Button>
            <Button
              style={{ background: T.navy, fontSize: 13 }}
              onClick={() => setShowDialog(true)}
            >
              <Plus style={{ width: 14, height: 14 }} />
              New Application
            </Button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5,1fr)",
            gap: 14,
          }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: T.cardBg,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: "16px",
                boxShadow: "0 1px 3px rgba(16,33,73,.04)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: s.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: s.iconColor,
                }}
              >
                {s.icon}
              </div>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: T.ink, fontFamily: "'Sora',sans-serif", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: s.metaColor, fontFamily: "'DM Sans',sans-serif" }}>{s.meta}</div>
            </div>
          ))}
        </div>

        {/* Pipeline */}
        <Panel>
          <PanelHead
            title="Application Pipeline"
            action={
              <button
                onClick={() => navigate("/loans/applications")}
                style={{ background: "none", border: "none", color: T.blue, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
              >
                View board →
              </button>
            }
          />
          <div style={{ display: "flex", gap: 10, padding: "16px 20px", flexWrap: "wrap" }}>
            {pipeline.map((p) => (
              <div key={p.label} style={{ flex: 1, minWidth: 100, border: `1px solid ${T.border}`, borderRadius: 11, padding: 14 }}>
                <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans',sans-serif" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, display: "inline-block", flexShrink: 0 }} />
                  {p.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, marginTop: 7, color: T.ink, fontFamily: "'Sora',sans-serif" }}>
                  {loading ? "…" : p.count}
                </div>
                <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>
                  {loading ? "" : p.amount}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Recent Apps + Arrears Aging */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
          <Panel>
            <PanelHead
              title="Recent Applications"
              action={
                <button
                  onClick={() => navigate("/loans/applications")}
                  style={{ background: "none", border: "none", color: T.blue, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
                >
                  See all →
                </button>
              }
            />
            {loading ? (
              <div style={{ padding: 30, textAlign: "center", color: T.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>Loading…</div>
            ) : recentApps.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: T.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>No applications yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>{["Applicant", "Product", "Amount", "Status"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {recentApps.map((a) => (
                    <tr key={a.id}>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Ava initials={a.initials} color={a.color} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{a.clientName}</div>
                            <div style={{ fontSize: 11, color: T.muted }}>{a.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>{a.product}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{a.amount}</td>
                      <td style={tdStyle}><StatusBadge status={a.stage} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel>
            <PanelHead
              title="Arrears Aging"
              action={
                <button
                  onClick={() => navigate("/loans/arrears")}
                  style={{ background: "none", border: "none", color: T.blue, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
                >
                  PAR report →
                </button>
              }
            />
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {aging.map((a) => (
                <div key={a.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
                    <span style={{ color: T.ink }}>{a.label}</span>
                    <span style={{ color: T.muted }}>{a.amount}</span>
                  </div>
                  <div style={{ height: 7, background: "#EEF1F6", borderRadius: 20, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${a.pct}%`, background: a.color, borderRadius: 20 }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <NewLoanApplicationDialog open={showDialog} onOpenChange={setShowDialog} />
    </div>
  );
}
