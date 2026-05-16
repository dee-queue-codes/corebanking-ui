import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  ChevronDown,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES } from "@/router/routes";
import { clientsAPI } from "@/services/clients/clientsAPI";

interface ClientRow {
  id: string;
  name: string;
  clientNumber: string;
  externalId: string;
  status: "Active" | "Pending";
  officeName: string;
  mobileNumber: string;
  email: string;
  activationDate: string;
  staff: boolean;
}

type ApiClient = Record<string, unknown>;

function getString(value: unknown, fallback = "") {
  if (typeof value === "number") return String(value);
  return typeof value === "string" ? value : fallback;
}

function getBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function getNestedName(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return getString(record.name);
  }
  return "";
}

function getClientName(client: ApiClient) {
  const displayName = getString(client.displayName) || getString(client.name);
  if (displayName) return displayName;

  const firstName = getString(client.firstName);
  const middleName = getString(client.middleName);
  const lastName = getString(client.lastName);
  return [firstName, middleName, lastName].filter(Boolean).join(" ") || "Unnamed Client";
}

function getClientStatus(client: ApiClient): ClientRow["status"] {
  const raw = getString(client.status) || getNestedName(client.status);
  return raw.toLowerCase() === "active" ? "Active" : "Pending";
}

function formatDate(value: unknown) {
  if (!value) return "";
  if (Array.isArray(value)) {
    const [year, month, day] = value as number[];
    if (year && month && day) {
      return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
  }
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
    return value;
  }
  return "";
}

function extractClients(response: unknown): ApiClient[] {
  if (Array.isArray(response)) return response as ApiClient[];
  if (!response || typeof response !== "object") return [];

  const record = response as Record<string, unknown>;
  if (Array.isArray(record.content)) return record.content as ApiClient[];
  if (Array.isArray(record.data)) return record.data as ApiClient[];

  if (record.data && typeof record.data === "object") {
    const data = record.data as Record<string, unknown>;
    if (Array.isArray(data.content)) return data.content as ApiClient[];
    if (Array.isArray(data.clients)) return data.clients as ApiClient[];
    if (Array.isArray(data.items)) return data.items as ApiClient[];
  }

  return [];
}

