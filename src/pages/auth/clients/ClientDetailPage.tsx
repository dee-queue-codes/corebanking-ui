import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Pencil,
  Trash2,
  MoreVertical,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Copy,
  Check,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BackButton } from "@/components/ui/back-button";
import { ROUTES } from "@/router/routes";
import { accountsAPI } from "@/services/clients/accountsAPI";
import { clientsAPI } from "@/services/clients/clientsAPI";
import { clientTransactionsAPI } from "@/services/clients/transactionsAPI";
import { productsAPI, type SavingsProduct } from "@/services/products/productsAPI";

// ── Types ───────────────────────────────────────────────────────────────────

type SectionType =
  | "details"
  | "address"
  | "transactions"
  | "family"
  | "identities"
  | "documents"
  | "notes";

interface MockClient {
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

interface AddressItem {
  id?: string | number;
  addressTypeId?: string | number;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvinceId?: { name?: string } | string;
  postalCode?: string;
  addressType?: string | { id?: string | number; name?: string };
}

interface IdentityItem {
  id?: string | number;
  documentType?: { name?: string } | string;
  documentKey?: string;
  description?: string;
  status?: string;
}

interface DocumentItem {
  id?: string | number;
  name?: string;
  fileName?: string;
  description?: string;
}

interface NoteItem {
  id?: string | number;
  note?: string;
  content?: string;
  createdByUsername?: string;
  createdBy?: string;
  createdOn?: string | number[];
  createdAt?: string;
}

interface FamilyMemberItem {
  id?: string | number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  relationship?: string;
  gender?: string;
  age?: number;
  qualification?: string;
  profession?: string;
  maritalStatus?: string;
  mobileNumber?: string;
  dateOfBirth?: string;
  isDependent?: boolean;
}

interface SavingsAccount {
  accountNo: string;
  productName: string;
  currency: string;
  balance: number;
  status: string;
  activatedDate: string;
}

interface ClientTransactionRow {
  id: string;
  accountNo: string;
  type: string;
  entryType: string;
  date: string;
  amount: number;
  runningBalance: number;
  status: string;
}

// ── Mock client store ────────────────────────────────────────────────────────

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractArray(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  if (response && typeof response === "object") {
    const r = response as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.content)) return r.content;
    if (r.data && typeof r.data === "object") {
      const data = r.data as Record<string, unknown>;
      if (Array.isArray(data.content)) return data.content;
      if (Array.isArray(data.accounts)) return data.accounts;
      if (Array.isArray(data.items)) return data.items;
    }
  }
  return [];
}

function extractCollection(response: unknown): unknown[] {
  const arr = extractArray(response);
  if (arr.length > 0) return arr;
  const data = unwrapData(response);
  if (data && typeof data === "object") return [data];
  return [];
}

function text(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function currentIsoDate(): string {
  return new Date().toISOString().split("T")[0];
}

function isPendingApprovalStatus(status: string): boolean {
  const normalized = status.toUpperCase();
  return (
    normalized === "PENDING" ||
    normalized === "SUBMITTED" ||
    normalized.includes("PENDING APPROVAL") ||
    normalized.includes("SUBMITTED")
  );
}

function nestedName(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return text((value as Record<string, unknown>).name);
  }
  return "";
}

function accountDate(value: unknown): string {
  if (!value) return "";
  if (Array.isArray(value)) {
    const [year, month, day] = value as number[];
    if (year && month && day)
      return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime()))
      return parsed.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    return value;
  }
  return "";
}

function mapSavingsAccount(value: unknown): SavingsAccount {
  const account = (value && typeof value === "object" ? value : {}) as Record<
    string,
    unknown
  >;
  return {
    accountNo:
      text(account.accountNo) ||
      text(account.accountNumber) ||
      text(account.id),
    productName:
      text(account.productName) ||
      nestedName(account.product) ||
      text(account.type) ||
      "Savings",
    currency: text(account.currency) || nestedName(account.currency) || "GHS",
    balance: Number(
      account.balance ??
        account.accountBalance ??
        account.availableBalance ??
        0,
    ),
    status: text(account.status) || nestedName(account.status) || "Pending",
    activatedDate:
      accountDate(account.activatedDate) ||
      accountDate(account.activatedOnDate) ||
      accountDate(account.openedAt),
  };
}

function mapTransaction(
  value: unknown,
  accountNo: string,
): ClientTransactionRow {
  const tx = (value && typeof value === "object" ? value : {}) as Record<
    string,
    unknown
  >;
  return {
    id: text(tx.id) || `${accountNo}-${text(tx.date)}-${text(tx.amount)}`,
    accountNo,
    type: text(tx.type) || "-",
    entryType: text(tx.entryType) || "-",
    date: accountDate(tx.date) || "-",
    amount: Number(tx.amount ?? 0),
    runningBalance: Number(tx.runningBalance ?? 0),
    status: tx.reversed === true ? "Reversed" : "Completed",
  };
}

function extractTransactions(response: unknown): unknown[] {
  const data = unwrapData(response);
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.transactions)) return record.transactions;
  }
  return extractArray(response);
}

function getClientStatus(value: unknown): MockClient["status"] {
  const raw = text(value) || nestedName(value);
  return raw.toLowerCase() === "active" ? "Active" : "Pending";
}

function getClientName(value: Record<string, unknown>): string {
  const displayName = text(value.displayName) || text(value.name);
  if (displayName) return displayName;

  const firstName = text(value.firstName);
  const middleName = text(value.middleName);
  const lastName = text(value.lastName);
  return (
    [firstName, middleName, lastName].filter(Boolean).join(" ") ||
    "Unnamed Client"
  );
}

function mapClientDetail(value: unknown): MockClient {
  const client = (value && typeof value === "object" ? value : {}) as Record<
    string,
    unknown
  >;
  const id = text(client.id) || text(client.clientId);

  return {
    id,
    name: getClientName(client),
    clientNumber:
      text(client.clientNumber) ||
      text(client.accountNo) ||
      text(client.accountNumber) ||
      id,
    externalId: text(client.externalId) || "-",
    status: getClientStatus(client.status),
    officeName:
      text(client.officeName) ||
      nestedName(client.office) ||
      nestedName(client.officeId) ||
      "-",
    mobileNumber:
      text(client.mobileNumber) ||
      text(client.phoneNumber) ||
      text(client.phone) ||
      "-",
    email: text(client.email) || "-",
    activationDate:
      accountDate(client.activationDate) ||
      accountDate(client.activatedOnDate) ||
      accountDate(client.createdAt) ||
      "-",
    staff: client.staff === true || client.isStaff === true,
  };
}

function unwrapData(response: unknown): unknown {
  if (response && typeof response === "object" && "data" in response) {
    return (response as Record<string, unknown>).data;
  }
  return response;
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data;
    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;
      if (typeof record.responseMessage === "string")
        return record.responseMessage;
      const nestedError = record.error;
      if (nestedError && typeof nestedError === "object") {
        const ne = nestedError as Record<string, unknown>;
        // If there are field-level validation details, list them all
        if (ne.details && typeof ne.details === "object") {
          const details = ne.details as Record<string, string>;
          const lines = Object.entries(details).map(([field, msg]) => `• ${field}: ${msg}`);
          if (lines.length) return lines.join("\n");
        }
        if (typeof ne.message === "string") return ne.message;
      }
      if (typeof record.message === "string") return record.message;
    }
  }
  return fallback;
}

/** Converts "YYYY-MM-DD" (HTML date input) → "dd-MM-YYYY" (API format) */
function formatDateForApi(date: string): string {
  if (!date) return date;
  const parts = date.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return date;
}

/** Converts "dd-MM-YYYY" (API format) → "YYYY-MM-DD" (HTML date input) */
function parseApiDateForInput(date: string): string {
  if (!date) return date;
  const parts = date.split("-");
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return date;
}

function getAddressType(addr: AddressItem): string {
  if (!addr.addressType) return "";
  if (typeof addr.addressType === "string")
    return addr.addressType.toUpperCase();
  return (addr.addressType.name || "").toUpperCase();
}

function getStoredAddressTypes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ADDRESS_TYPE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function rememberAddressType(
  clientId: string,
  address: AddressItem,
  addressTypeId: string,
) {
  if (!address.id) return;
  const key = `${clientId}:${address.id}`;
  const stored = getStoredAddressTypes();
  localStorage.setItem(
    ADDRESS_TYPE_STORAGE_KEY,
    JSON.stringify({ ...stored, [key]: addressTypeId }),
  );
}

function getAddressTypeId(clientId: string, address: AddressItem): string {
  if (address.id) {
    const stored = getStoredAddressTypes()[`${clientId}:${address.id}`];
    if (stored) return stored;
  }
  if (address.addressTypeId !== undefined && address.addressTypeId !== null)
    return String(address.addressTypeId);
  if (
    address.addressType &&
    typeof address.addressType === "object" &&
    address.addressType.id !== undefined
  )
    return String(address.addressType.id);
  const type = getAddressType(address);
  if (type === "OFFICE" || type === "BUSINESS" || type === "WORK")
    return ADDRESS_TYPES.office.id;
  return ADDRESS_TYPES.residential.id;
}

function splitAddresses(clientId: string, addresses: AddressItem[]) {
  return {
    residential: addresses.filter(
      (a) => getAddressTypeId(clientId, a) !== ADDRESS_TYPES.office.id,
    ),
    office: addresses.filter(
      (a) => getAddressTypeId(clientId, a) === ADDRESS_TYPES.office.id,
    ),
  };
}

function getStateName(addr: AddressItem): string {
  if (!addr.stateProvinceId) return "";
  if (typeof addr.stateProvinceId === "string") return addr.stateProvinceId;
  return addr.stateProvinceId.name || "";
}

function getDocTypeName(identity: IdentityItem): string {
  if (!identity.documentType) return "-";
  if (typeof identity.documentType === "string") {
    const num = Number(identity.documentType);
    if (!isNaN(num))
      return (
        DOCUMENT_TYPES.find((d) => d.id === num)?.name ?? identity.documentType
      );
    return identity.documentType;
  }
  const name = identity.documentType.name;
  if (name) return name;
  return "-";
}

function getNoteText(note: NoteItem): string {
  return note.note || note.content || "";
}
function getNoteAuthor(note: NoteItem): string {
  return note.createdByUsername || note.createdBy || "Unknown";
}

function getNoteDate(note: NoteItem): string {
  const raw = note.createdOn || note.createdAt;
  if (!raw) return "";
  if (Array.isArray(raw)) {
    try {
      const [y, mo, d] = raw as number[];
      return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }
  try {
    return new Date(raw as string).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(raw);
  }
}

const navSections = [
  { id: "details", label: "Details" },
  { id: "transactions", label: "Transactions" },
  { id: "address", label: "Address" },
  { id: "family", label: "Family Members" },
  { id: "identities", label: "Identities" },
  { id: "documents", label: "Documents" },
  { id: "notes", label: "Notes" },
];

const DOCUMENT_TYPES = [
  { id: 1, name: "Passport" },
  { id: 2, name: "Id" },
  { id: 3, name: "Drivers License" },
  { id: 4, name: "Any Other Id Type" },
];
const ADDRESS_TYPES = {
  residential: { id: "1", label: "Residential Address" },
  office: { id: "2", label: "Office Address" },
} as const;
const SECTION_ENDPOINT_UNAVAILABLE =
  "No backend endpoint is exposed for this section in the current API.";
const ADDRESS_TYPE_STORAGE_KEY = "clientAddressTypes";

// ── Design tokens ────────────────────────────────────────────────────────────

const T = {
  navy: "#002663",
  navyDark: "#001844",
  navyLight: "#1a4080",
  gold: "#C9A84C",
  goldLight: "#F0DFA0",
  bg: "#EEF2F8",
  surface: "#FFFFFF",
  border: "#DDE4EF",
  text: "#0D1B3E",
  textSub: "#4A5878",
  textMuted: "#8A9ABB",
  success: "#059669",
  successBg: "#ECFDF5",
  warning: "#B45309",
  warningBg: "#FFFBEB",
  shadow: "0 1px 4px rgba(0,38,99,0.08), 0 4px 16px rgba(0,38,99,0.06)",
  shadowHover: "0 4px 12px rgba(0,38,99,0.12), 0 8px 24px rgba(0,38,99,0.08)",
} as const;

// ── Shared sub-components ─────────────────────────────────────────────────

function SectionCard({
  title,
  accentColor = T.navy,
  actions,
  children,
}: {
  title: string;
  accentColor?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: T.surface,
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "15px 22px",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 3,
              height: 16,
              borderRadius: 2,
              background: accentColor,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "Sora, sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: T.text,
            }}
          >
            {title}
          </span>
        </div>
        {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

function GhostBtn({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "DM Sans, sans-serif",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.03em",
        color: T.navy,
        border: `1.5px solid ${T.navy}`,
        borderRadius: 8,
        padding: "5px 14px",
        background: "transparent",
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = T.navy;
        e.currentTarget.style.color = "#fff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = T.navy;
      }}
    >
      {children}
    </button>
  );
}

function SolidBtn({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "DM Sans, sans-serif",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.03em",
        color: "#fff",
        background: T.navy,
        border: "none",
        borderRadius: 8,
        padding: "5px 16px",
        height: 36,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.navyDark)}
      onMouseLeave={(e) => (e.currentTarget.style.background = T.navy)}
    >
      {children}
    </button>
  );
}