function mapClient(client: ApiClient): ClientRow {
  const id = getString(client.id) || getString(client.clientId);
  const clientNumber =
    getString(client.clientNumber) ||
    getString(client.accountNo) ||
    getString(client.accountNumber) ||
    id;

  return {
    id,
    name: getClientName(client),
    clientNumber,
    externalId: getString(client.externalId) || "-",
    status: getClientStatus(client),
    officeName:
      getString(client.officeName) ||
      getNestedName(client.office) ||
      getNestedName(client.officeId) ||
      "-",
    mobileNumber:
      getString(client.mobileNumber) ||
      getString(client.phoneNumber) ||
      getString(client.phone) ||
      "-",
    email: getString(client.email) || "-",
    activationDate:
      formatDate(client.activationDate) ||
      formatDate(client.activatedOnDate) ||
      formatDate(client.createdAt) ||
      "-",
    staff: getBoolean(client.staff) || getBoolean(client.isStaff),
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

export default function ClientsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') ?? '');
  const [selectedStatus, setSelectedStatus] = useState<
    "All" | "Active" | "Pending"
  >("All");
  const [statusOpen, setStatusOpen] = useState(false);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node))
        setStatusOpen(false);
    };
    if (statusOpen) document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [statusOpen]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (openMenu) {
        const ref = menuRefs.current[openMenu];
        if (ref && !ref.contains(e.target as Node)) setOpenMenu(null);
      }
    };
    if (openMenu) document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [openMenu]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    clientsAPI
      .getAll()
      .then((res) => {
        if (cancelled) return;
        const rows = extractClients(res.data)
          .map(mapClient)
          .filter((client) => client.id);
        setClients(rows);
      })
      .catch(() => {
        if (cancelled) return;
        setClients([]);
        setError("Failed to load clients");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const filtered = clients.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.clientNumber.includes(q) ||
      c.externalId.toLowerCase().includes(q) ||
      c.officeName.toLowerCase().includes(q);
    const matchStatus = selectedStatus === "All" || c.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 when filter changes
  useEffect(() => { setCurrentPage(1) }, [searchQuery, selectedStatus]);

  const handleView = (id: string) => {
    navigate(ROUTES.CLIENTS.DETAIL.replace(":clientId", id));
    setOpenMenu(null);
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this client?")) return;

    try {
      await clientsAPI.delete(id);
      setClients((p) => p.filter((c) => c.id !== id));
      setOpenMenu(null);
    } catch {
      setError("Failed to delete client");
    }
  };

  const activeCount = clients.filter((c) => c.status === "Active").length;
  const pendingCount = clients.filter((c) => c.status === "Pending").length;

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#EEF2F8",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        .cp, .cp * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        .sora { font-family: 'Sora', sans-serif !important; }
        .mono  { font-family: 'DM Mono', monospace !important; }
      `}</style>

      <div className="cp" style={{ padding: "24px 24px 40px" }}>
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #001844 0%, #002663 60%, #1a4080 100%)",
            borderRadius: 16,
            overflow: "hidden",
            position: "relative",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              height: 3,
              background: "linear-gradient(90deg, #C9A84C, #E8C96A, #C9A84C)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              top: 3,
              pointerEvents: "none",
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />
          <div style={{ padding: "28px 32px 0", position: "relative" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(201,168,76,0.9)",
                    marginBottom: 6,
                  }}
                >
                  Chelsea Bank
                </p>
                <h1
                  className="sora"
                  style={{
                    margin: 0,
                    fontSize: 26,
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  Clients
                </h1>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    fontWeight: 400,
                  }}
                >
                  Manage and view all registered clients
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                <button
                  onClick={() => navigate(ROUTES.CLIENTS.ADD)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "8px 18px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#fff",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.5)",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.8)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
                  }}
                >
                  <Plus style={{ width: 13, height: 13  }} />
                  Create Client
                </button>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {[
                {
                  label: "Total Clients",
                  value: clients.length,
                  sub: "All registered",
                },
                {
                  label: "Active",
                  value: activeCount,
                  sub: "Currently active",
                },
                {
                  label: "Pending",
                  value: pendingCount,
                  sub: "Awaiting approval",
                },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  style={{
                    flex: 1,
                    padding: "18px 24px",
                    borderRight:
                      i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.09em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    {stat.label}
                  </p>
                  <p
                    className="sora"
                    style={{
                      margin: "0 0 2px",
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.45)",
                    }}
                  >
                    {stat.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Controls ─────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ position: "relative", width: 280 }}>
            <Search
              style={{
                position: "absolute",
                left: 11,
                top: "50%",
                transform: "translateY(-50%)",
                width: 14,
                height: 14,
                color: "#8A9ABB",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search by name, ID, office..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                fontSize: 13,
                color: "#0D1B3E",
                background: "#fff",
                border: "1px solid #DDE4EF",
                borderRadius: 8,
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#002663")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#DDE4EF")}
            />
          </div>
          <div style={{ position: "relative" }} ref={statusRef}>
            <button
              onClick={() => setStatusOpen((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 12px",
                fontSize: 13,
                color: selectedStatus === "All" ? "#8A9ABB" : "#0D1B3E",
                background: "#fff",
                border: `1px solid ${statusOpen ? "#002663" : "#DDE4EF"}`,
                borderRadius: 8,
                cursor: "pointer",
                minWidth: 124,
                transition: "border-color 0.15s",
              }}
            >
              {selectedStatus !== "All" && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background:
                      selectedStatus === "Active" ? "#059669" : "#D97706",
                    flexShrink: 0,
                  }}
                />
              )}
              <span style={{ flex: 1, textAlign: "left" }}>
                {selectedStatus === "All" ? "Status" : selectedStatus}
              </span>
              <ChevronDown
                style={{
                  width: 13,
                  height: 13,
                  color: "#8A9ABB",
                  transition: "transform 0.15s",
                  transform: statusOpen ? "rotate(180deg)" : "none",
                  flexShrink: 0,
                }}
              />
            </button>
            {statusOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  zIndex: 30,
                  background: "#fff",
                  border: "1px solid #DDE4EF",
                  borderRadius: 8,
                  boxShadow: "0 4px 20px rgba(0,38,99,0.10)",
                  overflow: "hidden",
                  minWidth: 140,
                }}
              >
                {(["All", "Active", "Pending"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSelectedStatus(s);
                      setStatusOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 13px",
                      border: "none",
                      fontSize: 13,
                      fontWeight: selectedStatus === s ? 600 : 400,
                      color: selectedStatus === s ? "#002663" : "#4A5878",
                      background:
                        selectedStatus === s ? "#EEF3FF" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedStatus !== s)
                        e.currentTarget.style.background = "#F5F8FE";
                    }}
                    onMouseLeave={(e) => {
                      if (selectedStatus !== s)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {s !== "All" && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: s === "Active" ? "#059669" : "#D97706",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    {s === "All" ? "All Statuses" : s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #DDE4EF",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <p
              style={{
                padding: "48px",
                textAlign: "center",
                fontSize: 13,
                color: "#8A9ABB",
              }}
            >
              Loading clients...
            </p>
          ) : error ? (
            <p
              style={{
                padding: "48px",
                textAlign: "center",
                fontSize: 13,
                color: "#EF4444",
              }}
            >
              {error}
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "#F8FAFЕ",
                    borderBottom: "1px solid #DDE4EF",
                  }}
                >
                  {[
                    "Name",
                    "Client No.",
                    "External ID",
                    "Status",
                    "Office Name",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "11px 20px",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#6B7A99",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "56px",
                        textAlign: "center",
                        fontSize: 13,
                        color: "#8A9ABB",
                      }}
                    >
                      No clients found
                    </td>
                  </tr>
                ) : (
                  paginated.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() =>
                        navigate(
                          ROUTES.CLIENTS.DETAIL.replace(":clientId", client.id),
                        )
                      }
                      onMouseEnter={() => setHoveredRow(client.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderBottom: "1px solid #F0F3F8",
                        cursor: "pointer",
                        background:
                          hoveredRow === client.id ? "#F7FAFF" : "#fff",
                        transition: "background 0.1s",
                      }}
                    >
                      {/* Name */}
                      <td style={{ padding: "14px 20px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: "#E0E9FF",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span
                              className="sora"
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#002663",
                              }}
                            >
                              {getInitials(client.name)}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: "#0D1B3E",
                            }}
                          >
                            {client.name}
                          </span>
                        </div>
                      </td>

                      {/* Client No. */}
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          className="mono"
                          style={{
                            fontSize: 13,
                            color: "#374151",
                            fontWeight: 400,
                          }}
                        >
                          {client.clientNumber}
                        </span>
                      </td>

                      {/* External ID */}
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          className="mono"
                          style={{
                            fontSize: 13,
                            color: "#6B7A99",
                            fontWeight: 400,
                          }}
                        >
                          {client.externalId}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 20px" }}>
                        {client.status === "Active" ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "3px 10px 3px 7px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 500,
                              color: "#059669",
                              background: "#ECFDF5",
                              border: "1px solid #A7F3D0",
                            }}
                          >
                            <CheckCircle2 style={{ width: 12, height: 12 }} />
                            Active
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "3px 10px 3px 7px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 500,
                              color: "#B45309",
                              background: "#FFFBEB",
                              border: "1px solid #FCD34D",
                            }}
                          >
                            <AlertTriangle style={{ width: 12, height: 12 }} />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Office */}
                      <td
                        style={{
                          padding: "14px 20px",
                          fontSize: 13,
                          color: "#6B7A99",
                        }}
                      >
                        {client.officeName}
                      </td>

                      {/* Actions */}
                      <td
                        style={{ padding: "14px 20px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          style={{ position: "relative" }}
                          ref={(el) => {
                            menuRefs.current[client.id] = el;
                          }}
                        >
                          <button
                            onClick={() =>
                              setOpenMenu(
                                openMenu === client.id ? null : client.id,
                              )
                            }
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 6,
                              border: "none",
                              background:
                                hoveredRow === client.id ||
                                openMenu === client.id
                                  ? "#EEF2F8"
                                  : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              opacity:
                                hoveredRow === client.id ||
                                openMenu === client.id
                                  ? 1
                                  : 0,
                              transition: "opacity 0.1s, background 0.1s",
                            }}
                          >
                            <MoreVertical
                              style={{
                                width: 15,
                                height: 15,
                                color: "#6B7A99",
                              }}
                            />
                          </button>
                          {openMenu === client.id && (
                            <div
                              style={{
                                position: "absolute",
                                right: 0,
                                top: "calc(100% + 4px)",
                                zIndex: 20,
                                background: "#fff",
                                border: "1px solid #DDE4EF",
                                borderRadius: 8,
                                boxShadow: "0 4px 20px rgba(0,38,99,0.10)",
                                overflow: "hidden",
                                minWidth: 145,
                              }}
                            >
                              {[
                                {
                                  Icon: Eye,
                                  label: "View",
                                  color: "#374151",
                                  hover: "#F5F8FE",
                                  action: () => handleView(client.id),
                                },
                                {
                                  Icon: Edit,
                                  label: "Edit",
                                  color: "#374151",
                                  hover: "#F5F8FE",
                                  action: () => setOpenMenu(null),
                                },
                                {
                                  Icon: Trash2,
                                  label: "Delete",
                                  color: "#EF4444",
                                  hover: "#FEF2F2",
                                  action: () => handleDelete(client.id),
                                },
                              ].map(({ Icon, label, color, hover, action }) => (
                                <button
                                  key={label}
                                  onClick={action}
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "9px 14px",
                                    border: "none",
                                    background: "transparent",
                                    fontSize: 13,
                                    color,
                                    cursor: "pointer",
                                    textAlign: "left",
                                    transition: "background 0.1s",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background = hover)
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                      "transparent")
                                  }
                                >
                                  <Icon
                                    style={{
                                      width: 13,
                                      height: 13,
                                      flexShrink: 0,
                                    }}
                                  />
                                  {label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination footer */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <p style={{ fontSize: 12, color: "#8A9ABB", margin: 0 }}>
              Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} clients
            </p>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '5px 12px', borderRadius: 7, border: '1px solid #DDE4EF',
                  background: '#fff', fontSize: 12, color: currentPage === 1 ? '#CBD5E1' : '#0D1B3E',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', fontSize: 12, color: '#8A9ABB' }}>…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      style={{
                        width: 30, height: 30, borderRadius: 7,
                        border: '1px solid ' + (currentPage === p ? '#002663' : '#DDE4EF'),
                        background: currentPage === p ? '#002663' : '#fff',
                        color: currentPage === p ? '#fff' : '#0D1B3E',
                        fontSize: 12, fontWeight: currentPage === p ? 600 : 400,
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '5px 12px', borderRadius: 7, border: '1px solid #DDE4EF',
                  background: '#fff', fontSize: 12, color: currentPage === totalPages ? '#CBD5E1' : '#0D1B3E',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