function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr
        style={{ background: "#F5F8FE", borderBottom: `1px solid ${T.border}` }}
      >
        {cols.map((h) => (
          <th
            key={h}
            style={{
              padding: "10px 20px",
              textAlign: h === 'Action' ? 'right' : 'left',
              fontFamily: "DM Sans, sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: T.textMuted,
            }}
          >
            {h}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function EmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td
        colSpan={cols}
        style={{
          padding: "48px 24px",
          textAlign: "center",
          fontFamily: "DM Sans, sans-serif",
          fontSize: 13,
          color: T.textMuted,
        }}
      >
        {message}
      </td>
    </tr>
  );
}

function LoadingRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td
        colSpan={cols}
        style={{
          padding: "32px 24px",
          textAlign: "center",
          fontFamily: "DM Sans, sans-serif",
          fontSize: 13,
          color: T.textMuted,
        }}
      >
        Loading...
      </td>
    </tr>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? ''
  const { bg, color, dot } = ((): { bg: string; color: string; dot: string } => {
    if (s === 'completed')
      return { bg: T.successBg,  color: T.success,   dot: T.success   }
    if (s === 'active')
      return { bg: T.successBg,  color: T.success,   dot: T.success   }
    if (s === 'pending' || s === 'submitted')
      return { bg: '#FFFBEB',    color: '#B45309',   dot: '#F59E0B'   }
    if (s === 'approved')
      return { bg: T.successBg,  color: T.success,   dot: T.success   }
    if (s === 'failed')
      return { bg: '#FEF2F2',    color: '#DC2626',   dot: '#EF4444'   }
    if (s === 'reversed')
      return { bg: '#F1F5F9',    color: T.textSub,   dot: T.textMuted }
    return   { bg: '#F1F5F9',    color: T.textSub,   dot: T.textMuted }
  })()
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600, background: bg, color, whiteSpace: 'nowrap', flexWrap: 'wrap', maxWidth: '100%' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, flexShrink: 0 }} />
      {status || '—'}
    </span>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<MockClient | null>(null);
  const [clientLoading, setClientLoading] = useState(true);
  const [clientError, setClientError] = useState("");
  const [activeSection, setActiveSection] = useState<SectionType>("details");

  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [transactions, setTransactions] = useState<ClientTransactionRow[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState("");
  const [selectedAccountFilter, setSelectedAccountFilter] =
    useState<string>("all");
  const [accountActionLoading, setAccountActionLoading] = useState<
    string | null
  >(null);
  const [accountActionError, setAccountActionError] = useState("");
  const [copiedAccountNo, setCopiedAccountNo] = useState<string | null>(null);
  const [residentialAddresses, setResidentialAddresses] = useState<
    AddressItem[]
  >([]);
  const [officeAddresses, setOfficeAddresses] = useState<AddressItem[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [identities, setIdentities] = useState<IdentityItem[]>([]);
  const [identitiesLoading, setIdentitiesLoading] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberItem[]>([]);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    isStaff: false,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false);
  const [createAccountForm, setCreateAccountForm] = useState({
    savingsProduct: "",
    submittedOnDate: new Date().toISOString().split("T")[0],
  });
  const [savingsProducts, setSavingsProducts] = useState<SavingsProduct[]>([]);
  const [savingsProductsLoading, setSavingsProductsLoading] = useState(false);
  const [createAccountSaving, setCreateAccountSaving] = useState(false);
  const [createAccountError, setCreateAccountError] = useState("");
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const pendingAddressTypeId = useRef(ADDRESS_TYPES.residential.id)
  const [showEditAddressDialog, setShowEditAddressDialog] = useState(false)
  const [editAddressForm, setEditAddressForm] = useState({ addressId: '', addressTypeId: ADDRESS_TYPES.residential.id, addressLine1: '', addressLine2: '', city: '', stateProvinceId: '', postalCode: '' })
  const [editAddressSaving, setEditAddressSaving] = useState(false)
  const [editAddressError, setEditAddressError] = useState('')
  const [addressForm, setAddressForm] = useState({
    addressTypeId: "1",
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateProvinceId: "",
    postalCode: "",
  });
  const [addressDialogTitle, setAddressDialogTitle] = useState<string>(
    ADDRESS_TYPES.residential.label,
  );
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  const [familyForm, setFamilyForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    relationship: "",
    gender: "",
    age: "",
    qualification: "",
    profession: "",
    maritalStatus: "",
    mobileNumber: "",
    dateOfBirth: "",
    isDependent: false,
  });
  const [showIdentityDialog, setShowIdentityDialog] = useState(false);
  const [identityForm, setIdentityForm] = useState({
    documentTypeId: "",
    description: "",
    documentKey: "",
  });
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [documentForm, setDocumentForm] = useState<{
    name: string;
    description: string;
    file: File | null;
  }>({ name: "", description: "", file: null });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('')

  // Edit — Notes
  const [showEditNoteDialog, setShowEditNoteDialog] = useState(false)
  const [editNoteId, setEditNoteId] = useState<string | number>('')
  const [editNoteText, setEditNoteText] = useState('')
  const [editNoteSaving, setEditNoteSaving] = useState(false)
  const [editNoteError, setEditNoteError] = useState('')

  // Edit — Identities
  const [showEditIdentityDialog, setShowEditIdentityDialog] = useState(false)
  const [editIdentityId, setEditIdentityId] = useState<string | number>('')
  const [editIdentityForm, setEditIdentityForm] = useState({ documentTypeId: '', documentKey: '', description: '' })
  const [editIdentitySaving, setEditIdentitySaving] = useState(false)
  const [editIdentityError, setEditIdentityError] = useState('')

  // Edit — Family Members
  const [showEditFamilyDialog, setShowEditFamilyDialog] = useState(false)
  const [editFamilyId, setEditFamilyId] = useState<string | number>('')
  const [editFamilyForm, setEditFamilyForm] = useState({ firstName: '', middleName: '', lastName: '', relationship: '', gender: '', age: '', qualification: '', profession: '', maritalStatus: '', mobileNumber: '', dateOfBirth: '', isDependent: false })
  const [editFamilySaving, setEditFamilySaving] = useState(false)
  const [editFamilyError, setEditFamilyError] = useState('')

  // Edit — Documents
  const [showEditDocumentDialog, setShowEditDocumentDialog] = useState(false)
  const [editDocumentForm, setEditDocumentForm] = useState({ name: '', description: '' })
  const [editDocumentError, setEditDocumentError] = useState('')

  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [depositForm, setDepositForm] = useState({
    accountNumber: "",
    transactionAmount: "",
    transactionDate: new Date().toISOString().split("T")[0],
    paymentTypeId: "",
    note: "",
  });
  const [depositSaving, setDepositSaving] = useState(false);
  const [depositError, setDepositError] = useState("");

  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    accountNumber: "",
    transactionAmount: "",
    transactionDate: new Date().toISOString().split("T")[0],
    paymentTypeId: "",
    note: "",
  });
  const [withdrawSaving, setWithdrawSaving] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromAccountNumber: "",
    toAccountNumber: "",
    transferAmount: "",
    transferDescription: "",
    referenceId: "",
  });
  const [transferSaving, setTransferSaving] = useState(false);
  const [transferError, setTransferError] = useState("");

  const [paymentTypes, setPaymentTypes] = useState<
    { id: number; name: string }[]
  >([]);

  const skipAuthRedirect = { _skipAuthRedirect: true } as const;

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    setSavingsProductsLoading(true);
    productsAPI
      .getSavings()
      .then((res) => setSavingsProducts(extractArray(res.data) as SavingsProduct[]))
      .catch(() => setSavingsProducts([]))
      .finally(() => setSavingsProductsLoading(false));
  }, []);

  // Load payment types
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5173/api/v1'}/fineract/paymenttypes`, { headers })
      .then(r => r.json())
      .then((data: unknown) => {
        const raw = Array.isArray(data) ? data
          : data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).pageItems)
            ? (data as Record<string, unknown>).pageItems as unknown[]
            : data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).data)
              ? (data as Record<string, unknown>).data as unknown[]
              : []
        const mapped = (raw as Record<string, unknown>[])
          .map(pt => ({ id: Number(pt.id), name: String(pt.name ?? pt.value ?? pt.label ?? '') }))
          .filter(pt => pt.id && pt.name)
        setPaymentTypes(mapped)
        const moneyTransfer = mapped.find(pt => pt.name.toLowerCase().includes('money transfer'))
        if (moneyTransfer) {
          const id = String(moneyTransfer.id)
          setDepositForm(p => ({ ...p, paymentTypeId: id }))
          setWithdrawForm(p => ({ ...p, paymentTypeId: id }))
        }
      })
      .catch(() => { /* silent */ })
  }, []);

  useEffect(() => {
    if (!clientId) {
      setClient(null);
      setClientLoading(false);
      setClientError("Client ID is missing");
      return;
    }

    let cancelled = false;
    setClientLoading(true);
    setClientError("");

    clientsAPI
      .getById(clientId, skipAuthRedirect)
      .then((res) => {
        if (cancelled) return;
        const mapped = mapClientDetail(unwrapData(res.data));
        setClient(mapped);
        const parts = mapped.name.split(" ");
        setEditForm({
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" ") || "",
          email: mapped.email === "-" ? "" : mapped.email,
          mobileNumber: mapped.mobileNumber === "-" ? "" : mapped.mobileNumber,
          isStaff: mapped.staff,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setClient(null);
        setClientError("Failed to load client details");
      })
      .finally(() => {
        if (!cancelled) setClientLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    setAccountsLoading(true);
    accountsAPI
      .getByClientId(clientId, skipAuthRedirect)
      .then((res) => {
        setSavingsAccounts(extractArray(res.data).map(mapSavingsAccount));
      })
      .catch(() => setSavingsAccounts([]))
      .finally(() => setAccountsLoading(false));
  }, [clientId]);

  useEffect(() => {
    if (!clientId || savingsAccounts.length === 0) return;
    setTransactionsLoading(true);
    setTransactionsError("");

    const accountsWithNumber = savingsAccounts.filter((a) => a.accountNo);
    Promise.allSettled(
      accountsWithNumber.map((account) =>
        clientTransactionsAPI
          .getByAccountNumber(account.accountNo, skipAuthRedirect)
          .then((txRes) =>
            extractTransactions(txRes.data).map((tx) =>
              mapTransaction(tx, account.accountNo),
            ),
          ),
      ),
    )
      .then((results) => {
        const rows = results.flatMap((result) =>
          result.status === "fulfilled" ? result.value : [],
        );
        setTransactions(rows);
        if (results.some((result) => result.status === "rejected")) {
          setTransactionsError(
            "Some account transactions could not be loaded.",
          );
        }
      })
      .catch((error) => {
        setTransactions([]);
        setTransactionsError(
          getApiErrorMessage(error, "Failed to load transactions."),
        );
      })
      .finally(() => setTransactionsLoading(false));
  }, [clientId, savingsAccounts]);

  useEffect(() => {
    if (!clientId) return;
    setAddressLoading(true);
    clientsAPI
      .getAddresses(clientId, skipAuthRedirect)
      .then((res) => {
        const split = splitAddresses(
          clientId,
          extractCollection(res.data) as AddressItem[],
        );
        setResidentialAddresses(split.residential);
        setOfficeAddresses(split.office);
      })
      .catch(() => {
        setResidentialAddresses([]);
        setOfficeAddresses([]);
      })
      .finally(() => setAddressLoading(false));
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    setIdentitiesLoading(true);
    clientsAPI
      .getIdentities(clientId, skipAuthRedirect)
      .then((res) => setIdentities(extractArray(res.data) as IdentityItem[]))
      .catch(() => setIdentities([]))
      .finally(() => setIdentitiesLoading(false));
  }, [clientId]);

  useEffect(() => {
    setDocuments([]);
    setDocumentsLoading(false);
  }, []);

  useEffect(() => {
    if (!clientId) return;
    setNotesLoading(true);
    clientsAPI
      .getNotes(clientId, skipAuthRedirect)
      .then((res) => setNotes(extractArray(res.data) as NoteItem[]))
      .catch(() => setNotes([]))
      .finally(() => setNotesLoading(false));
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    setFamilyLoading(true);
    clientsAPI
      .getFamilyMembers(clientId, skipAuthRedirect)
      .then((res) =>
        setFamilyMembers(extractArray(res.data) as FamilyMemberItem[]),
      )
      .catch(() => setFamilyMembers([]))
      .finally(() => setFamilyLoading(false));
  }, [clientId]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (!editForm.firstName.trim()) {
      setEditError("First name is required.");
      return;
    }
    if (!editForm.lastName.trim()) {
      setEditError("Last name is required.");
      return;
    }
    if (!clientId) {
      setEditError("Client ID is missing.");
      return;
    }
    setEditSaving(true);
    try {
      await clientsAPI.update(
        clientId,
        {
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          email: editForm.email.trim(),
          phone: editForm.mobileNumber.trim(),
        },
        skipAuthRedirect,
      );
      setClient((prev) =>
        prev
          ? {
              ...prev,
              name: `${editForm.firstName.trim()} ${editForm.lastName.trim()}`,
              email: editForm.email.trim(),
              mobileNumber: editForm.mobileNumber.trim(),
              staff: editForm.isStaff,
            }
          : prev,
      );
      setShowEditDialog(false);
    } catch {
      setEditError("Failed to update client. Please try again.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim() || !clientId) return;
    setSavingNote(true);
    try {
      await clientsAPI.createNote(
        clientId,
        newNoteText.trim(),
        skipAuthRedirect,
      );
      const res = await clientsAPI.getNotes(clientId, skipAuthRedirect);
      setNotes(extractArray(res.data) as NoteItem[]);
      setNewNoteText("");
    } catch {
      /* silent */
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string | number | undefined) => {
    if (!noteId || !clientId) return;
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      await clientsAPI.deleteNote(clientId, noteId, skipAuthRedirect);
    } catch {
      /* silent */
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError("");
    if (
      !depositForm.transactionAmount ||
      isNaN(Number(depositForm.transactionAmount)) ||
      Number(depositForm.transactionAmount) <= 0
    ) {
      setDepositError("A valid amount is required.");
      return;
    }
    if (!depositForm.transactionDate) {
      setDepositError("Transaction date is required.");
      return;
    }
    if (
      !depositForm.paymentTypeId ||
      isNaN(Number(depositForm.paymentTypeId))
    ) {
      setDepositError("A valid payment type ID is required.");
      return;
    }
    setDepositSaving(true);
    try {
      await clientTransactionsAPI.deposit(
        depositForm.accountNumber,
        {
          transactionAmount: Number(depositForm.transactionAmount),
          transactionDate: depositForm.transactionDate,
          paymentTypeId: Number(depositForm.paymentTypeId),
          note: depositForm.note.trim(),
          accountNumber: depositForm.accountNumber,
          locale: "en",
          dateFormat: "yyyy-MM-dd",
        },
        skipAuthRedirect,
      );
      setShowDepositDialog(false);
      const defaultPtDeposit = paymentTypes.find(pt => pt.name.toLowerCase().includes('money transfer'))
      setDepositForm({
        accountNumber: "",
        transactionAmount: "",
        transactionDate: new Date().toISOString().split("T")[0],
        paymentTypeId: defaultPtDeposit ? String(defaultPtDeposit.id) : "",
        note: "",
      });
      if (clientId) {
        const res = await accountsAPI.getByClientId(clientId, skipAuthRedirect);
        setSavingsAccounts(extractArray(res.data).map(mapSavingsAccount));
      }
    } catch (error) {
      setDepositError(
        getApiErrorMessage(
          error,
          "Failed to process deposit. Please try again.",
        ),
      );
    } finally {
      setDepositSaving(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError("");
    if (
      !withdrawForm.transactionAmount ||
      isNaN(Number(withdrawForm.transactionAmount)) ||
      Number(withdrawForm.transactionAmount) <= 0
    ) {
      setWithdrawError("A valid amount is required.");
      return;
    }
    if (!withdrawForm.transactionDate) {
      setWithdrawError("Transaction date is required.");
      return;
    }
    if (
      !withdrawForm.paymentTypeId ||
      isNaN(Number(withdrawForm.paymentTypeId))
    ) {
      setWithdrawError("A valid payment type ID is required.");
      return;
    }
    setWithdrawSaving(true);
    try {
      await clientTransactionsAPI.withdraw(
        withdrawForm.accountNumber,
        {
          transactionAmount: Number(withdrawForm.transactionAmount),
          transactionDate: withdrawForm.transactionDate,
          paymentTypeId: Number(withdrawForm.paymentTypeId),
          note: withdrawForm.note.trim(),
          accountNumber: withdrawForm.accountNumber,
          locale: "en",
          dateFormat: "yyyy-MM-dd",
        },
        skipAuthRedirect,
      );
      setShowWithdrawDialog(false);
      const defaultPtWithdraw = paymentTypes.find(pt => pt.name.toLowerCase().includes('money transfer'))
      setWithdrawForm({
        accountNumber: "",
        transactionAmount: "",
        transactionDate: new Date().toISOString().split("T")[0],
        paymentTypeId: defaultPtWithdraw ? String(defaultPtWithdraw.id) : "",
        note: "",
      });
      if (clientId) {
        const res = await accountsAPI.getByClientId(clientId, skipAuthRedirect);
        setSavingsAccounts(extractArray(res.data).map(mapSavingsAccount));
      }
    } catch (error) {
      setWithdrawError(
        getApiErrorMessage(
          error,
          "Failed to process withdrawal. Please try again.",
        ),
      );
    } finally {
      setWithdrawSaving(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError("");
    if (!transferForm.fromAccountNumber.trim()) {
      setTransferError("From account number is required.");
      return;
    }
    if (!transferForm.toAccountNumber.trim()) {
      setTransferError("To account number is required.");
      return;
    }
    if (
      !transferForm.transferAmount ||
      isNaN(Number(transferForm.transferAmount)) ||
      Number(transferForm.transferAmount) <= 0
    ) {
      setTransferError("A valid transfer amount is required.");
      return;
    }
    setTransferSaving(true);
    try {
      await clientTransactionsAPI.transfer(
        {
          fromAccountNumber: transferForm.fromAccountNumber.trim(),
          toAccountNumber: transferForm.toAccountNumber.trim(),
          transferAmount: Number(transferForm.transferAmount),
          transferDescription: transferForm.transferDescription.trim(),
          referenceId: transferForm.referenceId.trim(),
        },
        skipAuthRedirect,
      );
      setShowTransferDialog(false);
      setTransferForm({
        fromAccountNumber: "",
        toAccountNumber: "",
        transferAmount: "",
        transferDescription: "",
        referenceId: "",
      });
      if (clientId) {
        const res = await accountsAPI.getByClientId(clientId, skipAuthRedirect);
        setSavingsAccounts(extractArray(res.data).map(mapSavingsAccount));
      }
    } catch (error) {
      setTransferError(
        getApiErrorMessage(
          error,
          "Failed to process transfer. Please try again.",
        ),
      );
    } finally {
      setTransferSaving(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAccountError("");
    if (!createAccountForm.savingsProduct) {
      setCreateAccountError("Savings product is required.");
      return;
    }
    if (!clientId) {
      setCreateAccountError("Invalid client ID.");
      return;
    }
    setCreateAccountSaving(true);
    try {
      await accountsAPI.create(
        {
          clientId,
          savingsProduct: createAccountForm.savingsProduct,
          submittedOnDate: createAccountForm.submittedOnDate,
        },
        skipAuthRedirect,
      );
      setShowCreateAccountDialog(false);
      setCreateAccountForm({
        savingsProduct: "",
        submittedOnDate: new Date().toISOString().split("T")[0],
      });
      const res = await accountsAPI.getByClientId(clientId, skipAuthRedirect);
      setSavingsAccounts(extractArray(res.data).map(mapSavingsAccount));
    } catch {
      setCreateAccountError("Failed to create account. Please try again.");
    } finally {
      setCreateAccountSaving(false);
    }
  };

  const handleApproveAccount = async (accountNumber: string) => {
    if (!clientId) return;
    setAccountActionLoading(accountNumber);
    setAccountActionError("");
    try {
      await accountsAPI.approve(
        accountNumber,
        { approvedOnDate: currentIsoDate() },
        skipAuthRedirect,
      );
      const res = await accountsAPI.getByClientId(clientId, skipAuthRedirect);
      setSavingsAccounts(extractArray(res.data).map(mapSavingsAccount));
    } catch (error) {
      setAccountActionError(
        getApiErrorMessage(error, "Failed to approve account."),
      );
    } finally {
      setAccountActionLoading(null);
    }
  };

  const handleActivateAccount = async (accountNumber: string) => {
    if (!clientId) return;
    setAccountActionLoading(accountNumber);
    setAccountActionError("");
    try {
      await accountsAPI.activate(
        accountNumber,
        { activatedOnDate: currentIsoDate() },
        skipAuthRedirect,
      );
      const res = await accountsAPI.getByClientId(clientId, skipAuthRedirect);
      setSavingsAccounts(extractArray(res.data).map(mapSavingsAccount));
    } catch (error) {
      setAccountActionError(
        getApiErrorMessage(error, "Failed to activate account."),
      );
    } finally {
      setAccountActionLoading(null);
    }
  };

  const handleViewAccountTransactions = (accountNumber: string) => {
    setSelectedAccountFilter(accountNumber);
    setActiveSection("transactions");
  };

  const handleCopyAccountNumber = async (accountNumber: string) => {
    if (!accountNumber) return;

    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedAccountNo(accountNumber);
      window.setTimeout(() => setCopiedAccountNo(null), 1500);
    } catch {
      setAccountActionError("Failed to copy account number.");
    }
  };

  // ── Section Renderers ─────────────────────────────────────────────────────

  const reloadAddresses = async () => {
    if (!clientId) return;
    const res = await clientsAPI.getAddresses(clientId, skipAuthRedirect);
    const split = splitAddresses(
      clientId,
      extractCollection(res.data) as AddressItem[],
    );
    setResidentialAddresses(split.residential);
    setOfficeAddresses(split.office);
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!clientId) {
      setAddError("Client ID is missing.");
      return;
    }
    if (!addressForm.addressLine1.trim()) {
      setAddError("Address line 1 is required.");
      return;
    }
    const addressTypeId = pendingAddressTypeId.current;

    // Snapshot existing IDs so we can identify the newly created address after reload
    const existingIds = new Set(
      [...residentialAddresses, ...officeAddresses]
        .map((a) => (a.id != null ? String(a.id) : ""))
        .filter(Boolean),
    );

    setAddSaving(true);
    try {
      await clientsAPI.createAddress(
        clientId,
        {
          addressLine1: addressForm.addressLine1.trim(),
          addressLine2: addressForm.addressLine2.trim() || undefined,
          city: addressForm.city.trim() || undefined,
          postalCode: addressForm.postalCode.trim() || undefined,
        },
        {
          ...skipAuthRedirect,
          params: { addressTypeId: Number(addressTypeId) },
        },
      );

      // Reload from server
      const freshRes = await clientsAPI.getAddresses(clientId, skipAuthRedirect);
      const allAddresses = extractCollection(freshRes.data) as AddressItem[];

      // Find the new address (its ID won't be in our pre-creation snapshot)
      const newAddr = allAddresses.find(
        (a) => a.id != null && !existingIds.has(String(a.id)),
      );
      if (newAddr) {
        rememberAddressType(clientId, newAddr, addressTypeId);
      }

      const residential: AddressItem[] = [];
      const office: AddressItem[] = [];
      for (const addr of allAddresses) {
        const isNew = newAddr != null && addr.id != null && String(addr.id) === String(newAddr.id);
        const knownType = isNew ? addressTypeId : getAddressTypeId(clientId, addr);
        if (knownType === ADDRESS_TYPES.office.id) office.push(addr);
        else residential.push(addr);
      }
      setResidentialAddresses(residential);
      setOfficeAddresses(office);

      setAddressForm({
        addressTypeId: "1",
        addressLine1: "",
        addressLine2: "",
        city: "",
        stateProvinceId: "",
        postalCode: "",
      });
      setShowAddressDialog(false);
    } catch (error) {
      setAddError(
        getApiErrorMessage(error, "Failed to add address. Please try again."),
      );
    } finally {
      setAddSaving(false);
    }
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditAddressError('')
    if (!clientId) { setEditAddressError('Client ID is missing.'); return }
    if (!editAddressForm.addressLine1.trim()) { setEditAddressError('Address line 1 is required.'); return }
    setEditAddressSaving(true)
    try {
      await clientsAPI.updateAddress(clientId, {
        addressId: Number(editAddressForm.addressId),
        addressLine1: editAddressForm.addressLine1.trim(),
        addressLine2: editAddressForm.addressLine2.trim() || undefined,
        city: editAddressForm.city.trim() || undefined,
        postalCode: editAddressForm.postalCode.trim() || undefined,
      }, { ...skipAuthRedirect, params: { addressTypeId: Number(editAddressForm.addressTypeId) } })
      await reloadAddresses()
      setShowEditAddressDialog(false)
    } catch (error) {
      setEditAddressError(getApiErrorMessage(error, 'Failed to update address. Please try again.'))
    } finally {
      setEditAddressSaving(false)
    }
  }

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditNoteError('')
    if (!editNoteText.trim()) { setEditNoteError('Note text is required.'); return }
    if (!clientId || !editNoteId) return
    setEditNoteSaving(true)
    try {
      await clientsAPI.updateNote(clientId, editNoteId, editNoteText.trim(), skipAuthRedirect)
      const res = await clientsAPI.getNotes(clientId, skipAuthRedirect)
      setNotes(extractArray(res.data) as NoteItem[])
      setShowEditNoteDialog(false)
    } catch (error) {
      setEditNoteError(getApiErrorMessage(error, 'Failed to update note.'))
    } finally {
      setEditNoteSaving(false)
    }
  }

  const handleDeleteIdentity = async (identityId: string | number) => {
    if (!clientId) return
    try {
      await clientsAPI.deleteIdentity(clientId, identityId, skipAuthRedirect)
      const res = await clientsAPI.getIdentities(clientId, skipAuthRedirect)
      setIdentities(extractArray(res.data) as IdentityItem[])
    } catch (error) {
      console.error('Failed to delete identity', error)
    }
  }

  const handleUpdateIdentity = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditIdentityError('')
    if (!editIdentityForm.documentTypeId) { setEditIdentityError('ID type is required.'); return }
    if (!editIdentityForm.documentKey.trim()) { setEditIdentityError('ID number is required.'); return }
    if (!clientId || !editIdentityId) return
    setEditIdentitySaving(true)
    try {
      await clientsAPI.updateIdentity(clientId, editIdentityId, {
        documentTypeId: Number(editIdentityForm.documentTypeId),
        documentKey: editIdentityForm.documentKey.trim(),
        description: editIdentityForm.description.trim(),
        status: 'ACTIVE',
      }, skipAuthRedirect)
      const res = await clientsAPI.getIdentities(clientId, skipAuthRedirect)
      setIdentities(extractArray(res.data) as IdentityItem[])
      setShowEditIdentityDialog(false)
    } catch (error) {
      setEditIdentityError(getApiErrorMessage(error, 'Failed to update identity.'))
    } finally {
      setEditIdentitySaving(false)
    }
  }

  const handleUpdateFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditFamilyError('')
    if (!editFamilyForm.firstName.trim()) { setEditFamilyError('First name is required.'); return }
    if (!clientId || !editFamilyId) return
    setEditFamilySaving(true)
    try {
      await clientsAPI.updateFamilyMember(clientId, editFamilyId, {
        firstName: editFamilyForm.firstName.trim(),
        middleName: editFamilyForm.middleName.trim(),
        lastName: editFamilyForm.lastName.trim(),
        relationship: editFamilyForm.relationship.trim(),
        gender: editFamilyForm.gender.trim().toUpperCase() || undefined,
        age: editFamilyForm.age ? Number(editFamilyForm.age) : undefined,
        qualification: editFamilyForm.qualification.trim() || undefined,
        profession: editFamilyForm.profession.trim() || undefined,
        maritalStatus: editFamilyForm.maritalStatus.trim() || undefined,
        mobileNumber: editFamilyForm.mobileNumber.trim() || undefined,
        dateOfBirth: editFamilyForm.dateOfBirth ? formatDateForApi(editFamilyForm.dateOfBirth) : undefined,
        isDependent: editFamilyForm.isDependent,
      }, skipAuthRedirect)
      const res = await clientsAPI.getFamilyMembers(clientId, skipAuthRedirect)
      setFamilyMembers(extractArray(res.data) as FamilyMemberItem[])
      setShowEditFamilyDialog(false)
    } catch (error) {
      setEditFamilyError(getApiErrorMessage(error, 'Failed to update family member.'))
    } finally {
      setEditFamilySaving(false)
    }
  }


  const handleCreateFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!clientId) {
      setAddError("Client ID is missing.");
      return;
    }
    if (!familyForm.firstName.trim()) {
      setAddError("First name is required.");
      return;
    }
    setAddSaving(true);
    try {
      await clientsAPI.createFamilyMember(
        clientId,
        {
          firstName: familyForm.firstName.trim(),
          middleName: familyForm.middleName.trim(),
          lastName: familyForm.lastName.trim(),
          relationship: familyForm.relationship.trim(),
          gender: familyForm.gender.trim().toUpperCase() || undefined,
          age: familyForm.age ? Number(familyForm.age) : undefined,
          qualification: familyForm.qualification.trim() || undefined,
          profession: familyForm.profession.trim() || undefined,
          maritalStatus: familyForm.maritalStatus.trim() || undefined,
          mobileNumber: familyForm.mobileNumber.trim() || undefined,
          dateOfBirth: familyForm.dateOfBirth ? formatDateForApi(familyForm.dateOfBirth) : undefined,
          isDependent: familyForm.isDependent,
        },
        skipAuthRedirect,
      );
      const res = await clientsAPI.getFamilyMembers(clientId, skipAuthRedirect);
      setFamilyMembers(extractArray(res.data) as FamilyMemberItem[]);
      setFamilyForm({
        firstName: "",
        middleName: "",
        lastName: "",
        relationship: "",
        gender: "",
        age: "",
        qualification: "",
        profession: "",
        maritalStatus: "",
        mobileNumber: "",
        dateOfBirth: "",
        isDependent: false,
      });
      setShowFamilyDialog(false);
    } catch (error) {
      setAddError(
        getApiErrorMessage(
          error,
          "Failed to add family member. Please try again.",
        ),
      );
    } finally {
      setAddSaving(false);
    }
  };

  const handleCreateIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!clientId) {
      setAddError("Client ID is missing.");
      return;
    }
    if (!identityForm.documentTypeId.trim()) {
      setAddError("ID type ID is required.");
      return;
    }
    if (!identityForm.documentKey.trim()) {
      setAddError("ID number is required.");
      return;
    }
    const documentTypeId = Number(identityForm.documentTypeId);
    if (Number.isNaN(documentTypeId)) {
      setAddError("ID type ID must be a number.");
      return;
    }
    setAddSaving(true);
    try {
      await clientsAPI.createIdentity(
        clientId,
        {
          documentTypeId,
          description: identityForm.description.trim(),
          documentKey: identityForm.documentKey.trim(),
          status: "ACTIVE",
        },
        {
          ...skipAuthRedirect,
          params: { documentTypeId },
        },
      );
      const res = await clientsAPI.getIdentities(clientId, skipAuthRedirect);
      setIdentities(extractArray(res.data) as IdentityItem[]);
      setIdentityForm({ documentTypeId: "", description: "", documentKey: "" });
      setShowIdentityDialog(false);
    } catch (error) {
      setAddError(
        getApiErrorMessage(error, "Failed to add identity. Please try again."),
      );
    } finally {
      setAddSaving(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!clientId) {
      setAddError("Client ID is missing.");
      return;
    }
    if (!documentForm.name.trim()) {
      setAddError("Document name is required.");
      return;
    }
    setAddSaving(true);
    try {
      const payload = documentForm.file
        ? new FormData()
        : {
            name: documentForm.name.trim(),
            description: documentForm.description.trim(),
          };
      if (payload instanceof FormData) {
        payload.append("name", documentForm.name.trim());
        payload.append("description", documentForm.description.trim());
        payload.append("file", documentForm.file as File);
      }
      await clientsAPI.createDocument(clientId, payload, skipAuthRedirect);
      const res = await clientsAPI.getDocuments(clientId, skipAuthRedirect);
      setDocuments(extractArray(res.data) as DocumentItem[]);
      setDocumentForm({ name: "", description: "", file: null });
      setShowDocumentDialog(false);
    } catch (error) {
      setAddError(
        getApiErrorMessage(error, "Failed to add document. Please try again."),
      );
    } finally {
      setAddSaving(false);
    }
  };

  const renderDetails = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {false && (
        <SectionCard title="Client Details">
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            {[
              { label: "Client Name", value: client?.name },
              { label: "Client No.", value: client?.clientNumber, mono: true },
              { label: "External ID", value: client?.externalId, mono: true },
              { label: "Office Name", value: client?.officeName },
              { label: "Mobile Number", value: client?.mobileNumber },
              { label: "Email", value: client?.email },
              { label: "Status", value: client?.status },
              { label: "Activation Date", value: client?.activationDate },
              { label: "Staff", value: client?.staff ? "Yes" : "No" },
            ].map((field, i) => (
              <div
                key={field.label}
                style={{
                  padding: "18px 22px",
                  borderRight:
                    (i + 1) % 3 !== 0 ? `1px solid ${T.border}` : "none",
                  borderBottom: i < 6 ? `1px solid ${T.border}` : "none",
                }}
              >
                <p
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: T.textMuted,
                    margin: "0 0 7px",
                  }}
                >
                  {field.label}
                </p>
                <p
                  style={{
                    fontFamily: field.mono
                      ? "DM Mono, monospace"
                      : "DM Sans, sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: T.text,
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {field.value || "—"}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Savings Accounts */}
      {accountActionError && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            fontFamily: "DM Sans, sans-serif",
            fontSize: 12,
            color: "#DC2626",
          }}
        >
          {accountActionError}
        </div>
      )}
      <SectionCard
        title="Savings Accounts"
        accentColor={T.gold}
        actions={
          <SolidBtn
            onClick={() => {
              setCreateAccountError("");
              setShowCreateAccountDialog(true);
            }}
          >
            Create Account
          </SolidBtn>
        }
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <TableHead
            cols={[
              "Account No.",
              "Product Name",
              "Balance",
              "Status",
              "Activation Date",
              "Action",
            ]}
          />
          <tbody>
            {accountsLoading ? (
              <LoadingRow cols={6} />
            ) : savingsAccounts.length === 0 ? (
              <EmptyRow cols={6} message="No savings accounts found" />
            ) : (
              savingsAccounts.map((acc, i) => {
                const statusUpper = acc.status?.toUpperCase() ?? "";
                const isPending = isPendingApprovalStatus(acc.status ?? "");
                const isApproved = statusUpper === "APPROVED";
                const isActive = statusUpper === "ACTIVE";
                const isActing = accountActionLoading === acc.accountNo;
                return (
                  <tr
                    key={`${acc.accountNo}-${i}`}
                    style={{
                      borderBottom: `1px solid ${T.border}`,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#FAFBFF")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "13px 20px" }}>
                      <button
                        onClick={() =>
                          acc.accountNo &&
                          handleViewAccountTransactions(acc.accountNo)
                        }
                        style={{
                          fontFamily: "DM Mono, monospace",
                          fontSize: 12,
                          fontWeight: 500,
                          color: T.navy,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          textDecoration: "underline",
                          textDecorationStyle: "dotted",
                          textUnderlineOffset: 3,
                        }}
                      >
                        {acc.accountNo || "—"}
                      </button>
                      {acc.accountNo && (
                        <button
                          type="button"
                          aria-label={`Copy account number ${acc.accountNo}`}
                          title={
                            copiedAccountNo === acc.accountNo
                              ? "Copied"
                              : "Copy account number"
                          }
                          onClick={() => handleCopyAccountNumber(acc.accountNo)}
                          style={{
                            width: 24,
                            height: 24,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: 7,
                            verticalAlign: "middle",
                            borderRadius: 6,
                            border: `1px solid ${T.border}`,
                            background:
                              copiedAccountNo === acc.accountNo
                                ? T.successBg
                                : "#F8FAFC",
                            color:
                              copiedAccountNo === acc.accountNo
                                ? T.success
                                : T.textMuted,
                            cursor: "pointer",
                            padding: 0,
                            transition: "background 0.15s, color 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            if (copiedAccountNo !== acc.accountNo) {
                              e.currentTarget.style.background = "#EEF2F8";
                              e.currentTarget.style.color = T.navy;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (copiedAccountNo !== acc.accountNo) {
                              e.currentTarget.style.background = "#F8FAFC";
                              e.currentTarget.style.color = T.textMuted;
                            }
                          }}
                        >
                          {copiedAccountNo === acc.accountNo ? (
                            <Check style={{ width: 13, height: 13 }} />
                          ) : (
                            <Copy style={{ width: 13, height: 13 }} />
                          )}
                        </button>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "13px 20px",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 13,
                        color: T.textSub,
                      }}
                    >
                      {acc.productName || "—"}
                    </td>
                    <td
                      style={{
                        padding: "13px 20px",
                        fontFamily: "Sora, sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        color: T.text,
                      }}
                    >
                      {acc.currency} {Number(acc.balance || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: "13px 20px", minWidth: 110 }}>
                      <StatusPill status={acc.status} />
                    </td>
                    <td
                      style={{
                        padding: "13px 20px",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 13,
                        color: T.textSub,
                      }}
                    >
                      {acc.activatedDate || "—"}
                    </td>
                    <td style={{ padding: "13px 20px", textAlign: 'right' }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: 'flex-end',
                          gap: 6,
                        }}
                      >
                        {isActive && (
                          <>
                            <button
                              onClick={() => {
                                setDepositError("");
                                setDepositForm({
                                  accountNumber: acc.accountNo,
                                  transactionAmount: "",
                                  transactionDate: new Date()
                                    .toISOString()
                                    .split("T")[0],
                                  paymentTypeId: "",
                                  note: "",
                                });
                                setShowDepositDialog(true);
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "5px 11px",
                                borderRadius: 7,
                                border: "none",
                                background: T.successBg,
                                color: T.success,
                                fontFamily: "DM Sans, sans-serif",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#D1FAE5")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = T.successBg)
                              }
                            >
                              <ArrowDownToLine
                                style={{ width: 12, height: 12 }}
                              />
                              Deposit
                            </button>
                            <button
                              onClick={() => {
                                setWithdrawError("");
                                setWithdrawForm({
                                  accountNumber: acc.accountNo,
                                  transactionAmount: "",
                                  transactionDate: new Date()
                                    .toISOString()
                                    .split("T")[0],
                                  paymentTypeId: "",
                                  note: "",
                                });
                                setShowWithdrawDialog(true);
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "5px 11px",
                                borderRadius: 7,
                                border: "none",
                                background: "#FEF2F2",
                                color: "#DC2626",
                                fontFamily: "DM Sans, sans-serif",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#FEE2E2")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "#FEF2F2")
                              }
                            >
                              <ArrowUpFromLine
                                style={{ width: 12, height: 12 }}
                              />
                              Withdraw
                            </button>
                            <button
                              onClick={() => {
                                setTransferError("");
                                setTransferForm({
                                  fromAccountNumber: acc.accountNo,
                                  toAccountNumber: "",
                                  transferAmount: "",
                                  transferDescription: "",
                                  referenceId: "",
                                });
                                setShowTransferDialog(true);
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "5px 11px",
                                borderRadius: 7,
                                border: "none",
                                background: "#EFF6FF",
                                color: "#2563EB",
                                fontFamily: "DM Sans, sans-serif",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#DBEAFE")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "#EFF6FF")
                              }
                            >
                              <ArrowLeftRight
                                style={{ width: 12, height: 12 }}
                              />
                              Transfer
                            </button>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              disabled={isActing}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 7,
                                border: `1px solid ${T.border}`,
                                background: T.surface,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: isActing ? "not-allowed" : "pointer",
                                opacity: isActing ? 0.5 : 1,
                                transition:
                                  "border-color 0.15s, background 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                if (!isActing) {
                                  e.currentTarget.style.borderColor = T.navy;
                                  e.currentTarget.style.background = "#F0F4F9";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = T.border;
                                e.currentTarget.style.background = T.surface;
                              }}
                            >
                              <MoreVertical
                                style={{
                                  width: 13,
                                  height: 13,
                                  color: T.textMuted,
                                }}
                              />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleViewAccountTransactions(acc.accountNo)
                              }
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Transactions
                            </DropdownMenuItem>
                            {isPending && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleApproveAccount(acc.accountNo)
                                }
                              >
                                <ArrowDownToLine className="w-4 h-4 mr-2 text-blue-600" />
                                <span className="text-blue-600">
                                  Approve Account
                                </span>
                              </DropdownMenuItem>
                            )}
                            {isApproved && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleActivateAccount(acc.accountNo)
                                }
                              >
                                <ArrowUpFromLine className="w-4 h-4 mr-2 text-green-600" />
                                <span className="text-green-600">
                                  Activate Account
                                </span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );

  const renderAddress = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[
        { title: "Residential Address", data: residentialAddresses },
        { title: "Office Address", data: officeAddresses },
      ].map(({ title, data }) => (
        <SectionCard
          key={title}
          title={title}
          actions={
            <GhostBtn
              onClick={() => {
                const type = title.startsWith("Office")
                  ? ADDRESS_TYPES.office
                  : ADDRESS_TYPES.residential;
                pendingAddressTypeId.current = type.id;
                setAddError("");
                setAddressDialogTitle(type.label);
                setAddressForm((p) => ({ ...p, addressTypeId: type.id }));
                setShowAddressDialog(true);
              }}
            >
              Add
            </GhostBtn>
          }
        >
          {addressLoading ? (
            <p
              style={{
                padding: "32px 24px",
                textAlign: "center",
                fontFamily: "DM Sans, sans-serif",
                fontSize: 13,
                color: T.textMuted,
              }}
            >
              Loading addresses...
            </p>
          ) : data.length === 0 ? (
            <p
              style={{
                padding: "48px 24px",
                textAlign: "center",
                fontFamily: "DM Sans, sans-serif",
                fontSize: 13,
                color: T.textMuted,
              }}
            >
              No {title.toLowerCase()} found
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {data.map((addr, i) => (
                  <tr
                    key={addr.id ?? i}
                    style={{
                      borderBottom: `1px solid ${T.border}`,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#FAFBFF")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td
                      style={{
                        padding: "13px 20px",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 13,
                        color: T.textSub,
                      }}
                    >
                      {addr.addressLine1 || "—"}
                    </td>
                    <td
                      style={{
                        padding: "13px 20px",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 13,
                        color: T.textSub,
                      }}
                    >
                      {addr.addressLine2 || "—"}
                    </td>
                    <td
                      style={{
                        padding: "13px 20px",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 13,
                        color: T.textSub,
                      }}
                    >
                      {addr.city || "—"}
                    </td>
                    <td
                      style={{
                        padding: "13px 20px",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 13,
                        color: T.textSub,
                      }}
                    >
                      {getStateName(addr) || addr.postalCode || "—"}
                    </td>
                    <td style={{ padding: "13px 20px", textAlign: "right" }}>
                      <button
                        onClick={() => {
                          setEditAddressError('')
                          setEditAddressForm({
                            addressId: String(addr.id ?? ''),
                            addressTypeId: getAddressTypeId(clientId, addr),
                            addressLine1: addr.addressLine1 ?? '',
                            addressLine2: addr.addressLine2 ?? '',
                            city: addr.city ?? '',
                            stateProvinceId: getStateName(addr),
                            postalCode: addr.postalCode ?? '',
                          })
                          setShowEditAddressDialog(true)
                        }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          border: `1px solid ${T.border}`,
                          background: T.surface,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Pencil
                          style={{ width: 13, height: 13, color: T.textMuted }}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      ))}
    </div>
  );

  const renderTransactions = () => {
    const filteredTxs =
      selectedAccountFilter === "all"
        ? transactions
        : transactions.filter((tx) => tx.accountNo === selectedAccountFilter);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionCard
          title="Transactions"
          actions={
            savingsAccounts.length > 0 ? (
              <Select
                value={selectedAccountFilter}
                onValueChange={setSelectedAccountFilter}
              >
                <SelectTrigger className="h-8 text-xs w-[260px] bg-white border-gray-200">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {savingsAccounts.map((acc) => (
                    <SelectItem key={acc.accountNo} value={acc.accountNo}>
                      {acc.accountNo}
                      {acc.productName ? ` (${acc.productName})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : undefined
          }
        >
          {transactionsLoading ? (
            <p
              style={{
                padding: "32px 24px",
                textAlign: "center",
                fontFamily: "DM Sans, sans-serif",
                fontSize: 13,
                color: T.textMuted,
              }}
            >
              Loading transactions...
            </p>
          ) : transactionsError && filteredTxs.length === 0 ? (
            <p
              style={{
                padding: "48px 24px",
                textAlign: "center",
                fontFamily: "DM Sans, sans-serif",
                fontSize: 13,
                color: "#EF4444",
              }}
            >
              {transactionsError}
            </p>
          ) : filteredTxs.length === 0 ? (
            <p
              style={{
                padding: "48px 24px",
                textAlign: "center",
                fontFamily: "DM Sans, sans-serif",
                fontSize: 13,
                color: T.textMuted,
              }}
            >
              {selectedAccountFilter !== "all"
                ? `No transactions found for account ${selectedAccountFilter}`
                : "No transactions found"}
            </p>
          ) : (
            <>
              {transactionsError && (
                <p
                  style={{
                    padding: "12px 20px",
                    margin: 0,
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: 12,
                    color: "#B45309",
                    background: "#FFFBEB",
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  {transactionsError}
                </p>
              )}
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <TableHead
                  cols={[
                    "Date",
                    "Account No.",
                    "Type",
                    "Entry",
                    "Amount",
                    "Running Balance",
                    "Status",
                  ]}
                />
                <tbody>
                  {filteredTxs.map((tx) => (
                    <tr
                      key={`${tx.accountNo}-${tx.id}`}
                      style={{
                        borderBottom: `1px solid ${T.border}`,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#FAFBFF")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "13px 20px",
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: 13,
                          color: T.textSub,
                        }}
                      >
                        {tx.date}
                      </td>
                      <td
                        style={{
                          padding: "13px 20px",
                          fontFamily: "DM Mono, monospace",
                          fontSize: 12,
                          color: T.navy,
                        }}
                      >
                        {tx.accountNo}
                      </td>
                      <td
                        style={{
                          padding: "13px 20px",
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: 13,
                          color: T.text,
                        }}
                      >
                        {tx.type}
                      </td>
                      <td
                        style={{
                          padding: "13px 20px",
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: 13,
                          color:
                            tx.entryType === "DEBIT" ? "#DC2626" : "#059669",
                          fontWeight: 600,
                        }}
                      >
                        {tx.entryType}
                      </td>
                      <td
                        style={{
                          padding: "13px 20px",
                          fontFamily: "Sora, sans-serif",
                          fontSize: 13,
                          color: T.text,
                          fontWeight: 600,
                        }}
                      >
                        {tx.amount.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "13px 20px",
                          fontFamily: "Sora, sans-serif",
                          fontSize: 13,
                          color: T.textSub,
                        }}
                      >
                        {tx.runningBalance.toFixed(2)}
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        <StatusPill status={tx.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </SectionCard>
      </div>
    );
  };

  const renderIdentities = () => {
    const resolveStatus = (raw: string | undefined): string => {
      if (!raw) return '—'
      // Handle enum strings like "clientIdentifierStatusType.active"
      const parts = raw.split('.')
      const label = parts[parts.length - 1]
      return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()
    }

    return (
      <SectionCard
        title="Identities"
        actions={<GhostBtn onClick={() => { setAddError(''); setShowIdentityDialog(true) }}>Add</GhostBtn>}
      >
        {identitiesLoading ? (
          <p style={{ padding: '32px 24px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: T.textMuted }}>Loading identities...</p>
        ) : identities.length === 0 ? (
          <p style={{ padding: '48px 24px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: T.textMuted }}>No identities found</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <TableHead cols={['ID Type', 'Number', 'Description', 'Status', 'Action']} />
            <tbody>
              {identities.map((identity, i) => {
                const status = resolveStatus(identity.status)
                const isActive = status.toLowerCase() === 'active'
                return (
                  <tr
                    key={identity.id ?? i}
                    style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFF')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '13px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: `linear-gradient(135deg, ${T.navy}, ${T.navyLight})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FileText style={{ width: 15, height: 15, color: '#fff' }} />
                        </div>
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: T.text }}>
                          {getDocTypeName(identity)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 20px', fontFamily: 'DM Mono, monospace', fontSize: 12, color: T.navy, letterSpacing: '0.04em' }}>
                      {identity.documentKey || '—'}
                    </td>
                    <td style={{ padding: '13px 20px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: T.textSub }}>
                      {identity.description || '—'}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        fontFamily: 'DM Sans, sans-serif',
                        background: isActive ? '#EFF6FF' : '#FEF2F2',
                        color: isActive ? '#2563EB' : '#DC2626',
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? '#3B82F6' : '#EF4444', flexShrink: 0 }} />
                        {status}
                      </span>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          style={{
                            width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.border}`,
                            background: T.surface, display: 'inline-flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer',
                          }}
                          onClick={() => {
                            setEditIdentityError('')
                            setEditIdentityId(identity.id ?? '')
                            setEditIdentityForm({
                              documentTypeId: String(identity.documentType && typeof identity.documentType === 'object' ? (identity.documentType as Record<string, unknown>).id ?? '' : ''),
                              documentKey: identity.documentKey ?? '',
                              description: identity.description ?? '',
                            })
                            setShowEditIdentityDialog(true)
                          }}
                        >
                          <Pencil style={{ width: 13, height: 13, color: T.textMuted }} />
                        </button>
                        <button
                          onClick={() => handleDeleteIdentity(identity.id ?? '')}
                          style={{
                            width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.border}`,
                            background: T.surface, display: 'inline-flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer',
                          }}>
                          <Trash2 style={{ width: 13, height: 13, color: '#EF4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </SectionCard>
    )
  }

  const renderDocuments = () => (
    <SectionCard title="Documents">
      {documentsLoading ? (
        <p
          style={{
            padding: "32px 24px",
            textAlign: "center",
            fontFamily: "DM Sans, sans-serif",
            fontSize: 13,
            color: T.textMuted,
          }}
        >
          Loading documents...
        </p>
      ) : documents.length === 0 ? (
        <p
          style={{
            padding: "48px 24px",
            textAlign: "center",
            fontFamily: "DM Sans, sans-serif",
            fontSize: 13,
            color: T.textMuted,
          }}
        >
          {SECTION_ENDPOINT_UNAVAILABLE}
        </p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <TableHead cols={["File Name", "File", "Description", "Action"]} />
          <tbody>
            {documents.map((doc, i) => (
              <tr
                key={doc.id ?? i}
                style={{
                  borderBottom: `1px solid ${T.border}`,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#FAFBFF")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td
                  style={{
                    padding: "13px 20px",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: 13,
                    color: T.text,
                    fontWeight: 500,
                  }}
                >
                  {doc.name || doc.fileName || "—"}
                </td>
                <td style={{ padding: "13px 20px" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "#FEE2E2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <FileText
                        style={{ width: 15, height: 15, color: "#DC2626" }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 13,
                        color: T.textSub,
                      }}
                    >
                      {doc.fileName || doc.name || "—"}
                    </span>
                  </div>
                </td>
                <td
                  style={{
                    padding: "13px 20px",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: 13,
                    color: T.textSub,
                  }}
                >
                  {doc.description || "—"}
                </td>
                <td style={{ padding: "13px 20px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      style={{
                        width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.border}`,
                        background: T.surface, display: "inline-flex", alignItems: "center",
                        justifyContent: "center", cursor: "pointer",
                      }}
                      onClick={() => {
                        setEditDocumentError('')
                        setEditDocumentForm({
                          name: doc.name ?? doc.fileName ?? '',
                          description: doc.description ?? '',
                        })
                        setShowEditDocumentDialog(true)
                      }}
                    >
                      <Pencil style={{ width: 13, height: 13, color: T.textMuted }} />
                    </button>
                    <button
                      style={{
                        width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.border}`,
                        background: T.surface, display: "inline-flex", alignItems: "center",
                        justifyContent: "center", cursor: "pointer",
                      }}
                    >
                      <Trash2 style={{ width: 13, height: 13, color: '#EF4444' }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SectionCard>
  );

  const renderFamily = () => (
    <SectionCard
      title="Family Members"
      actions={
        <GhostBtn
          onClick={() => {
            setAddError("");
            setShowFamilyDialog(true);
          }}
        >
          Add
        </GhostBtn>
      }
    >
      {familyLoading ? (
        <p
          style={{
            padding: "32px 24px",
            textAlign: "center",
            fontFamily: "DM Sans, sans-serif",
            fontSize: 13,
            color: T.textMuted,
          }}
        >
          Loading family members...
        </p>
      ) : familyMembers.length === 0 ? (
        <p
          style={{
            padding: "48px 24px",
            textAlign: "center",
            fontFamily: "DM Sans, sans-serif",
            fontSize: 13,
            color: T.textMuted,
          }}
        >
          No family members found
        </p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <TableHead
            cols={[
              "Name",
              "Relationship",
              "Gender",
              "Age",
              "Qualification",
              "Dependent",
              "Action",
            ]}
          />
          <tbody>
            {familyMembers.map((m, i) => (
              <tr
                key={m.id ?? i}
                style={{
                  borderBottom: `1px solid ${T.border}`,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#FAFBFF")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td
                  style={{
                    padding: "13px 20px",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: 13,
                    color: T.text,
                    fontWeight: 500,
                  }}
                >
                  {`${m.firstName || ""} ${m.lastName || ""}`.trim() || "—"}
                </td>
                <td
                  style={{
                    padding: "13px 20px",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: 13,
                    color: T.textSub,
                  }}
                >
                  {m.relationship || "—"}
                </td>
                <td
                  style={{
                    padding: "13px 20px",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: 13,
                    color: T.textSub,
                  }}
                >
                  {m.gender || "—"}
                </td>
                <td
                  style={{
                    padding: "13px 20px",
                    fontFamily: "Sora, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: T.text,
                  }}
                >
                  {m.age ?? "—"}
                </td>
                <td
                  style={{
                    padding: "13px 20px",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: 13,
                    color: T.textSub,
                  }}
                >
                  {m.qualification || "—"}
                </td>
                <td style={{ padding: "13px 20px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      background: m.isDependent ? "#EFF6FF" : "#F1F5F9",
                      color: m.isDependent ? "#1D4ED8" : T.textSub,
                    }}
                  >
                    {m.isDependent ? "Yes" : "No"}
                  </span>
                </td>
                <td style={{ padding: "13px 20px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      style={{
                        width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.border}`,
                        background: T.surface, display: "inline-flex", alignItems: "center",
                        justifyContent: "center", cursor: "pointer",
                      }}
                      onClick={() => {
                        setEditFamilyError('')
                        setEditFamilyId(m.id ?? '')
                        setEditFamilyForm({
                          firstName: m.firstName ?? '',
                          middleName: m.middleName ?? '',
                          lastName: m.lastName ?? '',
                          relationship: m.relationship ?? '',
                          gender: (m.gender ?? '').toUpperCase(),
                          age: m.age != null ? String(m.age) : '',
                          qualification: m.qualification ?? '',
                          profession: (m.profession ?? '').toLowerCase(),
                          maritalStatus: (m.maritalStatus ?? '').toUpperCase(),
                          mobileNumber: m.mobileNumber ?? '',
                          dateOfBirth: parseApiDateForInput(m.dateOfBirth ?? ''),
                          isDependent: !!m.isDependent,
                        })
                        setShowEditFamilyDialog(true)
                      }}
                    >
                      <Pencil style={{ width: 13, height: 13, color: T.textMuted }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SectionCard>
  );

  const renderNotes = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionCard title="Notes">
        {notesLoading ? (
          <p
            style={{
              padding: "32px 24px",
              textAlign: "center",
              fontFamily: "DM Sans, sans-serif",
              fontSize: 13,
              color: T.textMuted,
            }}
          >
            Loading notes...
          </p>
        ) : notes.length === 0 ? (
          <p
            style={{
              padding: "48px 24px",
              textAlign: "center",
              fontFamily: "DM Sans, sans-serif",
              fontSize: 13,
              color: T.textMuted,
            }}
          >
            No notes yet. Add one below.
          </p>
        ) : (
          <div>
            {notes.map((note, i) => (
              <div
                key={note.id ?? i}
                style={{
                  padding: "16px 22px",
                  borderBottom: `1px solid ${T.border}`,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#FAFBFF")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 13,
                        color: T.text,
                        marginBottom: 6,
                        lineHeight: 1.5,
                      }}
                    >
                      {getNoteText(note)}
                    </p>
                    <p
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 11,
                        fontWeight: 600,
                        color: T.navy,
                      }}
                    >
                      by {getNoteAuthor(note)}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 11,
                        color: T.textMuted,
                      }}
                    >
                      {getNoteDate(note)}
                    </span>
                    <button
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        border: `1px solid ${T.border}`,
                        background: T.surface,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setEditNoteError('')
                        setEditNoteId(note.id ?? '')
                        setEditNoteText(getNoteText(note))
                        setShowEditNoteDialog(true)
                      }}
                    >
                      <Pencil style={{ width: 13, height: 13, color: T.textMuted }} />
                    </button>
                    <button
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        border: `1px solid ${T.border}`,
                        background: T.surface,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                      onClick={() => handleDeleteNote(note.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#FCA5A5";
                        e.currentTarget.style.background = "#FEF2F2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = T.border;
                        e.currentTarget.style.background = T.surface;
                      }}
                    >
                      <Trash2
                        style={{ width: 13, height: 13, color: "#EF4444" }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add note input */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: `1px solid ${T.border}`,
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
          }}
        >
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Write a note..."
            rows={2}
            style={{
              flex: 1,
              resize: "none",
              padding: "9px 12px",
              fontFamily: "DM Sans, sans-serif",
              fontSize: 13,
              color: T.text,
              background: "#F5F8FE",
              border: `1.5px solid ${T.border}`,
              borderRadius: 9,
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = T.navy)}
            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
          />
          <button
            onClick={handleAddNote}
            disabled={savingNote || !newNoteText.trim()}
            style={{
              padding: "9px 18px",
              borderRadius: 9,
              border: "none",
              background: T.navy,
              color: "#fff",
              fontFamily: "DM Sans, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              cursor:
                savingNote || !newNoteText.trim() ? "not-allowed" : "pointer",
              opacity: savingNote || !newNoteText.trim() ? 0.55 : 1,
              transition: "background 0.15s, opacity 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!savingNote && newNoteText.trim())
                e.currentTarget.style.background = T.navyDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = T.navy;
            }}
          >
            {savingNote ? "Saving..." : "Add Note"}
          </button>
        </div>
      </SectionCard>
    </div>
  );

  // ── Guard ─────────────────────────────────────────────────────────────────

  if (clientLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ fontFamily: "DM Sans, sans-serif", color: T.textMuted }}>
          Loading client details...
        </p>
      </div>
    );
  }

  if (!client) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: "DM Sans, sans-serif",
            color: clientError ? "#EF4444" : T.textMuted,
          }}
        >
          {clientError || "Client not found"}
        </p>
      </div>
    );
  }

  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  // ── Main Render ───────────────────────────────────────────────────────────

  return (
    <div className="cdp-root" style={{ minHeight: "100vh", background: T.bg }}>
      <style>{`
        .cdp-root, .cdp-root button, .cdp-root input, .cdp-root textarea,
        .cdp-root select, .cdp-root th, .cdp-root td, .cdp-root p,
        .cdp-root span:not(.lucide), .cdp-root label, .cdp-root h1,
        .cdp-root h2, .cdp-root h3, .cdp-root a {
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>

      {/* Back button row */}
      <div style={{ padding: "20px 24px 0" }}>
        <BackButton
          onClick={() => navigate(ROUTES.CLIENTS.LIST)}
          label="Back to Clients"
        />
      </div>

      {/* ── Header card ──────────────────────────────────────────────────── */}
      <div style={{ margin: "16px 24px 0" }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navy} 55%, ${T.navyLight} 100%)`,
            borderRadius: 16,
            padding: "0",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,38,99,0.28)",
            position: "relative",
          }}
        >
          {/* Gold top stripe */}
          <div
            style={{
              height: 3,
              background: `linear-gradient(90deg, ${T.gold}, #E8C96A, ${T.gold})`,
              width: "100%",
            }}
          />

          {/* Subtle dot-grid texture overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              top: 3,
              pointerEvents: "none",
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          />

          <div style={{ padding: "24px 28px 20px", position: "relative" }}>
            {/* Top row: avatar + name + status + menu */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                {/* Avatar */}
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.12)",
                    border: `2px solid ${T.gold}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 0 4px rgba(201,168,76,0.18)`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Sora, sans-serif",
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#fff",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {initials}
                  </span>
                </div>
                {/* Name + office */}
                <div>
                  <h1
                    style={{
                      fontFamily: "Sora, sans-serif",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#fff",
                      margin: 0,
                      letterSpacing: "-0.01em",
                      lineHeight: 1.2,
                    }}
                  >
                    {client.name}
                  </h1>
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(200,215,255,0.85)",
                      margin: "4px 0 0",
                      fontWeight: 400,
                    }}
                  >
                    {client.officeName}
                    {client.staff && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          color: T.gold,
                          border: `1px solid ${T.gold}`,
                          borderRadius: 4,
                          padding: "1px 6px",
                        }}
                      >
                        Staff
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Status + menu */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  paddingTop: 2,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    background:
                      client.status === "Active"
                        ? "rgba(5,150,105,0.18)"
                        : "rgba(217,119,6,0.18)",
                    color: client.status === "Active" ? "#6EE7B7" : "#FCD34D",
                    border: `1px solid ${client.status === "Active" ? "rgba(110,231,183,0.35)" : "rgba(252,211,77,0.35)"}`,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background:
                        client.status === "Active" ? "#34D399" : "#FBBF24",
                      flexShrink: 0,
                    }}
                  />
                  {client.status}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: "rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.2)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255,255,255,0.1)")
                      }
                    >
                      <MoreVertical
                        style={{
                          width: 15,
                          height: 15,
                          color: "rgba(255,255,255,0.85)",
                        }}
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditError("");
                        setShowEditDialog(true);
                      }}
                    >
                      Edit Client
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedAccountFilter("all");
                        setActiveSection("transactions");
                      }}
                    >
                      View Transactions
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Close Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Info fields row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 0,
              }}
            >
              {[
                { label: "Client No.", value: client.clientNumber },
                { label: "External ID", value: client.externalId },
                { label: "Activation Date", value: client.activationDate },
                { label: "Mobile Number", value: client.mobileNumber },
                { label: "Email", value: client.email },
              ].map((field, i) => (
                <div
                  key={field.label}
                  style={{
                    borderRight:
                      i < 4 ? "1px solid rgba(255,255,255,0.1)" : "none",
                    paddingRight: 20,
                    paddingLeft: i > 0 ? 20 : 0,
                  }}
                >
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(180,200,255,0.7)",
                      marginBottom: 5,
                    }}
                  >
                    {field.label}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#fff",
                      fontFamily:
                        field.label === "Client No." ||
                        field.label === "External ID"
                          ? "DM Mono, monospace"
                          : "DM Sans, sans-serif",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      ...(field.label === "Email"
                        ? { color: "#93C5FD", cursor: "pointer" }
                        : {}),
                    }}
                  >
                    {field.value}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ── Body: Nav + Content ───────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 20,
          padding: "20px 24px 32px",
          alignItems: "flex-start",
        }}
      >
        {/* Left nav */}
        <div style={{ width: 172, flexShrink: 0 }}>
          <div
            style={{
              background: T.surface,
              borderRadius: 14,
              border: `1px solid ${T.border}`,
              boxShadow: T.shadow,
              padding: "8px 8px",
              overflow: "hidden",
            }}
          >
            {navSections.map((s) => {
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id as SectionType)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 0,
                    padding: "9px 12px",
                    borderRadius: 9,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? T.navy : T.textSub,
                    background: isActive ? "#EEF3FF" : "transparent",
                    transition: "all 0.15s",
                    marginBottom: 2,
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "#F5F8FE";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  {isActive && (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 3,
                        height: 18,
                        borderRadius: "0 2px 2px 0",
                        background: T.navy,
                      }}
                    />
                  )}
                  <span style={{ paddingLeft: isActive ? 8 : 4 }}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeSection === "details" && renderDetails()}
          {activeSection === "address" && renderAddress()}
          {activeSection === "transactions" && renderTransactions()}
          {activeSection === "identities" && renderIdentities()}
          {activeSection === "documents" && renderDocuments()}
          {activeSection === "family" && renderFamily()}
          {activeSection === "notes" && renderNotes()}
        </div>
      </div>

      {/* ── Edit Client Dialog ────────────────────────────────────────────── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Sora, sans-serif" }}>
              Edit Client
            </DialogTitle>
            <DialogDescription>
              Update the client's information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="editFirstName"
                  className="text-sm text-gray-700 mb-1.5 block"
                >
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="editFirstName"
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, firstName: e.target.value }))
                  }
                  className="bg-gray-50 border-gray-300"
                />
              </div>
              <div>
                <Label
                  htmlFor="editLastName"
                  className="text-sm text-gray-700 mb-1.5 block"
                >
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="editLastName"
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, lastName: e.target.value }))
                  }
                  className="bg-gray-50 border-gray-300"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="editEmail"
                className="text-sm text-gray-700 mb-1.5 block"
              >
                Email Address
              </Label>
              <Input
                id="editEmail"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, email: e.target.value }))
                }
                className="bg-gray-50 border-gray-300"
              />
            </div>
            <div>
              <Label
                htmlFor="editMobile"
                className="text-sm text-gray-700 mb-1.5 block"
              >
                Mobile Number
              </Label>
              <Input
                id="editMobile"
                value={editForm.mobileNumber}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, mobileNumber: e.target.value }))
                }
                className="bg-gray-50 border-gray-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="editIsStaff"
                checked={editForm.isStaff}
                onCheckedChange={(v) =>
                  setEditForm((p) => ({ ...p, isStaff: !!v }))
                }
              />
              <Label
                htmlFor="editIsStaff"
                className="text-sm text-gray-700 cursor-pointer"
              >
                Is Staff?
              </Label>
            </div>
            {editError && <p className="text-sm text-red-600">{editError}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={editSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-white"
                style={{ backgroundColor: T.navy }}
                disabled={editSaving}
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Create Account Dialog ─────────────────────────────────────────── */}
      {/* ── Edit Address Dialog ───────────────────────────────────────────── */}
      <Dialog open={showEditAddressDialog} onOpenChange={setShowEditAddressDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Sora, sans-serif' }}>Edit Address</DialogTitle>
            <DialogDescription>Update the address details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateAddress} className="space-y-4">
            <Input placeholder="Address line 1 *" value={editAddressForm.addressLine1} onChange={e => setEditAddressForm(p => ({ ...p, addressLine1: e.target.value }))} className="bg-gray-50 border-gray-300" />
            <Input placeholder="Address line 2" value={editAddressForm.addressLine2} onChange={e => setEditAddressForm(p => ({ ...p, addressLine2: e.target.value }))} className="bg-gray-50 border-gray-300" />
            <Input placeholder="City" value={editAddressForm.city} onChange={e => setEditAddressForm(p => ({ ...p, city: e.target.value }))} className="bg-gray-50 border-gray-300" />
            <Input placeholder="Postal code" value={editAddressForm.postalCode} onChange={e => setEditAddressForm(p => ({ ...p, postalCode: e.target.value }))} className="bg-gray-50 border-gray-300" />
            {editAddressError && <p className="text-sm text-red-600">{editAddressError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditAddressDialog(false)} disabled={editAddressSaving}>Cancel</Button>
              <Button type="submit" className="text-white" style={{ backgroundColor: T.navy }} disabled={editAddressSaving}>
                {editAddressSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Note Dialog ─────────────────────────────────────────────── */}
      <Dialog open={showEditNoteDialog} onOpenChange={setShowEditNoteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Sora, sans-serif' }}>Edit Note</DialogTitle>
            <DialogDescription>Update the note text.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateNote} className="space-y-4">
            <textarea
              value={editNoteText}
              onChange={(e) => setEditNoteText(e.target.value)}
              placeholder="Note text *"
              rows={4}
              style={{
                width: '100%', resize: 'vertical', padding: '9px 12px',
                fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: T.text,
                background: '#F5F8FE', border: `1.5px solid ${T.border}`,
                borderRadius: 9, outline: 'none',
              }}
            />
            {editNoteError && <p className="text-sm text-red-600">{editNoteError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditNoteDialog(false)} disabled={editNoteSaving}>Cancel</Button>
              <Button type="submit" className="text-white" style={{ backgroundColor: T.navy }} disabled={editNoteSaving}>
                {editNoteSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Identity Dialog ─────────────────────────────────────────── */}
      <Dialog open={showEditIdentityDialog} onOpenChange={setShowEditIdentityDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Sora, sans-serif' }}>Edit Identity</DialogTitle>
            <DialogDescription>Update the identity document details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateIdentity} className="space-y-4">
            <div>
              <Label className="text-sm text-gray-700 mb-1.5 block">ID Type <span className="text-red-500">*</span></Label>
              <Select value={editIdentityForm.documentTypeId} onValueChange={(v) => setEditIdentityForm(p => ({ ...p, documentTypeId: v }))}>
                <SelectTrigger className="bg-gray-50 border-gray-300">
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((dt) => (
                    <SelectItem key={dt.id} value={String(dt.id)}>{dt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="ID number *" value={editIdentityForm.documentKey} onChange={(e) => setEditIdentityForm(p => ({ ...p, documentKey: e.target.value }))} className="bg-gray-50 border-gray-300" />
            <Input placeholder="Description" value={editIdentityForm.description} onChange={(e) => setEditIdentityForm(p => ({ ...p, description: e.target.value }))} className="bg-gray-50 border-gray-300" />
            {editIdentityError && <p className="text-sm text-red-600">{editIdentityError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditIdentityDialog(false)} disabled={editIdentitySaving}>Cancel</Button>
              <Button type="submit" className="text-white" style={{ backgroundColor: T.navy }} disabled={editIdentitySaving}>
                {editIdentitySaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Family Member Dialog ────────────────────────────────────── */}
      <Dialog open={showEditFamilyDialog} onOpenChange={setShowEditFamilyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Sora, sans-serif' }}>Edit Family Member</DialogTitle>
            <DialogDescription>Update family member details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateFamilyMember} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Input placeholder="First name *" value={editFamilyForm.firstName} onChange={(e) => setEditFamilyForm(p => ({ ...p, firstName: e.target.value }))} className="bg-gray-50 border-gray-300" />
              <Input placeholder="Middle name" value={editFamilyForm.middleName} onChange={(e) => setEditFamilyForm(p => ({ ...p, middleName: e.target.value }))} className="bg-gray-50 border-gray-300" />
              <Input placeholder="Last name" value={editFamilyForm.lastName} onChange={(e) => setEditFamilyForm(p => ({ ...p, lastName: e.target.value }))} className="bg-gray-50 border-gray-300" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Relationship" value={editFamilyForm.relationship} onChange={(e) => setEditFamilyForm(p => ({ ...p, relationship: e.target.value }))} className="bg-gray-50 border-gray-300" />
              <select value={editFamilyForm.gender} onChange={(e) => setEditFamilyForm(p => ({ ...p, gender: e.target.value }))} style={{ height: 36, borderRadius: 6, border: '1px solid #D1D5DB', background: '#F9FAFB', padding: '0 10px', fontSize: 14, width: '100%' }}>
                <option value="" disabled>Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                <option value="UNSPECIFIED">Unspecified</option>
              </select>
              <Input placeholder="Age" type="number" value={editFamilyForm.age} onChange={(e) => setEditFamilyForm(p => ({ ...p, age: e.target.value }))} className="bg-gray-50 border-gray-300" />
              <Input placeholder="Qualification" value={editFamilyForm.qualification} onChange={(e) => setEditFamilyForm(p => ({ ...p, qualification: e.target.value }))} className="bg-gray-50 border-gray-300" />
              <select value={editFamilyForm.profession} onChange={(e) => setEditFamilyForm(p => ({ ...p, profession: e.target.value }))} style={{ height: 36, borderRadius: 6, border: '1px solid #D1D5DB', background: '#F9FAFB', padding: '0 10px', fontSize: 14, width: '100%' }}>
                <option value="" disabled>Profession</option>
                <option value="employed">Employed</option>
                <option value="entreprenuer">Entrepreneur</option>
              </select>
              <select value={editFamilyForm.maritalStatus} onChange={(e) => setEditFamilyForm(p => ({ ...p, maritalStatus: e.target.value }))} style={{ height: 36, borderRadius: 6, border: '1px solid #D1D5DB', background: '#F9FAFB', padding: '0 10px', fontSize: 14, width: '100%' }}>
                <option value="" disabled>Marital status</option>
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
              </select>
              <Input placeholder="Mobile number" value={editFamilyForm.mobileNumber} onChange={(e) => setEditFamilyForm(p => ({ ...p, mobileNumber: e.target.value }))} className="bg-gray-50 border-gray-300" />
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Date of Birth</Label>
                <Input type="date" value={editFamilyForm.dateOfBirth} onChange={(e) => setEditFamilyForm(p => ({ ...p, dateOfBirth: e.target.value }))} className="bg-gray-50 border-gray-300" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="editDependent" checked={editFamilyForm.isDependent} onCheckedChange={(v) => setEditFamilyForm(p => ({ ...p, isDependent: !!v }))} />
              <Label htmlFor="editDependent" className="text-sm text-gray-700 cursor-pointer">Dependent</Label>
            </div>
            {editFamilyError && (
              <div className="text-sm text-red-600 whitespace-pre-line">{editFamilyError}</div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditFamilyDialog(false)} disabled={editFamilySaving}>Cancel</Button>
              <Button type="submit" className="text-white" style={{ backgroundColor: T.navy }} disabled={editFamilySaving}>
                {editFamilySaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Document Dialog ─────────────────────────────────────────── */}
      <Dialog open={showEditDocumentDialog} onOpenChange={setShowEditDocumentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Sora, sans-serif' }}>Edit Document</DialogTitle>
            <DialogDescription>Update the document details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            setEditDocumentError('Document editing is not supported by the API.')
          }} className="space-y-4">
            <Input placeholder="Document name" value={editDocumentForm.name} onChange={(e) => setEditDocumentForm(p => ({ ...p, name: e.target.value }))} className="bg-gray-50 border-gray-300" />
            <Input placeholder="Description" value={editDocumentForm.description} onChange={(e) => setEditDocumentForm(p => ({ ...p, description: e.target.value }))} className="bg-gray-50 border-gray-300" />
            {editDocumentError && <p className="text-sm text-red-600">{editDocumentError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDocumentDialog(false)}>Close</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Sora, sans-serif" }}>
              Add {addressDialogTitle}
            </DialogTitle>
            <DialogDescription>
              This address will be saved under{" "}
              {addressDialogTitle.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAddress} className="space-y-4">
            <Input
              placeholder="Address line 1"
              value={addressForm.addressLine1}
              onChange={(e) =>
                setAddressForm((p) => ({ ...p, addressLine1: e.target.value }))
              }
              className="bg-gray-50 border-gray-300"
            />
            <Input
              placeholder="Address line 2"
              value={addressForm.addressLine2}
              onChange={(e) =>
                setAddressForm((p) => ({ ...p, addressLine2: e.target.value }))
              }
              className="bg-gray-50 border-gray-300"
            />
            <Input
              placeholder="City"
              value={addressForm.city}
              onChange={(e) =>
                setAddressForm((p) => ({ ...p, city: e.target.value }))
              }
              className="bg-gray-50 border-gray-300"
            />
            <Input
              placeholder="Postal code"
              value={addressForm.postalCode}
              onChange={(e) =>
                setAddressForm((p) => ({ ...p, postalCode: e.target.value }))
              }
              className="bg-gray-50 border-gray-300"
            />
            {addError && <div className="text-sm text-red-600 whitespace-pre-line">{addError}</div>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddressDialog(false)}
                disabled={addSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-white"
                style={{ backgroundColor: T.navy }}
                disabled={addSaving}
              >
                {addSaving ? "Saving..." : "Add Address"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showFamilyDialog} onOpenChange={setShowFamilyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Sora, sans-serif" }}>
              Add Family Member
            </DialogTitle>
            <DialogDescription>
              Add a family member for this client.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateFamilyMember} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Input
                placeholder="First name *"
                value={familyForm.firstName}
                onChange={(e) =>
                  setFamilyForm((p) => ({ ...p, firstName: e.target.value }))
                }
                className="bg-gray-50 border-gray-300"
              />
              <Input
                placeholder="Middle name"
                value={familyForm.middleName}
                onChange={(e) =>
                  setFamilyForm((p) => ({ ...p, middleName: e.target.value }))
                }
                className="bg-gray-50 border-gray-300"
              />
              <Input
                placeholder="Last name"
                value={familyForm.lastName}
                onChange={(e) =>
                  setFamilyForm((p) => ({ ...p, lastName: e.target.value }))
                }
                className="bg-gray-50 border-gray-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Relationship"
                value={familyForm.relationship}
                onChange={(e) =>
                  setFamilyForm((p) => ({ ...p, relationship: e.target.value }))
                }
                className="bg-gray-50 border-gray-300"
              />
              <select
                value={familyForm.gender}
                onChange={(e) => setFamilyForm((p) => ({ ...p, gender: e.target.value }))}
                style={{ height: 36, borderRadius: 6, border: '1px solid #D1D5DB', background: '#F9FAFB', padding: '0 10px', fontSize: 14, width: '100%' }}
              >
                <option value="" disabled>Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                <option value="UNSPECIFIED">Unspecified</option>
              </select>
              <Input
                placeholder="Age"
                type="number"
                value={familyForm.age}
                onChange={(e) =>
                  setFamilyForm((p) => ({ ...p, age: e.target.value }))
                }
                className="bg-gray-50 border-gray-300"
              />
              <Input
                placeholder="Qualification"
                value={familyForm.qualification}
                onChange={(e) =>
                  setFamilyForm((p) => ({
                    ...p,
                    qualification: e.target.value,
                  }))
                }
                className="bg-gray-50 border-gray-300"
              />
              <select value={familyForm.profession} onChange={(e) => setFamilyForm((p) => ({ ...p, profession: e.target.value }))} style={{ height: 36, borderRadius: 6, border: '1px solid #D1D5DB', background: '#F9FAFB', padding: '0 10px', fontSize: 14, width: '100%' }}>
                <option value="" disabled>Profession</option>
                <option value="employed">Employed</option>
                <option value="entreprenuer">Entrepreneur</option>
              </select>
              <select value={familyForm.maritalStatus} onChange={(e) => setFamilyForm((p) => ({ ...p, maritalStatus: e.target.value }))} style={{ height: 36, borderRadius: 6, border: '1px solid #D1D5DB', background: '#F9FAFB', padding: '0 10px', fontSize: 14, width: '100%' }}>
                <option value="" disabled>Marital status</option>
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
              </select>
              <Input
                placeholder="Mobile number"
                value={familyForm.mobileNumber}
                onChange={(e) =>
                  setFamilyForm((p) => ({ ...p, mobileNumber: e.target.value }))
                }
                className="bg-gray-50 border-gray-300"
              />
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">
                  Date of Birth
                </Label>
                <Input
                  type="date"
                  value={familyForm.dateOfBirth}
                  onChange={(e) =>
                    setFamilyForm((p) => ({
                      ...p,
                      dateOfBirth: e.target.value,
                    }))
                  }
                  className="bg-gray-50 border-gray-300"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="dependent"
                checked={familyForm.isDependent}
                onCheckedChange={(v) =>
                  setFamilyForm((p) => ({ ...p, isDependent: !!v }))
                }
              />
              <Label
                htmlFor="dependent"
                className="text-sm text-gray-700 cursor-pointer"
              >
                Dependent
              </Label>
            </div>
            {addError && <div className="text-sm text-red-600 whitespace-pre-line">{addError}</div>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFamilyDialog(false)}
                disabled={addSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-white"
                style={{ backgroundColor: T.navy }}
                disabled={addSaving}
              >
                {addSaving ? "Saving..." : "Add Family Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showIdentityDialog} onOpenChange={setShowIdentityDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Sora, sans-serif" }}>
              Add Identity
            </DialogTitle>
            <DialogDescription>
              Add an identity document for this client.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateIdentity} className="space-y-4">
            <div>
              <Label className="text-sm text-gray-700 mb-1.5 block">
                ID Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={identityForm.documentTypeId}
                onValueChange={(v) =>
                  setIdentityForm((p) => ({ ...p, documentTypeId: v }))
                }
              >
                <SelectTrigger className="bg-gray-50 border-gray-300">
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((dt) => (
                    <SelectItem key={dt.id} value={String(dt.id)}>
                      {dt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="ID number *"
              value={identityForm.documentKey}
              onChange={(e) =>
                setIdentityForm((p) => ({ ...p, documentKey: e.target.value }))
              }
              className="bg-gray-50 border-gray-300"
            />
            <Input
              placeholder="Description"
              value={identityForm.description}
              onChange={(e) =>
                setIdentityForm((p) => ({ ...p, description: e.target.value }))
              }
              className="bg-gray-50 border-gray-300"
            />
            {addError && <div className="text-sm text-red-600 whitespace-pre-line">{addError}</div>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowIdentityDialog(false)}
                disabled={addSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-white"
                style={{ backgroundColor: T.navy }}
                disabled={addSaving}
              >
                {addSaving ? "Saving..." : "Add Identity"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Sora, sans-serif" }}>
              Add Document
            </DialogTitle>
            <DialogDescription>
              Upload or register a document for this client.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDocument} className="space-y-4">
            <Input
              placeholder="Document name"
              value={documentForm.name}
              onChange={(e) =>
                setDocumentForm((p) => ({ ...p, name: e.target.value }))
              }
              className="bg-gray-50 border-gray-300"
            />
            <Input
              placeholder="Description"
              value={documentForm.description}
              onChange={(e) =>
                setDocumentForm((p) => ({ ...p, description: e.target.value }))
              }
              className="bg-gray-50 border-gray-300"
            />
            <Input
              type="file"
              onChange={(e) =>
                setDocumentForm((p) => ({
                  ...p,
                  file: e.target.files?.[0] ?? null,
                }))
              }
              className="bg-gray-50 border-gray-300"
            />
            {addError && <div className="text-sm text-red-600 whitespace-pre-line">{addError}</div>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDocumentDialog(false)}
                disabled={addSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-white"
                style={{ backgroundColor: T.navy }}
                disabled={addSaving}
              >
                {addSaving ? "Saving..." : "Add Document"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Deposit Dialog ────────────────────────────────────────────────── */}
      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Sora, sans-serif" }}>
              Deposit
            </DialogTitle>
            <DialogDescription>
              Deposit funds into account{" "}
              <span
                style={{ fontFamily: "DM Mono, monospace", fontWeight: 600 }}
              >
                {depositForm.accountNumber}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="depositAmount"
                  className="text-sm text-gray-700 mb-1.5 block"
                >
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="depositAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={depositForm.transactionAmount}
                  onChange={(e) =>
                    setDepositForm((p) => ({
                      ...p,
                      transactionAmount: e.target.value,
                    }))
                  }
                  className="bg-gray-50 border-gray-300"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700 mb-1.5 block">
                  Payment Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={depositForm.paymentTypeId}
                  onValueChange={(v) =>
                    setDepositForm((p) => ({ ...p, paymentTypeId: v }))
                  }
                >
                  <SelectTrigger className="bg-gray-50 border-gray-300">
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTypes.map((pt) => (
                      <SelectItem key={pt.id} value={String(pt.id)}>
                        {pt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label
                htmlFor="depositDate"
                className="text-sm text-gray-700 mb-1.5 block"
              >
                Transaction Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="depositDate"
                type="date"
                value={depositForm.transactionDate}
                onChange={(e) =>
                  setDepositForm((p) => ({
                    ...p,
                    transactionDate: e.target.value,
                  }))
                }
                className="bg-gray-50 border-gray-300"
              />
            </div>
            <div>
              <Label
                htmlFor="depositNote"
                className="text-sm text-gray-700 mb-1.5 block"
              >
                Note
              </Label>
              <Input
                id="depositNote"
                placeholder="e.g. Cash deposit"
                value={depositForm.note}
                onChange={(e) =>
                  setDepositForm((p) => ({ ...p, note: e.target.value }))
                }
                className="bg-gray-50 border-gray-300"
              />
            </div>
            {depositError && (
              <p className="text-sm text-red-600">{depositError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDepositDialog(false)}
                disabled={depositSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-white"
                style={{ backgroundColor: T.success }}
                disabled={depositSaving}
              >
                {depositSaving ? "Processing..." : "Deposit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Withdrawal Dialog ─────────────────────────────────────────────── */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Sora, sans-serif" }}>
              Withdrawal
            </DialogTitle>
            <DialogDescription>
              Withdraw funds from account{" "}
              <span
                style={{ fontFamily: "DM Mono, monospace", fontWeight: 600 }}
              >
                {withdrawForm.accountNumber}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="withdrawAmount"
                  className="text-sm text-gray-700 mb-1.5 block"
                >
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="withdrawAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={withdrawForm.transactionAmount}
                  onChange={(e) =>
                    setWithdrawForm((p) => ({
                      ...p,
                      transactionAmount: e.target.value,
                    }))
                  }
                  className="bg-gray-50 border-gray-300"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700 mb-1.5 block">
                  Payment Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={withdrawForm.paymentTypeId}
                  onValueChange={(v) =>
                    setWithdrawForm((p) => ({ ...p, paymentTypeId: v }))
                  }
                >
                  <SelectTrigger className="bg-gray-50 border-gray-300">
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTypes.map((pt) => (
                      <SelectItem key={pt.id} value={String(pt.id)}>
                        {pt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label
                htmlFor="withdrawDate"
                className="text-sm text-gray-700 mb-1.5 block"
              >
                Transaction Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="withdrawDate"
                type="date"
                value={withdrawForm.transactionDate}
                onChange={(e) =>
                  setWithdrawForm((p) => ({
                    ...p,
                    transactionDate: e.target.value,
                  }))
                }
                className="bg-gray-50 border-gray-300"
              />
            </div>
            <div>
              <Label
                htmlFor="withdrawNote"
                className="text-sm text-gray-700 mb-1.5 block"
              >
                Note
              </Label>
              <Input
                id="withdrawNote"
                placeholder="e.g. Cash withdrawal"
                value={withdrawForm.note}
                onChange={(e) =>
                  setWithdrawForm((p) => ({ ...p, note: e.target.value }))
                }
                className="bg-gray-50 border-gray-300"
              />
            </div>
            {withdrawError && (
              <p className="text-sm text-red-600">{withdrawError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowWithdrawDialog(false)}
                disabled={withdrawSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-white"
                style={{ backgroundColor: "#DC2626" }}
                disabled={withdrawSaving}
              >
                {withdrawSaving ? "Processing..." : "Withdraw"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Transfer Dialog ───────────────────────────────────────────────── */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Sora, sans-serif" }}>
              Transfer
            </DialogTitle>
            <DialogDescription>
              Transfer funds between accounts.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <Label
                htmlFor="transferFrom"
                className="text-sm text-gray-700 mb-1.5 block"
              >
                From Account <span className="text-red-500">*</span>
              </Label>
              <Input
                id="transferFrom"
                placeholder="Account number"
                value={transferForm.fromAccountNumber}
                onChange={(e) =>
                  setTransferForm((p) => ({
                    ...p,
                    fromAccountNumber: e.target.value,
                  }))
                }
                className="bg-gray-50 border-gray-300 font-mono"
              />
            </div>
            <div>
              <Label
                htmlFor="transferTo"
                className="text-sm text-gray-700 mb-1.5 block"
              >
                To Account <span className="text-red-500">*</span>
              </Label>
              <Input
                id="transferTo"
                placeholder="Account number"
                value={transferForm.toAccountNumber}
                onChange={(e) =>
                  setTransferForm((p) => ({
                    ...p,
                    toAccountNumber: e.target.value,
                  }))
                }
                className="bg-gray-50 border-gray-300 font-mono"
              />
            </div>
            <div>
              <Label
                htmlFor="transferAmount"
                className="text-sm text-gray-700 mb-1.5 block"
              >
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="transferAmount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={transferForm.transferAmount}
                onChange={(e) =>
                  setTransferForm((p) => ({
                    ...p,
                    transferAmount: e.target.value,
                  }))
                }
                className="bg-gray-50 border-gray-300"
              />
            </div>
            <div>
              <Label
                htmlFor="transferDesc"
                className="text-sm text-gray-700 mb-1.5 block"
              >
                Description
              </Label>
              <Input
                id="transferDesc"
                placeholder="e.g. Internal transfer"
                value={transferForm.transferDescription}
                onChange={(e) =>
                  setTransferForm((p) => ({
                    ...p,
                    transferDescription: e.target.value,
                  }))
                }
                className="bg-gray-50 border-gray-300"
              />
            </div>
            <div>
              <Label
                htmlFor="transferRef"
                className="text-sm text-gray-700 mb-1.5 block"
              >
                Reference ID
              </Label>
              <Input
                id="transferRef"
                placeholder="Optional reference"
                value={transferForm.referenceId}
                onChange={(e) =>
                  setTransferForm((p) => ({
                    ...p,
                    referenceId: e.target.value,
                  }))
                }
                className="bg-gray-50 border-gray-300"
              />
            </div>
            {transferError && (
              <p className="text-sm text-red-600">{transferError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTransferDialog(false)}
                disabled={transferSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-white"
                style={{ backgroundColor: "#2563EB" }}
                disabled={transferSaving}
              >
                {transferSaving ? "Processing..." : "Transfer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCreateAccountDialog}
        onOpenChange={setShowCreateAccountDialog}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Sora, sans-serif" }}>
              Create Savings Account
            </DialogTitle>
            <DialogDescription>
              Create a savings account for this client.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <Label
                htmlFor="savingsProduct"
                className="text-sm text-gray-700 mb-1.5 block"
              >
                Savings Product
              </Label>
              <Select
                value={createAccountForm.savingsProduct}
                onValueChange={(v) => {
                  setCreateAccountForm((p) => ({ ...p, savingsProduct: v }));
                  setCreateAccountError("");
                }}
              >
                <SelectTrigger
                  id="savingsProduct"
                  className="bg-gray-50 border-gray-300"
                >
                  <SelectValue
                    placeholder={
                      savingsProductsLoading
                        ? "Loading savings products..."
                        : "Select savings product"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {savingsProducts.map((product) => (
                    <SelectItem key={product.id} value={product.name}>
                      {product.name} ({product.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="submittedOnDate"
                className="text-sm text-gray-700 mb-1.5 block"
              >
                Submitted On Date
              </Label>
              <Input
                id="submittedOnDate"
                type="date"
                value={createAccountForm.submittedOnDate}
                onChange={(e) => {
                  setCreateAccountForm((p) => ({
                    ...p,
                    submittedOnDate: e.target.value,
                  }));
                  setCreateAccountError("");
                }}
                className="bg-gray-50 border-gray-300"
              />
            </div>
            {createAccountError && (
              <p className="text-sm text-red-600">{createAccountError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateAccountDialog(false)}
                disabled={createAccountSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-white"
                style={{ backgroundColor: T.navy }}
                disabled={createAccountSaving}
              >
                {createAccountSaving ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
