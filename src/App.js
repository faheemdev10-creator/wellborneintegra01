import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from './supabaseClient';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  ShieldAlert,
  Megaphone,
  LogOut,
  ChevronRight,
  CheckCircle2,
  X,
  Search,
  Bell,
  Stamp,
  AlertTriangle,
  ClipboardList,
  Boxes,
  Users,
  Building2,
  Inbox as InboxIcon,
  Send,
  Archive,
  Paperclip,
  Eye,
  Lock,
  Workflow,
  Truck,
  Trash2,
  TrendingUp,
  Clock3,
  Sparkles,
  ArrowUpRight,
  Activity,
  Pencil,
  Plus,
  CalendarDays,
  History,
  Filter,
  Upload,
  Layers,
  PackageSearch,
  PauseCircle,
  PlayCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  MapPin,
  MessageSquare,
  Repeat,
  Menu,
  Download,
  FlaskConical,
  Beaker,
  Zap,
  Radar,
  Orbit,
  Gauge,
  Pin,
  Phone,
  PhoneOff,
  PhoneIncoming,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
} from 'lucide-react';

const INK = '#0A1220';
const INK_DEEP = '#040711';
const MIDNIGHT = '#0D1B2E';
const GOLD = '#C9A55C';
const GOLD_LIGHT = '#F2D999';
const GOLD_DEEP = '#8C6A2E';
const CYAN = '#5FE0D0';
const CYAN_DEEP = '#1FA396';
const VIOLET = '#8B7CF6';
const AMBER = '#8A5A24';
const PAPER = '#FAF7EF';
const LINE = '#E9E2D0';
const RED = '#8A2E2E';
const IPQ_RED = '#B23A3A';

// ---------------------------------------------------------------------
// PAGE ACCENTS — one accent colour per department/page, matching the
// colour family each page's own hero banner already uses (violet for
// Documents/New Activity, emerald for the Warehouse "Vault" pages, red
// for Health & Safety, gold for Dashboard/Announcements, teal for the
// Directory). The sidebar and top bar read from this same map so their
// active-state glow always agrees with whatever department the person
// is standing in, instead of staying a fixed colour while the page
// underneath changes theme. `rgb` is the same colour as `c`, spelled
// out as "r,g,b" so it can be dropped into an rgba(...) string for
// soft glows/blobs at any opacity.
// ---------------------------------------------------------------------
const PAGE_ACCENTS = {
  dashboard:     { c: GOLD,      light: GOLD_LIGHT, rgb: '201,165,92'  },
  documents:     { c: VIOLET,    light: '#C9C0FB',  rgb: '139,124,246' },
  new:           { c: VIOLET,    light: '#C9C0FB',  rgb: '139,124,246' },
  inventory:     { c: '#3FBE8E', light: '#9BE8C9',  rgb: '63,190,142'  },
  'warehouse-reports': { c: '#3FBE8E', light: '#9BE8C9', rgb: '63,190,142' },
  production:    { c: '#3FBE8E', light: '#9BE8C9',  rgb: '63,190,142'  },
  hse:           { c: '#E2564C', light: '#F3ABA3',  rgb: '226,86,76'   },
  announcements: { c: GOLD,      light: GOLD_LIGHT, rgb: '201,165,92'  },
  directory:     { c: CYAN_DEEP, light: CYAN,       rgb: '31,163,150'  },
};
const DEFAULT_ACCENT = PAGE_ACCENTS.dashboard;

// Convert a "#rrggbb" (or "#rgb") hex colour into an "r,g,b" string so it
// can be dropped into an rgba(...) glow, exactly like PAGE_ACCENTS.rgb.
function hexToRgbString(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

// The shell's accent (sidebar glow, top bar tint, page wash) for a given
// page/user. Every page except Dashboard has one fixed department colour
// (see PAGE_ACCENTS). Dashboard is different: its own hero already
// colours itself to the *viewing user's* department (see DEPT_THEMES /
// getDeptTheme below — an HSE officer's dashboard is ruby red, a
// Production lead's is citrine amber, and so on), so the shell around it
// needs to pick up that same per-user colour rather than a fixed one —
// otherwise the gold sidebar/top bar fights whatever colour the hero
// actually rendered in, which is exactly the clash to avoid.
function getShellAccent(page, user) {
  if (page === 'dashboard' && user) {
    const t = getDeptTheme(user.dept);
    return { c: t.accent, light: t.ink, rgb: hexToRgbString(t.accent) };
  }
  return PAGE_ACCENTS[page] || DEFAULT_ACCENT;
}

// Every department a document can be routed to. Procurement Manager is new.
const DEPARTMENTS = [
  'Production',
  'QA',
  'QC',
  'Warehouse',
  'HSE',
  'Admin',
  'Plant Manager',
  'Procurement Manager',
];

// ---------------------------------------------------------------------
// MAIN DASHBOARD THEMES — one fully distinct, light & colourful palette
// per department, used ONLY by the main landing Dashboard hero right
// after login (DashboardHero below). Every inner tool page (Warehouse
// Inventory, Production Inventory, HSE records, Directory, etc.) keeps
// its own existing look untouched — this is purely the "front door"
// each department sees when they sign in.
// ---------------------------------------------------------------------
// Dark "jewel vault" palette — each department reads as a different gem
// (citrine, emerald, sapphire, amethyst, ruby, topaz) set in the same
// deep-ink base, instead of the old pale/bright cards. gemA/gemB are the
// two facet colours used by DeptGemBadge; accent/accentDeep still drive
// buttons, pills and small UI the rest of the app already reads off this
// object, so nothing downstream needs to change shape.
const DEPT_THEMES = {
  Production: {
    name: 'Production',
    gem: 'Citrine',
    gradient: 'linear-gradient(135deg, #1A1006 0%, #241605 45%, #120B03 100%)',
    accent: '#F0A93E',
    accentDeep: '#B8781A',
    accentSoft: 'rgba(240,169,62,0.18)',
    ink: '#FBE9C8',
    gemA: '#FFD37A',
    gemB: '#B8781A',
    glowA: 'rgba(240,169,62,0.4)',
    glowB: 'rgba(255,150,60,0.28)',
    glowC: 'rgba(255,210,130,0.22)',
    icon: Workflow,
  },
  QA: {
    name: 'QA',
    gem: 'Emerald',
    gradient: 'linear-gradient(135deg, #071410 0%, #0A1D16 45%, #050D0A 100%)',
    accent: '#39D98A',
    accentDeep: '#189A5B',
    accentSoft: 'rgba(57,217,138,0.18)',
    ink: '#D9F7E7',
    gemA: '#6CF0B0',
    gemB: '#189A5B',
    glowA: 'rgba(57,217,138,0.4)',
    glowB: 'rgba(20,180,120,0.28)',
    glowC: 'rgba(140,240,190,0.2)',
    icon: CheckCircle2,
  },
  QC: {
    name: 'QC',
    gem: 'Amethyst',
    gradient: 'linear-gradient(135deg, #0E0B1C 0%, #150F29 45%, #080614 100%)',
    accent: '#9B8CFF',
    accentDeep: '#5F4FD6',
    accentSoft: 'rgba(155,140,255,0.18)',
    ink: '#E5E1FF',
    gemA: '#C0B4FF',
    gemB: '#5F4FD6',
    glowA: 'rgba(155,140,255,0.42)',
    glowB: 'rgba(110,90,240,0.3)',
    glowC: 'rgba(200,190,255,0.22)',
    icon: FlaskConical,
  },
  Warehouse: {
    name: 'Warehouse',
    gem: 'Aquamarine',
    gradient: 'linear-gradient(135deg, #05171A 0%, #082024 45%, #04100F 100%)',
    accent: '#2FE0C9',
    accentDeep: '#0F9C89',
    accentSoft: 'rgba(47,224,201,0.18)',
    ink: '#D6FBF3',
    gemA: '#7CF3E0',
    gemB: '#0F9C89',
    glowA: 'rgba(47,224,201,0.4)',
    glowB: 'rgba(20,190,165,0.28)',
    glowC: 'rgba(140,245,225,0.2)',
    icon: Boxes,
  },
  HSE: {
    name: 'HSE',
    gem: 'Ruby',
    gradient: 'linear-gradient(135deg, #1B0808 0%, #250B0B 45%, #100404 100%)',
    accent: '#FF5C5C',
    accentDeep: '#B22323',
    accentSoft: 'rgba(255,92,92,0.18)',
    ink: '#FFE1DE',
    gemA: '#FF9A8F',
    gemB: '#B22323',
    glowA: 'rgba(255,92,92,0.42)',
    glowB: 'rgba(230,50,50,0.28)',
    glowC: 'rgba(255,160,150,0.22)',
    icon: ShieldAlert,
  },
  Admin: {
    name: 'Admin',
    gem: 'Iolite',
    gradient: 'linear-gradient(135deg, #0C0B1E 0%, #131028 45%, #070613 100%)',
    accent: '#8B7CF6',
    accentDeep: '#5638C9',
    accentSoft: 'rgba(139,124,246,0.18)',
    ink: '#E4E0FF',
    gemA: '#B4A6FF',
    gemB: '#5638C9',
    glowA: 'rgba(139,124,246,0.42)',
    glowB: 'rgba(100,70,230,0.28)',
    glowC: 'rgba(190,175,255,0.2)',
    icon: Building2,
  },
  'Plant Manager': {
    name: 'Plant Manager',
    gem: 'Imperial Topaz',
    gradient: 'linear-gradient(135deg, #170F03 0%, #201404 45%, #0D0801 100%)',
    accent: GOLD_LIGHT,
    accentDeep: GOLD_DEEP,
    accentSoft: 'rgba(201,165,92,0.2)',
    ink: '#FBF0D6',
    gemA: '#FFE7A8',
    gemB: GOLD_DEEP,
    glowA: 'rgba(242,217,153,0.45)',
    glowB: 'rgba(201,165,92,0.3)',
    glowC: 'rgba(255,232,180,0.22)',
    icon: Gauge,
  },
  'Procurement Manager': {
    name: 'Procurement',
    gem: 'Sapphire',
    gradient: 'linear-gradient(135deg, #060F1C 0%, #091629 45%, #040A14 100%)',
    accent: '#4FB4FF',
    accentDeep: '#1C6FB0',
    accentSoft: 'rgba(79,180,255,0.18)',
    ink: '#DCEEFF',
    gemA: '#9BD4FF',
    gemB: '#1C6FB0',
    glowA: 'rgba(79,180,255,0.42)',
    glowB: 'rgba(30,140,230,0.28)',
    glowC: 'rgba(160,215,255,0.22)',
    icon: Truck,
  },
};
function getDeptTheme(dept) {
  return DEPT_THEMES[dept] || DEPT_THEMES.Admin;
}

// The four storage sections inside Warehouse Inventory. Any department can
// open any section and add/edit/delete items there — this is purely an
// organisational split so everyone knows where a given item lives.
const INVENTORY_CATEGORIES = [
  { key: 'Raw Material', icon: Layers },
  { key: 'Packaging Material', icon: Boxes },
  { key: 'Finished Goods', icon: PackageSearch },
  { key: 'General Items', icon: Archive },
];

// Raw Material is further split into two sub-sections: API's and
// Excipients. Every field (batch, mfg/exp dates, qty, min stock,
// location, full movement history/ledger) works identically to every
// other inventory section — the only difference is this extra layer of
// organisation inside Raw Material. Same permission rule applies: only
// Warehouse can add/edit/delete; every department can view, in real time.
const RAW_MATERIAL_SUBCATEGORIES = [
  { key: 'APIs', label: "API's", icon: FlaskConical },
  { key: 'Excipients', label: 'Excipients', icon: Beaker },
];

// ---------------------------------------------------------------------
// Batch-number normalisation — used everywhere two entries need to be
// recognised as "the same physical batch" even when the product name
// was typed differently (typo, casing, extra spaces). Deliberately does
// NOT touch product name at all: the batch number is the one field
// that's supposed to be an exact, authoritative identifier, so it's the
// only thing merge logic keys off. Trims, upper-cases, and collapses
// internal whitespace/hyphen spacing so "bn 2201", "BN-2201" and
// " Bn2201 " family of typos still line up where that's reasonable —
// but this never guesses across genuinely different batch numbers.
function normBatchNo(b) {
  return (b || '').toString().trim().toUpperCase().replace(/\s+/g, ' ');
}

// Groups a list of items by normalised batch number, returning only the
// groups that actually have more than one entry (i.e. real possible
// duplicates) and that have a non-empty batch number to begin with.
function findDuplicateBatchGroups(items, batchKey) {
  const map = new Map();
  items.forEach((item) => {
    const norm = normBatchNo(item[batchKey]);
    if (!norm) return;
    if (!map.has(norm)) map.set(norm, []);
    map.get(norm).push(item);
  });
  return [...map.values()].filter((group) => group.length > 1);
}

// ---------------------------------------------------------------------
// MergeBatchModal — shared confirmation surface for merging duplicate
// batch entries (same batch number, different name spelling) in both
// Warehouse Inventory and Packing Status. Purely presentational: it
// shows what's being combined and lets the person pick which spelling
// of the name survives, then hands that choice back to the caller,
// which knows how to actually perform the merge for its own data shape.
// ---------------------------------------------------------------------
function MergeBatchModal({ batchNo, items, combinedSummary, onCancel, onConfirm }) {
  const uniqueNames = [...new Set(items.map((it) => it.name).filter(Boolean))];
  const [canonicalName, setCanonicalName] = useState(uniqueNames[0] || '');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!canonicalName.trim()) return;
    setSaving(true);
    await onConfirm(canonicalName.trim());
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 75, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(4,7,17,0.55)', backdropFilter: 'blur(3px)' }} />
      <div className="wb-history-modal" style={{ position: 'relative', background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(4,7,17,0.35)' }}>
        <div style={{ padding: '20px 24px', background: `linear-gradient(120deg, ${INK_DEEP}, ${INK})` }}>
          <p style={{ color: 'rgba(248,244,233,0.55)', fontSize: 11, margin: 0, letterSpacing: '0.06em' }}>MERGE DUPLICATE BATCH</p>
          <h2 className="wb-serif" style={{ color: '#F8F4E9', fontSize: 20, margin: '4px 0 0' }}>Batch {batchNo}</h2>
          <p style={{ color: 'rgba(248,244,233,0.5)', fontSize: 12, margin: '6px 0 0' }}>
            {items.length} entries found under this exact batch number, with different name spellings.
          </p>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {items.map((it) => (
              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', border: `1px solid ${LINE}`, borderRadius: 8, background: PAPER, fontSize: 13 }}>
                <span style={{ color: INK, fontWeight: 500 }}>{it.name || '(blank name)'}</span>
                <span style={{ color: '#7A7460', fontSize: 12 }}>{it.detail}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#8A8370', margin: '0 0 8px' }}>KEEP THIS SPELLING</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {uniqueNames.map((n) => (
              <label key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: INK, cursor: 'pointer' }}>
                <input type="radio" checked={canonicalName === n} onChange={() => setCanonicalName(n)} />
                {n}
              </label>
            ))}
          </div>
          <input
            value={canonicalName}
            onChange={(e) => setCanonicalName(e.target.value)}
            placeholder="Or type the correct name"
            style={{ width: '100%', padding: '9px 10px', border: `1px solid ${LINE}`, borderRadius: 8, boxSizing: 'border-box', fontSize: 13, marginBottom: 16 }}
          />
          <div style={{ background: '#FBF3E3', border: `1px solid ${GOLD}`, borderRadius: 8, padding: '10px 12px', fontSize: 12, color: AMBER, marginBottom: 18 }}>
            After merging: one entry named "{canonicalName || '…'}" — {combinedSummary}. This can't be undone, but the full history of both entries is kept in the ledger.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={saving || !canonicalName.trim()}
              onClick={submit}
              className="wb-btn wb-btn-gold"
              style={{ background: GOLD, color: 'white', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: saving ? 'default' : 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Merging…' : 'Merge into one'}
            </button>
            <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#7A7460', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// For "New Activity", every activity type can be sent to ANY department —
// including QA and QC. (QA/QC are only excluded from the automated
// "Default Company Flow" chain below, not from manual/custom routing.)
const DOC_TYPE_HINTS = {
  'Production Order': [...DEPARTMENTS],
  'New Inventory': [...DEPARTMENTS],
  'New Batch': [...DEPARTMENTS],
  'Work Order': [...DEPARTMENTS],
  'Demand Order': [...DEPARTMENTS],
  'Dispatch Order': [...DEPARTMENTS],
};

// The standard company approval chain used by "Default Company Flow".
// Admin → Plant Manager → Production → Warehouse. QA and QC are NOT part
// of this default chain — they're only ever used via manual/custom routing
// (i.e. through "New Activity" with a department picked directly).
const DEFAULT_FLOW_ORDER = ['Admin', 'Plant Manager', 'Production', 'Warehouse'];

function nextDefaultStep(dept) {
  const idx = DEFAULT_FLOW_ORDER.indexOf(dept);
  if (idx === -1 || idx === DEFAULT_FLOW_ORDER.length - 1) return null;
  return DEFAULT_FLOW_ORDER[idx + 1];
}

// The default flow always funnels through Admin first (unless Admin is the
// one creating it), matching "it moves from Admin, goes directly to Plant
// Manager, then Production…".
function firstDefaultStep(creatorDept) {
  return creatorDept === 'Admin' ? 'Plant Manager' : 'Admin';
}

// Every account has its own username/password so no one can log into
// another department's portal. NOTE: for a real deployment these
// credentials should live behind Supabase Auth rather than in client-side
// code — this is a lightweight gate for an internal LAN tool, not a hard
// security boundary.
const USERS = [
  {
    id: 'u1',
    name: 'Murad Ali',
    dept: 'Production',
    title: 'Production Manager',
    isHead: false,
    username: 'murad.ali',
    password: 'Prod@123',
  },
  {
    id: 'u2',
    name: 'Salman Siraj',
    dept: 'QA',
    title: 'QA Manager',
    isHead: false,
    username: 'salman.siraj',
    password: 'QA@123',
  },
  {
    id: 'u3',
    name: 'Siraj Ahmad',
    dept: 'QC',
    title: 'QC Analyst',
    isHead: false,
    username: 'siraj.ahmad',
    password: 'QC@123',
  },
  {
    id: 'u4',
    name: 'Iftikhar Ahmad',
    dept: 'Warehouse',
    title: 'Warehouse Officer',
    isHead: false,
    username: 'iftikhar.ahmad',
    password: 'Wh@123',
  },
  {
    id: 'u5',
    name: 'Muhammad Faheem Khan',
    dept: 'HSE',
    title: 'HSE Officer',
    isHead: true,
    username: 'faheem.khan',
    password: 'HSE@123',
  },
  {
    id: 'u6',
    name: 'Sohail Akhter',
    dept: 'Admin',
    title: 'Administrator',
    isHead: true,
    username: 'sohail.akhter',
    password: 'Admin@123',
  },
  {
    id: 'u7',
    name: 'Iftikhar Ahmad Khan',
    dept: 'Plant Manager',
    title: 'Plant Manager',
    isHead: true,
    username: 'iftikhar.khan',
    password: 'Plant@123',
  },
  {
    // TODO: swap in the real name — this is a placeholder so the account
    // exists and the workflow works end-to-end.
    id: 'u8',
    name: 'Sakhawat khan',
    dept: 'Procurement Manager',
    title: 'Procurement Manager',
    isHead: false,
    username: 'sakhawat.khan',
    password: 'Proc@123',
  },
];

// Every client-generated id carries a random suffix on top of the
// timestamp so two records created in the same millisecond (two people
// submitting at once, or a fast double-click) never collide on the same
// id — which would otherwise cause a primary-key clash in Supabase and a
// duplicated/blinking row in the UI (and React "two children with the
// same key" warnings).
const nextId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const now = () =>
  new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
const nowISO = () => new Date().toISOString();

// ---------------------------------------------------------------------
// PERFORMANCE — useDebouncedCallback.
// Every realtime subscription in this app reloads its whole table on
// ANY change ('*': insert/update/delete). A single user action often
// fires several of those events back-to-back (e.g. creating a document
// inserts one row, then a follow-up update to its history fires a
// second event moments later) — without debouncing, that was two (or
// more) full `select('*')` reloads plus two full re-renders for what
// the person experienced as one action. This hook collapses a burst of
// calls arriving within `delay` ms into a single call, run once the
// burst settles, without ever needing to add debounce logic by hand at
// every call site.
// ---------------------------------------------------------------------
function useDebouncedCallback(fn, delay = 250) {
  const fnRef = React.useRef(fn);
  const timerRef = React.useRef(null);
  fnRef.current = fn;
  return React.useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        fnRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

// Consistent, compact date+time formatter used anywhere we show a
// timestamp directly in a list/table so nobody has to open a document to
// find out when something happened.
function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const safe = dateStr.length === 7 ? dateStr + '-01' : dateStr;
  const d = new Date(safe + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  });
}

// Full day + month + year — for real calendar dates (a register line's
// DATE field, a dispatch's date), as opposed to formatDate() above,
// which is deliberately month-only because it exists for the
// Manufacturing/Expiry *month* fields elsewhere in Warehouse Inventory.
// Register and dispatch dates come from a type="date" input (a real
// day), so showing them through the month-only formatter was silently
// dropping the day itself — this is the one that keeps it.
function formatFullDate(dateStr) {
  if (!dateStr) return '—';
  const safe = dateStr.length === 7 ? dateStr + '-01' : dateStr;
  const d = new Date(safe + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------
// Notification sounds — synthesised with the Web Audio API so nothing
// extra needs to be bundled or hosted. A short two-note chime covers
// ordinary inbox sends/receives; a longer, richer tune is reserved for
// Warehouse receiving stock straight from Production and for anything
// else that needs "you must act on this" urgency (e.g. accept/reject a
// packing hand-off).
// ---------------------------------------------------------------------
let __wbAudioCtx = null;
function getWbAudioCtx() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!__wbAudioCtx) __wbAudioCtx = new Ctx();
  if (__wbAudioCtx.state === 'suspended') __wbAudioCtx.resume();
  return __wbAudioCtx;
}

function wbPlayTone(ctx, freq, startTime, duration, peakGain, type) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.03);
}

// Short chime — any ordinary inbox send or receive.
// A quick rising four-note run (C5-E5-G5-C6) for energy, but played as
// soft sine tones at a gentle volume with smooth fades so it still
// reads as calm rather than jarring.
function playInboxChime() {
  const ctx = getWbAudioCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    wbPlayTone(ctx, freq, t + i * 0.085, 0.22, 0.12, 'sine');
  });
}

// Soft, warm arrival tune for the post-login welcome splash — a gentle
// ascending run rather than an alert-style chime, since this plays the
// moment someone successfully signs in, not on a notification.
function playWelcomeChime() {
  const ctx = getWbAudioCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const notes = [392, 493.88, 587.33, 783.99]; // G4, B4, D5, G5
  notes.forEach((freq, i) => {
    wbPlayTone(ctx, freq, t + i * 0.13, 0.55, 0.14, i === 3 ? 'triangle' : 'sine');
  });
}

// Time-of-day greeting — reads the device clock at the moment of login
// so the welcome splash always matches when someone is actually
// signing in, department shift or not.
function wbTimeGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Good night';
}

// Long, richer tune — Warehouse receiving directly from Production, or
// any other "you must act on this" arrival (e.g. accept/reject a
// packing hand-off). Deliberately more ornate than the plain chime so
// it reads as more urgent.
function playWarehouseReceiveTune() {
  const ctx = getWbAudioCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
  notes.forEach((freq, i) => {
    wbPlayTone(ctx, freq, t + i * 0.17, 0.32, 0.17, i % 2 ? 'triangle' : 'sine');
  });
}

// A distinct, elegant "phone ringing" tune for department-to-department
// calls — a smooth little triad run rather than a flat two-note beep,
// so a call reads as more premium.
function playLuxuryCallRing() {
  const ctx = getWbAudioCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const notes = [1046.5, 880, 987.77, 1318.5];
  notes.forEach((freq, i) => {
    wbPlayTone(ctx, freq, t + i * 0.16, 0.3, 0.15, 'triangle');
  });
}

// ---------------------------------------------------------------------
// "Keep ringing" — drives the persistent, non-stop notification tune.
// Handed a live "is there still something unresolved" flag on every
// render, this loops the appropriate tune every few seconds for as
// long as that flag stays true — across page navigation, since it's
// mounted once at the root. The moment the flag goes false (the
// specific item was opened, or — for a packing hand-off — accepted /
// rejected) the loop stops on its very next check. No separate
// "silence" toggle exists on purpose: the only way to stop it is to
// resolve the thing it's ringing about.
// ---------------------------------------------------------------------
function usePersistentRing(hasPending, urgent) {
  const genRef = useRef(0);
  const loopingRef = useRef(false);

  useEffect(() => {
    if (hasPending) {
      if (!loopingRef.current) {
        loopingRef.current = true;
        genRef.current += 1;
        const myGeneration = genRef.current;
        const ringOnce = (first) => {
          if (genRef.current !== myGeneration) return;
          if (urgent) playWarehouseReceiveTune();
          else playInboxChime();
          setTimeout(() => ringOnce(false), urgent ? 4200 : 2800);
        };
        ringOnce(true);
      }
    } else {
      loopingRef.current = false;
      genRef.current += 1; // invalidates any in-flight loop
    }
  }, [hasPending, urgent]);
}



// Warehouse Inventory — flags an item as "expiring soon" once its expiry
// date is within 6 months from today (and not already expired, which is
// its own, more urgent case — see isExpired below). Mirrors the existing
// below-minimum-stock flag so both render the same red warning treatment.
const EXPIRY_WARNING_MONTHS = 6;
function isExpiringSoon(expiryStr) {
  if (!expiryStr) return false;
  const safe = expiryStr.length === 7 ? expiryStr + '-01' : expiryStr;
  const exp = new Date(safe + 'T00:00:00');
  if (isNaN(exp.getTime())) return false;
  const warnBy = new Date();
  warnBy.setMonth(warnBy.getMonth() + EXPIRY_WARNING_MONTHS);
  return exp.getTime() >= new Date().setHours(0, 0, 0, 0) && exp <= warnBy;
}
function isExpired(expiryStr) {
  if (!expiryStr) return false;
  const safe = expiryStr.length === 7 ? expiryStr + '-01' : expiryStr;
  const exp = new Date(safe + 'T00:00:00');
  if (isNaN(exp.getTime())) return false;
  return exp.getTime() < new Date().setHours(0, 0, 0, 0);
}

function isSameDay(isoA, isoB) {
  if (!isoA || !isoB) return false;
  const a = new Date(isoA);
  const b = new Date(isoB);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(iso) {
  return isSameDay(iso, new Date().toISOString());
}

// True when the given date falls in the current calendar month/year —
// used by the Warehouse Reports monthly dashboard stats.
function isThisMonth(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// A calendar-month key ("2026-09") for grouping/labelling, and the
// matching helpers used by both the monthly edit-lock below and the
// Monthly Recap report — one canonical way to talk about "which month
// did this happen in" everywhere in Warehouse Reports.
function monthKeyOf(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthLabelOf(key) {
  if (!key) return '';
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
function currentMonthKey() {
  return monthKeyOf(new Date().toISOString());
}
function previousMonthKey(key) {
  const [y, m] = (key || currentMonthKey()).split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return monthKeyOf(d.toISOString());
}

// Key used to group/label a timestamp by calendar day, e.g. "2026-09-03".
function dayKey(iso) {
  if (!iso) return 'unknown';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'unknown';
  return d.toISOString().slice(0, 10);
}

function dayLabel(key) {
  if (key === 'unknown') return 'Undated';
  const d = new Date(key + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Best-available timestamp for a document: its latest history entry,
// falling back to when it was created.
function lastActivityISO(doc) {
  if (doc.history && doc.history.length) {
    const last = doc.history[doc.history.length - 1];
    if (last && last.atISO) return last.atISO;
  }
  return doc.created_at || doc.createdAt || null;
}

// ---------------------------------------------------------------------
// ATTACHMENTS: either a Google Drive link (typed in), or a file uploaded
// straight from the device (phone gallery, WhatsApp download, any
// document) via Supabase Storage. Uploading is the recommended path —
// it removes the Drive "you need access" / 403 problem entirely, because
// the file is served from our own storage bucket instead of relying on a
// Drive sharing setting someone forgot to change.
// ---------------------------------------------------------------------

// Google Drive links: a plain "share" link (…/file/d/ID/view?usp=sharing)
// only opens for other people if the file's sharing setting is "Anyone
// with the link". If it's still set to "Restricted" (the Drive default),
// anyone else who clicks it gets exactly the 403/404-style "You need
// access" error. We can't change that permission from here — only
// whoever owns the file in Google Drive can — but we DO normalize the
// link to Drive's canonical viewer URL so it behaves consistently once
// sharing is set correctly, and we warn the user inline. The real, durable
// fix is to use "Upload from this device" instead, below.
function extractDriveFileId(url) {
  if (!url) return null;
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?(?:export=\w+&)?id=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/[a-z]+\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function normalizeAttachmentUrl(url) {
  const trimmed = (url || '').trim();
  if (!trimmed) return trimmed;
  const fileId = extractDriveFileId(trimmed);
  if (!fileId) return trimmed;
  // Canonical, most-compatible Drive viewer link.
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
}

function isGoogleDriveLink(url) {
  return !!extractDriveFileId(url || '');
}

// Uploads a file (photo, PDF, WhatsApp doc, anything picked from the
// device) to a public Supabase Storage bucket called "attachments" and
// returns its permanent public URL. This bucket must exist and be marked
// Public in the Supabase dashboard (Storage → New bucket → "attachments"
// → Public) — once it is, every uploaded file opens instantly for every
// department, with no sharing setting to forget.
async function uploadFileToStorage(file) {
  if (!file) return null;
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `uploads/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (uploadError) {
    // Surface a much clearer message for the single most common setup
    // mistake: the "attachments" bucket doesn't exist yet in Supabase
    // Storage. Without this, Supabase's raw error ("Bucket not found")
    // leaves no clue about how to actually fix it.
    const msg = (uploadError.message || '').toLowerCase();
    if (msg.includes('bucket not found') || msg.includes('not found')) {
      throw new Error(
        'Storage bucket "attachments" does not exist yet in Supabase. In the Supabase dashboard, go to Storage → New bucket → name it exactly "attachments" → toggle it Public → Save, then try uploading again.'
      );
    }
    throw uploadError;
  }
  const { data } = supabase.storage.from('attachments').getPublicUrl(path);
  return { url: data.publicUrl, name: file.name };
}

// A small, reusable "attach a file" control: lets someone pick a Drive
// link OR upload straight from their device (gallery, WhatsApp, any
// document). Used identically in New Activity and inside a document's
// "Send to another dept." form.
function AttachmentPicker({ attachmentUrl, setAttachmentUrl, fileName, setFileName }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const result = await uploadFileToStorage(file);
      setAttachmentUrl(result.url);
      setFileName(result.name);
    } catch (err) {
      setUploadError(
        err && err.message
          ? err.message
          : 'Upload failed — check the "attachments" storage bucket exists and is Public.'
      );
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <label
        style={{
          fontSize: '12px',
          color: '#5C5646',
          display: 'block',
          marginBottom: '6px',
        }}
      >
        Attach a photo or document
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <label
          className="wb-btn wb-btn-gold"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: GOLD,
            color: 'white',
            border: 'none',
            padding: '9px 14px',
            borderRadius: '6px',
            cursor: uploading ? 'wait' : 'pointer',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
        >
          <Upload size={14} />
          {uploading ? 'Uploading…' : 'Upload from device'}
          <input
            type="file"
            onChange={handleFile}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        {fileName && !uploading && (
          <span
            style={{
              fontSize: '12px',
              color: '#1F4B3F',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <CheckCircle2 size={13} /> {fileName}
          </span>
        )}
      </div>
      <p
        style={{
          color: '#B0AA96',
          fontSize: '11px',
          margin: '0 0 10px',
        }}
      >
        Works with photos from your gallery, images saved from WhatsApp, or
        any document on your phone or computer — no Google account needed.
      </p>
      <p
        style={{
          color: '#8A8370',
          fontSize: '11px',
          margin: '0 0 6px',
          textAlign: 'center',
        }}
      >
        — or paste a Google Drive link instead —
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px',
        }}
      >
        <Paperclip size={14} color="#8A8370" />
        <input
          value={isGoogleDriveLink(attachmentUrl) || !fileName ? attachmentUrl : ''}
          onChange={(e) => {
            setFileName('');
            setAttachmentUrl(e.target.value);
          }}
          placeholder="https://drive.google.com/… (optional)"
          style={{
            flex: 1,
            padding: '8px',
            border: `1px solid ${LINE}`,
            borderRadius: '6px',
            boxSizing: 'border-box',
          }}
        />
      </div>
      {isGoogleDriveLink(attachmentUrl) && (
        <p
          style={{
            color: '#8A8370',
            fontSize: '11px',
            margin: '0 0 10px',
          }}
        >
          Google Drive link detected. In Drive, this file's sharing must be
          set to "Anyone with the link" (Viewer) — otherwise whoever opens
          it will get a 403 "you need access" error, since that permission
          can only be changed by the file's owner in Drive, not from here.
          Uploading the file directly above avoids this entirely.
        </p>
      )}
      {uploadError && (
        <p style={{ color: RED, fontSize: '11px', margin: '0 0 10px' }}>
          {uploadError}
        </p>
      )}
    </div>
  );
}

function currentDeptOf(doc) {
  return doc.status === 'In Progress' || doc.status === 'IPQ'
    ? doc.path[doc.currentIndex]
    : null;
}

// Admin, Plant Manager and HSE are the three roles with full, cross-department
// action rights on documents. Every other department can still SEE where
// every document is — they just can't act on one that isn't theirs, which
// DocDrawer's canAct enforces. (Inventory, HSE and Announcements each have
// their own, separate access rules — see those sections.)
function canSeeEverything(user) {
  return !!user.isHead;
}

// The company-wide "All Departments — Live Activity" board on the
// dashboard is restricted to the Plant Manager only — every other
// department (including HSE and Admin) sees their own normal dashboard
// without it.
function canSeeLiveActivityBoard(user) {
  return user.dept === 'Plant Manager';
}

// The Plant Manager also gets a compact, live Packing Status
// snapshot right on the dashboard — active/completed batches, any Daily
// Packing entries on IPQ hold, and today's Warehouse transfers — so
// production status is visible without leaving the dashboard. See
// ProductionSnapshotCard below.
function canSeeProductionSnapshot(user) {
  return user.dept === 'Plant Manager';
}

// ---------------------------------------------------------------------
// WAREHOUSE INVENTORY PERMISSIONS
// Only the Warehouse department may add, edit, delete, receive, issue,
// adjust, or transfer stock, manage batches, or otherwise change any
// inventory record — including both Raw Material sub-sections (API's
// and Excipients). Every other department (Production, QA, QC, HSE,
// Procurement Manager, Plant Manager, Admin, and any future department)
// gets full read/search/history access but is strictly view-only.
//
// This check is applied in TWO places, by design:
//   1. UI level (InventoryPage) — hides/disables every editing control
//      for anyone who isn't Warehouse.
//   2. Application logic level (the handleAddInventory / handleEditInventory /
//      handleDeleteInventory functions in App, below) — refuses the
//      mutation even if it were somehow triggered without going through
//      the UI (e.g. a modified client, devtools, a stray button).
//
// For real defense-in-depth this MUST also be enforced at the database
// layer via Supabase Row Level Security, which the UI/app-logic checks
// alone cannot guarantee (a user could in principle call the Supabase
// client directly with the anon key). Because this app currently
// authenticates with a single shared anon key rather than per-user
// Supabase Auth sessions, RLS can't yet key off "which department is
// this request from" — that requires wiring department logins through
// Supabase Auth (e.g. custom JWT claims or a `profiles` table keyed by
// `auth.uid()`) so policies can reference `auth.jwt()`. Once that's in
// place, apply policies along these lines in the Supabase SQL editor:
//
//   alter table inventory enable row level security;
//
//   create policy "Everyone can view inventory"
//     on inventory for select
//     using (true);
//
//   create policy "Only Warehouse can insert inventory"
//     on inventory for insert
//     with check (auth.jwt() ->> 'department' = 'Warehouse');
//
//   create policy "Only Warehouse can update inventory"
//     on inventory for update
//     using (auth.jwt() ->> 'department' = 'Warehouse')
//     with check (auth.jwt() ->> 'department' = 'Warehouse');
//
//   create policy "Only Warehouse can delete inventory"
//     on inventory for delete
//     using (auth.jwt() ->> 'department' = 'Warehouse');
//
// Until per-department Supabase Auth is wired up, the app-logic check
// below is the strongest enforcement available and should not be
// removed even once RLS is added — keep both layers.
function canManageInventory(user) {
  return user.dept === 'Warehouse';
}

// ---------------------------------------------------------------------
// MONTHLY EDIT LOCK — Warehouse can still add/edit/delete freely, but
// only for records whose most recent activity happened THIS calendar
// month. Once the month turns over, that record is closed — same as a
// page in a bound stock register can't be re-written once the month's
// page is turned. Recording a fresh action against it (a top-up, a new
// register line) this month unlocks it again; this never blocks adding
// something brand new, since a new item/row's own activity is always
// "now". Applied in two places: WarehouseInventoryPage's own item rows
// (keyed off the item's last history entry / created_at) and each
// register line inside WarehouseRegisterPage (keyed off that line's own
// Date field) — see isItemLockedForEdit / isRegisterRowLocked below.
// ---------------------------------------------------------------------
function itemLastActivityISO(item) {
  const hist = Array.isArray(item.history) ? item.history : [];
  if (hist.length) {
    const last = hist[hist.length - 1];
    return last.atISO || last.at;
  }
  return item.created_at;
}
function isItemLockedForEdit(item) {
  return !isThisMonth(itemLastActivityISO(item));
}
function isRegisterRowLocked(row) {
  return !!(row && row.date) && !isThisMonth(row.date);
}

// ---------------------------------------------------------------------
// Packing Status PERMISSIONS
// Packing Status (ProductionInventoryPage) is a separate module
// from Warehouse Inventory above — Production logs daily packing and
// sends completed batches to Warehouse, which then accepts/rejects them
// into stock. Every department can now VIEW this page (search, filter,
// open history, export CSV) — the same "everyone can see it, only the
// owning department can change it" pattern already used for Warehouse
// Inventory and HSE. Mutation rights are unchanged and still enforced
// separately, in both places they always were:
//   - canManageProduction(user) — only Production can log/edit/delete
//     Daily Packing entries or toggle IPQ.
//   - canReceiveWarehouse(user) — only Warehouse can accept/reject an
//     incoming transfer.
// Everyone else (QA, QC, HSE, Procurement Manager, and now everyone in
// general) is strictly read-only here.
// ---------------------------------------------------------------------
function canSeeProductionInventory(user) {
  return true;
}
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------
// RESPONSIVE HELPER — a tiny hook that tracks whether the viewport is at
// or below a mobile breakpoint, using matchMedia so it updates live on
// resize / device rotation. Used anywhere layout needs a genuinely
// different (not just narrower) arrangement on a phone — collapsing a
// grid to one column, swapping the sidebar for a slide-in drawer, etc.
// Purely CSS-driven responsiveness (media queries in PremiumStyles)
// handles everything else; this hook is only for the handful of spots
// using inline gridTemplateColumns / layout objects that CSS classes
// can't reach.
// ---------------------------------------------------------------------
function useIsMobile(breakpoint = 860) {
  const query = `(max-width: ${breakpoint}px)`;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );
  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setIsMobile(e.matches);
    if (mql.addEventListener) mql.addEventListener('change', handler);
    else mql.addListener(handler);
    setIsMobile(mql.matches);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler);
      else mql.removeListener(handler);
    };
  }, [query]);
  return isMobile;
}

// ---------------------------------------------------------------------
// LUXURY COUNT-UP — animates a number from 0 up to its target whenever
// the target changes, using a short eased tween. Used on every headline
// statistic (dashboard tiles, Packing Status snapshot tiles) so values
// arrive with a refined, deliberate motion instead of popping in flat.
// ---------------------------------------------------------------------
function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(target);
  const prevRef = React.useRef(target);
  React.useEffect(() => {
    const from = prevRef.current;
    const to = Number(target) || 0;
    if (from === to) return;

    // Anyone who has asked their OS for reduced motion gets the final
    // number immediately rather than a tween.
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      prevRef.current = to;
      setValue(to);
      return;
    }

    let raf;
    // The tween rounds to whole numbers, so on a short count (say 3 -> 5)
    // most frames produce the value the previous frame already produced.
    // Tracking the last emitted integer and skipping the setState when it
    // has not changed avoids a pile of no-op re-renders per second, per
    // tile, which matters once several tiles animate at once.
    let lastEmitted = from;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = Math.round(from + (to - from) * eased);
      if (next !== lastEmitted) {
        lastEmitted = next;
        setValue(next);
      }
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        prevRef.current = to;
        if (lastEmitted !== to) setValue(to);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => raf && cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function StatusPill({ status }) {
  const map = {
    'In Progress': { bg: '#FBF3E3', fg: AMBER, dot: GOLD },
    Completed: { bg: '#E9F3EC', fg: '#1F4B3F', dot: '#2E6E5B' },
    Open: { bg: '#FBF3E3', fg: AMBER, dot: GOLD },
    Closed: { bg: '#E9F3EC', fg: '#1F4B3F', dot: '#2E6E5B' },
    IPQ: { bg: '#FBEAEA', fg: IPQ_RED, dot: IPQ_RED },
  };
  const s = map[status] || map['In Progress'];
  return (
    <span
      style={{ background: s.bg, color: s.fg }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
    >
      <span
        style={{ background: s.dot }}
        className="w-1.5 h-1.5 rounded-full"
      />
      {status === 'IPQ' ? 'IPQ — Holding' : status}
    </span>
  );
}

function RiskBadge({ level }) {
  const map = { High: '#8A2E2E', Medium: '#7A4A1E', Low: '#1F4B3F' };
  return (
    <span
      style={{ color: map[level] || INK, borderColor: map[level] || INK }}
      className="text-xs font-mono font-medium px-2 py-0.5 rounded border"
    >
      {level}
    </span>
  );
}

function Seal({ filled, active, size = 32, ipq = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle
        cx="20"
        cy="20"
        r="17"
        stroke={ipq ? IPQ_RED : active ? GOLD : filled ? GOLD : '#C9C2AE'}
        strokeWidth={filled || active || ipq ? 2 : 1.4}
        fill={ipq ? '#3A1414' : filled ? INK : 'white'}
      />
      {filled && !ipq && (
        <circle cx="20" cy="20" r="12" stroke={GOLD_LIGHT} strokeWidth="0.8" />
      )}
      {ipq ? (
        <path
          d="M16 14v12M24 14v12"
          stroke="#F0B4B4"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      ) : filled ? (
        <path
          d="M13 20.5l4.5 4.5L27 15"
          stroke={GOLD_LIGHT}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <circle cx="20" cy="20" r="3" fill={active ? GOLD : '#D8D2C0'} />
      )}
    </svg>
  );
}

// A single visual timeline of every step a document has actually taken so
// far — every history entry, in order, until it's marked Completed. This is
// what shows on EVERY document (not just default-flow ones).
function HistoryTimeline({ doc }) {
  return (
    <div>
      {doc.history.map((h, i) => {
        const isLast = i === doc.history.length - 1;
        const isSystem = h.dept === 'System';
        const isIpqEntry = h.ipq === true;
        return (
          <div key={i} style={{ display: 'flex', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  marginTop: '4px',
                  background: isIpqEntry
                    ? IPQ_RED
                    : isSystem
                    ? GOLD_LIGHT
                    : doc.status === 'Completed' || !isLast
                    ? '#2E6E5B'
                    : GOLD,
                  flexShrink: 0,
                }}
              />
              {!isLast && (
                <div
                  style={{
                    width: '1px',
                    flex: 1,
                    background: LINE,
                    minHeight: '18px',
                  }}
                />
              )}
            </div>
            <div style={{ paddingBottom: '14px' }}>
              <p style={{ color: isIpqEntry ? IPQ_RED : INK, fontSize: '13px', margin: 0 }}>
                {isSystem ? (
                  <i style={{ color: '#7A7460' }}>{h.action}</i>
                ) : (
                  <>
                    <b>{h.user}</b> ({h.dept}) — {h.action}
                  </>
                )}
              </p>
              <p style={{ color: '#B0AA96', fontSize: '11px', margin: 0 }}>
                {h.at}
              </p>
            </div>
          </div>
        );
      })}
      {doc.status === 'Completed' && (
        <div style={{ display: 'flex', gap: '10px' }}>
          <div
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              marginTop: '4px',
              background: '#2E6E5B',
            }}
          />
          <p
            style={{
              color: '#1F4B3F',
              fontSize: '13px',
              margin: 0,
              fontWeight: 500,
            }}
          >
            Closed — fully completed
          </p>
        </div>
      )}
    </div>
  );
}

// The "beautiful" full-chain progress tracker for documents using the
// Default Company Flow: every stage of the standard chain is shown — done,
// current, or still upcoming — not just the steps already travelled.
function DefaultFlowTracker({ doc }) {
  const current = currentDeptOf(doc);
  const isIpq = doc.status === 'IPQ';
  const stages = [
    { key: 'Admin', label: 'Admin' },
    { key: 'Plant Manager', label: 'Plant Mgr' },
    { key: 'Production', label: 'Production' },
    { key: 'Warehouse', label: 'Warehouse' },
  ];
  if (doc.path.includes('Procurement Manager')) {
    stages.push({ key: 'Procurement Manager', label: 'Procurement' });
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        alignItems: 'flex-start',
        rowGap: '16px',
      }}
    >
      {stages.map((s, i) => {
        const passedIdx = doc.path.lastIndexOf(s.key);
        const isCurrent = current === s.key;
        const done =
          passedIdx !== -1 &&
          (passedIdx < doc.currentIndex || doc.status === 'Completed');
        const status = done ? 'done' : isCurrent ? 'current' : 'upcoming';
        const filled = status === 'done';
        const active = status === 'current' && !isIpq;
        const ipqHere = status === 'current' && isIpq;
        return (
          <React.Fragment key={s.key}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                minWidth: '76px',
              }}
            >
              <Seal filled={filled} active={active} ipq={ipqHere} size={30} />
              <span
                style={{
                  fontSize: '11px',
                  color: ipqHere ? IPQ_RED : active ? GOLD : filled ? INK : '#9C9585',
                  textAlign: 'center',
                  fontWeight: active || ipqHere ? 600 : 400,
                }}
              >
                {s.label}
                {ipqHere ? ' (IPQ)' : ''}
              </span>
            </div>
            {i < stages.length - 1 && (
              <ChevronRight
                size={14}
                color="#D8D2C0"
                style={{ marginTop: '8px', flexShrink: 0 }}
              />
            )}
          </React.Fragment>
        );
      })}
      <ChevronRight
        size={14}
        color="#D8D2C0"
        style={{ marginTop: '8px', flexShrink: 0 }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          minWidth: '76px',
        }}
      >
        <Seal filled={doc.status === 'Completed'} active={false} size={30} />
        <span
          style={{
            fontSize: '11px',
            color: doc.status === 'Completed' ? INK : '#9C9585',
            textAlign: 'center',
          }}
        >
          Closed
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// WELCOME SPLASH — shown for a couple of seconds right after a
// successful sign-in, before the person lands on their dashboard.
// Greets them by first name with a time-of-day greeting (reads the
// device clock at the moment of login, not a fixed message) plus a
// soft rising chime, then hands off to onLogin automatically. A "Skip"
// affordance lets anyone in a hurry click straight through.
// ---------------------------------------------------------------------
function WelcomeSplash({ user, onDone }) {
  const greeting = useMemo(() => wbTimeGreeting(), []);
  const firstName = (user.name || '').split(' ')[0];

  useEffect(() => {
    playWelcomeChime();
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="wb-login-stage wb-welcome-stage">
      <div className="wb-login-gridlines" />
      <div className="wb-login-aurora wb-login-aurora-a" />
      <div className="wb-login-aurora wb-login-aurora-b" />
      <div className="wb-login-aurora wb-login-aurora-c" />
      <div className="wb-login-grain" />
      <div className="wb-orbit-field">
        <span className="wb-orbit-dot wb-orbit-dot-1" />
        <span className="wb-orbit-dot wb-orbit-dot-2" />
        <span className="wb-orbit-dot wb-orbit-dot-3" />
      </div>
      <div className="wb-welcome-content" onClick={onDone} role="button" tabIndex={0}>
        <div className="wb-welcome-mark wb-crest">
          <Sparkles size={26} color={INK_DEEP} />
        </div>
        <p className="wb-welcome-greeting">{greeting}, {firstName}</p>
        <h1 className="wb-serif wb-welcome-title">Welcome to Wellborne Integra</h1>
        <p className="wb-welcome-dept">{user.dept}{user.title ? ` · ${user.title}` : ''}</p>
        <p className="wb-welcome-skip">Click anywhere to continue</p>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [welcomeUser, setWelcomeUser] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    const match = USERS.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        u.password === password
    );
    if (!match) {
      setError('Incorrect username or password.');
      return;
    }
    setError('');
    // Hold on the welcome splash for a beat before handing off to
    // onLogin — WelcomeSplash below fires the chime and the timed
    // hand-off itself.
    setWelcomeUser(match);
  };

  if (welcomeUser) {
    return <WelcomeSplash user={welcomeUser} onDone={() => onLogin(welcomeUser)} />;
  }

  return (
    <div className="wb-login-stage">
      <div className="wb-login-gridlines" />
      <div className="wb-login-aurora wb-login-aurora-a" />
      <div className="wb-login-aurora wb-login-aurora-b" />
      <div className="wb-login-aurora wb-login-aurora-c" />
      {/* Slow diagonal shafts of light crossing the stage. Three of them at
          different widths, speeds and negative delays, so the pattern never
          visibly loops back to a starting position. */}
      <div className="wb-login-beams">
        <span className="wb-login-beam wb-login-beam-1" />
        <span className="wb-login-beam wb-login-beam-2" />
        <span className="wb-login-beam wb-login-beam-3" />
      </div>
      {/* A drifting starfield drawn entirely with box-shadow on three nodes
          rather than ~40 separate elements — the whole field costs three
          composited layers, so it stays smooth on low-end hardware. */}
      <div className="wb-login-stars wb-login-stars-1" />
      <div className="wb-login-stars wb-login-stars-2" />
      <div className="wb-login-stars wb-login-stars-3" />
      <div className="wb-login-vignette" />
      <div className="wb-login-grain" />
      <div className="wb-orbit-field">
        <span className="wb-orbit-dot wb-orbit-dot-1" />
        <span className="wb-orbit-dot wb-orbit-dot-2" />
        <span className="wb-orbit-dot wb-orbit-dot-3" />
        <span className="wb-orbit-dot wb-orbit-dot-4" />
        <span className="wb-orbit-dot wb-orbit-dot-5" />
      </div>
      <div className="wb-login-wrap">
        <div className="wb-login-brand">
          <div className="wb-login-crest-stack">
            <span className="wb-login-halo wb-login-halo-a" />
            <span className="wb-login-halo wb-login-halo-b" />
            <div className="wb-login-mark wb-crest">
              <Sparkles size={24} color={INK_DEEP} />
            </div>
          </div>
          <div className="wb-login-wordmark wb-serif">Wellborne</div>
          <div className="wb-login-sub">INTEGRA</div>
          <div className="wb-login-rule" />
          <p className="wb-login-tag">Sign in with your department account</p>
        </div>

        <form onSubmit={submit} className="wb-login-card">
          <span className="wb-login-card-sheen" />
          <label className="wb-login-label wb-login-stagger" style={{ '--d': '0.30s' }}>Username</label>
          <div className="wb-login-field wb-login-stagger" style={{ '--d': '0.34s' }}>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. faheem.khan"
              className="wb-login-input"
            />
          </div>

          <label className="wb-login-label wb-login-stagger" style={{ '--d': '0.40s' }}>Password</label>
          <div className="wb-login-field wb-login-stagger" style={{ '--d': '0.44s' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="wb-login-input"
            />
          </div>

          {error && <p className="wb-login-error">{error}</p>}

          <button type="submit" className="wb-login-submit wb-login-stagger" style={{ '--d': '0.52s' }}>
            <span>Sign in</span>
            <ChevronRight size={16} />
          </button>

          <p className="wb-login-note">
            <Lock size={12} /> Each department has its own login — accounts
            can't see each other's credentials.
          </p>
        </form>

        <p className="wb-login-footer">Wellborne Integra · Enterprise Operations Platform</p>
      </div>
    </div>
  );
}

function Sidebar({ user, page, setPage, onLogout, inboxCount, mobileOpen, onCloseMobile }) {
  const isMobile = useIsMobile();
  // The whole shell (sidebar + top bar) tints softly to whichever
  // department is currently open, so it never reads as a fixed navy
  // frame pasted over a differently-coloured page.
  const activeAccent = getShellAccent(page, user);

  const navigate = (key) => {
    setPage(key);
    if (isMobile && onCloseMobile) onCloseMobile();
  };

  const item = (key, label, Icon, show = true, badge) => {
    if (!show) return false;
    // Every item glows in ITS OWN department's colour (not just whichever
    // page happens to be active) — so the sidebar itself reads as a small
    // legend of every department's identity, and the active row's colour
    // always matches the page underneath it.
    const itemAccent = getShellAccent(key, user);
    const active = page === key;
    return (
      <button
        key={key}
        onClick={() => navigate(key)}
        className="wb-nav-btn"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          textAlign: 'left',
          border: 'none',
          cursor: 'pointer',
          background: active
            ? `linear-gradient(90deg, rgba(${itemAccent.rgb},0.20) 0%, rgba(${itemAccent.rgb},0.03) 100%)`
            : 'transparent',
          color: active ? itemAccent.light : 'rgba(248,244,233,0.68)',
          boxShadow: active ? `inset 2px 0 0 0 ${itemAccent.c}, 0 0 16px -6px rgba(${itemAccent.rgb},0.65)` : 'none',
        }}
      >
        <Icon size={16} color={active ? itemAccent.light : 'currentColor'} />
        <span style={{ flex: 1 }}>{label}</span>
        {!!badge && (
          <span
            className="wb-nav-badge"
            style={{
              background: `linear-gradient(120deg, ${itemAccent.c}, ${itemAccent.light})`,
              color: INK_DEEP,
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '10px',
              boxShadow: `0 0 10px rgba(${itemAccent.rgb},0.55)`,
            }}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      className="wb-sidebar"
      style={{
        background: `linear-gradient(185deg, ${INK_DEEP} 0%, ${MIDNIGHT} 100%)`,
        width: '256px',
        height: '100vh',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        zIndex: isMobile ? 300 : 'auto',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 12px',
        borderRight: `1px solid rgba(${activeAccent.rgb},0.16)`,
        overflow: 'hidden',
        transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: isMobile
          ? 'transform 0.28s cubic-bezier(0.16,1,0.3,1)'
          : 'border-color 0.6s ease',
        boxShadow: isMobile && mobileOpen ? '18px 0 44px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      {/* Ambient department glow — a soft, slowly-drifting bloom in the  */}
      {/* current page's accent colour, low enough opacity to stay a     */}
      {/* mood rather than a distraction. Colour crossfades smoothly     */}
      {/* whenever `page` changes, thanks to the transition below.       */}
      <div
        className="wb-sidebar-glow"
        style={{
          background: `radial-gradient(circle, rgba(${activeAccent.rgb},0.5) 0%, rgba(${activeAccent.rgb},0) 70%)`,
          transition: 'background 0.6s ease',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            className="wb-crest"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(242,217,153,0.4)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={14} color={INK_DEEP} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span
              className="wb-serif"
              style={{
                color: '#F8F4E9',
                fontSize: '18px',
                letterSpacing: '0.03em',
              }}
            >
              Wellborne
            </span>
            <span
              style={{
                color: 'rgba(242,217,153,0.75)',
                fontSize: '9px',
                letterSpacing: '0.28em',
              }}
            >
              INTEGRA
            </span>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={onCloseMobile}
            aria-label="Close menu"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <X size={16} color="#F8F4E9" />
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {item('dashboard', 'Dashboard', LayoutDashboard)}
        {item('documents', 'In process', FileText, true, inboxCount)}
        {item('new', 'New Activity', PlusCircle)}
        {/* Warehouse Inventory is visible company-wide — every department,
            including QA and QC, can see current stock live; only the
            Warehouse department can add/edit/remove items (enforced
            inside InventoryPage and canManageInventory). */}
        {item('inventory', 'Warehouse Inventory', Boxes, true)}
        {/* Warehouse Reports mirrors every category/sub-category that
            exists inside Warehouse Inventory and renders each item's
            movement ledger as a classic bound "Stock (Inward & Outward)
            Register" page. Items and their movements are pulled straight
            from the same inventory records, so anything added/issued in
            Warehouse Inventory shows up here automatically — nothing
            extra to sync. Visible to every department; only Warehouse
            can add, edit, or remove the register's own annotations
            (Folio/Remarks, Max Level, Rate, manual note lines) — see
            canManageInventory() and WarehouseReportsPage below. */}
        {item('warehouse-reports', 'Warehouse Reports', ClipboardList, true)}
        {/* Packing Status is its own module (daily packing entries,
            batches, and Production → Warehouse transfers). Visible to
            every department now — only Production can log/edit/delete
            Daily Packing or toggle IPQ, and only Warehouse can accept/
            reject a transfer; everyone else gets a read-only view. */}
        {item('production', 'Packing Status', PackageSearch, canSeeProductionInventory(user))}
        {/* Health & Safety is likewise visible to everyone; only the HSE
            department can add, edit or remove records (enforced inside
            HSEPage). */}
        {item('hse', 'Health & Safety', ShieldAlert, true)}
        {item('announcements', 'Announcements', Megaphone)}
        {item('directory', 'Department Directory', Users)}
      </div>
      <div style={{ marginTop: 'auto', padding: '0 12px' }}>
        <div
          style={{
            borderTop: '1px solid rgba(242,217,153,0.14)',
            paddingTop: '16px',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${INK} 0%, ${INK_DEEP} 100%)`,
                border: `1px solid ${GOLD}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: GOLD_LIGHT,
                fontSize: '11px',
                flexShrink: 0,
              }}
            >
              {user.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  color: '#F8F4E9',
                  fontSize: '13px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.name}
              </div>
              <div style={{ color: 'rgba(248,244,233,0.45)', fontSize: '11px' }}>
                {user.title}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="wb-nav-btn"
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(248,244,233,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 0',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
}

// The notifications dropdown used to be a plain position:absolute child of
// the bell button's wrapper. That wrapper sits inside a div carrying
// `zIndex: 1`, and any positioned element with a z-index creates a stacking
// context — so the panel's own z-index:301 meant nothing outside of it, and
// it was painted underneath page content and clipped by ancestors. That is
// the "notification bar is being hidden" bug.
//
// The durable fix is to stop fighting the ancestor chain: render the panel
// into document.body through a portal and position it with position:fixed
// against the bell's real on-screen rectangle. Nothing above it in the tree
// can clip it or out-paint it anymore, on any page.
function NotificationPanel({ items, onSelect, onClose, anchorRef }) {
  const [pos, setPos] = useState(null);

  React.useLayoutEffect(() => {
    const place = () => {
      const el = anchorRef && anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const width = Math.min(340, vw - 24);
      // Prefer right-aligning under the bell, then clamp so it can never
      // run off either edge of a narrow phone screen.
      let left = r.right - width;
      if (left < 12) left = 12;
      if (left + width > vw - 12) left = vw - 12 - width;
      const top = r.bottom + 10;
      setPos({
        top,
        left,
        width,
        maxHeight: Math.max(180, window.innerHeight - top - 16),
      });
    };
    place();
    window.addEventListener('resize', place);
    // Capture phase so it also tracks scrolling of inner containers.
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchorRef, items.length]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 2400, background: 'transparent' }}
      />
      <div
        className="wb-notif-panel"
        role="dialog"
        aria-label="Notifications"
        style={{
          position: 'fixed',
          top: pos ? `${pos.top}px` : '-9999px',
          left: pos ? `${pos.left}px` : '-9999px',
          width: pos ? `${pos.width}px` : '340px',
          maxHeight: pos ? `${pos.maxHeight}px` : '420px',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          background: '#FFFDF8',
          border: `1px solid ${LINE}`,
          borderRadius: '14px',
          boxShadow: '0 24px 60px rgba(10,18,32,0.30), 0 0 0 1px rgba(201,165,92,0.20)',
          zIndex: 2401,
          opacity: pos ? 1 : 0,
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderBottom: `1px solid ${LINE}`,
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: '#1F2937',
          }}
        >
          Notifications{items.length > 0 ? ` (${items.length})` : ''}
        </div>
        {items.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: '12.5px', color: '#8A8578' }}>
            You're all caught up.
          </div>
        ) : (
          items.map(({ doc, urgent }) => (
            <button
              key={doc.id}
              onClick={() => onSelect(doc)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                border: 'none',
                borderBottom: `1px solid ${LINE}`,
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: urgent ? '#B23A3A' : GOLD_LIGHT,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1F2937', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.title || doc.type || 'Document'}
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#8A8578', marginTop: '3px', paddingLeft: '15px' }}>
                {urgent ? 'Awaiting Accept / Reject — ' : 'New arrival — '}
                {doc.id}
              </div>
            </button>
          ))
        )}
      </div>
    </>,
    document.body
  );
}

function TopBar({ title, accent, user, onMenuClick, onOpenCall, callActive, ringing, onOpenInbox, notifPanelOpen, notificationItems, onToggleNotif, onSelectNotifItem, onCloseNotifPanel }) {
  const a = accent || DEFAULT_ACCENT;
  const bellRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [fsAnimate, setFsAnimate] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    // The little rotate-and-settle animation on this button is defined
    // only inside the ≤860px media query below, so on desktop this class
    // is added the same way but simply has no matching keyframes — the
    // click just does its job with no visual flourish there.
    setFsAnimate(true);
    setTimeout(() => setFsAnimate(false), 420);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div
      className="wb-topbar-luxe"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 32px',
        gap: '12px',
        boxShadow: `inset 0 -1px 0 rgba(${a.rgb},0.4), 0 6px 20px rgba(4,7,17,0.18)`,
        transition: 'box-shadow 0.6s ease',
      }}
    >
      <div className="wb-topbar-luxe-sweep-wrap">
        <div className="wb-topbar-luxe-sweep" style={{ background: `linear-gradient(100deg, transparent 35%, rgba(${a.rgb},0.14) 48%, rgba(${a.rgb},0.26) 50%, rgba(${a.rgb},0.14) 52%, transparent 65%)`, transition: 'background 0.6s ease' }} />
      </div>
      {/* A thin animated comet of light along the very bottom edge, in   */}
      {/* the active department's colour — the one detail that makes    */}
      {/* the top bar feel like it belongs to whatever page is open      */}
      {/* beneath it, rather than a fixed bar sitting on top of it.      */}
      <div className="wb-topbar-underglow-wrap">
        <div className="wb-topbar-underglow" style={{ background: `linear-gradient(90deg, transparent, ${a.light}, ${a.c}, ${a.light}, transparent)`, transition: 'background 0.6s ease' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, position: 'relative', zIndex: 1 }}>
        <button
          onClick={onMenuClick}
          className="wb-hamburger-btn wb-topbar-luxe-menu"
          aria-label="Open menu"
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '9px',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Menu size={17} color={a.light} />
        </button>
        <h1
          className="wb-serif wb-topbar-luxe-title"
          style={{
            fontSize: '25px',
            margin: 0,
            letterSpacing: '0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: a.light,
            textShadow: `0 0 18px rgba(${a.rgb},0.3)`,
            transition: 'color 0.6s ease, text-shadow 0.6s ease',
          }}
        >
          {title}
        </h1>
      </div>
      <div className="wb-topbar-luxe-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <button
          onClick={toggleFullscreen}
          className={`wb-topbar-luxe-icon-btn${fsAnimate ? ' wb-fullscreen-btn-animate' : ''}`}
          aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
          title={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
        >
          {isFullscreen ? <Minimize2 size={16} color={a.light} /> : <Maximize2 size={16} color={a.light} />}
        </button>
        {onOpenCall && (
          <button
            onClick={onOpenCall}
            className={`wb-topbar-luxe-icon-btn${callActive ? ' wb-icon-btn-active' : ''}`}
            aria-label="Call a department"
            title="Call a department"
          >
            <Phone size={16} color={callActive ? '#FF8A80' : a.light} />
          </button>
        )}
        {onOpenInbox && (
          <div style={{ position: 'relative' }}>
            <button
              ref={bellRef}
              onClick={onToggleNotif || onOpenInbox}
              className={`wb-topbar-luxe-icon-btn${ringing ? ' wb-icon-btn-active' : ''}`}
              aria-label={ringing ? 'New arrival — open notifications' : 'Notifications'}
              title={ringing ? 'New arrival — open notifications' : 'Notifications'}
              style={{ position: 'relative' }}
            >
              <Bell size={16} color={ringing ? '#FF8A80' : a.light} className={ringing ? 'wb-bell-ring' : ''} />
              {notificationItems && notificationItems.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    minWidth: '15px',
                    height: '15px',
                    padding: '0 3px',
                    borderRadius: '999px',
                    background: '#B23A3A',
                    color: '#fff',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    lineHeight: '15px',
                    textAlign: 'center',
                  }}
                >
                  {notificationItems.length > 9 ? '9+' : notificationItems.length}
                </span>
              )}
            </button>
            {notifPanelOpen && (
              <NotificationPanel
                items={notificationItems || []}
                onSelect={onSelectNotifItem}
                onClose={onCloseNotifPanel}
                anchorRef={bellRef}
              />
            )}
          </div>
        )}
        <div className="wb-topbar-luxe-avatar">
          {user.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')}
        </div>
      </div>
    </div>
  );
}

function NoticeBanner({ notice, onDismiss, onDelete }) {
  if (!notice) return null;
  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #FBF3E3 0%, #F6EAD2 100%)',
        borderBottom: `1px solid ${LINE}`,
        padding: '10px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <p style={{ fontSize: '14px', margin: 0 }}>
        <span style={{ color: AMBER, fontWeight: 600 }}>{notice.title}.</span>{' '}
        <span style={{ color: '#5A4A32' }}>{notice.body}</span>
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={() => {
            if (window.confirm('Delete this announcement for everyone?')) {
              onDelete(notice.id);
            }
          }}
          title="Delete announcement"
          style={{
            background: 'none',
            border: 'none',
            color: '#8A2E2E',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Trash2 size={14} />
        </button>
        <button
          onClick={onDismiss}
          title="Dismiss for now"
          style={{
            background: 'none',
            border: 'none',
            color: AMBER,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// DEPARTMENT ACTIVITY BOARD — restricted to the Plant Manager only (see
// canSeeLiveActivityBoard). Single place to watch every department's
// activity, with the document number/ID and the exact date & time shown
// right in the list — no need to open the application / a document to
// find out when something happened.
// ---------------------------------------------------------------------
function DepartmentActivityBoard({ documents, user, onOpenDoc }) {
  const [activeDept, setActiveDept] = useState('All');
  const [range, setRange] = useState('today'); // 'today' | 'all'

  // This board previously rebuilt its whole activity feed (flattening
  // and sorting EVERY history entry across EVERY document) on every
  // single render — including renders this component didn't cause
  // itself, like its parent Dashboard re-rendering. useMemo means the
  // flatten/sort/snapshot work only happens again when `documents`
  // actually changes.
  const feed = useMemo(() => {
    const list = [];
    documents.forEach((doc) => {
      (doc.history || []).forEach((h) => {
        list.push({
          docId: doc.id,
          docTitle: doc.title,
          docType: doc.type,
          dept: h.dept,
          user: h.user,
          action: h.action,
          at: h.at,
          atISO: h.atISO || doc.created_at || null,
          ipq: h.ipq === true,
        });
      });
    });
    list.sort((a, b) => new Date(b.atISO || 0) - new Date(a.atISO || 0));
    return list;
  }, [documents]);

  const filtered = useMemo(
    () =>
      feed.filter((f) => {
        if (activeDept !== 'All' && f.dept !== activeDept) return false;
        if (range === 'today' && !isToday(f.atISO)) return false;
        return true;
      }),
    [feed, activeDept, range]
  );

  const deptTabs = ['All', ...DEPARTMENTS];

  // Per-department snapshot: how many docs currently sit with them, and
  // when their most recent action was.
  const snapshot = useMemo(
    () =>
      DEPARTMENTS.map((d) => {
        const queue = documents.filter((doc) => currentDeptOf(doc) === d).length;
        const ipqCount = documents.filter(
          (doc) => currentDeptOf(doc) === d && doc.status === 'IPQ'
        ).length;
        const lastEntry = feed.find((f) => f.dept === d);
        return { dept: d, queue, ipqCount, lastEntry };
      }),
    [documents, feed]
  );

  return (
    <div
      className="wb-card"
      style={{
        background: 'white',
        borderRadius: '14px',
        border: `1px solid ${LINE}`,
        padding: '22px 24px',
        marginBottom: '24px',
        boxShadow: '0 1px 2px rgba(10,18,32,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={16} color={GOLD} />
          <p className="wb-serif" style={{ color: INK, fontSize: '17px', margin: 0 }}>
            All Departments — Live Activity
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['today', 'all'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '12px',
                cursor: 'pointer',
                border: `1px solid ${range === r ? GOLD : LINE}`,
                background: range === r ? '#FBF3E3' : 'white',
                color: range === r ? AMBER : '#7A7460',
              }}
            >
              <CalendarDays size={12} />
              {r === 'today' ? "Today's activity" : 'All history'}
            </button>
          ))}
        </div>
      </div>

      {/* Per-department snapshot cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        {snapshot.map((s) => (
          <button
            key={s.dept}
            onClick={() => setActiveDept(s.dept === activeDept ? 'All' : s.dept)}
            style={{
              textAlign: 'left',
              background: activeDept === s.dept ? '#FBF3E3' : PAPER,
              border: `1px solid ${activeDept === s.dept ? GOLD : LINE}`,
              borderRadius: '10px',
              padding: '12px 14px',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <p
              style={{
                color: INK,
                fontSize: '13px',
                fontWeight: 600,
                margin: '0 0 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {s.dept}
              {s.ipqCount > 0 && (
                <span
                  style={{
                    background: '#FBEAEA',
                    color: IPQ_RED,
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '999px',
                  }}
                >
                  {s.ipqCount} IPQ
                </span>
              )}
            </p>
            <p style={{ color: '#7A7460', fontSize: '11px', margin: 0 }}>
              {s.queue} in queue
            </p>
            <p style={{ color: '#B0AA96', fontSize: '10px', margin: '4px 0 0' }}>
              {s.lastEntry ? formatDateTime(s.lastEntry.atISO) : 'No activity yet'}
            </p>
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '10px',
        }}
      >
        <Filter size={13} color="#8A8370" />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {deptTabs.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDept(d)}
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                cursor: 'pointer',
                border: `1px solid ${activeDept === d ? GOLD : LINE}`,
                background: activeDept === d ? INK : 'white',
                color: activeDept === d ? 'white' : '#7A7460',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="wb-table-scroll" style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '640px', fontSize: '13px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: PAPER, textAlign: 'left', position: 'sticky', top: 0 }}>
              <th style={{ padding: '8px 12px', fontSize: '10px', color: '#8A8370' }}>Doc No. / ID</th>
              <th style={{ padding: '8px 12px', fontSize: '10px', color: '#8A8370' }}>Title</th>
              <th style={{ padding: '8px 12px', fontSize: '10px', color: '#8A8370' }}>Department</th>
              <th style={{ padding: '8px 12px', fontSize: '10px', color: '#8A8370' }}>Action</th>
              <th style={{ padding: '8px 12px', fontSize: '10px', color: '#8A8370' }}>Date &amp; Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '18px 12px', color: '#9C9585', textAlign: 'center' }}>
                  No activity {range === 'today' ? 'today' : 'recorded'} for this filter.
                </td>
              </tr>
            )}
            {filtered.map((f, i) => (
              <tr
                key={f.docId + i}
                onClick={() => onOpenDoc && onOpenDoc(f.docId)}
                style={{ borderTop: `1px solid ${LINE}`, cursor: onOpenDoc ? 'pointer' : 'default' }}
              >
                <td style={{ padding: '10px 12px', color: '#9C9585', fontFamily: 'monospace', fontSize: '11px' }}>
                  {f.docId}
                </td>
                <td style={{ padding: '10px 12px', color: INK }}>{f.docTitle}</td>
                <td style={{ padding: '10px 12px', color: '#7A7460' }}>{f.dept}</td>
                <td style={{ padding: '10px 12px', color: f.ipq ? IPQ_RED : '#5C5646', fontWeight: f.ipq ? 600 : 400 }}>
                  {f.user} — {f.action}
                </td>
                <td style={{ padding: '10px 12px', color: '#7A7460', whiteSpace: 'nowrap' }}>
                  {formatDateTime(f.atISO)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// PRODUCTION SNAPSHOT — a compact, live summary of Packing Status
// surfaced directly on the Plant Manager's Dashboard (see
// canSeeProductionSnapshot), so the day's packing progress, batch status
// and any IPQ holds are visible without leaving the dashboard. This is
// deliberately read-only: every action (log packing, mark completed,
// send to Warehouse…) still happens on the full Packing Status
// page, one click away via "Open full view". It subscribes to the same
// three tables ProductionInventoryPageInner does, so it stays live.
// ---------------------------------------------------------------------

function ProductionSnapshotCard({ onOpenProduction }) {
  const [batches, setBatches] = useState([]);
  const [entries, setEntries] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [b, e, t] = await Promise.all([
      supabase
        .from('production_batch_status')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('production_packing_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('warehouse_transfers')
        .select('*')
        .order('sent_at', { ascending: false }),
    ]);
    if (!b.error) setBatches(b.data || []);
    if (!e.error) setEntries(e.data || []);
    if (!t.error) setTransfers(t.data || []);
    setLoading(false);
  }, []);

  // Debounced so the three tables aren't each triggering their own
  // Promise.all() round trip within the same instant — a single Daily
  // Packing action can touch two of these tables together.
  const debouncedLoadAll = useDebouncedCallback(loadAll, 250);

  useEffect(() => {
    loadAll();
    const channel = supabase
      .channel(`prod-snapshot-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_batches' }, debouncedLoadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_packing_entries' }, debouncedLoadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_transfers' }, debouncedLoadAll)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadAll, debouncedLoadAll]);

  const activeBatches = batches.filter((b) => b.status === 'Active').length;
  const completedBatches = batches.filter((b) => b.status === 'Completed').length;
  const ipqEntries = entries.filter((e) => e.status === 'IPQ').length;
  const transfersToday = transfers.filter((t) => isToday(t.sent_at)).length;
  const pendingTransfers = transfers.filter((t) => t.status === 'Pending').length;

  const stats = [
    { label: 'Active batches', value: activeBatches, icon: Layers },
    { label: 'Completed batches', value: completedBatches, icon: CheckCircle2 },
    { label: 'IPQ hold — packing', value: ipqEntries, icon: PauseCircle, alert: ipqEntries > 0 },
    { label: "Today's transfers", value: transfersToday, icon: Truck },
  ];

  return (
    <div
      className="wb-card wb-snapshot-luxury"
      style={{
        background: 'white',
        borderRadius: '14px',
        border: `1px solid ${LINE}`,
        padding: '22px 24px',
        marginBottom: '24px',
        boxShadow: '0 1px 2px rgba(10,18,32,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PackageSearch size={16} color={GOLD} />
          <p className="wb-serif" style={{ color: INK, fontSize: '17px', margin: 0 }}>
          Packing Status — Live Snapshot
          </p>
        </div>
        <button
          onClick={onOpenProduction}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: GOLD,
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Open full view <ArrowUpRight size={13} />
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px',
          marginBottom: '18px',
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="wb-mini-stat"
            style={{
              background: s.alert ? '#FBEAEA' : PAPER,
              border: `1px solid ${s.alert ? IPQ_RED : LINE}`,
              borderRadius: '10px',
              padding: '12px 14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <s.icon size={13} color={s.alert ? IPQ_RED : GOLD} />
              <span style={{ fontSize: '11px', color: '#7A7460' }}>{s.label}</span>
            </div>
            <p className="wb-serif" style={{ margin: 0, fontSize: '22px', color: s.alert ? IPQ_RED : INK }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <p style={{ color: '#8A8370', fontSize: '11px', margin: '0 0 10px' }}>
        RECENT DAILY PACKING
      </p>
      {loading && <p style={{ color: '#9C9585', fontSize: '13px' }}>Loading…</p>}
      {!loading && entries.length === 0 && (
        <p style={{ color: '#9C9585', fontSize: '13px' }}>No packing entries logged yet.</p>
      )}
      {entries.slice(0, 5).map((e, i) => (
        <div
          key={e.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 0',
            borderTop: i === 0 ? 'none' : `1px solid ${LINE}`,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: INK,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {e.product_name} — Batch {e.batch_number}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#B0AA96' }}>
              {e.created_by} ({e.created_dept}) · {formatDateTime(e.created_at)}
            </p>
          </div>
          <span
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '999px',
              background: e.status === 'IPQ' ? '#FBEAEA' : '#E9F3EC',
              color: e.status === 'IPQ' ? IPQ_RED : '#1F4B3F',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {e.status === 'IPQ' ? 'IPQ' : `${e.packing_done} packs`}
          </span>
        </div>
      ))}

      {pendingTransfers > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '14px',
            background: '#FBF3E3',
            border: `1px solid ${GOLD}`,
            borderRadius: '8px',
            padding: '10px 14px',
            color: AMBER,
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <Truck size={14} /> {pendingTransfers} transfer{pendingTransfers === 1 ? '' : 's'} waiting
          on Warehouse to accept.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// LIVE CLOCK — a small ticking readout used in the dashboard hero, giving
// the welcome header a genuinely "live" feel (updates once a second)
// rather than a static timestamp painted once on load.
// ---------------------------------------------------------------------
function useLiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    // 5s instead of 1s — the clock display only shows minutes:seconds
    // rounded visually anyway, and a 1s tick was forcing a re-render of
    // the entire dashboard hero (and everything animating inside it)
    // sixty times a minute for no perceptible benefit.
    const id = setInterval(() => setTime(new Date()), 5000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ---------------------------------------------------------------------
// PERFORMANCE — LiveClock as an isolated leaf component.
// Calling useLiveClock() straight inside a big page (DashboardPage,
// PackingStatusHero) meant that page's ENTIRE tree — every stat tile,
// every table row, every animated hero graphic — re-rendered 60 times a
// minute just because the clock ticked. This tiny component owns the
// once-a-second timer itself, so only this small <span> re-renders each
// tick; everything around it stays untouched.
// ---------------------------------------------------------------------
function LiveClock({ className = 'wb-hero-clock' }) {
  const time = useLiveClock();
  return (
    <span className={className}>
      {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

// ---------------------------------------------------------------------
// HERO RADIAL GAUGE — a small animated SVG ring used in the dashboard
// welcome section to visualise "how clear is your queue today" at a
// glance: full gold ring = inbox empty, ring drains as items pile up.
// Deliberately restrained motion (one continuous rotation of the arc's
// leading glow) rather than scattered per-element effects.
// ---------------------------------------------------------------------
function HeroGauge({ pct, label, value }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return (
    <div className="wb-hero-gauge">
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke="url(#wbGaugeGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 38 38)"
          className="wb-hero-gauge-arc"
        />
        <defs>
          <linearGradient id="wbGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={GOLD_LIGHT} />
            <stop offset="100%" stopColor={CYAN} />
          </linearGradient>
        </defs>
      </svg>
      <div className="wb-hero-gauge-label">
        <span className="wb-hero-gauge-value">{value}</span>
        <span className="wb-hero-gauge-text">{label}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// DEPT HERO GAUGE — same idea as HeroGauge above (a radial "how clear
// is your queue" ring) but recoloured for the light, per-department
// Dashboard hero: dark ink numerals instead of cream, and the ring
// tracks the department's own accent colour instead of gold/cyan.
// ---------------------------------------------------------------------
function DeptHeroGauge({ pct, label, value, theme, gaugeId }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const gid = `wbDeptGauge-${gaugeId}`;
  return (
    <div className="wb-dept-hero-gauge">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="6" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
          className="wb-hero-gauge-arc"
        />
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.accent} />
            <stop offset="100%" stopColor={theme.accentDeep} />
          </linearGradient>
        </defs>
      </svg>
      <div className="wb-dept-hero-gauge-label">
        <span className="wb-dept-hero-gauge-value" style={{ color: theme.ink }}>{value}</span>
        <span className="wb-dept-hero-gauge-text" style={{ color: theme.accent }}>{label}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// MAIN DASHBOARD HERO — the very first thing every department sees
// after signing in. Re-themed as a dark "jewel vault": a near-black,
// department-tinted gradient backdrop, a faceted gem badge in place of
// the old flat icon circle, a slow drift of coloured glow blobs, and a
// bigger, bolder greeting in cream/gold. Deliberately mounted ONLY
// here — every inner tool page (Warehouse Inventory, Production, HSE
// records, Directory, etc.) keeps its existing look untouched.
// ---------------------------------------------------------------------
function DashboardHero({ user, quickActions, clearPct, inboxCount, setPage }) {
  const theme = getDeptTheme(user.dept);
  const DeptIcon = theme.icon;
  return (
    <div
      className="wb-dept-hero"
      style={{ background: theme.gradient, '--dept-accent': theme.accent }}
    >
      <div className="wb-dept-hero-gridlines" />
      <div className="wb-dept-hero-glow-a" style={{ background: theme.glowA }} />
      <div className="wb-dept-hero-glow-b" style={{ background: theme.glowB }} />
      <div className="wb-dept-hero-glow-c" style={{ background: theme.glowC }} />
      <div className="wb-dept-hero-sparkle wb-dept-hero-sparkle-1" style={{ background: theme.gemA }} />
      <div className="wb-dept-hero-sparkle wb-dept-hero-sparkle-2" style={{ background: theme.accent }} />
      <div className="wb-dept-hero-sparkle wb-dept-hero-sparkle-3" style={{ background: theme.gemA }} />

      {/* Faceted gem badge — slow rotating light sweep, orbited by two small dots */}
      <div className="wb-dept-hero-orbit">
        <div
          className="wb-dept-gem"
          style={{
            '--gem-a': theme.gemA,
            '--gem-b': theme.gemB,
            background: `linear-gradient(155deg, ${theme.gemA}, ${theme.accent} 45%, ${theme.gemB} 100%)`,
          }}
        >
          <span className="wb-dept-gem-sweep" />
          <DeptIcon size={28} color="#0A1220" strokeWidth={2.25} />
        </div>
        <div className="wb-dept-hero-orbit-dot wb-dept-hero-orbit-dot-a" style={{ background: theme.accent }} />
        <div className="wb-dept-hero-orbit-dot wb-dept-hero-orbit-dot-b" style={{ background: theme.gemA }} />
      </div>

      <div className="wb-dept-hero-top">
        <div className="wb-dept-hero-eyebrow" style={{ color: theme.accent }}>
          <span className="wb-dept-live-dot" style={{ background: theme.accent }} />
          <span>{todayLabel()}</span>
          <span className="wb-hero-eyebrow-sep">·</span>
          <LiveClock className="wb-dept-hero-clock" />
        </div>

        <h2 className="wb-serif wb-dept-hero-title wb-dept-hero-title-shine" style={{ color: theme.ink, '--dept-shine-a': theme.ink, '--dept-shine-b': theme.gemA }}>
          {greeting()}, {user.name.split(' ')[0]}
        </h2>
        <p className="wb-dept-hero-sub" style={{ color: theme.accent }}>
          {user.title} · {user.dept} department · <span style={{ opacity: 0.75 }}>{theme.gem}</span>
        </p>

        <div className="wb-dept-hero-actions">
          {quickActions.map((a) => (
            <button
              key={a.key}
              onClick={() => setPage(a.key)}
              className="wb-dept-pill"
              style={{ borderColor: theme.accentSoft, color: theme.ink }}
            >
              <a.icon size={14} color={theme.accent} />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="wb-dept-hero-gauge-wrap">
        <DeptHeroGauge pct={clearPct} value={inboxCount} label="in your queue" theme={theme} gaugeId={user.dept.replace(/\s+/g, '')} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// DASHBOARD — a warmer, more "luxury hotel lobby" take: a gold-on-ink
// hero header, four headline stats, quick-action pills, a two-column
// recent-activity + announcements panel, and a small department-specific
// spotlight card.
// ---------------------------------------------------------------------

// Dashboard headline stats — "jewel tiles": a deliberately different
// language from the dark command-deck heroes used everywhere else in the
// portal. Each tile is a pale, tinted facet of glass with its own colour
// (cyan / emerald / rose / gold) carrying a soft breathing glow, a
// medallion icon that pops slightly above the card edge, a count-up
// number, and a thin accent bar that draws itself in on mount. All
// motion is either one-shot (mount-in, bar fill) or a slow opacity
// breathe — no continuously-repainting transforms, in keeping with the
// portal-wide performance fix noted elsewhere in this file.
const JEWEL_THEMES = {
  cyan: {
    tint: 'rgba(95,224,208,0.22)',
    medalBg: 'linear-gradient(135deg, #E9FBF8, #C9F3EC)',
    medalShadow: 'rgba(95,224,208,0.35)',
    ring: 'rgba(95,224,208,0.4)',
    bar: 'linear-gradient(90deg, #1FA396, #5FE0D0)',
    icon: '#1FA396',
    value: '#0A1220',
  },
  emerald: {
    tint: 'rgba(46,110,91,0.18)',
    medalBg: 'linear-gradient(135deg, #E8F5EE, #C9E6D7)',
    medalShadow: 'rgba(46,110,91,0.3)',
    ring: 'rgba(46,110,91,0.35)',
    bar: 'linear-gradient(90deg, #1F4B3F, #2E6E5B)',
    icon: '#1F4B3F',
    value: '#0A1220',
  },
  rose: {
    tint: 'rgba(178,58,58,0.18)',
    medalBg: 'linear-gradient(135deg, #FBEAEA, #F4D2D2)',
    medalShadow: 'rgba(178,58,58,0.32)',
    ring: 'rgba(178,58,58,0.4)',
    bar: 'linear-gradient(90deg, #8A2E2E, #B23A3A)',
    icon: '#8A2E2E',
    value: '#8A2E2E',
  },
  gold: {
    tint: 'rgba(201,165,92,0.24)',
    medalBg: 'linear-gradient(135deg, #FBF3E3, #F3E4C4)',
    medalShadow: 'rgba(201,165,92,0.35)',
    ring: 'rgba(201,165,92,0.45)',
    bar: 'linear-gradient(90deg, #8C6A2E, #C9A55C)',
    icon: '#8C6A2E',
    value: '#0A1220',
  },
};

function DashboardJewelStat({ stat, delay }) {
  const count = useCountUp(stat.value);
  const theme = JEWEL_THEMES[stat.tint] || JEWEL_THEMES.gold;

  return (
    <button
      onClick={stat.onClick}
      className="wb-jewel-card"
      style={{
        cursor: stat.onClick ? 'pointer' : 'default',
        animationDelay: `${delay}ms`,
        '--jewel-tint': theme.tint,
        '--jewel-ring': theme.ring,
      }}
    >
      <div className="wb-jewel-glow" />
      <div className="wb-jewel-top">
        <div
          className="wb-jewel-medal"
          style={{ background: theme.medalBg, boxShadow: `0 6px 16px ${theme.medalShadow}, inset 0 0 0 1px rgba(255,255,255,0.5)` }}
        >
          <stat.icon size={19} color={theme.icon} />
        </div>
        {stat.onClick && (
          <span className="wb-jewel-arrow">
            <ArrowUpRight size={14} color="#B0AA96" />
          </span>
        )}
      </div>
      <p className="wb-jewel-label">{stat.label}</p>
      <p className="wb-serif wb-jewel-value" style={{ color: theme.value }}>
        {count}
      </p>
      <div className="wb-jewel-bar-track">
        <div
          className="wb-jewel-bar"
          style={{ background: theme.bar, animationDelay: `${delay + 250}ms` }}
        />
      </div>
    </button>
  );
}

function DashboardPage({ user, documents, notices, hse, inventory, setPage, setSelectedDoc }) {
  // Every derived dashboard value (inbox, stats, spotlight, recent
  // activity) used to recompute on EVERY render — including the once-
  // a-second tick from the live clock and every Supabase realtime
  // event on documents/hse/inventory. Wrapping it in useMemo means it
  // only recomputes when the underlying data actually changes, and the
  // clock itself is now an isolated leaf component (see LiveClock)
  // so its tick no longer re-renders this whole page.
  const dash = useMemo(() => {
  const inbox = documents.filter(
    (d) => currentDeptOf(d) === user.dept && d.status === 'In Progress'
  );
  const visibleDocs = canSeeEverything(user)
    ? documents
    : documents.filter(
        (d) => d.createdDept === user.dept || currentDeptOf(d) === user.dept
      );
  const completed = visibleDocs.filter((d) => d.status === 'Completed').length;
  const ipqCount = visibleDocs.filter((d) => d.status === 'IPQ').length;
  const allHse = [
    ...(hse.riskAssessments || []),
    ...(hse.incidents || []),
    ...(hse.permits || []),
  ];
  const openHse = allHse.filter((r) => r.status !== 'Closed').length;
  const highRisk = (hse.riskAssessments || []).filter(
    (r) => r.level === 'High'
  ).length;
  const stockCount = inventory.length;
  const lowStock = inventory.filter(
    (i) => Number(i.qty) < Number(i.min_stock || i.minStock || 0)
  ).length;
  const expiringSoon = inventory.filter(
    (i) => isExpired(i.expiry) || isExpiringSoon(i.expiry)
  ).length;

  const totalRelevant = visibleDocs.length || 1;
  const clearPct = Math.max(0, Math.min(1, 1 - inbox.length / Math.max(totalRelevant, inbox.length || 1)));

  const stats = [
    {
      label: 'Waiting in your inbox',
      value: inbox.length,
      icon: InboxIcon,
      onClick: () => setPage('documents'),
      tint: 'cyan',
    },
    {
      label: 'Activity completed',
      value: completed,
      icon: CheckCircle2,
      tint: 'emerald',
    },
    {
      label: 'Holding — IPQ',
      value: ipqCount,
      icon: PauseCircle,
      onClick: () => setPage('documents'),
      alert: ipqCount > 0,
      tint: 'rose',
    },
    {
      label: 'Stock items tracked',
      value: stockCount,
      icon: Boxes,
      onClick: () => setPage('inventory'),
      tint: 'gold',
    },
  ];

  const quickActions = [
    { key: 'new', label: 'New Activity', icon: PlusCircle },
    { key: 'inventory', label: 'Inventory', icon: Boxes },
    { key: 'announcements', label: 'Announcements', icon: Megaphone },
    { key: 'hse', label: 'Health & Safety', icon: ShieldAlert },
  ];

  // Most recent action taken on each document the user can see, newest
  // documents first — a lightweight "recent activity" feed.
  const recentActivity = visibleDocs
    .filter((d) => d.history && d.history.length)
    .slice(0, 6)
    .map((d) => ({ doc: d, entry: d.history[d.history.length - 1] }));

  let spotlight = null;
  if (user.dept === 'Warehouse' || canSeeEverything(user)) {
    spotlight = {
      title: 'Stock at a glance',
      icon: Boxes,
      body:
        lowStock > 0 && expiringSoon > 0
          ? `${lowStock} item${lowStock === 1 ? '' : 's'} below minimum stock, ${expiringSoon} expiring within ${EXPIRY_WARNING_MONTHS} months.`
          : lowStock > 0
          ? `${lowStock} item${lowStock === 1 ? '' : 's'} below minimum stock level — worth a re-order check.`
          : expiringSoon > 0
          ? `${expiringSoon} item${expiringSoon === 1 ? '' : 's'} expiring within ${EXPIRY_WARNING_MONTHS} months.`
          : 'All tracked stock is comfortably above its minimum level, nothing expiring soon.',
      cta: 'Open inventory',
      page: 'inventory',
    };
  } else if (user.dept === 'HSE') {
    spotlight = {
      title: 'Risk spotlight',
      icon: AlertTriangle,
      body:
        highRisk > 0
          ? `${highRisk} risk assessment${highRisk === 1 ? '' : 's'} currently rated High.`
          : 'No High-rated risk assessments open right now.',
      cta: 'Review HSE records',
      page: 'hse',
    };
  } else {
    spotlight = {
      title: 'Keep things moving',
      icon: Workflow,
      body:
        inbox.length > 0
          ? `You have ${inbox.length} item${inbox.length === 1 ? '' : 's'} waiting on your sign-off.`
          : 'Nothing waiting on you right now — inbox is clear.',
      cta: 'Go to inbox',
      page: 'documents',
    };
  }

    return {
      inbox,
      visibleDocs,
      completed,
      ipqCount,
      stockCount,
      lowStock,
      expiringSoon,
      clearPct,
      stats,
      quickActions,
      recentActivity,
      spotlight,
    };
  }, [documents, user, hse, inventory, setPage]);
  const {
    inbox,
    visibleDocs,
    completed,
    ipqCount,
    stockCount,
    lowStock,
    expiringSoon,
    clearPct,
    stats,
    quickActions,
    recentActivity,
    spotlight,
  } = dash;

  return (
    <div className="wb-page-padding" style={{ padding: '28px 32px 40px' }}>
      {/* Main dashboard hero — bright, colourful, department-themed */}
      <DashboardHero
        user={user}
        quickActions={quickActions}
        clearPct={clearPct}
        inboxCount={inbox.length}
        setPage={setPage}
      />

      {/* Headline stats */}
      <div className="wb-jewel-grid">
        {stats.map((s, i) => (
          <DashboardJewelStat key={s.label} stat={s} delay={i * 70} />
        ))}
      </div>

      {/* Spotlight card */}
      <button
        onClick={() => setPage(spotlight.page)}
        className="wb-card wb-spotlight"
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${INK} 0%, ${INK_DEEP} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 6px 16px rgba(10,18,32,0.28)',
          }}
        >
          <spotlight.icon size={19} color={GOLD_LIGHT} />
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              color: INK,
              fontSize: '14px',
              fontWeight: 600,
              margin: '0 0 2px',
            }}
          >
            {spotlight.title}
          </p>
          <p style={{ color: '#5C5646', fontSize: '13px', margin: 0 }}>
            {spotlight.body}
          </p>
        </div>
        <span
          style={{
            color: GOLD,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
          }}
        >
          {spotlight.cta} <ArrowUpRight size={13} />
        </span>
      </button>

      {/* Live cross-department activity board — visible ONLY to the
          Plant Manager, per company policy. Every other department
          (including HSE and Admin) sees the normal dashboard without it. */}
      {canSeeLiveActivityBoard(user) && (
        <DepartmentActivityBoard
          documents={documents}
          user={user}
          onOpenDoc={(docId) => {
            const doc = documents.find((d) => d.id === docId);
            if (doc && setSelectedDoc) setSelectedDoc(doc);
          }}
        />
      )}

      {/* Packing Status live snapshot — also Plant Manager only, so
          production's daily packing progress, batch status and IPQ holds
          are visible right from the dashboard without navigating to the
          full Packing Status page. */}
      {canSeeProductionSnapshot(user) && (
        <ProductionSnapshotCard onOpenProduction={() => setPage('production')} />
      )}

      {/* Two-column: recent activity + announcements */}
      <div className="wb-dashboard-columns">
        <div
          className="wb-card"
          style={{
            background: 'white',
            borderRadius: '14px',
            border: `1px solid ${LINE}`,
            padding: '22px 24px',
            boxShadow: '0 1px 2px rgba(10,18,32,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <Activity size={16} color={GOLD} />
            <p className="wb-serif" style={{ color: INK, fontSize: '17px', margin: 0 }}>
              Recent activity
            </p>
          </div>
          {recentActivity.length === 0 && (
            <p style={{ color: '#9C9585', fontSize: '13px' }}>
              Nothing to show yet.
            </p>
          )}
          {recentActivity.map(({ doc, entry }, i) => (
            <div
              key={doc.id + i}
              style={{
                display: 'flex',
                gap: '10px',
                padding: '12px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${LINE}`,
              }}
            >
              <Clock3
                size={13}
                color="#B0AA96"
                style={{ marginTop: '3px', flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    color: INK,
                    fontSize: '13px',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <b>{doc.title}</b> — {entry.action}
                </p>
                <p
                  style={{
                    color: '#B0AA96',
                    fontSize: '11px',
                    margin: '2px 0 0',
                  }}
                >
                  {entry.user} ({entry.dept}) · {formatDateTime(entry.atISO) !== '—' ? formatDateTime(entry.atISO) : entry.at}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="wb-card"
          style={{
            background: 'white',
            borderRadius: '14px',
            border: `1px solid ${LINE}`,
            padding: '22px 24px',
            boxShadow: '0 1px 2px rgba(10,18,32,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <Megaphone size={16} color={GOLD} />
            <p className="wb-serif" style={{ color: INK, fontSize: '17px', margin: 0 }}>
              Recent announcements
            </p>
          </div>
          {notices.length === 0 && (
            <p style={{ color: '#9C9585', fontSize: '13px' }}>
              No announcements yet.
            </p>
          )}
          {notices.slice(0, 4).map((n, i) => (
            <div
              key={n.id}
              style={{
                padding: '12px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${LINE}`,
              }}
            >
              <p
                style={{
                  color: INK,
                  fontSize: '13px',
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                {n.title}
              </p>
              <p
                style={{ color: '#7A7460', fontSize: '13px', margin: '3px 0' }}
              >
                {n.body}
              </p>
              <p style={{ color: '#B0AA96', fontSize: '11px', margin: 0 }}>
                {n.postedBy} ({n.postedDept}) · {n.date}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// DOCUMENT DRAWER HERO — a compact "signal" command header for the
// document detail drawer. Its own ink + violet language (not the
// emerald/gold Warehouse Vault, not the cyan Dashboard/Packing Status
// heroes) built around a travelling signal dot on a dashed line —
// literally a document pulsing from department to department — plus a
// shimmering title and a status-tinted glow (rose for IPQ, emerald for
// Completed, violet while in progress).
// ---------------------------------------------------------------------
function DocDrawerHero({ doc, isIpq, onClose }) {
  const accentClass = isIpq
    ? 'wb-docdrawer-hero-rose'
    : doc.status === 'Completed'
    ? 'wb-docdrawer-hero-emerald'
    : 'wb-docdrawer-hero-violet';
  const dotClass = isIpq
    ? 'wb-live-dot-rose'
    : doc.status === 'Completed'
    ? 'wb-live-dot-emerald'
    : 'wb-live-dot-violet';

  return (
    <div className={`wb-docdrawer-hero ${accentClass}`}>
      <div className="wb-docdrawer-hero-gridlines" />
      <div className="wb-docdrawer-hero-glow-a" />
      <div className="wb-docdrawer-hero-glow-b" />
      <svg className="wb-docdrawer-signal" viewBox="0 0 400 12" preserveAspectRatio="none">
        <line x1="0" y1="6" x2="400" y2="6" stroke="rgba(139,124,246,0.25)" strokeWidth="1" strokeDasharray="3 7" />
        <circle cx="6" cy="6" r="3" className="wb-docdrawer-signal-dot" />
      </svg>
      <button onClick={onClose} className="wb-docdrawer-close" aria-label="Close">
        <X size={16} />
      </button>
      <p className="wb-docdrawer-eyebrow">
        <span className={`wb-live-dot ${dotClass}`} />
        {doc.id} · {doc.type}{doc.routing === 'default' ? ' · Default Company Flow' : ''}
      </p>
      <h2 className="wb-serif wb-docdrawer-title">
        <span className="wb-docdrawer-title-shine">{doc.title}</span>
      </h2>
      <p className="wb-docdrawer-sub">
        Last activity: {formatDateTime(lastActivityISO(doc))}
      </p>
    </div>
  );
}

function DocDrawer({
  doc,
  user,
  onClose,
  onForward,
  onComplete,
  onReturn,
  onWarehouseDemand,
  onAcceptPacking,
  onRejectPacking,
  onSetIPQ,
  onResumeIPQ,
}) {
  const [mode, setMode] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [ipqReason, setIpqReason] = useState('');
  if (!doc) return null;

  const current = currentDeptOf(doc);
  const isIpq = doc.status === 'IPQ';
  const canAct =
    (doc.status === 'In Progress' || doc.status === 'IPQ') &&
    (canSeeEverything(user) || user.dept === current);
  const otherDepts = DEPARTMENTS.filter((d) => d !== current);
  const canReturn = doc.currentIndex > 0;
  const isDefault = doc.routing === 'default';
  const suggestedNext = isDefault ? nextDefaultStep(current) : null;
  const atWarehouse = isDefault && current === 'Warehouse';
  // A packing hand-off from Production is "pending" for as long as the
  // very last history line is still that Production send — i.e. nobody
  // at Warehouse has accepted or rejected it yet. The moment either
  // button below is used, a new history entry is appended and this
  // naturally becomes false again — no separate flag/column needed.
  const lastHistoryEntry = doc.history && doc.history.length
    ? doc.history[doc.history.length - 1]
    : null;
  const needsPackingDecision =
    atWarehouse &&
    doc.status === 'In Progress' &&
    !!lastHistoryEntry &&
    lastHistoryEntry.dept === 'Production';

  const openForward = (presetRecipient) => {
    setMode('forward');
    setRecipient(presetRecipient || otherDepts[0]);
    setAttachmentUrl(doc.attachmentUrl || '');
    setFileName('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(4,7,17,0.45)',
          backdropFilter: 'blur(2px)',
        }}
      />
      <div
        className="wb-drawer"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '500px',
          height: '100%',
          background: 'white',
          overflowY: 'auto',
          boxShadow: '-16px 0 48px rgba(4,7,17,0.24)',
          borderLeft: isIpq ? `3px solid ${IPQ_RED}` : 'none',
        }}
      >
        <DocDrawerHero doc={doc} isIpq={isIpq} onClose={onClose} />
        <div style={{ padding: '24px' }}>
          {isIpq && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                background: '#FBEAEA',
                border: `1px solid ${IPQ_RED}`,
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <PauseCircle size={18} color={IPQ_RED} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <p style={{ color: IPQ_RED, fontSize: '13px', fontWeight: 700, margin: 0 }}>
                  This activity is IPQ — On Hold
                </p>
                <p style={{ color: '#7A3A3A', fontSize: '12px', margin: '3px 0 0' }}>
                  It's paused with {current} and won't move until it's resumed.
                </p>
              </div>
            </div>
          )}

          {!canAct && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: PAPER,
                border: `1px solid ${LINE}`,
                borderRadius: '8px',
                padding: '8px 12px',
                marginBottom: '16px',
                color: '#7A7460',
                fontSize: '12px',
              }}
            >
              <Eye size={13} /> View only — this document isn't in your
              department's queue.
            </div>
          )}

          <p
            style={{ color: '#8A8370', fontSize: '12px', marginBottom: '12px' }}
          >
            {isDefault ? 'FULL COMPANY-FLOW PROGRESS' : 'PATH TRAVELLED SO FAR'}
          </p>

          {isDefault ? (
            <DefaultFlowTracker doc={doc} />
          ) : (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              {doc.path.map((dept, i) => {
                const filled =
                  i < doc.currentIndex || doc.status === 'Completed';
                const isCurrent =
                  doc.status === 'In Progress' && i === doc.currentIndex;
                const ipqHere =
                  isIpq && i === doc.currentIndex;
                return (
                  <div
                    key={i}
                    className="wb-seal-pop"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      animationDelay: `${i * 0.05}s`,
                    }}
                  >
                    <div
                      style={{ position: 'relative', display: 'inline-flex' }}
                    >
                      {(isCurrent || ipqHere) && (
                        <span
                          className={`wb-seal-glow${ipqHere ? ' wb-seal-glow-rose' : ''}`}
                        />
                      )}
                      <Seal filled={filled} active={isCurrent} ipq={ipqHere} size={32} />
                    </div>
                    <span
                      style={{
                        color: ipqHere ? IPQ_RED : isCurrent ? GOLD : INK,
                        fontSize: '11px',
                        fontWeight: ipqHere ? 600 : 400,
                      }}
                    >
                      {dept}
                      {ipqHere ? ' (IPQ)' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <StatusPill status={doc.status} />
            {(doc.status === 'In Progress' || doc.status === 'IPQ') && (
              <span
                style={{
                  color: '#7A7460',
                  fontSize: '12px',
                  marginLeft: '8px',
                }}
              >
                Currently with <b>{current}</b>
              </span>
            )}
          </div>

          {doc.attachmentUrl && (
            <div style={{ marginTop: '16px' }}>
              <p
                style={{
                  color: '#8A8370',
                  fontSize: '12px',
                  marginBottom: '6px',
                }}
              >
                ATTACHMENT
              </p>
              <a
                href={doc.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: GOLD,
                  fontSize: '13px',
                  textDecoration: 'none',
                  border: `1px solid ${LINE}`,
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
              >
                <Paperclip size={14} /> Open attached document
              </a>
              {isGoogleDriveLink(doc.attachmentUrl) && (
                <p
                  style={{
                    color: '#B0AA96',
                    fontSize: '11px',
                    margin: '6px 0 0',
                  }}
                >
                  Getting a "you need access" / 403 error? Ask whoever
                  attached this to set the file's Drive sharing to "Anyone
                  with the link", or ask them to re-attach it using "Upload
                  from device" instead next time.
                </p>
              )}
            </div>
          )}

          <p
            style={{
              color: '#8A8370',
              fontSize: '12px',
              margin: '24px 0 12px',
            }}
          >
            HISTORY & NOTES — every step, in order, until closed
          </p>
          <HistoryTimeline doc={doc} />

          {canAct && mode === null && (
            <div style={{ marginTop: '20px' }}>
              {isIpq ? (
                <button
                  onClick={() => onResumeIPQ(doc.id)}
                  className="wb-btn"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#1F4B3F',
                    color: 'white',
                    border: 'none',
                    padding: '11px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '10px',
                  }}
                >
                  <PlayCircle size={15} /> Resume activity (back to In Progress)
                </button>
              ) : (
                <>
                  {isDefault && suggestedNext && !atWarehouse && (
                    <button
                      onClick={() => openForward(suggestedNext)}
                      className="wb-btn"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: `linear-gradient(120deg, ${INK} 0%, ${INK_DEEP} 100%)`,
                        color: 'white',
                        border: 'none',
                        padding: '11px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        marginBottom: '10px',
                        boxShadow: '0 6px 16px rgba(10,18,32,0.25)',
                      }}
                    >
                      <Workflow size={15} /> Continue default flow → {suggestedNext}
                    </button>
                  )}

                  {needsPackingDecision && (
                    <div
                      className="wb-packing-gate"
                      style={{
                        background:
                          'linear-gradient(135deg, #1A1006 0%, #241605 60%, #120B03 100%)',
                        border: `1px solid ${GOLD_DEEP}`,
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '14px',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div className="wb-packing-gate-glow" />
                      <p
                        style={{
                          fontSize: '11px',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: GOLD_LIGHT,
                          margin: '0 0 4px',
                          fontWeight: 700,
                          position: 'relative',
                        }}
                      >
                        Packing hand-off from Production
                      </p>
                      <p
                        style={{
                          fontSize: '13px',
                          color: '#FBE9C8',
                          margin: '0 0 12px',
                          position: 'relative',
                        }}
                      >
                        This can't move forward until Warehouse accepts or
                        rejects the packing. The notification tune will keep
                        ringing until this is resolved.
                      </p>
                      <div
                        style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', position: 'relative' }}
                      >
                        <button
                          onClick={() => onAcceptPacking(doc.id)}
                          className="wb-btn"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
                            color: INK_DEEP,
                            fontWeight: 700,
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          <CheckCircle2 size={15} /> Accept packing
                        </button>
                        <button
                          onClick={() => onRejectPacking(doc.id)}
                          className="wb-btn"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'transparent',
                            color: '#FF9A8F',
                            border: '1px solid #8A2E2E',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={15} /> Reject — send back
                        </button>
                      </div>
                    </div>
                  )}

                  {atWarehouse && !needsPackingDecision && (
                    <div
                      style={{
                        background: PAPER,
                        border: `1px solid ${LINE}`,
                        borderRadius: '8px',
                        padding: '14px',
                        marginBottom: '10px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '13px',
                          color: '#5C5646',
                          margin: '0 0 10px',
                        }}
                      >
                        Is more stock / procurement needed for this?
                      </p>
                      <div
                        style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
                      >
                        <button
                          onClick={() => onWarehouseDemand(doc.id, true)}
                          className="wb-btn wb-btn-gold"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: GOLD,
                            color: 'white',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          <Truck size={15} /> Demand — send to Procurement
                        </button>
                        <button
                          onClick={() => onComplete(doc.id)}
                          className="wb-btn"
                          style={{
                            background: 'white',
                            border: '1px solid #C7C2AE',
                            color: '#1F4B3F',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          No demand — close order
                        </button>
                      </div>
                    </div>
                  )}

                  {!needsPackingDecision && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => openForward()}
                      className="wb-btn"
                      style={{
                        flex: 1,
                        background: 'white',
                        color: INK,
                        border: `1px solid ${LINE}`,
                        padding: '10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        minWidth: '160px',
                      }}
                    >
                      Send to another dept.
                    </button>
                    <button
                      onClick={() => onComplete(doc.id)}
                      className="wb-btn"
                      style={{
                        background: 'white',
                        border: '1px solid #C7C2AE',
                        color: '#1F4B3F',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      Mark complete
                    </button>
                    {canReturn && (
                      <button
                        onClick={() => setMode('return')}
                        className="wb-btn"
                        style={{
                          background: 'white',
                          border: '1px solid #D9C4C4',
                          color: '#8A2E2E',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        Return
                      </button>
                    )}
                  </div>
                  )}

                  {!needsPackingDecision && (
                  <button
                    onClick={() => setMode('ipq')}
                    className="wb-btn"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: '#FBEAEA',
                      color: IPQ_RED,
                      border: `1px solid ${IPQ_RED}`,
                      padding: '10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      marginTop: '10px',
                      fontWeight: 600,
                    }}
                  >
                    <PauseCircle size={15} /> Mark as IPQ (Activity is on hold)
                  </button>
                  )}
                </>
              )}
            </div>
          )}

          {mode === 'forward' && (
            <div
              style={{
                background: PAPER,
                border: `1px solid ${LINE}`,
                borderRadius: '10px',
                padding: '16px',
                marginTop: '16px',
              }}
            >
              <p style={{ fontSize: '14px', marginBottom: '10px' }}>
                Send this document to:
              </p>
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '10px',
                  border: `1px solid ${LINE}`,
                  borderRadius: '6px',
                }}
              >
                {otherDepts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <label
                style={{
                  fontSize: '12px',
                  color: '#5C5646',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Note — how things are going / message for the next dept.
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="e.g. Batch checked, minor deviation noted on page 2, please review before sign-off…"
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '14px',
                  border: `1px solid ${LINE}`,
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                }}
              />

              <AttachmentPicker
                attachmentUrl={attachmentUrl}
                setAttachmentUrl={setAttachmentUrl}
                fileName={fileName}
                setFileName={setFileName}
              />

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    onForward(
                      doc.id,
                      recipient,
                      note,
                      isGoogleDriveLink(attachmentUrl)
                        ? normalizeAttachmentUrl(attachmentUrl)
                        : attachmentUrl
                    );
                    setMode(null);
                    setNote('');
                    setAttachmentUrl('');
                    setFileName('');
                    onClose();
                  }}
                  className="wb-btn wb-btn-gold"
                  style={{
                    background: GOLD,
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Sign & Send
                </button>
                <button
                  onClick={() => setMode(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#7A7460',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {mode === 'return' && (
            <div
              style={{
                background: '#FBEAEA',
                border: '1px solid #E8D0D0',
                borderRadius: '10px',
                padding: '16px',
                marginTop: '16px',
              }}
            >
              <p
                style={{
                  color: '#8A2E2E',
                  fontSize: '14px',
                  marginBottom: '10px',
                }}
              >
                Reason for returning:
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '10px',
                  border: '1px solid #E8D0D0',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    onReturn(doc.id, note);
                    setMode(null);
                    setNote('');
                    onClose();
                  }}
                  className="wb-btn"
                  style={{
                    background: '#8A2E2E',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Send Back
                </button>
                <button
                  onClick={() => setMode(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#7A7460',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {mode === 'ipq' && (
            <div
              style={{
                background: '#FBEAEA',
                border: `1px solid ${IPQ_RED}`,
                borderRadius: '10px',
                padding: '16px',
                marginTop: '16px',
              }}
            >
              <p
                style={{
                  color: IPQ_RED,
                  fontSize: '14px',
                  fontWeight: 700,
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <PauseCircle size={16} /> Mark as IPQ — reason for Holding
              </p>
              <p style={{ color: '#7A3A3A', fontSize: '12px', margin: '0 0 10px' }}>
                This will keep the activity with {current}, but flag it as
                On Hold everywhere in the portal until it's resumed.
              </p>
              <textarea
                value={ipqReason}
                onChange={(e) => setIpqReason(e.target.value)}
                rows={3}
                placeholder="e.g. Waiting on raw material, machine down, awaiting client confirmation…"
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '10px',
                  border: `1px solid ${IPQ_RED}`,
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    onSetIPQ(doc.id, ipqReason);
                    setMode(null);
                    setIpqReason('');
                    onClose();
                  }}
                  className="wb-btn"
                  style={{
                    background: IPQ_RED,
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Confirm — Mark as IPQ
                </button>
                <button
                  onClick={() => {
                    setMode(null);
                    setIpqReason('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#7A7460',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentsPage({ user, documents, setSelected, onDelete }) {
  const [tab, setTab] = useState('inbox');
  const [dateFilter, setDateFilter] = useState('today'); // 'today' | 'all' | a dayKey
  const [deptFilter, setDeptFilter] = useState('All');

  // Same redundant safety net as inboxCount in App above: once an
  // activity is Completed it must never reappear in anyone's queue,
  // including the Plant Manager's — currentDeptOf() already returns
  // null for Completed docs, and this && makes that guarantee explicit
  // here too.
  const inbox = documents.filter(
    (d) => currentDeptOf(d) === user.dept && d.status !== 'Completed'
  );
  const sent = documents.filter((d) => d.createdDept === user.dept);
  const base = tab === 'inbox' ? inbox : tab === 'sent' ? sent : documents;

  // Every distinct calendar day that has activity, newest first — this is
  // the "previous activity" archive the Plant Manager can jump back into
  // without having to hunt through the whole application.
  const availableDays = Array.from(
    new Set(documents.map((d) => dayKey(lastActivityISO(d))))
  )
    .filter((k) => k !== 'unknown')
    .sort((a, b) => (a < b ? 1 : -1));
  const todayKey = dayKey(new Date().toISOString());
  const previousDays = availableDays.filter((k) => k !== todayKey);

  let list = base;
  if (deptFilter !== 'All') {
    list = list.filter(
      (d) => currentDeptOf(d) === deptFilter || d.createdDept === deptFilter
    );
  }
  if (dateFilter === 'today') {
    list = list.filter((d) => isToday(lastActivityISO(d)));
  } else if (dateFilter !== 'all') {
    list = list.filter((d) => dayKey(lastActivityISO(d)) === dateFilter);
  }
  // Newest activity first, so the table itself reads like a live log.
  list = [...list].sort(
    (a, b) => new Date(lastActivityISO(b) || 0) - new Date(lastActivityISO(a) || 0)
  );

  const canDelete = canSeeEverything(user);
  const ipqInView = documents.filter((d) => d.status === 'IPQ').length;
  const todayCount = documents.filter((d) => isToday(lastActivityISO(d))).length;
  const tabs = [
    { key: 'inbox', label: 'Inbox', icon: InboxIcon, count: inbox.length },
    { key: 'sent', label: 'Sent by us', icon: Send, count: sent.length },
    {
      key: 'all',
      label: canSeeEverything(user)
        ? 'All departments'
        : 'All departments (view only)',
      icon: Archive,
      count: documents.length,
    },
  ];

  return (
    <div className="wb-page-padding" style={{ padding: '28px 32px' }}>
      {/* -------------------------------------------------------------- */}
      {/* IN PROCESS HERO — the same command-deck language used on the   */}
      {/* Dashboard / Packing Status / Announcements pages, re-themed    */}
      {/* cyan+gold for the document workflow. Reuses existing keyframes */}
      {/* only (wb-hero-in, wb-grid-pan-t, wb-drift-a/b, wb-title-shine, */}
      {/* wb-pulse-dot) — no new continuous animation added.             */}
      {/* -------------------------------------------------------------- */}
      <div className="wb-doc-hero">
        <div className="wb-doc-hero-gridlines" />
        <div className="wb-doc-hero-glow-a" />
        <div className="wb-doc-hero-glow-b" />
        <div className="wb-doc-hero-top">
          <div className="wb-prod-hero-eyebrow">
            <span className="wb-live-dot wb-live-dot-cyan" />
            <span>DOCUMENT WORKFLOW · LIVE</span>
            <span className="wb-hero-eyebrow-sep">·</span>
            <LiveClock />
          </div>
          <h2 className="wb-serif wb-prod-hero-title">
            <span className="wb-prod-hero-title-shine">In Process</span>
          </h2>
          <p className="wb-hero-sub" style={{ color: 'rgba(248,244,233,0.55)' }}>
            Every document moving through the company, tracked from department to department in real time
          </p>
        </div>
        <div className="wb-prod-hero-figures">
          <div className="wb-prod-figure">
            <div className="wb-prod-figure-icon">
              <InboxIcon size={14} color={CYAN} />
            </div>
            <p className="wb-prod-figure-value">{inbox.length}</p>
            <p className="wb-prod-figure-label">In your inbox</p>
          </div>
          <div className="wb-prod-figure">
            <div className="wb-prod-figure-icon">
              <Send size={14} color={CYAN} />
            </div>
            <p className="wb-prod-figure-value">{sent.length}</p>
            <p className="wb-prod-figure-label">Sent by us</p>
          </div>
          <div className={`wb-prod-figure${ipqInView > 0 ? ' wb-prod-figure-alert' : ''}`}>
            <div className="wb-prod-figure-icon">
              <PauseCircle size={14} color={ipqInView > 0 ? '#F0A8A8' : CYAN} />
            </div>
            <p className="wb-prod-figure-value">{ipqInView}</p>
            <p className="wb-prod-figure-label">IPQ hold</p>
          </div>
          <div className="wb-prod-figure">
            <div className="wb-prod-figure-icon">
              <Activity size={14} color={CYAN} />
            </div>
            <p className="wb-prod-figure-value">{todayCount}</p>
            <p className="wb-prod-figure-label">Today's activity</p>
          </div>
        </div>
      </div>

      {ipqInView > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FBEAEA',
            border: `1px solid ${IPQ_RED}`,
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            color: IPQ_RED,
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <PauseCircle size={15} />
          {ipqInView} activit{ipqInView === 1 ? 'y is' : 'ies are'} currently
          marked IPQ (Holding) — look for the red status in the table below.
        </div>
      )}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="wb-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: tab === t.key ? INK : 'white',
              color: tab === t.key ? 'white' : '#7A7460',
              border: `1px solid ${LINE}`,
            }}
          >
            <t.icon size={14} /> {t.label}{' '}
            <span style={{ fontSize: '11px' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Date filter bar — defaults to "Today", with a dedicated way to
          reach previous days' activity without leaving this page. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '16px',
          background: 'white',
          border: `1px solid ${LINE}`,
          borderRadius: '10px',
          padding: '12px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarDays size={14} color={GOLD} />
          <span style={{ fontSize: '12px', color: '#5C5646', fontWeight: 600 }}>
            Showing:
          </span>
        </div>
        <button
          onClick={() => setDateFilter('today')}
          style={{
            padding: '6px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            cursor: 'pointer',
            border: `1px solid ${dateFilter === 'today' ? GOLD : LINE}`,
            background: dateFilter === 'today' ? '#FBF3E3' : 'white',
            color: dateFilter === 'today' ? AMBER : '#7A7460',
          }}
        >
          Today's activity
        </button>
        <button
          onClick={() => setDateFilter('all')}
          style={{
            padding: '6px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            cursor: 'pointer',
            border: `1px solid ${dateFilter === 'all' ? GOLD : LINE}`,
            background: dateFilter === 'all' ? '#FBF3E3' : 'white',
            color: dateFilter === 'all' ? AMBER : '#7A7460',
          }}
        >
          All time
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
          <History size={13} color="#8A8370" />
          <select
            value={
              previousDays.includes(dateFilter) ? dateFilter : ''
            }
            onChange={(e) => e.target.value && setDateFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: `1px solid ${LINE}`,
              fontSize: '12px',
              color: '#5C5646',
            }}
          >
            <option value="">
              {previousDays.length
                ? 'Previous activity…'
                : 'No previous activity yet'}
            </option>
            {previousDays.map((k) => (
              <option key={k} value={k}>
                {dayLabel(k)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <Filter size={13} color="#8A8370" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: `1px solid ${LINE}`,
              fontSize: '12px',
              color: '#5C5646',
            }}
          >
            <option value="All">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="wb-card wb-table-scroll"
        style={{
          background: 'white',
          borderRadius: '10px',
          border: `1px solid ${LINE}`,
          overflow: 'auto',
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: '760px',
            fontSize: '14px',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr style={{ background: PAPER, textAlign: 'left' }}>
              <th
                style={{
                  padding: '12px 20px',
                  fontSize: '11px',
                  color: '#8A8370',
                }}
              >
                Doc No. / ID
              </th>
              <th
                style={{
                  padding: '12px 20px',
                  fontSize: '11px',
                  color: '#8A8370',
                }}
              >
                Title
              </th>
              <th
                style={{
                  padding: '12px 20px',
                  fontSize: '11px',
                  color: '#8A8370',
                }}
              >
                Routing
              </th>
              <th
                style={{
                  padding: '12px 20px',
                  fontSize: '11px',
                  color: '#8A8370',
                }}
              >
                With Dept.
              </th>
              <th
                style={{
                  padding: '12px 20px',
                  fontSize: '11px',
                  color: '#8A8370',
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: '12px 20px',
                  fontSize: '11px',
                  color: '#8A8370',
                }}
              >
                Date &amp; Time
              </th>
              {tab === 'all' && canDelete && (
                <th
                  style={{
                    padding: '12px 20px',
                    fontSize: '11px',
                    color: '#8A8370',
                  }}
                >
                  {' '}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td
                  colSpan={tab === 'all' && canDelete ? 7 : 6}
                  style={{
                    padding: '24px 20px',
                    color: '#9C9585',
                    textAlign: 'center',
                  }}
                >
                  {dateFilter === 'today'
                    ? "Nothing has happened yet today — try 'All time' or pick a previous day."
                    : 'Nothing here yet.'}
                </td>
              </tr>
            )}
            {list.map((d) => (
              <tr
                key={d.id}
                style={{
                  borderTop: `1px solid ${LINE}`,
                  background: d.status === 'IPQ' ? '#FDF4F4' : 'transparent',
                }}
              >
                <td
                  onClick={() => setSelected(d)}
                  style={{
                    padding: '14px 20px',
                    color: '#9C9585',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {d.id}
                </td>
                <td
                  onClick={() => setSelected(d)}
                  style={{
                    padding: '14px 20px',
                    color: INK,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {d.title}
                  {d.attachmentUrl && (
                    <Paperclip
                      size={12}
                      color="#8A8370"
                      style={{
                        display: 'inline',
                        marginLeft: '6px',
                        verticalAlign: 'middle',
                      }}
                    />
                  )}
                </td>
                <td
                  onClick={() => setSelected(d)}
                  style={{
                    padding: '14px 20px',
                    color: '#7A7460',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {d.routing === 'default' ? 'Default flow' : 'Manual'}
                </td>
                <td
                  onClick={() => setSelected(d)}
                  style={{
                    padding: '14px 20px',
                    color: '#7A7460',
                    cursor: 'pointer',
                  }}
                >
                  {currentDeptOf(d) || '—'}
                </td>
                <td
                  onClick={() => setSelected(d)}
                  style={{ padding: '14px 20px', cursor: 'pointer' }}
                >
                  <StatusPill status={d.status} />
                </td>
                <td
                  onClick={() => setSelected(d)}
                  style={{
                    padding: '14px 20px',
                    color: '#7A7460',
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatDateTime(lastActivityISO(d))}
                </td>
                {tab === 'all' && canDelete && (
                  <td style={{ padding: '14px 20px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            `Delete "${d.title}" (${d.id}) permanently? This cannot be undone.`
                          )
                        ) {
                          onDelete(d.id);
                        }
                      }}
                      title="Delete this document"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#8A2E2E',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// COMPOSE HERO — animated header for "Create & send a document",
// sharing the ink + violet "signal" language of the Document Drawer
// hero (since both are about a document travelling between
// departments) but with its own layout: a wide banner with a slowly
// travelling signal dot along a full-width dashed line, and a
// shimmering title.
// ---------------------------------------------------------------------
function ComposeHero() {
  return (
    <div className="wb-compose-hero">
      <div className="wb-compose-hero-gridlines" />
      <div className="wb-compose-hero-glow-a" />
      <div className="wb-compose-hero-glow-b" />
      <svg className="wb-compose-signal" viewBox="0 0 600 14" preserveAspectRatio="none">
        <line x1="0" y1="7" x2="600" y2="7" stroke="rgba(139,124,246,0.28)" strokeWidth="1" strokeDasharray="3 8" />
        <circle cx="7" cy="7" r="3.5" className="wb-compose-signal-dot" />
      </svg>
      <p className="wb-compose-eyebrow">
        <span className="wb-live-dot wb-live-dot-violet" />
        NEW ACTIVITY · COMPOSER
      </p>
      <h2 className="wb-serif wb-compose-title">
        <span className="wb-compose-title-shine">Create &amp; Send a Document</span>
      </h2>
      <p className="wb-compose-sub">
        Route it to one department, or launch the default company flow
      </p>
    </div>
  );
}

function NewDocumentPage({ user, onCreate, setPage }) {
  const types = Object.keys(DOC_TYPE_HINTS);
  const [type, setType] = useState(types[0]);
  const [title, setTitle] = useState('');
  const [routing, setRouting] = useState('custom');

  // Every department (including QA and QC) is a valid recipient for a
  // manually-routed "New Activity" — only the automated Default Company
  // Flow leaves QA/QC out.
  const optionsForType = (t) =>
    (DOC_TYPE_HINTS[t] || DEPARTMENTS).filter((d) => d !== user.dept);

  const [recipient, setRecipient] = useState(optionsForType(types[0])[0]);
  const [note, setNote] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const changeType = (t) => {
    setType(t);
    setRecipient(optionsForType(t)[0]);
  };
  const otherDepts = optionsForType(type);
  const defaultFirstHop = firstDefaultStep(user.dept);

  const submit = () => {
    onCreate({
      type,
      title,
      note,
      attachmentUrl: isGoogleDriveLink(attachmentUrl)
        ? normalizeAttachmentUrl(attachmentUrl)
        : attachmentUrl,
      routing,
      recipient: routing === 'custom' ? recipient : defaultFirstHop,
    });
    setTitle('');
    setNote('');
    setAttachmentUrl('');
    setFileName('');
    setPage('documents');
  };

  return (
    <div className="wb-page-padding" style={{ padding: '28px 32px', maxWidth: '600px' }}>
      <ComposeHero />
      <div
        className="wb-card"
        style={{
          background: 'white',
          borderRadius: '14px',
          border: `1px solid ${LINE}`,
          padding: '28px',
          marginTop: '18px',
          boxShadow: '0 1px 2px rgba(10,18,32,0.04)',
        }}
      >
        <label
          style={{
            fontSize: '12px',
            color: '#5C5646',
            display: 'block',
            marginBottom: '8px',
          }}
        >
          Routing
        </label>
        <div className="wb-routing-grid">
          <button
            onClick={() => setRouting('custom')}
            className={`wb-routing-card${routing === 'custom' ? ' wb-routing-card-selected' : ''}`}
          >
            {routing === 'custom' && <span className="wb-routing-card-glow" />}
            <Send size={16} color={routing === 'custom' ? GOLD : '#B0AA96'} style={{ marginBottom: '6px' }} />
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: 600,
                color: INK,
              }}
            >
              Choose department
            </p>
            <p
              style={{ margin: '4px 0 0', fontSize: '11px', color: '#7A7460' }}
            >
              Pick exactly who it goes to — any department, incl. QA/QC.
            </p>
          </button>
          <button
            onClick={() => setRouting('default')}
            className={`wb-routing-card${routing === 'default' ? ' wb-routing-card-selected' : ''}`}
          >
            {routing === 'default' && <span className="wb-routing-card-glow" />}
            <Workflow size={16} color={routing === 'default' ? GOLD : '#B0AA96'} style={{ marginBottom: '6px' }} />
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: 600,
                color: INK,
              }}
            >
              Default company flow
            </p>
            <p
              style={{ margin: '4px 0 0', fontSize: '11px', color: '#7A7460' }}
            >
              Auto-routes the standard chain (no QA/QC).
            </p>
          </button>
        </div>

        {routing === 'default' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              background: PAPER,
              border: `1px solid ${LINE}`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '18px',
              fontSize: '12px',
              color: '#5C5646',
            }}
          >
            <Workflow
              size={16}
              color={GOLD}
              style={{ flexShrink: 0, marginTop: '1px' }}
            />
            <span>
              Admin → Plant Manager → Production → Warehouse → Procurement
              (only if demand) → Closed. This one will first go to{' '}
              <b>{defaultFirstHop}</b>.
            </span>
          </div>
        )}

        <label
          style={{
            fontSize: '12px',
            color: '#5C5646',
            display: 'block',
            marginBottom: '6px',
          }}
        >
          Activity type
        </label>
        <select
          value={type}
          onChange={(e) => changeType(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '16px',
            border: `1px solid ${LINE}`,
            borderRadius: '6px',
          }}
        >
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <label
          style={{
            fontSize: '12px',
            color: '#5C5646',
            display: 'block',
            marginBottom: '6px',
          }}
        >
          Title / reference
        </label>
        <div style={{ marginBottom: '16px' }}>
          <ProductNameAutocomplete
            value={title}
            onChange={setTitle}
            placeholder="Start typing… e.g. Paracetamol, Titek, Amvazide"
          />
        </div>

        {routing === 'custom' && (
          <>
            <label
              style={{
                fontSize: '12px',
                color: '#5C5646',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Send to department
            </label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '16px',
                border: `1px solid ${LINE}`,
                borderRadius: '6px',
              }}
            >
              {otherDepts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </>
        )}

        <label
          style={{
            fontSize: '12px',
            color: '#5C5646',
            display: 'block',
            marginBottom: '6px',
          }}
        >
          Note — a message for the receiving department (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Let them know what to check, what's already been done, or anything to flag…"
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '16px',
            border: `1px solid ${LINE}`,
            borderRadius: '6px',
            boxSizing: 'border-box',
          }}
        />

        <AttachmentPicker
          attachmentUrl={attachmentUrl}
          setAttachmentUrl={setAttachmentUrl}
          fileName={fileName}
          setFileName={setFileName}
        />

        <button
          disabled={!title}
          onClick={submit}
          className="wb-btn wb-btn-gold"
          style={{
            background: !title
              ? '#D8D2C0'
              : `linear-gradient(120deg, ${INK} 0%, ${INK_DEEP} 100%)`,
            color: 'white',
            border: 'none',
            padding: '11px 22px',
            borderRadius: '8px',
            cursor: !title ? 'not-allowed' : 'pointer',
            boxShadow: !title ? 'none' : '0 8px 20px rgba(10,18,32,0.3)',
            width: '100%',
          }}
        >
          {routing === 'custom'
            ? `Send to ${recipient}`
            : `Start default flow → ${defaultFirstHop}`}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// WAREHOUSE INVENTORY — visible to every department (read-only for all
// departments EXCEPT Warehouse — see canManageInventory above). Split
// into 4 sections: Raw Material, Packaging Material, Finished Goods,
// General Items. Raw Material has a further split into two sub-sections
// — API's and Excipients — so those two families of raw material are
// kept organisationally separate while sharing exactly the same fields,
// permissions and history/ledger as everything else here. Each item can
// carry a manufacturing date, expiry date, and a minimum stock level;
// items below their minimum are flagged in red. No cap on how many items
// can be stored in any section (or sub-section).
//
// Every add/edit/delete is captured as a history entry (kept in the
// item's own `history` jsonb array) so anyone can open an item and see
// its complete movement trail — who changed what, when, previous vs new
// quantity, received/issued amounts, batch transfers, storage location
// and any notes/remarks left on that transaction. This history is
// visible to every department; only Warehouse can add new entries to it
// (by making a change).
//
// Real-time: this page subscribes to Supabase Realtime on the
// "inventory" table (see the effect in App below), so any add/edit/
// delete made by Warehouse appears for every other department
// immediately, without a page refresh — there is only one shared
// warehouse table for the whole company. This is ALSO the table that
// Production's "Send to Warehouse" → Warehouse "Accept" flow writes
// into automatically (category = 'Finished Goods') via the
// fn_accept_warehouse_transfer Supabase RPC — see WarehouseReceivingPanel
// below — so accepted production batches appear here live with no
// reload, the same way every other inventory change does.
//
// IMPORTANT — Supabase schema requirement: the "inventory" table needs
// these columns, or inserts/edits here will fail with a "schema cache"
// error. Run this once in the Supabase SQL editor if you see that error:
//
//   alter table inventory add column if not exists category text;
//   alter table inventory add column if not exists subcategory text;
//   alter table inventory add column if not exists subcategory2 text;
//   alter table inventory add column if not exists name text;
//   alter table inventory add column if not exists batch text;
//   alter table inventory add column if not exists qty numeric default 0;
//   alter table inventory add column if not exists unit text default 'units';
//   alter table inventory add column if not exists mfg_date date;
//   alter table inventory add column if not exists expiry date;
//   alter table inventory add column if not exists final_size text;
//   alter table inventory add column if not exists price numeric;
//   alter table inventory add column if not exists min_stock numeric default 0;
//   alter table inventory add column if not exists location text;
//   alter table inventory add column if not exists history jsonb default '[]';
//
// (subcategory2 stores the CEPH. / General group when subcategory is
// 'APIs' — see API_SUBSECTIONS below.)
// ---------------------------------------------------------------------
const INVENTORY_BLANK_FORM = {
  name: '',
  batch: '',
  qty: '',
  unit: '',
  mfg_date: '',
  expiry: '',
  final_size: '',
  price: '',
  min_stock: '',
  location: '',
  folio: '',
  batchTo: '',
  note: '',
};

// API's raw material is further split into two groups — CEPH. and
// GENERAL. Exactly the same fields, permissions and history/ledger as
// everywhere else in inventory; this is purely one more layer of
// organisation, same pattern as Raw Material -> API's/Excipients above.
const API_SUBSECTIONS = [
  { key: 'CEPH', label: 'CEPH.', icon: FlaskConical },
  { key: 'General', label: 'General', icon: Archive },
];

// ---------------------------------------------------------------------
// WAREHOUSE UNITS — the very first gate of Warehouse Inventory. Opening
// the page no longer drops straight into the stock dashboard: two big
// animated doors appear first — CEPH. and GENERAL — and whichever one
// is picked scopes EVERYTHING that follows to that unit.
//
// Inside a unit the page is byte-for-byte the same experience as before:
// the same Vault hero, the same four sections (Raw Material, Packaging
// Material, Finished Goods, General Items), the same Raw Material ->
// API's / Excipients sub-sections, the same CEPH./General API groups,
// the same add/edit/delete form, the same per-item history ledger, the
// same permissions (only Warehouse can manage, everyone can view live).
// The ONLY difference is scope: the list, every tile/count, the search,
// the CSV export and the duplicate-batch merge all look at that unit's
// stock only, and anything added while standing inside a unit is saved
// tagged with that unit. So stock added in CEPH. never shows up in
// GENERAL and vice versa. Switching units is one click, top-left.
//
// Storage: one extra text column, `unit_group`, holding 'CEPH' or
// 'GENERAL'. Run this once in the Supabase SQL editor:
//
//   alter table inventory add column if not exists unit_group text;
//
// Rows written before this existed have unit_group = null and are
// treated as belonging to the first unit (CEPH.), so nothing is ever
// hidden or lost. To move that legacy stock into GENERAL instead, run:
//
//   update inventory set unit_group = 'GENERAL' where unit_group is null;
// ---------------------------------------------------------------------
const WAREHOUSE_UNITS = [
  {
    key: 'CEPH',
    label: 'CEPH.',
    tagline: 'Cephalosporin unit',
    blurb: 'Dedicated cephalosporin block — its own raw material, packaging, finished goods and general stores.',
    icon: FlaskConical,
    accent: '#3FBE8E',
    accentLight: '#9BE8C9',
    accentRgb: '63,190,142',
  },
  {
    key: 'GENERAL',
    label: 'GENERAL',
    tagline: 'General unit',
    blurb: 'General manufacturing block — its own raw material, packaging, finished goods and general stores.',
    icon: Boxes,
    accent: GOLD,
    accentLight: GOLD_LIGHT,
    accentRgb: '201,165,92',
  },
];

// Which unit a row belongs to. Legacy rows (written before unit_group
// existed) fall back to the first unit so they stay visible.
function unitOf(item) {
  return item && item.unit_group ? item.unit_group : WAREHOUSE_UNITS[0].key;
}


// ---------------------------------------------------------------------
// PRODUCT MASTER LIST — Wellborne's full registered product catalogue
// (code, brand name, generic, pack size). This is the single source of
// truth product names are picked from in Warehouse Inventory and
// Packing Status, so the Warehouse and Production teams never have to
// type a product name by hand and risk a spelling mistake. Everything
// else on those forms (batch number, quantity, etc.) stays fully
// manual, exactly as before — only the product NAME field is backed by
// this list.
// ---------------------------------------------------------------------
const PRODUCTS_MASTER_LIST = [{"code": "005726", "name": "Amikar 100mg Inj", "generic": "Amikacin USP", "pack": "1's"}, {"code": "054870", "name": "Beloxi 7.5mg Tabs", "generic": "Meloxicam BP", "pack": "10's"}, {"code": "054871", "name": "Beloxi 15mg Tabs", "generic": "Meloxicam BP", "pack": "10's"}, {"code": "054872", "name": "Motivo 25mg Tabs", "generic": "Levosulpiride WB", "pack": "2 x 10's"}, {"code": "054873", "name": "Motivo 50mg Tabs", "generic": "Levosulpiride WB", "pack": "2 x 10's"}, {"code": "054874", "name": "Le-One 250mg Tabs", "generic": "Levofloxacin WB", "pack": "10's"}, {"code": "054875", "name": "Le-One 500mg Tabs", "generic": "Levofloxacin WB", "pack": "10's"}, {"code": "054876", "name": "Feforn 100mg Tabs", "generic": "Iron III Hydroxypolymaltose WB", "pack": "10's"}, {"code": "054877", "name": "Mecoborn 500mcg Tabs", "generic": "Mecobalamin USP", "pack": "2 x 10's/3 x 10's"}, {"code": "054878", "name": "P-Beta 20mg Tabs", "generic": "Piroxicam WB", "pack": "2 x 10's"}, {"code": "054879", "name": "Naxpro 250mg Tabs", "generic": "Naproxen BP", "pack": "2 x 10's"}, {"code": "054880", "name": "Naxpro 500mg Tabs", "generic": "Naproxen BP", "pack": "2 x 10's"}, {"code": "054881", "name": "Esoborn Inj", "generic": "Esomeprazole USP", "pack": "1's"}, {"code": "054882", "name": "Cefpam 500mg Inj", "generic": "Cefepime USP", "pack": "1's"}, {"code": "054883", "name": "Cefpam 1g Inj", "generic": "Cefepime USP", "pack": "1's"}, {"code": "054884", "name": "B-Metho 100mg Inj", "generic": "Suxamethonium Cl BP", "pack": "5's"}, {"code": "054885", "name": "Mecobron 500mcg Inj", "generic": "Mecobalamin WB", "pack": "10's"}, {"code": "054886", "name": "Le-One 500mg Inf", "generic": "Levofloxacin WB", "pack": "1's"}, {"code": "054887", "name": "Bromep Inj", "generic": "Omeprazole WB", "pack": "1's"}, {"code": "054888", "name": "Sulbron 1g Inj", "generic": "Cefoperazone/SulbactamWB", "pack": "1's"}, {"code": "054889", "name": "Sulbron 2g Inj", "generic": "Cefoperazone/SulbactamWB", "pack": "1's"}, {"code": "054890", "name": "Taczin 250mg Inj", "generic": "Cefotaxime USP", "pack": "1's"}, {"code": "054891", "name": "Taczin 500mg Inj", "generic": "Cefotaxime USP", "pack": "1's"}, {"code": "054892", "name": "Taczin 1g Inj", "generic": "Cefotaxime USP", "pack": "1's"}, {"code": "054893", "name": "B-Genta 80mg Inj", "generic": "Gentamicin BP", "pack": "5's"}, {"code": "054894", "name": "Belenz 30mg Inj", "generic": "Lansoprazole WB", "pack": "1's"}, {"code": "054895", "name": "B-Panta Inj", "generic": "Pantoprazole WB", "pack": "1's"}, {"code": "054896", "name": "Proart 80mg Inj", "generic": "Artemether WB", "pack": "5's"}, {"code": "054897", "name": "Zumax 100mg D.S", "generic": "Cefixime USP", "pack": "30ml x 1's"}, {"code": "054898", "name": "Zumax 200mg D.S", "generic": "Cefixime USP", "pack": "30ml x 1's"}, {"code": "054899", "name": "Zumax 400mg Caps", "generic": "Cefixime WB", "pack": "5's"}, {"code": "054900", "name": "Ciprotek 500mg Tabs", "generic": "Ciprofloxacin USP", "pack": "10's"}, {"code": "054901", "name": "Ciprotek 250mg Tabs", "generic": "Ciprofloxacin USP", "pack": "10's"}, {"code": "054902", "name": "Brocifen 250mg Inj", "generic": "Ceftriaxone USP", "pack": "1's"}, {"code": "054903", "name": "Brocifen 500mg Inj", "generic": "Ceftriaxone USP", "pack": "1's"}, {"code": "054904", "name": "Ciprotek 200mg Inf", "generic": "Ciprofloxacin USP", "pack": "1's"}, {"code": "054905", "name": "Brocifen 1g Inj", "generic": "Ceftriaxone USP", "pack": "1's"}, {"code": "054906", "name": "B-Panta 40mg Tabs", "generic": "Pantoprazole WB", "pack": "2 x 10's, 2 x 7's"}, {"code": "054907", "name": "Deborn-L Inj", "generic": "Diclofenac Sodium/Lidocaine WB", "pack": "1's"}, {"code": "054908", "name": "Diclobron-K 50mg Tabs", "generic": "Diclofenac Potassium WB", "pack": "20's"}, {"code": "054909", "name": "Proart Plus Tabs", "generic": "Artemether/Lumefantrine WB", "pack": "1 x 8's"}, {"code": "054910", "name": "Levtrin 5mg Tabs", "generic": "Levocetirizine WB", "pack": "10's"}, {"code": "054911", "name": "Citowel 10mg Tabs", "generic": "Escitalopram WB", "pack": "14's, 30's"}, {"code": "054912", "name": "Bropox 20mg Inj", "generic": "Piroxicam WB", "pack": "5's"}, {"code": "054913", "name": "Reborn 400mg Tabs", "generic": "Ribaverin USP", "pack": "10's"}, {"code": "054962", "name": "Esoborn 20mg Caps", "generic": "Esomeprazole USP", "pack": "2 x 7's"}, {"code": "054963", "name": "Esoborn 40mg Caps", "generic": "Esomeprazole USP", "pack": "2 x 7's"}, {"code": "054964", "name": "Bromep 20mg Caps", "generic": "Omeprazole USP", "pack": "2 x 7's"}, {"code": "056828", "name": "Deborn 75mg Inj", "generic": "Diclofenac Sodium WB", "pack": "5's"}, {"code": "056829", "name": "Deborn 50mg Tabs", "generic": "Diclofenac Sodium USP", "pack": "2 x 10's"}, {"code": "077411", "name": "D-Well 5mg Inj", "generic": "Cholecalciferol WB", "pack": "1's/5's"}, {"code": "077412", "name": "Mycophenol 500mg Tabs", "generic": "Mycophenolate WB", "pack": "10's/2 x 10's/5 x 10's"}, {"code": "078422", "name": "W-Borne Inj", "generic": "WFI USP", "pack": "1's"}, {"code": "078505", "name": "Fero 100mg Inj", "generic": "Iron Sucrose USP", "pack": "5's"}, {"code": "078506", "name": "Destidine 5mg Tabs", "generic": "Desloratadine USP", "pack": "10's"}, {"code": "080864", "name": "Zinzan 2mg Tabs", "generic": "Tizanidine USP", "pack": "10's"}, {"code": "080865", "name": "Zinzan 4mg Tabs", "generic": "Tizanidine USP", "pack": "10's"}, {"code": "080866", "name": "Feforn Plus Tabs", "generic": "Iron III Hydroxypolymaltose/Folic Acid WB", "pack": "10's"}, {"code": "080867", "name": "Ifaxim 200mg Tabs", "generic": "Rifaximin WB", "pack": "10's"}, {"code": "080868", "name": "Moxox 400mg Tablts", "generic": "Moxifloxacin USP", "pack": "5's"}, {"code": "080869", "name": "Olazap 5mg Tabs", "generic": "Olanzapine USP", "pack": "10's"}, {"code": "080870", "name": "Olazap 10mg Tabs", "generic": "Olanzapine USP", "pack": "10's"}, {"code": "080871", "name": "Rosutat 5mg Tabs", "generic": "Rosuvastatin USP", "pack": "10's"}, {"code": "080872", "name": "Egaser 6mg Tabs", "generic": "Tegaserod WB", "pack": "3x10's"}, {"code": "080908", "name": "Vglip 50mg Tabs", "generic": "Vildagliptin WB", "pack": "10's"}, {"code": "081205", "name": "Q-Well 25mg Tabs", "generic": "Quetiapine USP", "pack": "3 x 10's"}, {"code": "081206", "name": "Q-Well 100mg Tabs", "generic": "Quetiapine USP", "pack": "10's"}, {"code": "081207", "name": "Canex 16mg Tabs", "generic": "Candesartan USP", "pack": "28's"}, {"code": "081208", "name": "Bisfos 5mg Tabs", "generic": "Risedronate USP", "pack": "10's"}, {"code": "081209", "name": "Anavir 800mg Tabs", "generic": "Acyclovir USP", "pack": "2 x 10's"}, {"code": "081210", "name": "Canex 4mg Tabs", "generic": "Candesartan USP", "pack": "14's"}, {"code": "081211", "name": "Canex 8mg Tabs", "generic": "Candesartan USP", "pack": "14's"}, {"code": "081212", "name": "Zpras 60mg Caps", "generic": "Ziprasidone USP", "pack": "2 x 10's"}, {"code": "081213", "name": "Zpras 40mg Caps", "generic": "Ziprasidone USP", "pack": "14's"}, {"code": "081214", "name": "Ixib 100mg Caps", "generic": "Celecoxib BP", "pack": "4 x 5's"}, {"code": "081215", "name": "Mycotek 150mg Caps", "generic": "Fluconazole BP", "pack": "1's"}, {"code": "081216", "name": "Cefatek 500mg Caps", "generic": "Cefaclor USP", "pack": "12's"}, {"code": "081217", "name": "Cefatek 250mg Caps", "generic": "Cefaclor USP", "pack": "12's"}, {"code": "081218", "name": "Adrox 250mg Caps", "generic": "Cefadroxil USP", "pack": "10's"}, {"code": "081219", "name": "Adrox 500mg Caps", "generic": "Cefadroxil USP", "pack": "12's"}, {"code": "081220", "name": "Adrox 125mg D.S", "generic": "Cefadroxil USP", "pack": "60ml x 1's"}, {"code": "081221", "name": "Adrox 250mg D.S", "generic": "Cefadroxil USP", "pack": "60ml x 1's"}, {"code": "081222", "name": "Cefatek 125mg D.S", "generic": "Cefaclor USP", "pack": "60ml x 1's"}, {"code": "081223", "name": "Cefatek 250mg D.S", "generic": "Cefaclor USP", "pack": "60ml x 1's"}, {"code": "081224", "name": "Cefratek 250mg Caps", "generic": "Cephradine USP", "pack": "12's"}, {"code": "081225", "name": "Aztek 250mg Caps", "generic": "Azithromycin USP", "pack": "2 x 5's"}, {"code": "081747", "name": "Xtab 250mg Caps", "generic": "Cephalexin WB", "pack": "12's"}, {"code": "081748", "name": "Xtab 500mg Caps", "generic": "Cephalexin WB", "pack": "12's"}, {"code": "081749", "name": "Xtab 250mg D.S", "generic": "Cephalexin WB", "pack": "60ml x 1's"}, {"code": "081750", "name": "Xtab 125mg D.S", "generic": "Cephalexin USP", "pack": "60ml x 1's"}, {"code": "082617", "name": "Kbron 250mg Tabs", "generic": "Clarithromycin USP", "pack": "10's"}, {"code": "082618", "name": "Kbron 500mg Tabs", "generic": "Clarithromycin USP", "pack": "10's"}, {"code": "082619", "name": "Catraz 150mg Tabs", "generic": "Oxcarbazepine USP", "pack": "5 x 10's"}, {"code": "082620", "name": "Catraz 300mg Tabs", "generic": "Oxcarbazepine USP", "pack": "1's"}, {"code": "082621", "name": "Catraz 600mg Tabs", "generic": "Oxcarbazepine USP", "pack": "1's"}, {"code": "083877", "name": "Velair 10mg Tabs", "generic": "Loratadine USP", "pack": "10's"}, {"code": "083878", "name": "Enadine 60mg Tabs", "generic": "Fexofenadine USP", "pack": "10's"}, {"code": "083879", "name": "Enadine 120mg Tabs", "generic": "Fexofenadine USP", "pack": "10's"}, {"code": "083880", "name": "Enadine 180mg Tabs", "generic": "Fexofenadine USP", "pack": "10's"}, {"code": "083881", "name": "Virokalim 600mg Tabs", "generic": "Telbivudine Innv", "pack": "28's"}, {"code": "083882", "name": "CFR 4mg Tabs", "generic": "Chlorpheniramine USP", "pack": "10 x 100's"}, {"code": "083883", "name": "Ikast 10mg Tabs", "generic": "Montelukast USP", "pack": "14's"}, {"code": "086476", "name": "Abenaki 100mg Caps", "generic": "Pregabalin Innv", "pack": "10's"}, {"code": "086477", "name": "Abenaki 150mg Caps", "generic": "Pregabalin Innv", "pack": "10's"}, {"code": "086478", "name": "Abenaki 300mg Caps", "generic": "Pregabalin Innv", "pack": "14's"}, {"code": "087013", "name": "Dagmet 50/500mg Tabs", "generic": "Vildagliptin/Metformin Innv", "pack": "14's/28's"}, {"code": "087014", "name": "Dagmet 50/1000mg Tabs", "generic": "Vildaglitpin/Metformin Innv", "pack": "14's/28's"}, {"code": "087015", "name": "Virastep 0.5mg Tabs", "generic": "Entecavir USP", "pack": "3 x 10's"}, {"code": "087016", "name": "Virastep 1mg Tabs", "generic": "Entecavir USP", "pack": "3 x 10's"}, {"code": "087436", "name": "Amvazide 10/160/12.5mg Tab.", "generic": "Amlodipine/Valsartan/HCT USP", "pack": "10's/20's"}, {"code": "087437", "name": "Amvazide 5/160/12.5mg Tab.", "generic": "Amlodipine/Valsartan/HCT USP", "pack": "14's/28's"}, {"code": "087438", "name": "Amvazide 10/160/25mg Tab.", "generic": "Amlodipine/Valsartan/HCT USP", "pack": "10's/20's"}, {"code": "087439", "name": "Amvazide 5/160/25mg Tab.", "generic": "Amlodipine/Valsartan/HCT USP", "pack": "14's/28's"}, {"code": "087440", "name": "Amvazide 10/320/25mg Tab.", "generic": "Amlodipine/Valsartan/HCT USP", "pack": "14's"}, {"code": "088006", "name": "Veronic 300mg Tabs", "generic": "Tenofovir IP", "pack": "30's"}, {"code": "088557", "name": "Dagmet 50/850mg Tabs", "generic": "Vildaglitpin/Metformin Innv", "pack": "14's/28's"}, {"code": "088700", "name": "Meem 1mg Tabs", "generic": "Vildaglitpin/Metformin Innv", "pack": "2 x 10's"}, {"code": "088701", "name": "Meem 2mg Tabs", "generic": "Glimepiride USP", "pack": "2 x 10's"}, {"code": "088702", "name": "Meem 3mg Tabs", "generic": "Glimepiride USP", "pack": "2 x 10's"}, {"code": "088703", "name": "Meem 4mg Tabs", "generic": "Glimepiride USP", "pack": "2 x 10's"}, {"code": "089773", "name": "Sitanec 50/1000 mg Tabs", "generic": "Sitagliptin/Metformin Innv", "pack": "10's"}, {"code": "089774", "name": "Sitanec 50/500 mg Tabs", "generic": "Sitagliptin/Metformin Innv", "pack": "10's"}, {"code": "090718", "name": "Wellzol 400mg Tabs", "generic": "Metronidazole USP", "pack": "100's"}, {"code": "090719", "name": "Finto 250mg Inj", "generic": "Ceftazidime USP", "pack": "1's"}, {"code": "090720", "name": "Finto 500mg Inj", "generic": "Ceftazidime USP", "pack": "1's"}, {"code": "090721", "name": "Moxox 400mg Inf", "generic": "Moxifloxacin Innv", "pack": "1's"}, {"code": "090722", "name": "Temd 325/37.5mg Tabs", "generic": "Paracetamol/Tramadol USP", "pack": "10's"}, {"code": "090723", "name": "Finto 1g Inj", "generic": "Ceftazidime USP", "pack": "1's"}, {"code": "090724", "name": "Wellzol 500mg Inf", "generic": "Metronidazole USP", "pack": "1's"}, {"code": "090725", "name": "Zolweb 2.5mg Tabs", "generic": "Latrozole USP", "pack": "1's/30's"}, {"code": "091358", "name": "Bonema 35mg Tabs", "generic": "Risedronate Innv", "pack": "4's"}, {"code": "093274", "name": "CTX 500mg Inj", "generic": "Ceftriaxone USP", "pack": "1's"}, {"code": "093275", "name": "CTX 250mg Inj", "generic": "Ceftriaxone USP", "pack": "1's"}, {"code": "093276", "name": "CTX 1g Inj", "generic": "Ceftriaxone USP", "pack": "1's"}, {"code": "093350", "name": "Neocef 1g Inj", "generic": "Ceftriaxone USP", "pack": "1's"}, {"code": "093351", "name": "Neocef 500mg Inj", "generic": "Ceftriaxone USP", "pack": "1's"}, {"code": "093352", "name": "Neocef 250mg Inj", "generic": "Ceftriaxone USP", "pack": "1's"}, {"code": "093629", "name": "Predox 40mg/5ml Dry Susp.", "generic": "Cefpodoxime USP", "pack": "50ml x 1's"}, {"code": "094693", "name": "Nofiver 30mg Inj", "generic": "Ketorolac USP", "pack": "5's"}, {"code": "094694", "name": "Solben 50mg Tabs", "generic": "Itopride Innv", "pack": "10's"}, {"code": "094737", "name": "Sindolar 50mg SR Tabs", "generic": "Tramadol Innv", "pack": "10's"}, {"code": "095098", "name": "Emjao 4mg Tabs", "generic": "Ondansetron USP", "pack": "10's"}, {"code": "095099", "name": "Emjao 8mg Tabs", "generic": "Ondansetron USP", "pack": "10's"}, {"code": "095181", "name": "Titek 10mg Tabs", "generic": "Atorvastatin USP", "pack": "10's"}, {"code": "095182", "name": "Titek 20mg Tabs", "generic": "Atorvastatin USP", "pack": "10's"}, {"code": "095183", "name": "Titek 40mg Tabs", "generic": "Atorvastatin USP", "pack": "10's"}, {"code": "095184", "name": "Rosutat 10mg Tabs", "generic": "Rosuvastatin USP", "pack": "10's"}, {"code": "095185", "name": "Rosutat 20mg Tabs", "generic": "Rosuvastatin USP", "pack": "10's"}, {"code": "095988", "name": "DLX 60mg Caps", "generic": "Duloxetine USP", "pack": "10's/14's/28's/30's"}, {"code": "095989", "name": "DLX 20mg Caps", "generic": "Duloxetine USP", "pack": "10's/14's/28's/30's"}, {"code": "095990", "name": "DLX 30mg Caps", "generic": "Duloxetine USP", "pack": "10's/14's/28's/30's"}, {"code": "096159", "name": "Linzotek 600mg Tabs", "generic": "Linezolid USP", "pack": "12's"}, {"code": "096160", "name": "Abenaki 50mg Caps", "generic": "Pregabalin Innv", "pack": "10's/14's/20's/30's"}, {"code": "096161", "name": "Abenaki 75mg Caps", "generic": "Pregabalin Innv", "pack": "10's/14's/20's/30's"}, {"code": "096162", "name": "Lotiox 8mg Tabs", "generic": "Lornoxicam Innv", "pack": "10's"}, {"code": "096889", "name": "Wellverim 135mg Tabs", "generic": "Mebeverine BP", "pack": "30's"}, {"code": "096292", "name": "Epritek 50mg Tabs", "generic": "Eperisone Innv", "pack": "2x10's/3 x 10's"}, {"code": "096999", "name": "Tramine 500mg Caps", "generic": "Tranexamic Acid JP", "pack": "20's"}, {"code": "097000", "name": "Fas Fotek 500mg Caps", "generic": "Fosfomycin Innv", "pack": "10's"}, {"code": "097176", "name": "Emjao 8mg Inj", "generic": "Ondansetron USP", "pack": "5's"}, {"code": "098791", "name": "Chloroton Inj", "generic": "NS 0.9% USP", "pack": "1's"}, {"code": "101182", "name": "BCBL CR 12.5mg Tabs", "generic": "Paroxetine USP", "pack": "3 x 10's"}, {"code": "101183", "name": "BCBL CR 25mg Tabs", "generic": "Paroxetine USP", "pack": "3 x 10's"}, {"code": "101184", "name": "BCBL CR 37.5mg Tabs", "generic": "Paroxetine USP", "pack": "3 x 10's"}, {"code": "104498", "name": "Colistitek 80mg Inj", "generic": "Colistimethate USP", "pack": "1's"}, {"code": "104499", "name": "Terborn 250mg Tabs", "generic": "Terbinafine USP", "pack": "10's"}, {"code": "104500", "name": "Terborn 125mg Tabs", "generic": "Terbinafine USP", "pack": "10's"}, {"code": "104501", "name": "Brocifen 2g Inj", "generic": "Ceftriaxone USP", "pack": "1's"}, {"code": "104493", "name": "Cqborn-H 200mg Tabs", "generic": "Hydroxychloroquine USP", "pack": "30's/5 x 10's"}, {"code": "104494", "name": "Cqborn 250mg Tabs", "generic": "Chloroquine Phosphate USP", "pack": "50 x 10's"}, {"code": "104495", "name": "Lopitek 200/50mg Tabs", "generic": "Lopinavir/Ritonavir USP", "pack": "120's"}, {"code": "104496", "name": "Stamitek 75mg Caps", "generic": "Oseltamivir USP", "pack": "10's"}, {"code": "104497", "name": "Wellborne C 500mg Tabs", "generic": "Ascorbic Acid USP", "pack": "4 x 10's"}, {"code": "110137", "name": "Borncast 10mg Tabs", "generic": "Zafirlukast Innv", "pack": "28's"}, {"code": "110138", "name": "Borncast 20mg Tabs", "generic": "Zafirlukast Innv", "pack": "20's/28's"}, {"code": "114636", "name": "Tofucib 40mg Tabs", "generic": "Febuxostat Innv", "pack": "20's"}, {"code": "114637", "name": "Lolneb 2.5mg Tabs", "generic": "Nebivolol Innv", "pack": "2 x 7's"}, {"code": "114638", "name": "Lolneb 5mg Tabs", "generic": "Nebivolol Innv", "pack": "2 x 7's"}, {"code": "114639", "name": "Lolneb 10mg Tabs", "generic": "Nebivolol Innv", "pack": "2 x 7's"}, {"code": "115927", "name": "Bromep 40mg Caps", "generic": "Omeprazole USP", "pack": "2 x 7's"}, {"code": "115896", "name": "Tureng 50mg Tabs", "generic": "Lacosamide USP", "pack": "14's"}, {"code": "115897", "name": "Tureng 100mg Tabs", "generic": "Lacosamide USP", "pack": "14's"}, {"code": "115898", "name": "Tureng 200mg Tabs", "generic": "Lacosamide USP", "pack": "14's"}];

// ---------------------------------------------------------------------
// ProductNameAutocomplete — a colourful, animated "type to search, pick
// from a table" input used everywhere a Product Name is entered
// (Warehouse Inventory's Item Name, Packing Status's Daily Packing
// Product Name). The person can still type freely — nothing forces a
// selection — but as they type, a live table of matches from the
// Product Master List drops down (code / name / generic / pack), each
// row tinted a different accent colour, so picking the right row locks
// in the exact registered spelling with one click. Esc or clicking
// outside closes it; the typed value is always what ends up in the
// field either way.
// ---------------------------------------------------------------------
// APIS_MASTER_LIST — the registered raw-material API (Active
// Pharmaceutical Ingredient) names, sourced from Wellborne's master
// API list, used by ApiNameAutocomplete below the same way
// PRODUCTS_MASTER_LIST is used by ProductNameAutocomplete — so the
// Raw Material -> API's Item Name field can only ever pick a
// correctly-spelled, registered API name.
const APIS_MASTER_LIST = ["Amikacin", "Meloxicam", "Levosulpiride", "Levofloxacin HH", "Iron III Hydroxypolymaltose", "Mecobalamin", "Piroxicam", "Piroxicam BCD", "Naproxen", "Naproxen Na", "Esomeprazole Na (St)", "Esomeprazole Mg Pellets", "Cefepime HCl", "Suxamethonium Cl", "Omeprazole Pellets", "Omeprazole Na (St)", "Cefoperazone/Sulbactam Na", "Cefotaxime Na", "Gentamicin Sulfate", "Lansoprazole", "Cefixime TH (M)", "Cefixime TH (C)", "Ciprofloxacin HCl", "Ceftriaxone Na", "Pantoprazole Na (St)", "Pantoprazole Na SQH", "Diclofenac Na", "Lidocaine HCl", "Diclofenac K", "Artemether", "Lumefantrine", "Levocetirizine 2HCl", "Escitalopram Oxalate", "Ribaverin", "Cholecalciferol", "Mycophenolate Mofetil", "Iron Sucrose", "Desloratadine", "Tizanidine HCl", "Folic Acid", "Rifaximin", "Moxifloxacin HCl", "Olanzapine", "Rosuvastatin Ca", "Tegaserod Maleate", "Quetiapine Fumarate", "Candesartan Cilexetil", "Risedronate Na", "Acyclovir", "Ziprasidone HCl", "Celecoxib", "Fluconazole", "Cefadroxil MH", "Cefaclor MH", "Cephradine MH", "Azithromycin DH", "Cephalexin MH", "Clarithromycin", "Oxcarbazepine", "Loratadine", "Fexofenadine HCl", "Telbivudine", "Chlorpheniramine Maleate", "Montelukast Na", "Pregabalin", "Vildagliptin", "Metformin NCl", "Entecavir", "Amlodipine", "Valsartan", "Hydrochlorothiazide", "Tenofovir Disoproxil Fumarate", "Glimepiride", "Sitagliptin Phosphate MH", "Metronidazole", "Ceftazidime PH", "Paracetamol", "Tramadol HCl", "Letrozole", "Cefpodoxime Proxetil", "Ketorolac Tromethamine", "Itopride HCl", "Ondansetron HCl", "Atorvastatin Ca", "Duloxetine HCl", "Linezolid", "Lornoxicam", "Mebeverine HCl", "Eperisone HCl", "Tranexamic Acid", "Fosfomycin Tromethamine", "Paroxetine HCl", "Colistimethate Na", "Terbinafine HCl", "Hydroxychloroquine Sulfate", "Chloroquine Phosphate", "Lopinavir", "Ritonavir", "Oseltamivir Phosphate", "Ascorbic Acid", "Zafirlukast", "Febuxostat", "Nebivolol HCl", "Lacosamide"];

const WB_PRODUCT_ROW_ACCENTS = [GOLD, CYAN_DEEP, VIOLET, AMBER];

// Wrapped in React.memo — this sits inside forms (Warehouse Inventory's
// Add Item, Packing Status's Daily Packing) where several sibling
// fields share the same parent component. Without this, typing into
// Batch Number/Qty/Note etc. re-renders this component too even though
// its own value/placeholder haven't changed.
const ProductNameAutocomplete = React.memo(function ProductNameAutocomplete({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [coords, setCoords] = useState(null);
  const wrapRef = useRef(null);
  const dropRef = useRef(null);

  // The input can sit inside a modal card that clips overflow (for its
  // rounded corners) or inside a scrollable panel — either would cut
  // the dropdown off. Rendering it through a portal into document.body
  // and positioning it with fixed coordinates (read from the input's
  // own bounding box) sidesteps every ancestor's overflow/z-index rules
  // so the list is always fully visible, wherever this field is used.
  const reposition = useCallback(() => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    reposition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, reposition]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        dropRef.current && !dropRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const q = (value || '').trim().toLowerCase();
  const matches = q
    ? PRODUCTS_MASTER_LIST.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.generic.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q)
      ).slice(0, 8)
    : PRODUCTS_MASTER_LIST.slice(0, 8);

  const pick = (p) => {
    onChange(p.name);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, matches.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { if (matches[highlight]) { e.preventDefault(); pick(matches[highlight]); } }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  const dropdown = open && coords ? (
    <div
      ref={dropRef}
      className="wb-pna-drop"
      style={{
        position: 'fixed',
        zIndex: 99999,
        top: coords.top,
        left: coords.left,
        width: coords.width,
        background: 'white',
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        boxShadow: '0 18px 44px rgba(4,7,17,0.28)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          background: `linear-gradient(120deg, ${INK_DEEP} 0%, ${INK} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: GOLD_LIGHT, fontSize: 10.5, letterSpacing: '0.1em', fontWeight: 700 }}>
          PRODUCT MASTER LIST
        </span>
        <span style={{ color: 'rgba(248,244,233,0.55)', fontSize: 10.5 }}>
          {matches.length} match{matches.length === 1 ? '' : 'es'}
        </span>
      </div>
      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {matches.length === 0 ? (
          <div style={{ padding: '16px 14px', fontSize: 12.5, color: '#9C9585', textAlign: 'center' }}>
            No catalogue match — this will be saved exactly as typed.
          </div>
        ) : (
          matches.map((p, i) => {
            const accent = WB_PRODUCT_ROW_ACCENTS[i % WB_PRODUCT_ROW_ACCENTS.length];
            const active = i === highlight;
            return (
              <div
                key={p.code}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => { e.preventDefault(); pick(p); }}
                className="wb-pna-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  cursor: 'pointer',
                  borderLeft: `3px solid ${accent}`,
                  background: active ? `${accent}14` : 'white',
                  borderTop: `1px solid ${LINE}`,
                  transition: 'background 0.12s ease',
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: 'white',
                    background: accent,
                    borderRadius: 5,
                    padding: '2px 6px',
                    letterSpacing: '0.03em',
                  }}
                >
                  {p.code}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </p>
                  <p style={{ margin: '1px 0 0', fontSize: 10.5, color: '#8A8370', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.generic}
                  </p>
                </div>
                <span style={{ flexShrink: 0, fontSize: 10, color: accent, fontWeight: 600 }}>{p.pack}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  ) : null;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlight(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder || 'Start typing a product name…'}
          autoComplete="off"
          style={{
            width: '100%',
            padding: '9px 34px 9px 10px',
            border: `1.5px solid ${open ? GOLD : LINE}`,
            borderRadius: 8,
            boxSizing: 'border-box',
            fontSize: 13,
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            boxShadow: open ? `0 0 0 3px ${GOLD}22` : 'none',
          }}
        />
        <Search size={14} color={open ? GOLD : '#9C9585'} style={{ position: 'absolute', right: 11, top: 11, pointerEvents: 'none', transition: 'color 0.15s ease' }} />
      </div>
      {dropdown && ReactDOM.createPortal(dropdown, document.body)}
    </div>
  );
});

// ---------------------------------------------------------------------
// ApiNameAutocomplete — the same colourful, animated "type to search,
// pick from a list" input as ProductNameAutocomplete above, but sourced
// from APIS_MASTER_LIST (the registered raw-material API names) rather
// than the finished-product catalogue. Used for the Item Name field
// under Raw Material -> API's, so an API can only ever be entered under
// its exact registered spelling. The API list is a flat list of names
// (no code/generic/pack, unlike the product catalogue), so each row
// just shows the name against a rotating accent colour — everything
// else (portal positioning, keyboard nav, outside-click close) mirrors
// ProductNameAutocomplete exactly, so both fields feel identical.
// ---------------------------------------------------------------------
const ApiNameAutocomplete = React.memo(function ApiNameAutocomplete({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [coords, setCoords] = useState(null);
  const wrapRef = useRef(null);
  const dropRef = useRef(null);

  const reposition = useCallback(() => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    reposition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, reposition]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        dropRef.current && !dropRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const q = (value || '').trim().toLowerCase();
  const matches = q
    ? APIS_MASTER_LIST.filter((name) => name.toLowerCase().includes(q)).slice(0, 8)
    : APIS_MASTER_LIST.slice(0, 8);

  const pick = (name) => {
    onChange(name);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, matches.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { if (matches[highlight]) { e.preventDefault(); pick(matches[highlight]); } }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  const dropdown = open && coords ? (
    <div
      ref={dropRef}
      className="wb-pna-drop"
      style={{
        position: 'fixed',
        zIndex: 99999,
        top: coords.top,
        left: coords.left,
        width: coords.width,
        background: 'white',
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        boxShadow: '0 18px 44px rgba(4,7,17,0.28)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          background: `linear-gradient(120deg, ${INK_DEEP} 0%, ${INK} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: GOLD_LIGHT, fontSize: 10.5, letterSpacing: '0.1em', fontWeight: 700 }}>
          API MASTER LIST
        </span>
        <span style={{ color: 'rgba(248,244,233,0.55)', fontSize: 10.5 }}>
          {matches.length} match{matches.length === 1 ? '' : 'es'}
        </span>
      </div>
      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {matches.length === 0 ? (
          <div style={{ padding: '16px 14px', fontSize: 12.5, color: '#9C9585', textAlign: 'center' }}>
            No catalogue match — this will be saved exactly as typed.
          </div>
        ) : (
          matches.map((name, i) => {
            const accent = WB_PRODUCT_ROW_ACCENTS[i % WB_PRODUCT_ROW_ACCENTS.length];
            const active = i === highlight;
            return (
              <div
                key={name}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => { e.preventDefault(); pick(name); }}
                className="wb-pna-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  cursor: 'pointer',
                  borderLeft: `3px solid ${accent}`,
                  background: active ? `${accent}14` : 'white',
                  borderTop: `1px solid ${LINE}`,
                  transition: 'background 0.12s ease',
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: accent,
                  }}
                />
                <p style={{ margin: 0, flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {name}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  ) : null;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlight(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder || 'Start typing an API name…'}
          autoComplete="off"
          style={{
            width: '100%',
            padding: '9px 34px 9px 10px',
            border: `1.5px solid ${open ? GOLD : LINE}`,
            borderRadius: 8,
            boxSizing: 'border-box',
            fontSize: 13,
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            boxShadow: open ? `0 0 0 3px ${GOLD}22` : 'none',
          }}
        />
        <Search size={14} color={open ? GOLD : '#9C9585'} style={{ position: 'absolute', right: 11, top: 11, pointerEvents: 'none', transition: 'color 0.15s ease' }} />
      </div>
      {dropdown && ReactDOM.createPortal(dropdown, document.body)}
    </div>
  );
});

// ---------------------------------------------------------------------
// Batch-number merge helper — shared by Warehouse Inventory and Packing
// Status. Given the item's scoping key (category, etc.) plus a batch
// number, finds an already-existing record in the same scope with the
// same batch number (trimmed, case-insensitive) so a re-entry of the
// same batch merges straight into it instead of creating a duplicate
// line.
// ---------------------------------------------------------------------
function wbFindBatchMatch(list, batchNumber, scopeMatch) {
  const b = (batchNumber || '').trim().toLowerCase();
  if (!b) return null;
  return list.find((x) => (x.batch || x.batch_number || '').trim().toLowerCase() === b && scopeMatch(x)) || null;
}


// One line per change to an inventory item: what moved, who moved it,
// and where it went. Rendered inside InventoryHistoryModal, newest entry
// first. Read-only for everyone (including Warehouse) — history is a
// log, not an editable record.
function InventoryHistoryModal({ item, onClose }) {
  if (!item) return null;
  // Every entry is guarded below rather than trusted outright — this
  // modal is fed by two different writers (the app's own forms, and
  // whatever a Supabase RPC like fn_accept_warehouse_transfer inserts
  // server-side for Finished Goods), so a shape mismatch between the two
  // should degrade to "skip this line" rather than throw and leave the
  // whole modal looking like it "won't open".
  const entries = (Array.isArray(item.history) ? [...item.history] : [])
    .filter((h) => h && typeof h === 'object')
    .reverse();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(4,7,17,0.5)',
          backdropFilter: 'blur(3px)',
        }}
      />
      <div
        className="wb-history-modal"
        style={{
          position: 'relative',
          background: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(4,7,17,0.35)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            borderBottom: `1px solid ${LINE}`,
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            background: `linear-gradient(120deg, ${INK_DEEP} 0%, ${INK} 100%)`,
          }}
        >
          <div>
            <p style={{ color: 'rgba(248,244,233,0.55)', fontSize: '11px', margin: 0, letterSpacing: '0.06em' }}>
              ITEM HISTORY
            </p>
            <h2 className="wb-serif" style={{ color: '#F8F4E9', fontSize: '20px', margin: '4px 0 0' }}>
              {item.name}
            </h2>
            <p style={{ color: 'rgba(248,244,233,0.5)', fontSize: '12px', margin: '6px 0 0' }}>
              Batch No. {item.batch || '—'} · Current qty: {item.qty} {item.unit} ·{' '}
              {item.category || 'General Items'}
              {item.subcategory ? ` — ${item.subcategory === 'APIs' ? "API's" : item.subcategory}` : ''}
              {item.subcategory2 ? ` — ${item.subcategory2 === 'CEPH' ? 'CEPH.' : 'General'}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
          >
            <X size={16} color="#F8F4E9" />
          </button>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          <div className="wb-history-summary-grid">
            <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: '10px', padding: '12px' }}>
              <p style={{ fontSize: '10px', color: '#8A8370', margin: '0 0 4px' }}>MFG MONTH</p>
              <p style={{ fontSize: '13px', color: INK, margin: 0, fontWeight: 600 }}>{formatDate(item.mfg_date)}</p>
            </div>
            <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: '10px', padding: '12px' }}>
              <p style={{ fontSize: '10px', color: '#8A8370', margin: '0 0 4px' }}>EXP MONTH</p>
              <p style={{ fontSize: '13px', color: INK, margin: 0, fontWeight: 600 }}>{formatDate(item.expiry)}</p>
            </div>
            <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: '10px', padding: '12px' }}>
              <p style={{ fontSize: '10px', color: '#8A8370', margin: '0 0 4px' }}>STORAGE LOCATION</p>
              <p style={{ fontSize: '13px', color: INK, margin: 0, fontWeight: 600 }}>{item.location || 'Not specified'}</p>
            </div>
          </div>

          <p style={{ color: '#8A8370', fontSize: '12px', marginBottom: '12px' }}>
            COMPLETE MOVEMENT HISTORY — every transaction, newest first
          </p>

          {entries.length === 0 && (
            <p style={{ color: '#9C9585', fontSize: '13px' }}>
              No recorded changes yet for this item.
            </p>
          )}

          {entries.map((h, i) => {
            const received = Number(h.quantityReceived || 0);
            const issued = Number(h.quantityIssued || 0);
            return (
              <div
                key={i}
                style={{
                  border: `1px solid ${LINE}`,
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '12px',
                  background: i === 0 ? '#FBF3E3' : 'white',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <p style={{ color: INK, fontSize: '13px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                      {h.action}
                      {/* Folio from the register's own FOLIO column, shown
                          right next to the Particulars text it belongs
                          to — so the ledger reads "Particulars · Folio"
                          the same way the register's row reads them side
                          by side, instead of the folio getting lost. */}
                      {h.folio && (
                        <span style={{ fontWeight: 400, color: '#8A8370', fontSize: '12px' }}>
                          · Folio: <b style={{ color: '#5C5646', fontWeight: 600 }}>{h.folio}</b>
                        </span>
                      )}
                      {h.source === 'register' && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '9.5px',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            color: '#0F9C89',
                            background: 'rgba(47,224,201,0.14)',
                            border: '1px solid rgba(15,156,137,0.3)',
                            borderRadius: '999px',
                            padding: '2px 8px',
                          }}
                        >
                          <ClipboardList size={10} /> VIA REGISTER
                        </span>
                      )}
                    </p>
                    <p style={{ color: '#7A7460', fontSize: '12px', margin: '2px 0 0' }}>
                      {h.user} ({h.dept})
                    </p>
                  </div>
                  <p style={{ color: '#B0AA96', fontSize: '11px', margin: 0, whiteSpace: 'nowrap' }}>
                    {formatDateTime(h.atISO) !== '—' ? formatDateTime(h.atISO) : h.at}
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '8px',
                    fontSize: '12px',
                    color: '#5C5646',
                    marginTop: '10px',
                  }}
                >
                  <div>
                    <span style={{ color: '#9C9585' }}>Previous qty: </span>
                    <b>{h.previousQty != null ? `${h.previousQty} ${item.unit}` : '—'}</b>
                  </div>
                  <div>
                    <span style={{ color: '#9C9585' }}>New qty: </span>
                    <b>{h.newQty != null ? `${h.newQty} ${item.unit}` : '—'}</b>
                  </div>
                  {received > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1F4B3F' }}>
                      <ArrowDownCircle size={13} /> Received: <b>{received} {item.unit}</b>
                    </div>
                  )}
                  {issued > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: RED }}>
                      <ArrowUpCircle size={13} /> Issued: <b>{issued} {item.unit}</b>
                    </div>
                  )}
                  {h.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#9C9585" /> {h.location}
                    </div>
                  )}
                  {h.batchTo && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Repeat size={13} color="#9C9585" /> To {h.batchTo}
                    </div>
                  )}
                  {h.mfgDate && (
                    <div>
                      <span style={{ color: '#9C9585' }}>Mfg: </span>{formatDate(h.mfgDate)}
                    </div>
                  )}
                  {h.expiry && (
                    <div>
                      <span style={{ color: '#9C9585' }}>Exp: </span>{formatDate(h.expiry)}
                    </div>
                  )}
                </div>

                {h.note && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                      marginTop: '10px',
                      paddingTop: '10px',
                      borderTop: `1px solid ${LINE}`,
                      color: '#5C5646',
                      fontSize: '12px',
                    }}
                  >
                    <MessageSquare size={13} color="#9C9585" style={{ marginTop: '1px', flexShrink: 0 }} />
                    {h.note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// VAULT-STYLE LUXURY HERO — the shared emerald/gold "vault" header:
// deep emerald marble, a diagonal liquid-gold light sweep, a slow
// rotating faceted gem and a drift of fine gold dust. Originally built
// just for Warehouse Inventory; now shared by Warehouse Inventory,
// Packing Status and Ongoing Processes so all three read as one
// consistent, deliberately luxurious command deck instead of three
// different visual languages. Gradient <defs> ids are suffixed per
// instance (idSuffix) because Packing Status mounts TWO of these on
// the same page at once — without unique ids, the second hero's gem
// gradients would silently collide with the first's.
// ---------------------------------------------------------------------
function VaultStyleHero({
  as = 'div',
  onClick,
  idSuffix,
  liveLabel,
  liveDotClass = 'wb-live-dot-emerald',
  title,
  subtitle,
  figures,
  truckFigure,
}) {
  const Tag = as;
  const face1 = `wbGemFace1-${idSuffix}`;
  const face2 = `wbGemFace2-${idSuffix}`;
  const glow = `wbGemGlow-${idSuffix}`;
  const extraProps =
    as === 'button'
      ? { type: 'button', onClick, style: { width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none' } }
      : {};

  return (
    <Tag className="wb-vault-hero" {...extraProps}>
      <div className="wb-vault-marble" />
      <div className="wb-vault-sweep" />
      <div className="wb-vault-glow-a" />
      <div className="wb-vault-glow-b" />
      <span className="wb-vault-dust wb-vault-dust-1" />
      <span className="wb-vault-dust wb-vault-dust-2" />
      <span className="wb-vault-dust wb-vault-dust-3" />
      <span className="wb-vault-dust wb-vault-dust-4" />
      <span className="wb-vault-dust wb-vault-dust-5" />

      <svg className="wb-vault-gem" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={face1} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F2D999" />
            <stop offset="100%" stopColor="#8C6A2E" />
          </linearGradient>
          <linearGradient id={face2} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="100%" stopColor="#0F5C46" />
          </linearGradient>
          <radialGradient id={glow} cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="rgba(242,217,153,0.55)" />
            <stop offset="100%" stopColor="rgba(242,217,153,0)" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="90" fill={`url(#${glow})`} className="wb-vault-gem-halo" />
        <g className="wb-vault-gem-spin">
          <polygon points="100,28 138,70 122,132 78,132 62,70" fill={`url(#${face1})`} opacity="0.9" />
          <polygon points="100,28 138,70 100,90" fill={`url(#${face2})`} opacity="0.85" />
          <polygon points="62,70 100,90 78,132" fill="#0F5C46" opacity="0.55" />
          <polygon points="138,70 122,132 100,90" fill="#8C6A2E" opacity="0.55" />
          <polygon points="78,132 122,132 100,168" fill={`url(#${face1})`} opacity="0.8" />
        </g>
      </svg>

      <div className="wb-vault-top">
        <div className="wb-vault-eyebrow">
          <span className={`wb-live-dot ${liveDotClass}`} />
          <span>{liveLabel}</span>
          <span className="wb-hero-eyebrow-sep">·</span>
          <LiveClock className="wb-hero-clock wb-vault-clock" />
        </div>
        <h2 className="wb-serif wb-vault-title">
          <span className="wb-vault-title-shine">{title}</span>
        </h2>
        <p className="wb-hero-sub" style={{ color: 'rgba(226,247,236,0.62)' }}>
          {subtitle}
        </p>
      </div>

      <div className="wb-vault-figures">
        {figures.map((f) => (
          <div key={f.label} className={`wb-vault-figure${f.alert ? ' wb-vault-figure-alert' : ''}`}>
            <div className="wb-vault-figure-icon">
              <f.icon size={14} color={f.alert ? '#F0A8A8' : '#F2D999'} />
            </div>
            <p className="wb-vault-figure-value">{f.value}</p>
            <p className="wb-vault-figure-label">{f.label}</p>
          </div>
        ))}

        {/* An optional uniquely-animated tile: a little truck actually   */}
        {/* drives along a dashed road and the number ticks up, instead   */}
        {/* of just sitting there like the other static count tiles.      */}
        {truckFigure && (
          <div className="wb-vault-figure wb-vault-figure-truck">
            <div className="wb-vault-figure-icon">
              <truckFigure.icon size={14} color="#6EE7B7" />
            </div>
            <p className="wb-vault-figure-value">{truckFigure.value}</p>
            <p className="wb-vault-figure-label">{truckFigure.label}</p>
            <div className="wb-vault-truck-road">
              <span className="wb-vault-truck-dash" />
              <Truck size={13} color="#F2D999" className="wb-vault-truck-icon" />
            </div>
            {truckFigure.badge > 0 && (
              <span className="wb-vault-truck-badge">+{truckFigure.badge} today</span>
            )}
          </div>
        )}
      </div>
    </Tag>
  );
}

// WAREHOUSE VAULT HERO — Warehouse Inventory's own command header,
// built on the shared VaultStyleHero above. Shows a Below-Min.-Level
// alert tile (items under their re-order threshold) rather than a raw
// stock value, so the figure that catches your eye is one that needs
// action, the same way "Expiring soon" does.
function WarehouseVaultHero({ totalItems, belowMinLevel, receivedFromProduction, receivedToday, expiringSoon, unitLabel }) {
  const cItems = useCountUp(totalItems);
  const cBelowMin = useCountUp(belowMinLevel);
  const cReceivedToday = useCountUp(receivedToday);
  const cExpiring = useCountUp(expiringSoon);

  const figures = [
    { label: 'Items tracked', value: cItems, icon: Boxes },
    { label: 'Below Min. Level', value: cBelowMin, icon: AlertTriangle, alert: belowMinLevel > 0 },
    { label: 'Expiring soon', value: cExpiring, icon: Clock3, alert: expiringSoon > 0 },
  ];

  return (
    <VaultStyleHero
      idSuffix="warehouse"
      liveLabel={unitLabel ? `WAREHOUSE VAULT · ${unitLabel} UNIT · LIVE` : 'WAREHOUSE VAULT · LIVE'}
      title={unitLabel ? `Warehouse Inventory — ${unitLabel}` : 'Warehouse Inventory'}
      subtitle="Every section, every batch, every rupee of stock — tracked live"
      figures={figures}
      truckFigure={{
        label: 'Received today from Production',
        value: cReceivedToday,
        icon: ArrowDownCircle,
      }}
    />
  );
}

// Small scoped styles for the "Open Register" shortcut button sitting
// next to each item's name in Warehouse Inventory — a soft glow that
// only animates on hover, not sitting there running all the time. A
// table can easily have 50+ rows, and each row got its own pair of
// infinite animations (glow + shimmer) running forever even when
// nobody was looking at them — a real, constant repaint cost that
// scaled with inventory size. Static (and cheap) at rest; the shimmer
// only plays once, on hover.
function InventoryRegisterLinkStyles() {
  return (
    <style>{`
      .wb-reglink-btn {
        position: relative;
        overflow: hidden;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: 8px;
        padding: 2px 9px 2px 7px;
        border-radius: 999px;
        border: 1px solid rgba(47,224,201,0.5);
        background: linear-gradient(120deg, rgba(47,224,201,0.14), rgba(15,156,137,0.08));
        color: #0F9C89;
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.02em;
        cursor: pointer;
        vertical-align: middle;
        transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
      }
      .wb-reglink-btn:hover {
        transform: translateY(-1px) scale(1.04);
        border-color: #0F9C89;
        box-shadow: 0 4px 12px rgba(15,156,137,0.28);
      }
      .wb-reglink-btn:active { transform: translateY(0) scale(0.98); }
      .wb-reglink-btn::after {
        content: '';
        position: absolute;
        top: 0; left: -60%;
        width: 50%; height: 100%;
        background: linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent);
      }
      .wb-reglink-btn:hover::after {
        animation: wbRegLinkShimmer 700ms ease-out;
      }
      @keyframes wbRegLinkShimmer {
        0% { left: -60%; }
        100% { left: 120%; }
      }
      @media (prefers-reduced-motion: reduce) {
        .wb-reglink-btn:hover::after { animation: none !important; }
      }
    `}</style>
  );
}

// ---------------------------------------------------------------------
// WarehouseUnitPortal — the two big animated doors shown before the
// inventory dashboard opens. Each door carries its unit's live figures
// (items tracked, below minimum, expiring) so the choice is already an
// at-a-glance status board, and clicking one opens the full dashboard
// scoped to that unit. Purely a front door: no data is changed here.
// ---------------------------------------------------------------------
function WarehouseUnitPortal({ inventory, onPick, canManage }) {
  const statsByUnit = useMemo(() => {
    const blank = () => ({ count: 0, low: 0, expiring: 0, sections: {} });
    const out = {};
    WAREHOUSE_UNITS.forEach((u) => {
      out[u.key] = blank();
      INVENTORY_CATEGORIES.forEach((c) => {
        out[u.key].sections[c.key] = 0;
      });
    });
    (inventory || []).forEach((i) => {
      const bucket = out[unitOf(i)];
      if (!bucket) return;
      bucket.count += 1;
      if (Number(i.qty) < Number(i.min_stock || i.minStock || 0)) bucket.low += 1;
      if (isExpired(i.expiry) || isExpiringSoon(i.expiry)) bucket.expiring += 1;
      const cat = i.category || 'General Items';
      if (bucket.sections[cat] != null) bucket.sections[cat] += 1;
    });
    return out;
  }, [inventory]);

  return (
    <div className="wb-page-padding" style={{ padding: '28px 32px' }}>
      <style>{`
        @keyframes wbPortalRise {
          from { opacity: 0; transform: translateY(26px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wbPortalGlow {
          0%, 100% { opacity: 0.45; transform: translate3d(0,0,0) scale(1); }
          50%      { opacity: 0.85; transform: translate3d(0,-14px,0) scale(1.12); }
        }
        @keyframes wbPortalSweep {
          0%   { transform: translateX(-120%) rotate(12deg); }
          100% { transform: translateX(220%) rotate(12deg); }
        }
        @keyframes wbPortalPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
          50%      { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
        }
        .wb-portal-door {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          text-align: left;
          border-radius: 22px;
          padding: 30px 30px 26px;
          min-height: 300px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #FFF;
          border: 1px solid rgba(255,255,255,0.10);
          animation: wbPortalRise 620ms cubic-bezier(.2,.8,.25,1) both;
          transition: transform 320ms cubic-bezier(.2,.8,.25,1), box-shadow 320ms ease, border-color 320ms ease;
        }
        .wb-portal-door:hover {
          transform: translateY(-8px) scale(1.012);
          border-color: rgba(255,255,255,0.28);
        }
        .wb-portal-door:active { transform: translateY(-2px) scale(0.995); }
        .wb-portal-door .wb-portal-sheen {
          position: absolute; top: -40%; left: 0;
          width: 38%; height: 190%;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0) 100%);
          pointer-events: none;
        }
        .wb-portal-door:hover .wb-portal-sheen { animation: wbPortalSweep 1100ms ease forwards; }
        .wb-portal-door .wb-portal-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(46px);
          pointer-events: none;
          animation: wbPortalGlow 6s ease-in-out infinite;
        }
        .wb-portal-door .wb-portal-icon {
          transition: transform 420ms cubic-bezier(.2,.8,.25,1);
        }
        .wb-portal-door:hover .wb-portal-icon { transform: rotate(-8deg) scale(1.08); }
        .wb-portal-door .wb-portal-enter { transition: gap 300ms ease, background 300ms ease; }
        .wb-portal-door:hover .wb-portal-enter { gap: 12px; }
        @media (max-width: 860px) {
          .wb-portal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div
        style={{
          borderRadius: '22px',
          padding: '30px 32px 26px',
          background: `linear-gradient(135deg, ${INK_DEEP} 0%, ${MIDNIGHT} 58%, #0B2A22 100%)`,
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '22px',
          position: 'relative',
          overflow: 'hidden',
          animation: 'wbPortalRise 520ms cubic-bezier(.2,.8,.25,1) both',
        }}
      >
        <div
          className="wb-portal-blob"
          style={{
            position: 'absolute',
            right: '-60px',
            top: '-70px',
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'rgba(63,190,142,0.28)',
            filter: 'blur(60px)',
            animation: 'wbPortalGlow 7s ease-in-out infinite',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: CYAN, fontSize: 11, letterSpacing: '0.16em', fontWeight: 700 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: CYAN, display: 'inline-block' }} />
          WAREHOUSE VAULT · CHOOSE UNIT
        </div>
        <h2 style={{ margin: '12px 0 8px', fontSize: '38px', lineHeight: 1.05, color: GOLD_LIGHT, fontFamily: 'Georgia, serif' }}>
          Warehouse Inventory
        </h2>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.68)', fontSize: '14px', maxWidth: 640 }}>
          Two units, two separate stores. Pick a unit to open its own full
          inventory — same sections, same history, same live view. Stock added
          inside a unit stays inside that unit.
        </p>
      </div>

      <div
        className="wb-portal-grid"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
      >
        {WAREHOUSE_UNITS.map((u, idx) => {
          const Icon = u.icon;
          const stat = statsByUnit[u.key] || { count: 0, low: 0, expiring: 0, sections: {} };
          return (
            <button
              key={u.key}
              type="button"
              onClick={() => onPick(u.key)}
              className="wb-portal-door"
              style={{
                background: `linear-gradient(140deg, ${INK_DEEP} 0%, ${MIDNIGHT} 55%, rgba(${u.accentRgb},0.22) 100%)`,
                animationDelay: `${80 + idx * 110}ms`,
              }}
            >
              <span className="wb-portal-sheen" />
              <span
                className="wb-portal-blob"
                style={{
                  right: '-50px',
                  bottom: '-60px',
                  width: 220,
                  height: 220,
                  background: `rgba(${u.accentRgb},0.40)`,
                  animationDelay: `${idx * 900}ms`,
                }}
              />
              <span style={{ position: 'relative', display: 'block' }}>
                <span
                  className="wb-portal-icon"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 58,
                    height: 58,
                    borderRadius: 18,
                    background: `rgba(${u.accentRgb},0.16)`,
                    border: `1px solid rgba(${u.accentRgb},0.38)`,
                    color: u.accentLight,
                    marginBottom: 18,
                  }}
                >
                  <Icon size={28} />
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 11,
                    letterSpacing: '0.18em',
                    fontWeight: 700,
                    color: `rgba(${u.accentRgb},0.95)`,
                    textTransform: 'uppercase',
                  }}
                >
                  {u.tagline}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 46,
                    lineHeight: 1.05,
                    fontWeight: 700,
                    fontFamily: 'Georgia, serif',
                    color: '#FFF',
                    margin: '6px 0 10px',
                  }}
                >
                  {u.label}
                </span>
                <span style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.66)', maxWidth: 420 }}>
                  {u.blurb}
                </span>
              </span>

              <span style={{ position: 'relative', display: 'block', marginTop: 22 }}>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {[
                    { label: 'items tracked', value: stat.count, tone: 'rgba(255,255,255,0.86)' },
                    { label: 'below min.', value: stat.low, tone: '#F0A6A6' },
                    { label: 'expiring', value: stat.expiring, tone: GOLD_LIGHT },
                  ].map((chip) => (
                    <span
                      key={chip.label}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '5px 10px',
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: chip.tone,
                      }}
                    >
                      <b style={{ fontSize: 13 }}>{chip.value}</b> {chip.label}
                    </span>
                  ))}
                </span>
                <span
                  className="wb-portal-enter"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 700,
                    color: INK,
                    background: `linear-gradient(135deg, ${u.accentLight} 0%, ${u.accent} 100%)`,
                  }}
                >
                  Open {u.label} inventory <ArrowUpRight size={15} />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: canManage ? PAPER : '#FBF3E3',
          border: `1px solid ${canManage ? LINE : GOLD}`,
          borderRadius: '8px',
          padding: '8px 12px',
          marginTop: '18px',
          color: canManage ? '#7A7460' : AMBER,
          fontSize: '12px',
        }}
      >
        <Eye size={13} />
        {canManage
          ? ' Both units are visible to every department in real time. As the Warehouse department you can add, edit and remove stock inside either unit — each keeps its own separate record.'
          : ' View only — both units are visible to every department in real time, but only the Warehouse department can add, edit or remove stock.'}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// RegisterPostPreview — shows, live inside the Add/Edit form, the exact
// Stock Register line this save is going to post on its own: date,
// particulars (taken from the From/To fields), receipts or issued
// (taken from the quantity movement), balance (the resulting stock)
// and remarks (taken from the notes box). Nothing here writes data —
// it's a mirror of what submit() is about to do, so nobody has to
// maintain the register a second time by hand.
// ---------------------------------------------------------------------
function RegisterPostPreview({ form, editingId, existingItem }) {
  const entered = form.qty === '' ? null : Number(form.qty);
  if (entered == null || Number.isNaN(entered)) return null;
  const previousQty = existingItem ? Number(existingItem.qty || 0) : 0;
  const newQty = editingId ? entered : previousQty + entered;
  const delta = newQty - previousQty;
  // Particulars is now only whatever the person typed in "To" — no
  // auto-generated wording ("Issued to…", "Opening stock / first
  // receipt", "Received — added to existing batch") is added on top.
  // If To is left blank, Particulars is posted blank.
  const particulars = form.batchTo || '';
  const cell = (label, value, tone) => (
    <div style={{ minWidth: 90 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.08em', color: '#8A8370', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: tone || '#2E2A20', marginTop: 2 }}>
        {value === '' || value == null ? '—' : value}
      </div>
    </div>
  );
  return (
    <div
      style={{
        border: `1px dashed ${GOLD}`,
        background: '#FBF7EC',
        borderRadius: 10,
        padding: '10px 12px',
        marginTop: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          fontWeight: 700,
          color: AMBER,
          marginBottom: 8,
        }}
      >
        <History size={12} />
        {delta === 0
          ? 'No stock movement — nothing will be posted to the register'
          : 'This will be posted to the Stock Register automatically'}
      </div>
      {delta !== 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
          {cell('Date', new Date().toISOString().slice(0, 10))}
          {cell('Particulars', particulars)}
          {cell('Folio', form.folio || '')}
          {cell('Receipts', delta > 0 ? delta : '', '#2E7D5B')}
          {cell('Issued', delta < 0 ? -delta : '', '#9B3131')}
          {cell('Balance', newQty)}
          {cell('Remarks', form.note || '')}
        </div>
      )}
    </div>
  );
}

function InventoryPage({ user, inventory: allInventory, onAdd, onEdit, onDelete, onOpenRegister }) {
  // ---- "WHERE I LEFT OFF" -------------------------------------------
  // This component fully unmounts whenever the app switches to a
  // different page (e.g. the "Open Register" shortcut jumps to
  // Warehouse Reports) and remounts from scratch on return — which used
  // to mean landing back on the two-door picker every single time,
  // no matter which unit/section had been open a moment earlier. The
  // unit, section, sub-section and API group are mirrored into
  // sessionStorage as they change and read back once here, so coming
  // back — via the register link, the sidebar, or the browser's own
  // Back button — reopens exactly the same unit and section instead of
  // starting over. sessionStorage (not localStorage) is used on purpose:
  // it clears itself when the tab/browser closes, so a shared computer
  // doesn't keep showing the last person's spot on a fresh visit.
  const readSaved = (key, fallback) => {
    try {
      return window.sessionStorage.getItem(`wb_inv_${key}`) || fallback;
    } catch {
      return fallback;
    }
  };
  const saveSpot = (key, value) => {
    try {
      if (value) window.sessionStorage.setItem(`wb_inv_${key}`, value);
      else window.sessionStorage.removeItem(`wb_inv_${key}`);
    } catch {}
  };

  // Which unit (CEPH. / GENERAL) the person walked into. `null` means
  // nobody has picked yet, so the two big doors are shown instead of the
  // dashboard. Everything below this line is unchanged — it simply sees
  // only this unit's stock, because `inventory` is the scoped list.
  const [unitKey, setUnitKeyState] = useState(() => readSaved('unit', null) || null);
  const setUnitKey = (key) => {
    setUnitKeyState(key);
    saveSpot('unit', key);
  };
  const activeUnit = WAREHOUSE_UNITS.find((u) => u.key === unitKey) || null;
  const inventory = useMemo(
    () => (unitKey ? (allInventory || []).filter((i) => unitOf(i) === unitKey) : []),
    [allInventory, unitKey]
  );
  const canManage = canManageInventory(user);
  const [category, setCategoryState] = useState(() => readSaved('category', INVENTORY_CATEGORIES[0].key));
  const setCategory = (key) => {
    setCategoryState(key);
    saveSpot('category', key);
  };
  // Only meaningful while category === 'Raw Material'. Defaults to the
  // first sub-section (API's).
  const [subcategory, setSubcategoryState] = useState(() => readSaved('subcategory', RAW_MATERIAL_SUBCATEGORIES[0].key));
  const setSubcategory = (key) => {
    setSubcategoryState(key);
    saveSpot('subcategory', key);
  };
  // Only meaningful while inside Raw Material -> API's. Defaults to the
  // first group (CEPH.).
  const [apiSection, setApiSectionState] = useState(() => readSaved('apiSection', API_SUBSECTIONS[0].key));
  const setApiSection = (key) => {
    setApiSectionState(key);
    saveSpot('apiSection', key);
  };
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INVENTORY_BLANK_FORM);
  const [search, setSearch] = useState('');
  const [saveError, setSaveError] = useState('');
  const [historyItem, setHistoryItem] = useState(null);

  // Received-from-Production tracker, purely for the Vault hero's
  // "Received from Production" figure below — a lightweight read of
  // warehouse_transfers (the same table Production's "Send to
  // Warehouse" flow writes into) filtered to Received transfers, kept
  // live via its own realtime subscription so the moment Warehouse
  // accepts a transfer on the Packing Status page, this number ticks
  // up here too without a reload.
  const [receivedTransfers, setReceivedTransfers] = useState([]);
  useEffect(() => {
    let active = true;
    const loadReceived = async () => {
      const { data, error } = await supabase
        .from('warehouse_transfers')
        .select('id, quantity, status, sent_at')
        .eq('status', 'Received');
      if (!error && active) setReceivedTransfers(data || []);
    };
    loadReceived();
    const channel = supabase
      .channel(`inv-received-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_transfers' }, loadReceived)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);
  const receivedFromProduction = receivedTransfers.reduce(
    (sum, t) => sum + Number(t.quantity || 0),
    0
  );
  const receivedFromProductionToday = receivedTransfers
    .filter((t) => isToday(t.sent_at))
    .reduce((sum, t) => sum + Number(t.quantity || 0), 0);

  const isRawMaterial = category === 'Raw Material';
  const isAPIs = isRawMaterial && subcategory === 'APIs';

  // Live preview of the same-batch-number auto-merge, shown under the
  // Batch No. field while adding (not editing) so Warehouse can see
  // before saving that this entry will merge into an existing line
  // rather than create a new one. Memoized on the batch number itself
  // (plus scope) rather than the whole `form` object — typing in any
  // other field (name, qty, price…) used to re-scan the entire
  // inventory array on every keystroke; now it only re-scans when the
  // batch number actually changes.
  const liveBatchMatch = useMemo(() => {
    if (!formOpen || editingId) return null;
    return wbFindBatchMatch(inventory, form.batch, (i) =>
      (i.category || 'General Items') === category &&
      (isRawMaterial ? (i.subcategory || RAW_MATERIAL_SUBCATEGORIES[0].key) === subcategory : true) &&
      (isAPIs ? (i.subcategory2 || API_SUBSECTIONS[0].key) === apiSection : true)
    );
  }, [formOpen, editingId, inventory, form.batch, category, subcategory, apiSection, isRawMaterial, isAPIs]);

  const startAdd = () => {
    if (!canManage) return;
    setForm(INVENTORY_BLANK_FORM);
    setEditingId(null);
    setSaveError('');
    setFormOpen(true);
  };

  const startEdit = (item) => {
    if (!canManage) return;
    if (isItemLockedForEdit(item)) {
      alert(`This item is locked — it was last updated in ${monthLabelOf(monthKeyOf(itemLastActivityISO(item)))} and can no longer be edited directly. Add stock against it again this month to reopen it.`);
      return;
    }
    setForm({
      name: item.name || '',
      batch: item.batch || '',
      qty: item.qty ?? '',
      unit: item.unit || 'units',
      mfg_date: (item.mfg_date || '').slice(0, 7),
      expiry: (item.expiry || '').slice(0, 7),
      final_size: item.final_size || '',
      price: item.price ?? '',
      min_stock: item.min_stock ?? '',
      location: item.location || '',
      folio: '',
      batchTo: '',
      note: '',
    });
    setEditingId(item.id);
    setSaveError('');
    setFormOpen(true);
  };

  const submit = async () => {
    if (!canManage) return;
    if (!form.name || form.qty === '') return;
    setSaveError('');

    // Editing an existing line (not a fresh add/top-up) is refused once
    // that line is outside the monthly edit lock — this is the second
    // enforcement layer behind hiding the Edit button in the table.
    if (editingId) {
      const existingLocked = inventory.find((i) => i.id === editingId);
      if (existingLocked && isItemLockedForEdit(existingLocked)) {
        setSaveError(`This item was last updated in ${monthLabelOf(monthKeyOf(itemLastActivityISO(existingLocked)))} and is locked for direct edits. Add stock against it again this month instead.`);
        return;
      }
    }

    // Same-batch-number auto-merge: when adding a brand new line (not
    // editing), check this same section (category / sub-section / API
    // group) for a line that already carries this exact batch number.
    // If one exists, this "add" is redirected into that existing line
    // instead — its quantity is topped up rather than a duplicate row
    // being created.
    const batchMatch = !editingId
      ? wbFindBatchMatch(inventory, form.batch, (i) =>
          (i.category || 'General Items') === category &&
          (isRawMaterial ? (i.subcategory || RAW_MATERIAL_SUBCATEGORIES[0].key) === subcategory : true) &&
          (isAPIs ? (i.subcategory2 || API_SUBSECTIONS[0].key) === apiSection : true)
        )
      : null;
    const mergeId = editingId || (batchMatch ? batchMatch.id : null);

    const existing = mergeId ? (editingId ? inventory.find((i) => i.id === editingId) : batchMatch) : null;
    const previousQty = existing ? Number(existing.qty) : 0;
    const addedQty = Number(form.qty);
    // Editing an existing line replaces its quantity outright; merging a
    // fresh add into a matching batch instead tops the existing quantity
    // up by the newly entered amount.
    const newQty = editingId ? addedQty : previousQty + addedQty;
    const delta = newQty - previousQty;

    // Postgres `date` columns reject an empty string ("") — they only
    // accept a valid date or NULL, so blank dates are sent as null.
    const historyEntry = {
      dept: user.dept,
      user: user.name,
      action: editingId ? 'Stock updated' : batchMatch ? `Merged into existing batch (+${addedQty})` : 'Item added to inventory',
      at: now(),
      atISO: nowISO(),
      previousQty,
      newQty,
      quantityReceived: delta > 0 ? delta : 0,
      quantityIssued: delta < 0 ? -delta : 0,
      folio: form.folio || '',
      batchTo: form.batchTo || '',
      location: form.location || '',
      note: form.note || '',
    };
    const newHistory = existing && Array.isArray(existing.history)
      ? [...existing.history, historyEntry]
      : [historyEntry];

    // ---- Auto-posting into the article's STOCK REGISTER ----------------
    // Warehouse used to have to type the same movement twice: once here
    // (which moved the real quantity) and once again by hand on the
    // article's Stock (Inward & Outward) Register page. Every movement
    // saved from this form now writes its own register line as well, in
    // exactly the shape WarehouseRegisterPage already reads —
    // { date, particulars, folio, receipts, issued, balance, remarks } —
    // so the book fills itself.
    //
    //   delta < 0  → an issue. Goes in the ISSUED column, and the "To"
    //                field typed above becomes the PARTICULARS entry
    //                ("Issued to <To>"), which is the whole point of
    //                merging the two screens.
    //   delta > 0  → a receipt. Goes in the RECEIPTS column, and the
    //                "To" field (if filled in on a receipt too) still
    //                becomes the PARTICULARS entry.
    //
    //   FOLIO is its own dedicated field now (separate from Batch No.),
    //   typed once here and posted straight into the register's FOLIO
    //   column.
    //   delta = 0  → nothing moved (a pure detail edit: renamed, new
    //                location, new min level…), so no line is written —
    //                the register stays a record of stock movement only.
    //
    // BALANCE is never typed: it's the post-transaction quantity, which
    // this function has already computed as `newQty`. That's the "the
    // quantity changed after issued is already there" part — it comes
    // straight from the same number that's being written to the qty
    // column, so the book can't drift out of step with actual stock.
    //
    // The line is tagged `source: 'inventory'` so the register can badge
    // it as auto-posted rather than hand-written. Note the one-way rule:
    // this direction writes the line ONLY (the quantity was already
    // applied above). The reverse direction — a line typed directly on
    // the register — is what calls buildQtyMerge() over in
    // WarehouseRegisterPage. Neither path ever runs the other, so a
    // movement is counted exactly once.
    const existingLedger =
      existing && Array.isArray(existing.ledger_rows) ? existing.ledger_rows : [];
    const autoRegisterRow =
      delta === 0
        ? null
        : {
            date: new Date().toISOString().slice(0, 10),
            // Particulars is only what was typed in "To" — no
            // auto-generated wording layered on top, so the register
            // reads exactly what Warehouse entered and nothing else.
            particulars: form.batchTo || '',
            folio: form.folio || '',
            receipts: delta > 0 ? delta : '',
            issued: delta < 0 ? -delta : '',
            balance: newQty,
            remarks: form.note || '',
            to: form.batchTo || '',
            by: user.name,
            source: 'inventory',
          };
    const newLedgerRows = autoRegisterRow
      ? [...existingLedger, autoRegisterRow]
      : existingLedger;

    const payload = {
      name: form.name,
      batch: form.batch,
      qty: newQty,
      ledger_rows: newLedgerRows,
      unit: form.unit,
      // Which unit (CEPH. / GENERAL) this stock belongs to — whichever
      // door the person walked in through. This is what keeps the two
      // units' stores completely separate.
      unit_group: unitKey,
      category,
      // Raw Material items are tagged with which sub-section (API's or
      // Excipients) they belong to; every other category leaves this
      // null — same fields, same ledger, only the extra grouping layer
      // differs.
      subcategory: isRawMaterial ? subcategory : null,
      // API's items are further tagged with which group (CEPH. or
      // General) they belong to; everything else leaves this null.
      subcategory2: isAPIs ? apiSection : null,
      mfg_date: form.mfg_date ? `${form.mfg_date}-01` : null,
      expiry: form.expiry ? `${form.expiry}-01` : null,
      final_size: form.final_size || '',
      price: form.price === '' ? null : Number(form.price),
      min_stock: form.min_stock === '' ? 0 : Number(form.min_stock),
      location: form.location || '',
      history: newHistory,
    };
    const result = mergeId
      ? await onEdit(mergeId, payload)
      : await onAdd(payload);
    if (result && result.error) {
      const msg = result.error.message || '';
      if (/column .* (of|in) .*schema cache/i.test(msg) || /column .* does not exist/i.test(msg)) {
        setSaveError(
          `Your Supabase "inventory" table is missing a column this form needs (${msg}). Open the Supabase SQL editor and run the "alter table inventory add column…" statements noted in the code comments above InventoryPage, then try again.`
        );
      } else {
        setSaveError(msg || 'Failed to save this item.');
      }
      return;
    }
    setFormOpen(false);
    setEditingId(null);
    setForm(INVENTORY_BLANK_FORM);
  };

  const handleDeleteClick = (item) => {
    if (!canManage) return;
    if (isItemLockedForEdit(item)) {
      alert(`This item is locked — it was last updated in ${monthLabelOf(monthKeyOf(itemLastActivityISO(item)))} and can no longer be deleted. Add stock against it again this month to reopen it.`);
      return;
    }
    const subLabel = item.subcategory
      ? (item.subcategory === 'APIs' ? "API's" : item.subcategory) +
        (item.subcategory2 ? ` — ${item.subcategory2 === 'CEPH' ? 'CEPH.' : 'General'}` : '')
      : '';
    if (
      window.confirm(
        `Delete "${item.name}" (batch ${item.batch || 'n/a'}) from ${category}${
          subLabel ? ' — ' + subLabel : ''
        }?`
      )
    ) {
      onDelete(item.id);
    }
  };

  // Memoized so typing in the Add/Edit form (which lives in this same
  // component) doesn't re-filter the whole inventory list on every
  // keystroke — each of these only re-runs when the inventory data or
  // the relevant section/search actually change. Kept as separate
  // useMemo calls (rather than nested inside a single one) because
  // sectionItems and scopedItems are also used below for the tab
  // count badges.
  const sectionItems = useMemo(
    () => inventory.filter((i) => (i.category || 'General Items') === category),
    [inventory, category]
  );
  const scopedItems = useMemo(
    () =>
      isRawMaterial
        ? sectionItems.filter((i) => (i.subcategory || RAW_MATERIAL_SUBCATEGORIES[0].key) === subcategory)
        : sectionItems,
    [sectionItems, isRawMaterial, subcategory]
  );
  const apiScopedItems = useMemo(
    () =>
      isAPIs
        ? scopedItems.filter((i) => (i.subcategory2 || API_SUBSECTIONS[0].key) === apiSection)
        : scopedItems,
    [scopedItems, isAPIs, apiSection]
  );
  const visible = useMemo(
    () =>
      search
        ? apiScopedItems.filter(
            (i) =>
              (i.name || '').toLowerCase().includes(search.toLowerCase()) ||
              (i.batch || '').toLowerCase().includes(search.toLowerCase())
          )
        : apiScopedItems,
    [apiScopedItems, search]
  );

  const activeCat = INVENTORY_CATEGORIES.find((c) => c.key === category);
  const activeSub = RAW_MATERIAL_SUBCATEGORIES.find((s) => s.key === subcategory);
  const activeApiSection = API_SUBSECTIONS.find((s) => s.key === apiSection);

  // CSV export — mirrors the same csvExport() helper used by Production
  // Inventory, exporting exactly what's currently visible (section +
  // sub-section + API group + search filter) so the download always
  // matches what's on screen.
  const exportInventoryCsv = () => {
    const sectionLabel = isAPIs
      ? `raw-material-apis-${apiSection.toLowerCase()}`
      : isRawMaterial
      ? `raw-material-${subcategory.toLowerCase()}`
      : category.toLowerCase().replace(/\s+/g, '-');
    csvExport(
      `warehouse-inventory-${(unitKey || '').toLowerCase()}-${sectionLabel}-${new Date().toISOString().slice(0, 10)}.csv`,
      visible.map((i) => ({
        ...i,
        unit_label: activeUnit ? activeUnit.label : unitOf(i),
        subcategory_label: i.subcategory
          ? i.subcategory === 'APIs'
            ? "API's"
            : i.subcategory
          : '',
        api_section_label: i.subcategory2
          ? i.subcategory2 === 'CEPH'
            ? 'CEPH.'
            : 'General'
          : '',
        mfg_date: formatDate(i.mfg_date),
        expiry: formatDate(i.expiry),
        final_size: i.final_size || '',
        price: i.price != null && i.price !== '' ? i.price : '',
      })),
      [
        { key: 'unit_label', label: 'Unit' },
        { key: 'name', label: 'Item Name' },
        { key: 'batch', label: 'Batch No.' },
        { key: 'category', label: 'Category' },
        { key: 'subcategory_label', label: 'Sub-section' },
        { key: 'api_section_label', label: "API's Group" },
        { key: 'mfg_date', label: 'MFG Month' },
        { key: 'expiry', label: 'EXP Month' },
        ...(category === 'Finished Goods'
          ? [
              { key: 'final_size', label: 'Final Size' },
              { key: 'price', label: 'Price' },
            ]
          : []),
        { key: 'qty', label: 'Quantity' },
        { key: 'unit', label: 'Unit' },
        { key: 'min_stock', label: 'Min. Level' },
        { key: 'location', label: 'Storage Location' },
      ]
    );
  };

  // ---- PERFORMANCE + the numbers behind every tile on this page -------
  // One pass over `inventory` produces everything the hero, the four
  // section cards, the Raw Material sub-section cards and the API's
  // group chips need. Previously each of those re-filtered the whole
  // inventory array inline, on every render — roughly a dozen full
  // scans per keystroke in the search box, since the search input lives
  // in this same component. Now it's a single scan, memoized on the
  // inventory data itself, so typing costs nothing.
  const inventoryStats = useMemo(() => {
    const blank = () => ({ count: 0, low: 0, expiring: 0 });
    const byCategory = {};
    const bySub = {};
    const byApi = {};
    INVENTORY_CATEGORIES.forEach((c) => {
      byCategory[c.key] = blank();
    });
    RAW_MATERIAL_SUBCATEGORIES.forEach((s) => {
      bySub[s.key] = blank();
    });
    API_SUBSECTIONS.forEach((s) => {
      byApi[s.key] = blank();
    });
    let total = 0;
    let low = 0;
    let expiring = 0;
    const bump = (bucket, isLow, isExp) => {
      if (!bucket) return;
      bucket.count += 1;
      if (isLow) bucket.low += 1;
      if (isExp) bucket.expiring += 1;
    };
    inventory.forEach((i) => {
      const isLow = Number(i.qty) < Number(i.min_stock || i.minStock || 0);
      const isExp = isExpired(i.expiry) || isExpiringSoon(i.expiry);
      total += 1;
      if (isLow) low += 1;
      if (isExp) expiring += 1;
      const cat = i.category || 'General Items';
      bump(byCategory[cat], isLow, isExp);
      if (cat === 'Raw Material') {
        const sub = i.subcategory || RAW_MATERIAL_SUBCATEGORIES[0].key;
        bump(bySub[sub], isLow, isExp);
        if (sub === 'APIs') {
          bump(byApi[i.subcategory2 || API_SUBSECTIONS[0].key], isLow, isExp);
        }
      }
    });
    return { byCategory, bySub, byApi, total, low, expiring };
  }, [inventory]);

  const vaultTotalItems = inventoryStats.total;
  const vaultBelowMinLevel = inventoryStats.low;
  const vaultExpiringSoon = inventoryStats.expiring;

  // ---- THE FRONT DOOR ------------------------------------------------
  // Until a unit is chosen, the dashboard isn't rendered at all — the
  // two big animated CEPH. / GENERAL doors stand in its place. Picking
  // one drops straight into everything below, scoped to that unit.
  if (!unitKey) {
    return (
      <WarehouseUnitPortal
        inventory={allInventory}
        canManage={canManage}
        onPick={(key) => {
          setUnitKey(key);
          setCategory(INVENTORY_CATEGORIES[0].key);
          setSubcategory(RAW_MATERIAL_SUBCATEGORIES[0].key);
          setApiSection(API_SUBSECTIONS[0].key);
          setFormOpen(false);
          setEditingId(null);
          setSearch('');
          setHistoryItem(null);
        }}
      />
    );
  }

  return (
    <div className="wb-page-padding" style={{ padding: '28px 32px' }}>
      <InventoryRegisterLinkStylesMemo />
      {/* Which unit you're standing in, and the way back out to the two
          doors. Everything on this page below here is this unit's stock
          only. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setUnitKey(null);
            setFormOpen(false);
            setEditingId(null);
            setSearch('');
            setHistoryItem(null);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 999,
            border: `1px solid ${LINE}`,
            background: PAPER,
            color: '#5D5747',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Repeat size={13} /> Switch unit
        </button>
        {activeUnit && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: INK,
              background: `linear-gradient(135deg, ${activeUnit.accentLight} 0%, ${activeUnit.accent} 100%)`,
            }}
          >
            <activeUnit.icon size={14} /> {activeUnit.label} UNIT
          </span>
        )}
        <span style={{ fontSize: 12, color: '#8A8472' }}>
          Showing {activeUnit ? activeUnit.label : ''} stock only — {inventory.length}{' '}
          {inventory.length === 1 ? 'item' : 'items'} in this unit.
        </span>
      </div>
      <WarehouseVaultHero
        unitLabel={activeUnit ? activeUnit.label : ''}
        totalItems={vaultTotalItems}
        belowMinLevel={vaultBelowMinLevel}
        receivedFromProduction={receivedFromProduction}
        receivedToday={receivedFromProductionToday}
        expiringSoon={vaultExpiringSoon}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: canManage ? PAPER : '#FBF3E3',
          border: `1px solid ${canManage ? LINE : GOLD}`,
          borderRadius: '8px',
          padding: '8px 12px',
          marginTop: '18px',
          marginBottom: '18px',
          color: canManage ? '#7A7460' : AMBER,
          fontSize: '12px',
        }}
      >
        {canManage ? (
          <>
            <Eye size={13} /> Visible to every department in real time. As
            the Warehouse department, you can add, receive, issue, transfer
            and adjust stock in any section below (including the API's and
            Excipients sub-sections inside Raw Material). Click any row to
            view its complete history.
          </>
        ) : (
          <>
            <Eye size={13} /> View only — visible to every department in
            real time, but only the Warehouse department can add, edit, or
            remove stock. Click any row to view its complete history.
          </>
        )}
      </div>

      {/* ---------------------------------------------------------------
          Section cards — the four storage sections. These used to be a
          name and an item count, which told Warehouse nothing they
          couldn't already see. Each card now carries the section's own
          condition: the count set in a large serif figure, a share bar
          showing how much of the warehouse sits in this section, and
          amber / red chips for anything below minimum level or nearing
          expiry inside it — so a problem is visible from the section
          card without having to open the section first. Chips are only
          rendered when the number is non-zero; a healthy section stays
          quiet and reads "All levels healthy".

          All figures come from the single `inventoryStats` pass above,
          not from re-filtering `inventory` inside this map.
          --------------------------------------------------------------- */}
      <style>{`
        .wb-sec-card {
          position: relative;
          overflow: hidden;
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
        }
        .wb-sec-card:hover { transform: translateY(-2px); }
        .wb-sec-card:hover .wb-sec-icon { transform: scale(1.06) rotate(-3deg); }
        .wb-sec-icon { transition: transform 200ms ease; }
        .wb-sec-bar-fill { transition: width 420ms cubic-bezier(.4,0,.2,1); }
        @media (prefers-reduced-motion: reduce) {
          .wb-sec-card, .wb-sec-icon, .wb-sec-bar-fill { transition: none !important; }
          .wb-sec-card:hover { transform: none; }
        }
      `}</style>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
          marginBottom: '22px',
        }}
      >
        {INVENTORY_CATEGORIES.map((c) => {
          const stat = inventoryStats.byCategory[c.key] || { count: 0, low: 0, expiring: 0 };
          const count = stat.count;
          const active = category === c.key;
          const Icon = c.icon;
          const share = inventoryStats.total ? Math.round((count / inventoryStats.total) * 100) : 0;
          const chip = (label, value, tone) => (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 999,
                background: active ? 'rgba(255,255,255,0.10)' : tone.bg,
                color: active ? tone.onDark : tone.fg,
                border: `1px solid ${active ? 'rgba(255,255,255,0.14)' : tone.border}`,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: active ? tone.onDark : tone.fg,
                }}
              />
              {value} {label}
            </span>
          );
          return (
            <button
              key={c.key}
              onClick={() => {
                setCategory(c.key);
                setSubcategory(RAW_MATERIAL_SUBCATEGORIES[0].key);
                setApiSection(API_SUBSECTIONS[0].key);
                setFormOpen(false);
                setSearch('');
              }}
              className="wb-card wb-sec-card"
              style={{
                textAlign: 'left',
                display: 'block',
                padding: '15px 16px 13px',
                borderRadius: '14px',
                cursor: 'pointer',
                border: active ? `1.5px solid ${GOLD}` : `1px solid ${LINE}`,
                background: active
                  ? `linear-gradient(135deg, ${INK_DEEP} 0%, ${INK} 62%, #10192B 100%)`
                  : 'linear-gradient(160deg, #FFFFFF 0%, #FFFDF8 100%)',
                boxShadow: active
                  ? '0 14px 30px rgba(4,7,17,0.28)'
                  : '0 1px 2px rgba(10,18,32,0.05)',
              }}
            >
              {/* Faint oversized watermark of the section's own icon,
                  clipped by the card — depth without another asset. */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  right: -14,
                  bottom: -18,
                  opacity: active ? 0.1 : 0.05,
                  pointerEvents: 'none',
                }}
              >
                <Icon size={84} color={active ? GOLD_LIGHT : INK} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
                <div
                  className="wb-sec-icon"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: active
                      ? 'rgba(242,217,153,0.16)'
                      : 'linear-gradient(135deg, #FBF3E3, #F3E4C4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} color={active ? GOLD_LIGHT : GOLD} />
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '12.5px',
                    fontWeight: 600,
                    letterSpacing: '0.01em',
                    color: active ? '#F8F4E9' : INK,
                  }}
                >
                  {c.key}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  margin: '12px 0 0',
                  position: 'relative',
                }}
              >
                <span
                  className="wb-serif"
                  style={{
                    fontSize: '27px',
                    lineHeight: 1,
                    fontWeight: 600,
                    color: active ? '#FFFFFF' : INK,
                  }}
                >
                  {count}
                </span>
                <span
                  style={{
                    fontSize: '10.5px',
                    letterSpacing: '0.09em',
                    textTransform: 'uppercase',
                    color: active ? 'rgba(248,244,233,0.6)' : '#9C9585',
                  }}
                >
                  item{count === 1 ? '' : 's'}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    color: active ? 'rgba(248,244,233,0.7)' : '#B0AA96',
                  }}
                >
                  {share}%
                </span>
              </div>

              {/* Share of the whole warehouse held in this section. */}
              <div
                style={{
                  height: 3,
                  borderRadius: 999,
                  background: active ? 'rgba(255,255,255,0.12)' : '#F0EADC',
                  margin: '9px 0 11px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  className="wb-sec-bar-fill"
                  style={{
                    width: `${share}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: active
                      ? `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`
                      : `linear-gradient(90deg, ${GOLD}, #E3C77F)`,
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 5,
                  minHeight: 19,
                  position: 'relative',
                }}
              >
                {stat.low > 0 &&
                  chip('low', stat.low, {
                    bg: '#FBEAEA',
                    fg: IPQ_RED,
                    border: 'rgba(183,58,58,0.22)',
                    onDark: '#FFB4B4',
                  })}
                {stat.expiring > 0 &&
                  chip('expiring', stat.expiring, {
                    bg: '#FBF3E3',
                    fg: AMBER,
                    border: 'rgba(196,150,44,0.28)',
                    onDark: GOLD_LIGHT,
                  })}
                {stat.low === 0 && stat.expiring === 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      color: active ? 'rgba(248,244,233,0.5)' : '#B0AA96',
                    }}
                  >
                    {count === 0 ? 'Nothing stored yet' : 'All levels healthy'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Raw Material sub-section tabs — API's / Excipients. Only shown
          while Raw Material is the active section. Same permission rule
          as everything else: only Warehouse can add/edit/delete inside
          either sub-section; every department can view both, live. */}
      {isRawMaterial && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '18px',
            flexWrap: 'wrap',
          }}
        >
          {RAW_MATERIAL_SUBCATEGORIES.map((s) => {
            const stat = inventoryStats.bySub[s.key] || { count: 0, low: 0, expiring: 0 };
            const count = stat.count;
            const active = subcategory === s.key;
            const Icon = s.icon;
            const alerts = stat.low + stat.expiring;
            return (
              <button
                key={s.key}
                onClick={() => {
                  setSubcategory(s.key);
                  setApiSection(API_SUBSECTIONS[0].key);
                  setFormOpen(false);
                  setSearch('');
                }}
                className="wb-sec-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '11px',
                  padding: '10px 16px 10px 12px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  minWidth: 168,
                  textAlign: 'left',
                  border: `1px solid ${active ? GOLD : LINE}`,
                  background: active
                    ? 'linear-gradient(135deg, #FFFDF6 0%, #FBF3E3 100%)'
                    : 'white',
                  boxShadow: active
                    ? '0 6px 16px rgba(201,165,92,0.18)'
                    : '0 1px 2px rgba(10,18,32,0.04)',
                }}
              >
                <div
                  className="wb-sec-icon"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: active
                      ? `linear-gradient(135deg, ${GOLD}, #E3C77F)`
                      : '#F7F2E6',
                  }}
                >
                  <Icon size={14} color={active ? 'white' : '#9C9585'} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 6,
                      color: active ? AMBER : INK,
                      fontWeight: 600,
                      fontSize: 12.5,
                    }}
                  >
                    {s.label}
                    <span className="wb-serif" style={{ fontSize: 15, color: active ? AMBER : INK }}>
                      {count}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      marginTop: 1,
                      color: alerts > 0 ? IPQ_RED : '#B0AA96',
                      fontWeight: alerts > 0 ? 600 : 400,
                    }}
                  >
                    {alerts > 0
                      ? `${alerts} need${alerts === 1 ? 's' : ''} attention`
                      : count === 0
                      ? 'Empty'
                      : 'All healthy'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* API's group tabs — CEPH. / General. Only shown while inside
          Raw Material -> API's. Same permission rule as everything
          else: only Warehouse can add/edit/delete inside either group;
          every department can view both, live. */}
      {isAPIs && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '18px',
            marginLeft: '4px',
            flexWrap: 'wrap',
          }}
        >
          {API_SUBSECTIONS.map((s) => {
            const stat = inventoryStats.byApi[s.key] || { count: 0, low: 0, expiring: 0 };
            const count = stat.count;
            const active = apiSection === s.key;
            const alerts = stat.low + stat.expiring;
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => {
                  setApiSection(s.key);
                  setFormOpen(false);
                  setSearch('');
                }}
                className="wb-sec-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 13px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  border: `1px solid ${active ? GOLD : LINE}`,
                  background: active
                    ? `linear-gradient(120deg, ${INK_DEEP}, ${INK})`
                    : PAPER,
                  color: active ? 'white' : '#7A7460',
                  fontWeight: active ? 600 : 400,
                  boxShadow: active ? '0 6px 16px rgba(4,7,17,0.22)' : 'none',
                }}
              >
                {Icon && <Icon size={12} color={active ? GOLD_LIGHT : '#B0AA96'} />}
                {s.label}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '0 6px',
                    borderRadius: 999,
                    background: active ? 'rgba(255,255,255,0.12)' : 'white',
                    border: `1px solid ${active ? 'rgba(255,255,255,0.14)' : LINE}`,
                    color: active ? 'rgba(255,255,255,0.85)' : '#8A8370',
                  }}
                >
                  {count}
                </span>
                {/* A single dot is enough at this depth — the detail of
                    what's wrong is one click away on the table below. */}
                {alerts > 0 && (
                  <span
                    title={`${alerts} item${alerts === 1 ? '' : 's'} low on stock or nearing expiry`}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: active ? '#FFB4B4' : IPQ_RED,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {activeCat && <activeCat.icon size={16} color={GOLD} />}
          <p className="wb-serif" style={{ color: INK, fontSize: '17px', margin: 0 }}>
            {isAPIs
              ? `Raw Material — API's — ${activeApiSection ? activeApiSection.label : ''}`
              : isRawMaterial
              ? `Raw Material — ${activeSub ? activeSub.label : ''}`
              : category}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={13}
              color="#9C9585"
              style={{ position: 'absolute', left: '10px', top: '9px' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search this section…"
              style={{
                padding: '8px 10px 8px 30px',
                border: `1px solid ${LINE}`,
                borderRadius: '6px',
                fontSize: '12px',
                width: '190px',
              }}
            />
          </div>
          {/* CSV export — available to every department (it's a download
              of what's already visible to them, not a mutation), same as
              the CSV button on Packing Status's Daily Packing
              table. */}
          <button
            onClick={exportInventoryCsv}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'white',
              border: `1px solid ${LINE}`,
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#5C5646',
              whiteSpace: 'nowrap',
            }}
          >
            <Download size={13} /> CSV
          </button>
          {/* Add-item control only rendered for the Warehouse department —
              every other department gets search/filter/export only, no
              way to mutate stock from this page. */}
          {canManage && (
            <button
              onClick={startAdd}
              className="wb-btn wb-btn-gold"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: GOLD,
                color: 'white',
                border: 'none',
                padding: '9px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={14} /> Add item
            </button>
          )}
        </div>
      </div>

      {formOpen && canManage && (
        <div
          className="wb-card wb-inv-form-grid"
          style={{
            background: 'white',
            border: `1px solid ${LINE}`,
            borderRadius: '12px',
            padding: '18px',
            marginBottom: '18px',
            maxWidth: '620px',
            boxShadow: '0 1px 2px rgba(10,18,32,0.04)',
          }}
        >
          {saveError && (
            <div
              style={{
                gridColumn: '1 / -1',
                background: '#FBEAEA',
                border: `1px solid ${IPQ_RED}`,
                borderRadius: '8px',
                padding: '10px 12px',
                color: IPQ_RED,
                fontSize: '12px',
              }}
            >
              {saveError}
            </div>
          )}
          {isRawMaterial && (
            <div
              style={{
                gridColumn: '1 / -1',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: PAPER,
                border: `1px solid ${LINE}`,
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#5C5646',
              }}
            >
              {activeSub && <activeSub.icon size={13} color={GOLD} />}
              This item will be added under Raw Material — <b>{activeSub ? activeSub.label : ''}</b>
              {isAPIs ? <> — <b>{activeApiSection ? activeApiSection.label : ''}</b></> : null}.
            </div>
          )}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '11px', color: '#8A8370' }}>
              Item name
            </label>
            <div style={{ marginTop: '4px' }}>
              {isAPIs ? (
                <ApiNameAutocomplete
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                  placeholder="Start typing… e.g. Ceftriaxone Na, Cefepime HCl"
                />
              ) : (
                <ProductNameAutocomplete
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                  placeholder="Start typing… e.g. Paracetamol, Titek, Amvazide"
                />
              )}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#8A8370' }}>
              Batch No.
            </label>
            <input
              value={form.batch}
              onChange={(e) => setForm({ ...form, batch: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: `1px solid ${LINE}`,
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
            {!editingId && liveBatchMatch && (
              <p className="wb-pna-merge-hint" style={{ margin: '6px 0 0', fontSize: 11, color: CYAN_DEEP, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Repeat size={11} /> Will merge into existing "{liveBatchMatch.name}" line (+{form.qty || 0} → {Number(liveBatchMatch.qty) + Number(form.qty || 0)} {liveBatchMatch.unit})
              </p>
            )}
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#8A8370' }}>
              Unit
            </label>
            <input
              placeholder="units / kg / boxes…"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: `1px solid ${LINE}`,
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#8A8370' }}>
              Manufacturing month
            </label>
            <input
              type="month"
              value={form.mfg_date}
              onChange={(e) => setForm({ ...form, mfg_date: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: `1px solid ${LINE}`,
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#8A8370' }}>
              Expiry month
            </label>
            <input
              type="month"
              value={form.expiry}
              onChange={(e) => setForm({ ...form, expiry: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: `1px solid ${LINE}`,
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#8A8370' }}>
              Quantity in stock
            </label>
            <input
              type="number"
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: `1px solid ${LINE}`,
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#8A8370' }}>
              Minimum stock level
            </label>
            <input
              type="number"
              placeholder="Alert below this qty"
              value={form.min_stock}
              onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: `1px solid ${LINE}`,
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {category === 'Finished Goods' && (
            <>
              <div>
                <label style={{ fontSize: '11px', color: '#8A8370' }}>
                  Final Size
                </label>
                <input
                  placeholder="e.g. 100 tablets"
                  value={form.final_size}
                  onChange={(e) => setForm({ ...form, final_size: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '4px',
                    border: `1px solid ${LINE}`,
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#8A8370' }}>
                  Price
                </label>
                <input
                  type="number"
                  placeholder="e.g. 250"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '4px',
                    border: `1px solid ${LINE}`,
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </>
          )}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '11px', color: '#8A8370' }}>
              Storage location
            </label>
            <input
              placeholder="e.g. Aisle 3, Rack B"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: `1px solid ${LINE}`,
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {/* Folio + To — Folio is its own field (separate from Batch
              No.) that is posted straight into the register's FOLIO
              column. "To" feeds the PARTICULARS column: an issue posts
              "Issued to <To>", a receipt posts "Received — <To>" — so
              the register never has to be written by hand. */}
          <div>
            <label style={{ fontSize: '11px', color: '#8A8370' }}>
              Folio — becomes register folio
            </label>
            <input
              placeholder="e.g. GRN No., voucher No.…"
              value={form.folio}
              onChange={(e) => setForm({ ...form, folio: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: `1px solid ${LINE}`,
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#8A8370' }}>
              To — becomes register particulars
            </label>
            <div style={{ marginTop: '4px' }}>
              <ProductNameAutocomplete
                value={form.batchTo}
                onChange={(v) => setForm({ ...form, batchTo: v })}
                placeholder="Start typing…"
              />
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '11px', color: '#8A8370' }}>
              Notes / remarks for this transaction
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Received against PO-2210, moved to cold storage…"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: `1px solid ${LINE}`,
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {/* Live preview of the Stock Register line this save will post
              by itself — so Warehouse can see, before saving, that the
              book is being written for them and there is nothing left
              to copy across by hand. */}
          <div style={{ gridColumn: '1 / -1' }}>
            <RegisterPostPreview
              form={form}
              editingId={editingId}
              existingItem={
                editingId
                  ? inventory.find((i) => i.id === editingId)
                  : liveBatchMatch
              }
            />
          </div>
          <div
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              gap: '8px',
              marginTop: '4px',
            }}
          >
            <button
              onClick={submit}
              className="wb-btn wb-btn-gold"
              style={{
                background: GOLD,
                color: 'white',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              {editingId
                ? 'Save changes'
                : `Add to ${
                    isAPIs
                      ? `Raw Material — API's — ${activeApiSection ? activeApiSection.label : ''}`
                      : isRawMaterial
                      ? `Raw Material — ${activeSub ? activeSub.label : ''}`
                      : category
                  }`}
            </button>
            <button
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#7A7460',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div
        className="wb-card wb-table-scroll"
        style={{
          background: 'white',
          borderRadius: '12px',
          border: `1px solid ${LINE}`,
          overflow: 'auto',
          boxShadow: '0 1px 2px rgba(10,18,32,0.04)',
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: '640px',
            fontSize: '13px',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr style={{ background: PAPER, textAlign: 'left' }}>
              <th style={{ padding: '12px 16px', fontSize: '11px', color: '#8A8370' }}>Item Name</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', color: '#8A8370' }}>Batch No.</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', color: '#8A8370' }}>MFG Month</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', color: '#8A8370' }}>EXP Month</th>
              {category === 'Finished Goods' && (
                <>
                  <th style={{ padding: '12px 16px', fontSize: '11px', color: '#8A8370' }}>Final Size</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', color: '#8A8370' }}>Price</th>
                </>
              )}
              <th style={{ padding: '12px 16px', fontSize: '11px', color: '#8A8370' }}>Quantity</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', color: '#8A8370' }}>Min. Level</th>
              {canManage && (
                <th style={{ padding: '12px 16px', fontSize: '11px', color: '#8A8370' }}> </th>
              )}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={(canManage ? 7 : 6) + (category === 'Finished Goods' ? 2 : 0)}
                  style={{
                    padding: '24px 20px',
                    color: '#9C9585',
                    textAlign: 'center',
                  }}
                >
                  Nothing stored in {
                    isAPIs
                      ? `Raw Material — API's — ${activeApiSection ? activeApiSection.label : ''}`
                      : isRawMaterial
                      ? `Raw Material — ${activeSub ? activeSub.label : ''}`
                      : category
                  } yet.
                </td>
              </tr>
            )}
            {visible.map((item) => {
              const low =
                item.min_stock != null &&
                Number(item.qty) < Number(item.min_stock);
              const expired = isExpired(item.expiry);
              const expSoon = !expired && isExpiringSoon(item.expiry);
              return (
                <tr
                  key={item.id}
                  onClick={() => setHistoryItem(item)}
                  className="wb-inv-row"
                  style={{ borderTop: `1px solid ${LINE}`, cursor: 'pointer' }}
                >
                  <td style={{ padding: '13px 16px', color: INK, fontWeight: 500 }}>
                    {item.name}
                    {Array.isArray(item.history) && item.history.length > 0 && (
                      <History
                        size={12}
                        color="#B0AA96"
                        style={{ display: 'inline', marginLeft: '6px', verticalAlign: 'middle' }}
                      />
                    )}
                    {onOpenRegister && (
                      <button
                        className="wb-reglink-btn"
                        title="Open this article's stock register"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRegister(item.id);
                        }}
                      >
                        <ClipboardList size={11} /> Register
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '13px 16px', color: '#7A7460' }}>
                    {item.batch || '—'}
                  </td>
                  <td style={{ padding: '13px 16px', color: '#7A7460' }}>
                    {formatDate(item.mfg_date)}
                  </td>
                  <td
                    style={{
                      padding: '13px 16px',
                      color: expired || expSoon ? RED : '#7A7460',
                      fontWeight: expired || expSoon ? 600 : 400,
                    }}
                  >
                    {formatDate(item.expiry)}
                    {(expired || expSoon) && (
                      <span
                        style={{
                          marginLeft: '8px',
                          fontSize: '10px',
                          color: RED,
                          border: `1px solid ${RED}`,
                          borderRadius: '4px',
                          padding: '1px 5px',
                        }}
                      >
                        {expired ? 'Expired' : 'Expiring soon'}
                      </span>
                    )}
                  </td>
                  {category === 'Finished Goods' && (
                    <>
                      <td style={{ padding: '13px 16px', color: '#7A7460' }}>
                        {item.final_size || '—'}
                      </td>
                      <td style={{ padding: '13px 16px', color: '#7A7460' }}>
                        {item.price != null && item.price !== ''
                          ? `Rs. ${Number(item.price).toLocaleString('en-PK')}`
                          : '—'}
                      </td>
                    </>
                  )}
                  <td
                    style={{
                      padding: '13px 16px',
                      color: low ? RED : '#7A7460',
                      fontWeight: low ? 600 : 400,
                    }}
                  >
                    {item.qty} {item.unit}
                    {low && (
                      <span
                        style={{
                          marginLeft: '8px',
                          fontSize: '10px',
                          color: RED,
                          border: `1px solid ${RED}`,
                          borderRadius: '4px',
                          padding: '1px 5px',
                        }}
                      >
                        Below min.
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '13px 16px', color: '#7A7460' }}>
                    {item.min_stock != null && item.min_stock !== ''
                      ? `${item.min_stock} ${item.unit}`
                      : '—'}
                  </td>
                  {/* Edit/delete controls are hidden entirely for anyone
                      outside the Warehouse department — not just disabled,
                      so there's nothing to click even via inspecting the
                      DOM. The real block is still onAdd/onEdit/onDelete
                      refusing the mutation at the App level below. */}
                  {canManage && (
                    <td style={{ padding: '13px 16px' }}>
                      {isItemLockedForEdit(item) ? (
                        <span
                          title={`Locked — last updated ${monthLabelOf(monthKeyOf(itemLastActivityISO(item)))}. Add stock again this month to reopen it.`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#B0AA96', fontSize: '11px' }}
                        >
                          <Lock size={13} /> Locked
                        </span>
                      ) : (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(item);
                          }}
                          title="Edit"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#5C5646',
                            cursor: 'pointer',
                            display: 'flex',
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(item);
                          }}
                          title="Delete"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: RED,
                            cursor: 'pointer',
                            display: 'flex',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <InventoryHistoryModal item={historyItem} onClose={() => setHistoryItem(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------
// HSE HERO — a bold, animated red-toned command header for Health &
// Safety. Deliberately its own colour language (deep alarm-red/coral,
// vs. the department's soft red dashboard tile) so the page reads as
// "this matters" the moment it opens: a drifting red glow field, a
// slow-orbiting shield badge, and a scatter of small floating safety
// icons (hazard triangle, activity pulse, clipboard) drifting gently
// in the background.
// ---------------------------------------------------------------------
function HSEHero({ hse }) {
  const allHse = [
    ...(hse.riskAssessments || []),
    ...(hse.incidents || []),
    ...(hse.permits || []),
  ];
  const open = allHse.filter((r) => r.status !== 'Closed').length;
  const highRisk = (hse.riskAssessments || []).filter((r) => r.level === 'High').length;
  const incidentsCount = (hse.incidents || []).length;
  const permitsCount = (hse.permits || []).length;

  const figures = [
    { label: 'Open items', value: open, icon: ClipboardList },
    { label: 'High risk', value: highRisk, icon: AlertTriangle, alert: highRisk > 0 },
    { label: 'Incidents logged', value: incidentsCount, icon: Zap },
    { label: 'Active permits', value: permitsCount, icon: Stamp },
  ];

  const floatIcons = [
    { Icon: ShieldAlert, top: '10%', left: '62%', delay: '0s', size: 22 },
    { Icon: AlertTriangle, top: '58%', left: '78%', delay: '1.4s', size: 18 },
    { Icon: Activity, top: '70%', left: '54%', delay: '2.6s', size: 16 },
    { Icon: ClipboardList, top: '22%', left: '84%', delay: '0.8s', size: 16 },
  ];

  return (
    <div className="wb-hse-hero">
      <div className="wb-hse-hero-gridlines" />
      <div className="wb-hse-hero-glow-a" />
      <div className="wb-hse-hero-glow-b" />
      <div className="wb-hse-hero-glow-c" />
      {floatIcons.map((f, i) => (
        <div
          key={i}
          className="wb-hse-float-icon"
          style={{ top: f.top, left: f.left, animationDelay: f.delay }}
        >
          <f.Icon size={f.size} color="rgba(255,255,255,0.85)" />
        </div>
      ))}

      <div className="wb-hse-hero-orbit">
        <div className="wb-hse-hero-badge">
          <ShieldAlert size={30} color="#fff" />
        </div>
      </div>

      <div className="wb-hse-hero-top">
        <div className="wb-hse-hero-eyebrow">
          <span className="wb-hse-live-dot" />
          <span>{todayLabel()}</span>
        </div>
        <h2 className="wb-serif wb-hse-hero-title">Health &amp; Safety</h2>
        <p className="wb-hse-hero-sub">
          Risk assessments, incidents and permits to work — live across every department.
        </p>
      </div>

      <div className="wb-hse-hero-figures">
        {figures.map((f) => (
          <div key={f.label} className={`wb-hse-fig${f.alert ? ' wb-hse-fig-alert' : ''}`}>
            <f.icon size={16} />
            <span className="wb-hse-fig-value">{f.value}</span>
            <span className="wb-hse-fig-label">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const HSE_TABS = [
  { key: 'riskAssessments', label: 'Risk Assessments', icon: ClipboardList },
  { key: 'incidents', label: 'Incidents', icon: AlertTriangle },
  { key: 'permits', label: 'Permits to Work', icon: Stamp },
];

const HSE_BLANK_FORM = {
  title: '',
  area: '',
  level: 'Medium',
  rating: '',
  severity: 'Minor',
  status: 'Open',
  type: '',
  date: '',
};

// Visible to every department, but only HSE can add, edit or remove
// records — everyone else gets a read-only view of risk assessments,
// incidents and permits to work. Real-time via the hse_records channel
// in App below, so every department sees HSE's edits immediately.
function HSEPage({ user, hse, onAdd, onEdit, onDelete }) {
  const [tab, setTab] = useState('riskAssessments');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(HSE_BLANK_FORM);
  const canManage = user.dept === 'HSE';

  const startAdd = () => {
    setForm({ ...HSE_BLANK_FORM, date: new Date().toISOString().slice(0, 10) });
    setEditingId(null);
    setFormOpen(true);
  };

  const startEdit = (record) => {
    setForm({ ...HSE_BLANK_FORM, ...record });
    setEditingId(record.id);
    setFormOpen(true);
  };

  const submit = () => {
    if (!form.title) return;
    const payload = { ...form, category: tab };
    if (editingId) {
      onEdit(editingId, payload);
    } else {
      onAdd(payload);
    }
    setFormOpen(false);
    setEditingId(null);
    setForm(HSE_BLANK_FORM);
  };

  const records = hse[tab] || [];

  return (
    <div className="wb-page-padding" style={{ padding: '28px 32px' }}>
      <HSEHero hse={hse} />
      {!canManage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: PAPER,
            border: `1px solid ${LINE}`,
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '16px',
            color: '#7A7460',
            fontSize: '12px',
          }}
        >
          <Eye size={13} /> View only — risk assessments, incidents and
          permits are maintained by the HSE department.
        </div>
      )}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {HSE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setFormOpen(false);
              }}
              className="wb-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: tab === t.key ? INK : 'white',
                color: tab === t.key ? 'white' : '#7A7460',
                border: `1px solid ${LINE}`,
              }}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
        {canManage && (
          <button
            onClick={startAdd}
            className="wb-btn wb-btn-gold"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: GOLD,
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            <Plus size={14} /> Add {HSE_TABS.find((t) => t.key === tab)?.label}
          </button>
        )}
      </div>

      {formOpen && canManage && (
        <div
          className="wb-card"
          style={{
            background: 'white',
            border: `1px solid ${LINE}`,
            borderRadius: '10px',
            padding: '18px',
            marginBottom: '18px',
            display: 'grid',
            gap: '8px',
            maxWidth: '480px',
          }}
        >
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={{
              padding: '8px',
              border: `1px solid ${LINE}`,
              borderRadius: '6px',
            }}
          />
          <input
            placeholder="Area / location"
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
            style={{
              padding: '8px',
              border: `1px solid ${LINE}`,
              borderRadius: '6px',
            }}
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            style={{
              padding: '8px',
              border: `1px solid ${LINE}`,
              borderRadius: '6px',
            }}
          />
          {tab === 'riskAssessments' && (
            <>
              <input
                placeholder="Rating (numeric score)"
                type="number"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                style={{
                  padding: '8px',
                  border: `1px solid ${LINE}`,
                  borderRadius: '6px',
                }}
              />
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                style={{
                  padding: '8px',
                  border: `1px solid ${LINE}`,
                  borderRadius: '6px',
                }}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </>
          )}
          {tab === 'incidents' && (
            <>
              <select
                value={form.severity}
                onChange={(e) =>
                  setForm({ ...form, severity: e.target.value })
                }
                style={{
                  padding: '8px',
                  border: `1px solid ${LINE}`,
                  borderRadius: '6px',
                }}
              >
                <option>Minor</option>
                <option>Moderate</option>
                <option>Major</option>
              </select>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{
                  padding: '8px',
                  border: `1px solid ${LINE}`,
                  borderRadius: '6px',
                }}
              >
                <option>Open</option>
                <option>Closed</option>
              </select>
            </>
          )}
          {tab === 'permits' && (
            <>
              <input
                placeholder="Permit type (e.g. Working at Height)"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{
                  padding: '8px',
                  border: `1px solid ${LINE}`,
                  borderRadius: '6px',
                }}
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{
                  padding: '8px',
                  border: `1px solid ${LINE}`,
                  borderRadius: '6px',
                }}
              >
                <option>Open</option>
                <option>Closed</option>
              </select>
            </>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={submit}
              className="wb-btn wb-btn-gold"
              style={{
                background: GOLD,
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              {editingId ? 'Save changes' : 'Add record'}
            </button>
            <button
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#7A7460',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="wb-hse-grid">
        {records.length === 0 && (
          <p style={{ color: '#9C9585', fontSize: '14px' }}>
            No records yet.
          </p>
        )}
        {records.map((r) => (
          <div
            key={r.id}
            className="wb-card"
            style={{
              background: 'white',
              border: `1px solid ${LINE}`,
              borderRadius: '10px',
              padding: '18px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span style={{ color: '#9C9585', fontSize: '12px' }}>{r.id}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {r.level && <RiskBadge level={r.level} />}
                {!r.level && r.severity && (
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#7A4A1E',
                      border: '1px solid #7A4A1E',
                      borderRadius: '4px',
                      padding: '1px 6px',
                    }}
                  >
                    {r.severity}
                  </span>
                )}
                {r.status && <StatusPill status={r.status} />}
                {canManage && (
                  <>
                    <button
                      onClick={() => startEdit(r)}
                      title="Edit"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#5C5646',
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${r.title}"?`)) {
                          onDelete(r.id);
                        }
                      }}
                      title="Delete"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#8A2E2E',
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <p
              style={{
                color: INK,
                fontSize: '14px',
                fontWeight: 500,
                margin: 0,
              }}
            >
              {r.title}
            </p>
            <p
              style={{ color: '#7A7460', fontSize: '12px', margin: '4px 0 0' }}
            >
              {r.area} {r.type ? `· ${r.type}` : ''} · {r.date}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Announcements are open company-wide: anyone can post, and anyone can
// delete any announcement (including the pinned banner) — matching every
// department having full access here.
function AnnouncementsPage({ user, notices, onPost, onDelete }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState(false);

  const submit = () => {
    if (!title || !body) return;
    onPost(title, body, priority);
    setTitle('');
    setBody('');
    setPriority(false);
  };

  const pinnedCount = notices.filter((n) => n.priority).length;
  const todayCount = notices.filter((n) => isToday(n.createdAt)).length;

  return (
    <div className="wb-page-padding" style={{ padding: '28px 32px', maxWidth: '720px' }}>
      {/* -------------------------------------------------------------- */}
      {/* ANNOUNCEMENTS HERO — the same dark command-deck language used  */}
      {/* on the Dashboard and Packing Status pages (gridlines, drifting */}
      {/* glow blooms, shine-sweep title) re-themed in gold/violet so it */}
      {/* reads as the portal's "royal decree" surface — restrained to   */}
      {/* the same handful of GPU-composited, always-on effects already  */}
      {/* used elsewhere, rather than new continuous animation per item. */}
      {/* -------------------------------------------------------------- */}
      <div className="wb-ann-hero">
        <div className="wb-ann-hero-gridlines" />
        <div className="wb-ann-hero-glow-a" />
        <div className="wb-ann-hero-glow-b" />
        <div className="wb-ann-hero-top">
          <div className="wb-prod-hero-eyebrow" style={{ color: '#F2D999' }}>
            <span className="wb-live-dot wb-live-dot-gold" />
            <span>COMPANY-WIDE · LIVE</span>
            <span className="wb-hero-eyebrow-sep">·</span>
            <LiveClock />
          </div>
          <h2 className="wb-serif wb-prod-hero-title">
            <span className="wb-ann-hero-title-shine">Announcements</span>
          </h2>
          <p className="wb-hero-sub" style={{ color: 'rgba(248,244,233,0.55)' }}>
            One shared board, visible to every department the moment it's posted
          </p>
        </div>
        <div className="wb-prod-hero-figures" style={{ gridTemplateColumns: 'repeat(2, minmax(100px, 1fr))' }}>
          <div className="wb-prod-figure">
            <div className="wb-prod-figure-icon" style={{ background: 'rgba(242,217,153,0.16)' }}>
              <Megaphone size={14} color={GOLD_LIGHT} />
            </div>
            <p className="wb-prod-figure-value">{notices.length}</p>
            <p className="wb-prod-figure-label">Total posted</p>
          </div>
          <div className="wb-prod-figure">
            <div className="wb-prod-figure-icon" style={{ background: 'rgba(242,217,153,0.16)' }}>
              <Pin size={14} color={GOLD_LIGHT} />
            </div>
            <p className="wb-prod-figure-value">{pinnedCount}</p>
            <p className="wb-prod-figure-label">Pinned now</p>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------- */}
      {/* COMPOSER — a glassy gold-accented card; the glow only appears  */}
      {/* while an input inside it is focused (:focus-within), so it's   */}
      {/* zero-cost until someone's actually writing an announcement.    */}
      {/* -------------------------------------------------------------- */}
      <div className="wb-card wb-ann-composer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div className="wb-ann-composer-icon">
            <Sparkles size={15} color={GOLD} />
          </div>
          <p className="wb-serif" style={{ color: INK, fontSize: '16px', margin: 0 }}>
            Share an update — visible to every department
          </p>
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          style={{
            width: '100%',
            padding: '10px 12px',
            marginBottom: '10px',
            border: `1px solid ${LINE}`,
            borderRadius: '8px',
            boxSizing: 'border-box',
          }}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Message…"
          style={{
            width: '100%',
            padding: '10px 12px',
            marginBottom: '10px',
            border: `1px solid ${LINE}`,
            borderRadius: '8px',
            boxSizing: 'border-box',
          }}
        />
        <label className="wb-ann-pin-toggle">
          <input
            type="checkbox"
            checked={priority}
            onChange={(e) => setPriority(e.target.checked)}
          />
          <span className="wb-ann-pin-toggle-box">
            <Pin size={11} />
          </span>
          Pin as a banner at the top of the portal
        </label>
        <button
          disabled={!title || !body}
          onClick={submit}
          className="wb-btn wb-btn-gold"
          style={{
            background: !title || !body ? '#D8D2C0' : GOLD,
            color: 'white',
            border: 'none',
            padding: '11px 20px',
            borderRadius: '8px',
            cursor: !title || !body ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          Post announcement
        </button>
      </div>

      {notices.length === 0 && (
        <div className="wb-ann-empty">
          <Megaphone size={22} color="#C9BFA0" />
          <p style={{ color: '#9C9585', fontSize: '14px', margin: '10px 0 0' }}>
            No announcements yet — be the first to share one.
          </p>
        </div>
      )}

      {notices.map((n, i) => {
        const fresh = isToday(n.createdAt);
        return (
          <div
            key={n.id}
            className={`wb-card wb-ann-card wb-ann-in${n.priority ? ' wb-ann-card-pinned' : ''}`}
            style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}
          >
            {n.priority && <div className="wb-ann-card-shine" />}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0 }}>
                <div className={`wb-ann-avatar${n.priority ? ' wb-ann-avatar-gold' : ''}`}>
                  {(n.postedBy || '?').trim().charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      color: INK,
                      fontSize: '15px',
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {n.title}
                  </p>
                  <p style={{ color: '#B0AA96', fontSize: '11px', margin: '2px 0 0' }}>
                    {n.postedBy} · {n.postedDept} · {n.date}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {fresh && (
                  <span className="wb-ann-badge wb-ann-badge-new">
                    <span className="wb-live-dot wb-live-dot-cyan" />
                    New
                  </span>
                )}
                {n.priority && (
                  <span className="wb-ann-badge wb-ann-badge-pinned">
                    <Pin size={10} />
                    Pinned
                  </span>
                )}
                <button
                  onClick={() => {
                    if (window.confirm(`Delete announcement "${n.title}"?`)) {
                      onDelete(n.id);
                    }
                  }}
                  title="Delete announcement"
                  className="wb-ann-delete-btn"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p style={{ color: '#7A7460', fontSize: '13px', margin: '10px 0 0', position: 'relative', zIndex: 1 }}>
              {n.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------
// DIRECTORY HERO — a colourful, animated banner that samples every
// department's own theme colour into one rainbow strip, with a scatter
// of gently floating department icons drifting across it.
// ---------------------------------------------------------------------
function DirectoryHero({ deptCount, peopleCount }) {
  const jewels = Object.values(DEPT_THEMES);
  const positions = [
    { top: '12%', left: '58%' }, { top: '68%', left: '50%' },
    { top: '8%', left: '74%' }, { top: '38%', left: '86%' },
    { top: '72%', left: '80%' }, { top: '30%', left: '66%' },
    { top: '58%', left: '92%' }, { top: '15%', left: '90%' },
  ];
  return (
    <div className="wb-dir-hero">
      <div className="wb-dir-hero-gridlines" />
      <div className="wb-dir-hero-sweep" />
      <div className="wb-dir-hero-glow-a" />
      <div className="wb-dir-hero-glow-b" />
      <div className="wb-dir-hero-dust" />

      {jewels.map((t, i) => {
        const pos = positions[i % positions.length];
        const Icon = t.icon;
        return (
          <div
            key={t.name}
            className="wb-dir-jewel"
            style={{
              top: pos.top,
              left: pos.left,
              animationDelay: `${i * 0.6}s`,
              '--jewel-tint': t.accent,
            }}
          >
            <div className="wb-dir-jewel-halo" style={{ background: t.accent }} />
            <div
              className="wb-dir-jewel-badge"
              style={{ background: `linear-gradient(145deg, ${t.accent}, ${t.accentDeep})` }}
            >
              <Icon size={14} color="#fff" />
            </div>
          </div>
        );
      })}

      <div className="wb-dir-hero-content">
        <div className="wb-dir-hero-eyebrow">
          <span className="wb-dir-live-dot" />
          <Users size={12} />
          <span>Company Directory</span>
        </div>
        <h2 className="wb-serif wb-dir-hero-title">
          <span className="wb-dir-hero-title-shine">Department Directory</span>
        </h2>
        <p className="wb-dir-hero-sub">
          {peopleCount} people across {deptCount} departments
        </p>
      </div>
    </div>
  );
}

function DirectoryPage() {
  const grouped = useMemo(() => {
    const map = {};
    DEPARTMENTS.forEach((d) => { map[d] = []; });
    USERS.forEach((u) => {
      if (!map[u.dept]) map[u.dept] = [];
      map[u.dept].push(u);
    });
    return DEPARTMENTS.filter((d) => (map[d] || []).length > 0).map((d) => ({
      dept: d,
      theme: getDeptTheme(d),
      people: map[d],
    }));
  }, []);

  return (
    <div className="wb-page-padding" style={{ padding: '28px 32px' }}>
      <DirectoryHero deptCount={grouped.length} peopleCount={USERS.length} />
      {grouped.map((g) => (
        <div key={g.dept} className="wb-dir-dept-section">
          <div className="wb-dir-dept-heading">
            <span className="wb-dir-dept-dot" style={{ background: g.theme.accent }} />
            <h3 style={{ color: g.theme.accentDeep }}>{g.dept}</h3>
            <span className="wb-dir-dept-count" style={{ background: g.theme.accentSoft, color: g.theme.accentDeep }}>
              {g.people.length}
            </span>
          </div>
          <div className="wb-directory-grid">
            {g.people.map((u, i) => (
              <div
                key={u.id}
                className="wb-dir-card-v2"
                style={{ animationDelay: `${i * 60}ms`, '--dir-accent': g.theme.accent }}
              >
                <div
                  className="wb-dir-card-avatar"
                  style={{ background: `linear-gradient(135deg, ${g.theme.accent}, ${g.theme.accentDeep})` }}
                >
                  {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p className="wb-dir-card-name">{u.name}</p>
                  <p className="wb-dir-card-title">{u.title}</p>
                </div>
                {(u.dept === 'Plant Manager' || u.dept === 'HSE') && (
                  <span className="wb-dir-head-badge" style={{ color: g.theme.accentDeep, borderColor: g.theme.accentSoft }}>
                    {u.dept === 'Plant Manager' ? 'Head' : 'Developer'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// =======================================================================
// Warehouse Reports.
//
// Two parts:
//
// 1. An emerald, live "monthly pulse" dashboard — Items Dispatched This
//    Month, Items Packed This Month, Items Received From Production This
//    Month. These three numbers are computed from real data (inventory
//    movement history, production_packing_entries, warehouse_transfers)
//    and update the moment Warehouse Inventory changes or a new transfer/
//    packing entry lands — nothing here is typed in by hand.
//
// 2. The Register itself — a dedicated, full-page "Stock (Inward &
//    Outward) Register" that opens on its own, the same way a page
//    navigation would, instead of sitting in a side panel. Which
//    articles exist to open a register for is "connected" live to
//    Warehouse Inventory (same categories/sub-categories, and the
//    Article / Packing-Units / Minimum Level header fields are pulled
//    straight from that item) — but the register's own ledger rows
//    (Date, Particulars, Folio, Opening Balance, Issued, Remaining
//    Balance, Remarks) are
//    left completely BLANK. Nothing is auto-filled in there. Only the
//    Warehouse department can type in a row, edit one, or remove one;
//    every other department can open the same page and read whatever
//    Warehouse has filled in, but sees no edit controls at all.
//
// Data model: a new `ledger_rows` jsonb column on `inventory`, separate
// from the existing `history` column (which keeps recording real stock
// movements exactly as before — untouched by any of this). If it
// doesn't exist yet, run once:
//   alter table inventory add column if not exists ledger_rows jsonb default '[]'::jsonb;
//   alter table inventory add column if not exists max_stock numeric;
//   alter table inventory add column if not exists rate numeric;
// =======================================================================

// One emerald stat tile — the animated pulse ring behind the number is
// pure CSS (keyframes injected once via <WarehouseReportsStyles/>), so
// it keeps breathing gently without any JS animation loop.
// ---------------------------------------------------------------------
// WAREHOUSE MONTHLY PULSE — an emerald, "live HUD" readout of the three
// headline movements for the current calendar month: Total Packed,
// Total Added to Finished Goods, Total Items Added. Each tile is a
// button — clicking it opens the underlying list of records behind that
// number (WarehouseMonthlyDetailModal below), so the figure is never a
// dead end. Kept deliberately light on animation cost: everything below
// animates transform/opacity only (no layout thrash, no blur filters
// over large areas), so it stays smooth even with a big inventory.
// ---------------------------------------------------------------------
function WarehouseMonthlyStyles() {
  return (
    <style>{`
      .wb-pulse-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
        gap: 14px;
        margin-bottom: 22px;
      }
      .wb-pulse-tile {
        position: relative;
        overflow: hidden;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 16px 18px;
        border-radius: 14px;
        background: linear-gradient(135deg, #05171A 0%, #082024 55%, #04100F 100%);
        border: 1px solid rgba(47,224,201,0.35);
        box-shadow: 0 10px 26px rgba(4,7,17,0.28);
        cursor: pointer;
        font-family: inherit;
        /* A snappy overshoot curve rather than plain ease - it reads as a
           responsive instrument instead of a web page button, and at 170ms
           it is still short enough that it never feels like waiting. */
        transition: transform 170ms cubic-bezier(0.22,1,0.36,1),
                    box-shadow 170ms ease,
                    border-color 170ms ease;
        opacity: 0;
        animation: wb-pulse-tile-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
        animation-delay: var(--tile-d, 0s);
      }
      @keyframes wb-pulse-tile-in {
        from { opacity: 0; transform: translateY(12px) scale(0.97); }
        to   { opacity: 1; transform: none; }
      }
      .wb-pulse-tile:hover {
        transform: translateY(-3px);
        border-color: rgba(47,224,201,0.75);
        box-shadow: 0 18px 38px rgba(4,7,17,0.42),
                    0 0 0 1px rgba(47,224,201,0.30),
                    0 0 28px rgba(47,224,201,0.18);
      }
      .wb-pulse-tile:active { transform: translateY(-1px) scale(0.995); }
      .wb-pulse-tile:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px rgba(124,243,224,0.65), 0 14px 32px rgba(4,7,17,0.36);
      }

      /* A slow scan sweeping the tile, like a readout refreshing. */
      .wb-pulse-scan {
        position: absolute;
        top: 0; left: -45%;
        width: 40%; height: 100%;
        pointer-events: none;
        background: linear-gradient(100deg, transparent, rgba(124,243,224,0.10) 45%, rgba(214,251,243,0.16) 50%, rgba(124,243,224,0.10) 55%, transparent);
        transform: skewX(-16deg);
        animation: wb-pulse-scan-move 5.5s ease-in-out infinite;
        animation-delay: var(--tile-d, 0s);
        will-change: transform;
      }
      @keyframes wb-pulse-scan-move {
        0%, 55%, 100% { transform: translateX(0) skewX(-16deg); }
        28%           { transform: translateX(360%) skewX(-16deg); }
      }

      /* Cursor-following glow, driven by CSS vars set outside React. */
      .wb-pulse-tile-sheen {
        position: absolute; inset: 0;
        pointer-events: none;
        opacity: 0;
        background: radial-gradient(160px circle at var(--mx, 50%) var(--my, 50%), rgba(124,243,224,0.16), transparent 70%);
        transition: opacity 200ms ease;
      }
      .wb-pulse-tile:hover .wb-pulse-tile-sheen { opacity: 1; }
      .wb-pulse-grid-lines {
        position: absolute;
        inset: 0;
        opacity: 0.14;
        background-image:
          linear-gradient(rgba(47,224,201,0.9) 1px, transparent 1px),
          linear-gradient(90deg, rgba(47,224,201,0.9) 1px, transparent 1px);
        background-size: 16px 16px;
        pointer-events: none;
        animation: wb-pulse-grid-drift 9s linear infinite;
      }
      @keyframes wb-pulse-grid-drift {
        from { background-position: 0 0; }
        to   { background-position: 16px 16px; }
      }
      .wb-pulse-icon {
        position: relative;
        z-index: 2;
        transition: transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease;
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #7CF3E0, #2FE0C9);
        box-shadow: 0 0 16px rgba(47,224,201,0.55);
      }
      .wb-pulse-tile:hover .wb-pulse-icon {
        transform: scale(1.07) rotate(-3deg);
        box-shadow: 0 0 26px rgba(47,224,201,0.85);
      }
      .wb-pulse-icon-glow {
        position: absolute; inset: 0;
        border-radius: 10px;
        pointer-events: none;
        animation: wb-pulse-icon-breathe 3.2s ease-in-out infinite;
        animation-delay: var(--tile-d, 0s);
      }
      @keyframes wb-pulse-icon-breathe {
        0%, 100% { box-shadow: 0 0 0 0 rgba(47,224,201,0.45); }
        50%      { box-shadow: 0 0 0 7px rgba(47,224,201,0); }
      }
      .wb-pulse-value {
        position: relative;
        z-index: 2;
        transition: color 200ms ease, text-shadow 200ms ease;
        margin: 0;
        font-size: 23px;
        font-weight: 700;
        color: #D6FBF3;
        letter-spacing: 0.01em;
        font-variant-numeric: tabular-nums;
      }
      .wb-pulse-label {
        position: relative;
        z-index: 2;
        margin: 2px 0 0;
        font-size: 11.5px;
        color: rgba(214,251,243,0.65);
      }
      .wb-pulse-hint {
        position: relative;
        z-index: 2;
        margin-left: auto;
        flex-shrink: 0;
        color: rgba(214,251,243,0.4);
        display: flex;
        align-items: center;
        transition: transform 200ms cubic-bezier(0.22,1,0.36,1), color 200ms ease;
      }
      .wb-pulse-tile:hover .wb-pulse-hint {
        transform: translateX(4px);
        color: rgba(214,251,243,0.9);
      }
      .wb-pulse-tile:hover .wb-pulse-value {
        color: #FFFFFF;
        text-shadow: 0 0 18px rgba(124,243,224,0.45);
      }
      @media (max-width: 640px) {
        .wb-pulse-grid { grid-template-columns: 1fr; }
      }

      /* Detail modal */
      .wb-pulse-modal-backdrop {
        position: fixed; inset: 0; z-index: 80;
        background: rgba(4,7,17,0.55);
        display: flex; align-items: flex-start; justify-content: center;
        padding: 40px 16px;
        overflow-y: auto;
        animation: wbPulseFade 180ms ease-out both;
      }
      @keyframes wbPulseFade { from { opacity: 0; } to { opacity: 1; } }
      .wb-pulse-modal {
        background: white;
        border-radius: 16px;
        width: 100%;
        max-width: 760px;
        overflow: hidden;
        animation: wbPulseModalIn 220ms cubic-bezier(0.22,1,0.36,1) both;
      }
      @keyframes wbPulseModalIn {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      @media (prefers-reduced-motion: reduce) {
        .wb-pulse-modal-backdrop, .wb-pulse-modal, .wb-pulse-tile,
        .wb-pulse-scan, .wb-pulse-icon-glow, .wb-pulse-grid-lines {
          animation: none !important;
        }
        .wb-pulse-tile { opacity: 1 !important; }
      }
    `}</style>
  );
}

const WarehouseMonthlyTile = React.memo(function WarehouseMonthlyTile({
  icon: Icon,
  label,
  value,
  loading,
  onClick,
  index = 0,
}) {
  const animated = useCountUp(loading ? 0 : value, 650);
  // Pointer-following glow. Written straight to a CSS custom property on the
  // node rather than through React state, on purpose: a mousemove handler
  // that calls setState re-renders the tile on every pixel of cursor travel,
  // which is exactly what makes an otherwise fast page feel sluggish.
  // Touching the style property directly keeps it off React's render path.
  const ref = useRef(null);
  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, []);

  return (
    <button
      ref={ref}
      className="wb-pulse-tile"
      onClick={onClick}
      onMouseMove={onMove}
      style={{ '--tile-d': `${index * 0.07}s` }}
      title="Click to see the records behind this number"
    >
      <div className="wb-pulse-grid-lines" />
      <span className="wb-pulse-scan" />
      <span className="wb-pulse-tile-sheen" />
      <div className="wb-pulse-icon">
        <span className="wb-pulse-icon-glow" />
        <Icon size={18} color="#04352C" />
      </div>
      <div style={{ minWidth: 0, position: 'relative', zIndex: 2 }}>
        <p className="wb-pulse-value">{loading ? '—' : animated.toLocaleString()}</p>
        <p className="wb-pulse-label">{label}</p>
      </div>
      <span className="wb-pulse-hint">
        <ChevronRight size={16} />
      </span>
    </button>
  );
});

// The table opened by clicking a tile — deliberately a plain, unanimated
// table (no per-row stagger) so it stays instant even with a long list.
function WarehouseMonthlyDetailModal({ title, accent, columns, rows, filenameBase, onClose }) {
  const downloadCsv = () => {
    csvExport(
      `${filenameBase}.csv`,
      rows,
      columns.map((c) => ({ key: c.key, label: c.label }))
    );
  };
  const downloadPdf = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const esc = (v) => String(v ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const head = columns.map((c) => `<th>${esc(c.label)}</th>`).join('');
    const body = rows.length
      ? rows.map((r) => `<tr>${columns.map((c) => `<td>${esc(r[c.key])}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${columns.length}" style="color:#9C9585;padding:16px">No records.</td></tr>`;
    win.document.write(`
      <html><head><title>${esc(title)}</title>
      <style>
        body { font-family: Georgia, 'Times New Roman', serif; color: #0A1220; padding: 16px; }
        h1 { font-size: 18px; text-align: center; margin: 0 0 14px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #8C6A2E; padding: 6px 8px; text-align: center; }
        th { background: #EFEADA; }
      </style></head>
      <body><h1>${esc(title)}</h1>
      <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="wb-pulse-modal-backdrop" onClick={onClose}>
      <div className="wb-pulse-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: INK }}>{title}</p>
            <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#8A8370' }}>{rows.length} record{rows.length === 1 ? '' : 's'}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={downloadCsv} style={{ display: 'flex', alignItems: 'center', gap: '5px', border: `1px solid ${LINE}`, background: 'white', borderRadius: '7px', padding: '6px 10px', fontSize: '11.5px', cursor: 'pointer', color: '#5C5646' }}>
              <Download size={12} /> CSV
            </button>
            <button onClick={downloadPdf} style={{ display: 'flex', alignItems: 'center', gap: '5px', border: 'none', background: accent, color: 'white', borderRadius: '7px', padding: '6px 10px', fontSize: '11.5px', cursor: 'pointer' }}>
              <Download size={12} /> Print
            </button>
            <button onClick={onClose} style={{ border: 'none', background: '#F3F1E8', borderRadius: '7px', padding: '6px 9px', cursor: 'pointer', color: '#5C5646', display: 'flex' }}>
              <X size={14} />
            </button>
          </div>
        </div>
        <div style={{ maxHeight: '58vh', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#FAF8F1', position: 'sticky', top: 0 }}>
                {columns.map((c) => (
                  <th key={c.key} style={{ padding: '9px 12px', fontSize: '10.5px', letterSpacing: '0.05em', color: '#8A8370', textAlign: 'left', borderBottom: `1px solid ${LINE}` }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={columns.length} style={{ padding: '22px', textAlign: 'center', color: '#9C9585' }}>No records this month.</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
                  {columns.map((c) => (
                    <td key={c.key} style={{ padding: '9px 12px', color: INK }}>{r[c.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Live monthly pulse — packed, Finished-Goods-added, and items-added,
// each recomputed straight off real data (no separate "totals" table to
// keep in sync): both "added" figures come from every item's own
// movement history (the same ledger Warehouse Inventory already writes
// to on every add/edit) — this used to also show "Total Dispatched",
// but a quantity decrease in that history is just this simple Add/Edit
// form going down (a correction, a re-count...), not proof something
// actually left the building to a party, so it's been replaced with
// Finished-Goods-Added instead. Real dispatch tracking lives in the
// register's own Dispatch Record (Issued column against a Particulars/
// party name). Both "added" totals are a count of add-events rather
// than a summed quantity, since different articles are stocked in
// different units. Packed comes from Production's Daily Packing log.
// Realtime subscriptions on both source tables mean a new entry ticks
// the tiles up without a reload; `inventory` itself is already realtime
// from the parent.
function WarehouseReportsDashboard({ inventory }) {
  const [packedRows, setPackedRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openTile, setOpenTile] = useState(null); // 'packed' | 'fgAdded' | 'added' | null

  const loadMonthly = useCallback(async () => {
    const { data, error } = await supabase
      .from('production_packing_entries')
      .select('product_name, batch_number, packing_done, created_by, created_dept, created_at');
    if (!error) setPackedRows((data || []).filter((e) => isThisMonth(e.created_at)));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMonthly();
    const channel = supabase
      .channel(`wh-reports-dash-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_packing_entries' }, loadMonthly)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadMonthly]);

  const packedThisMonth = useMemo(() => packedRows.reduce((sum, e) => sum + Number(e.packing_done || 0), 0), [packedRows]);

  // Finished-Goods-Added/Items-Added — flattened straight off every
  // item's history for this month, in one pass, and reused both for the
  // tile totals and for what the detail modal lists when clicked.
  //
  // There used to be a "Total Dispatched This Month" tile here, counting
  // every Finished Goods decrease in an item's history. That wasn't
  // actually tracking dispatches — a decrease just means the qty on
  // Inventory's simple Add/Edit form went down (a correction, a re-count,
  // anything), not that it left the building to a party. Real dispatches
  // are tracked properly over in the register's Dispatch Record (which
  // reads the Issued column against a Particulars/party name). So this
  // tile instead counts Finished Goods being added — packed stock coming
  // into the warehouse — which is what a plain quantity increase here
  // genuinely means.
  const { addedRows, addedThisMonth, finishedGoodsAddedRows, finishedGoodsAddedThisMonth } = useMemo(() => {
    const added = [];
    const finishedGoodsAdded = [];
    let addedTotal = 0;
    let finishedGoodsAddedTotal = 0;
    inventory.forEach((item) => {
      const hist = Array.isArray(item.history) ? item.history : [];
      const isFinishedGoods = (item.category || 'General Items') === 'Finished Goods';
      hist.forEach((h) => {
        if (!isThisMonth(h.atISO || h.at)) return;
        const received = Number(h.quantityReceived || 0);
        if (received > 0) {
          // Counted as one "item added" event rather than summed by
          // quantity — different articles are stocked in different
          // units (kg, packs, litres...), so adding the raw numbers
          // together doesn't mean anything.
          const row = {
            product: item.name,
            batch: item.batch,
            category: item.category || 'General Items',
            qty: `${received} ${item.unit || ''}`.trim(),
            action: h.action || '',
            dept: h.dept || '',
            date: h.atISO || h.at ? formatDateTime(h.atISO || h.at) : '',
          };
          addedTotal += 1;
          added.push(row);
          if (isFinishedGoods) {
            finishedGoodsAddedTotal += 1;
            finishedGoodsAdded.push(row);
          }
        }
      });
    });
    return { addedRows: added, addedThisMonth: addedTotal, finishedGoodsAddedRows: finishedGoodsAdded, finishedGoodsAddedThisMonth: finishedGoodsAddedTotal };
  }, [inventory]);


  const detailColumns = [
    { key: 'product', label: 'Product' },
    { key: 'batch', label: 'Batch' },
    { key: 'category', label: 'Category' },
    { key: 'qty', label: 'Quantity' },
    { key: 'dept', label: 'Department' },
    { key: 'date', label: 'Date' },
  ];
  const packedColumns = [
    { key: 'product_name', label: 'Product' },
    { key: 'batch_number', label: 'Batch' },
    { key: 'packing_done', label: 'Packed' },
    { key: 'created_dept', label: 'Department' },
    { key: 'created_by', label: 'Logged By' },
    { key: 'created_at', label: 'Date', format: (v) => formatDateTime(v) },
  ];
  const packedRowsFormatted = useMemo(
    () => packedRows.map((r) => ({ ...r, created_at: formatDateTime(r.created_at) })),
    [packedRows]
  );

  return (
    <>
      <WarehouseMonthlyStylesMemo />
      <div className="wb-pulse-grid">
        <WarehouseMonthlyTile icon={Boxes} label="Total Packed This Month" value={packedThisMonth} loading={loading} onClick={() => setOpenTile('packed')}index={0} />
        <WarehouseMonthlyTile icon={PackageSearch} label="Total Added to Finished Goods This Month" value={finishedGoodsAddedThisMonth} loading={false} onClick={() => setOpenTile('fgAdded')}index={1} />
        <WarehouseMonthlyTile icon={ArrowDownCircle} label="Total Items Added This Month" value={addedThisMonth} loading={false} onClick={() => setOpenTile('added')}index={2} />
      </div>

      {openTile === 'packed' && (
        <WarehouseMonthlyDetailModal
          title="Total Packed This Month"
          accent="#0F9C89"
          columns={packedColumns.map(({ key, label }) => ({ key, label }))}
          rows={packedRowsFormatted}
          filenameBase="packed-this-month"
          onClose={() => setOpenTile(null)}
        />
      )}
      {openTile === 'fgAdded' && (
        <WarehouseMonthlyDetailModal
          title="Total Added to Finished Goods This Month"
          accent="#0F9C89"
          columns={detailColumns}
          rows={finishedGoodsAddedRows}
          filenameBase="added-to-finished-goods-this-month"
          onClose={() => setOpenTile(null)}
        />
      )}
      {openTile === 'added' && (
        <WarehouseMonthlyDetailModal
          title="Total Items Added This Month"
          accent="#0F9C89"
          columns={detailColumns}
          rows={addedRows}
          filenameBase="added-to-inventory-this-month"
          onClose={() => setOpenTile(null)}
        />
      )}
    </>
  );
}

// Scoped styles for the register page — the ruled "bound ledger" look
// from the physical book (blue rules, boxed columns, cream paper) plus
// the gentle entrance animations: the page itself lifts in like a book
// opening, each ledger line inks in one after the other, and the blank
// ruled lines below fade in last.
function WarehouseRegisterStyles() {
  return (
    <style>{`
      .wb-reg-shell {
        animation: wbRegOpen 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
        transform-origin: left center;
      }
      @keyframes wbRegOpen {
        0%   { opacity: 0; transform: perspective(1400px) rotateY(-9deg) translateY(14px); }
        100% { opacity: 1; transform: perspective(1400px) rotateY(0deg) translateY(0); }
      }
      .wb-reg-title {
        animation: wbRegFade 700ms ease-out 120ms both;
      }
      .wb-reg-fields > div {
        animation: wbRegFade 520ms ease-out both;
      }
      .wb-reg-fields > div:nth-child(1) { animation-delay: 160ms; }
      .wb-reg-fields > div:nth-child(2) { animation-delay: 220ms; }
      .wb-reg-fields > div:nth-child(3) { animation-delay: 280ms; }
      .wb-reg-fields > div:nth-child(4) { animation-delay: 340ms; }
      .wb-reg-fields > div:nth-child(5) { animation-delay: 400ms; }
      @keyframes wbRegFade {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* The book itself */
      .wb-reg-book {
        position: relative;
        background:
          linear-gradient(90deg, rgba(140,106,46,0.10) 0%, rgba(140,106,46,0) 34px),
          #FCFAF3;
        border: 1px solid #9FB0D4;
        box-shadow: 0 16px 38px rgba(4,7,17,0.14), inset 0 0 0 4px #FCFAF3, inset 0 0 0 5px #C9D4EA;
        border-radius: 3px;
      }

      /* Ruled table — thin indigo rules exactly like the printed book */
      .wb-reg-table { width: 100%; border-collapse: collapse; }
      .wb-reg-table th,
      .wb-reg-table td {
        border: 1px solid #5C79B8;
        padding: 0 7px;
        height: 30px;
        font-size: 12.5px;
        color: #0A1220;
        vertical-align: middle;
      }
      .wb-reg-table thead th {
        background: #F2F4FA;
        font-family: Georgia, 'Times New Roman', serif;
        font-weight: 700;
        font-size: 11px;
        letter-spacing: 0.14em;
        text-align: center;
        height: 34px;
        white-space: nowrap;
      }
      .wb-reg-table thead th.wb-reg-qty { letter-spacing: 0.3em; }
      .wb-reg-blank td { height: 28px; }
      .wb-reg-blank td:empty::after { content: ''; display: block; }

      /* A filled ledger line inks itself in, then highlights on hover */
      .wb-reg-row {
        animation: wbRowInk 420ms ease-out both;
        transition: background 160ms ease;
      }
      .wb-reg-row:hover { background: rgba(92,121,184,0.09); }
      @keyframes wbRowInk {
        from { opacity: 0; transform: translateX(-10px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      .wb-reg-blank { animation: wbRegFade 500ms ease-out both; }

      .wb-reg-actions { opacity: 0.25; transition: opacity 160ms ease; }
      .wb-reg-row:hover .wb-reg-actions { opacity: 1; }

      /* Underlined header fields, like the printed blanks on the page */
      .wb-reg-blank-line {
        display: inline-block;
        min-width: 90px;
        border-bottom: 1px solid #0A1220;
        padding: 0 8px 1px;
        font-weight: 600;
      }

      .wb-reg-btn {
        transition: transform 140ms ease, box-shadow 140ms ease;
      }
      .wb-reg-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(4,7,17,0.14); }

      @media print {
        .wb-reg-noprint { display: none !important; }
        .wb-reg-shell, .wb-reg-book { animation: none !important; box-shadow: none !important; }
      }
      @media (prefers-reduced-motion: reduce) {
        .wb-reg-shell, .wb-reg-title, .wb-reg-fields > div, .wb-reg-row, .wb-reg-blank {
          animation: none !important;
        }
      }
    `}</style>
  );
}

// The register itself — opened as a full, standalone page (not a side
// panel) once an article is picked. Laid out line-for-line like the
// bound "Stock (Inward & Outward) Register" book Warehouse keeps on the
// shelf: the same title, the same Article / Packing–Units / Maximum
// level / Minimum Level / Rate blanks across the top, and the same
// column run — DATE · PARTICULARS · FOLIO · QUANTITY (RECEIPTS /
// ISSUED / BALANCE) · REMARKS. Every row is typed in by hand; nothing
// is derived from stock history. Read-only for everyone except
// Warehouse, who can add, edit, or remove a row.
//
// Row shape: { date, particulars, folio, receipts, issued, balance,
// remarks }. Rows saved before the columns were renamed used `opening`
// where `receipts` now sits, so that older key is still read as a
// fallback and nothing already in the book is lost.
function WarehouseRegisterPage({ user, item, onEditInventory, onBack }) {
  const canManage = canManageInventory(user);
  const isMobile = useIsMobile();
  const [headerEdit, setHeaderEdit] = useState(false);
  const [headerForm, setHeaderForm] = useState({ max_stock: item.max_stock ?? '', rate: item.rate ?? '' });
  const [rows, setRows] = useState(Array.isArray(item.ledger_rows) ? item.ledger_rows : []);
  const [editingIdx, setEditingIdx] = useState(null);
  const [rowForm, setRowForm] = useState({ date: '', particulars: '', folio: '', receipts: '', issued: '', balance: '', remarks: '' });
  const [adding, setAdding] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const printRef = useRef(null);

  // Keep in sync if the underlying item record changes elsewhere (e.g.
  // another Warehouse user editing the same register live).
  useEffect(() => {
    setRows(Array.isArray(item.ledger_rows) ? item.ledger_rows : []);
  }, [item.ledger_rows]);

  const blankRow = { date: '', particulars: '', folio: '', receipts: '', issued: '', balance: '', remarks: '' };

  // Older rows stored the first quantity column as `opening`.
  const receiptsOf = (r) => (r.receipts !== undefined && r.receipts !== '' ? r.receipts : r.opening ?? '');

  // Date filter — rows keep type="date" values (yyyy-mm-dd), which sort
  // and compare lexicographically, so plain string comparison is enough.
  // Filtering never touches `rows` itself (edit/delete still act on the
  // real, unfiltered array via each row's original index) — it's purely
  // a view over what's already saved.
  const filteredRows = useMemo(() => {
    return rows
      .map((r, idx) => ({ ...r, idx }))
      .filter((r) => {
        if (dateFrom && (!r.date || r.date < dateFrom)) return false;
        if (dateTo && (!r.date || r.date > dateTo)) return false;
        return true;
      });
  }, [rows, dateFrom, dateTo]);

  const hasDateFilter = !!(dateFrom || dateTo);

  // The printed book always shows a full page of ruled lines whether or
  // not anything is written on them, so pad out to a minimum page with
  // empty lines and keep the look identical when the register is new.
  const MIN_LINES = isMobile ? 10 : 18;
  const blankLineCount = Math.max(0, MIN_LINES - filteredRows.length);

  const persistRows = async (nextRows, extra = {}) => {
    setSaving(true);
    setSaveError('');
    const res = await onEditInventory(item.id, { ledger_rows: nextRows, ...extra });
    setSaving(false);
    if (res?.error) {
      setSaveError(res.error.message || 'Failed to save. Ask an admin to add the ledger_rows column on inventory.');
      return false;
    }
    setRows(nextRows);
    return true;
  };

  // Turns a net quantity change from the register into the same shape
  // Warehouse Inventory's own qty edits already produce — a new `qty`
  // plus one more `history` entry — so a register line merges straight
  // into the item's real stock and shows up in its History exactly like
  // any other movement (tagged `source: 'register'` so it can carry its
  // own little "Via Register" badge there instead of looking typed in
  // by hand). Positive delta = stock goes up (Receipts), negative =
  // stock goes down (Issued). Returns {} (nothing to merge) when the
  // line didn't actually change the quantity.
  const buildQtyMerge = (deltaQty, actionLabel, remarks, folio) => {
    if (!deltaQty) return {};
    const previousQty = Number(item.qty || 0);
    const newQty = previousQty + deltaQty;
    const historyEntry = {
      dept: user.dept,
      user: user.name,
      action: actionLabel,
      at: now(),
      atISO: nowISO(),
      previousQty,
      newQty,
      quantityReceived: deltaQty > 0 ? deltaQty : 0,
      quantityIssued: deltaQty < 0 ? -deltaQty : 0,
      note: remarks || '',
      // The register's FOLIO column, carried across so the item's
      // movement history (what Warehouse Inventory calls the item's
      // ledger) can show Particulars together with Folio, exactly as
      // they sit side by side on the register itself — see the
      // rendering of h.folio next to h.action in InventoryHistoryModal.
      folio: folio || '',
      source: 'register',
    };
    return {
      qty: newQty,
      history: [...(Array.isArray(item.history) ? item.history : []), historyEntry],
    };
  };

  const startAddRow = () => {
    if (!canManage) return;
    setRowForm(blankRow);
    setEditingIdx(null);
    setAdding(true);
  };

  const startEditRow = (idx) => {
    if (!canManage) return;
    const existing = rows[idx] || {};
    if (isRegisterRowLocked(existing)) {
      alert(`This line is from ${monthLabelOf(monthKeyOf(existing.date))} and is locked — only lines dated this month can be edited.`);
      return;
    }
    setRowForm({ ...blankRow, ...existing, receipts: receiptsOf(existing) });
    setEditingIdx(idx);
    setAdding(true);
  };

  const saveRow = async () => {
    if (!canManage) return;
    // Second layer: refuse the save outright if editing a line that's
    // outside this month, even if it were somehow reached without the
    // hidden Edit button (e.g. a stale form left open across midnight).
    if (editingIdx != null && isRegisterRowLocked(rows[editingIdx])) {
      setSaveError(`This line is from ${monthLabelOf(monthKeyOf(rows[editingIdx].date))} and is locked — only lines dated this month can be edited.`);
      return;
    }
    const cleaned = { ...rowForm };
    delete cleaned.opening;
    const next = [...rows];
    if (editingIdx == null) next.push(cleaned);
    else next[editingIdx] = cleaned;

    // Merge this line's Receipts/Issued into the real Warehouse
    // Inventory quantity. Only the *change* versus what this same line
    // held before (0/0 for a brand-new line) is applied, so saving an
    // edit only moves stock by however much the numbers actually moved
    // — re-saving an unrelated field on an old line doesn't double-count
    // its quantity.
    const prevReceipts = editingIdx != null ? Number(receiptsOf(rows[editingIdx]) || 0) : 0;
    const prevIssued = editingIdx != null ? Number(rows[editingIdx].issued || 0) : 0;
    const newReceipts = Number(cleaned.receipts || 0);
    const newIssued = Number(cleaned.issued || 0);
    const netDelta = (newReceipts - prevReceipts) - (newIssued - prevIssued);
    const actionLabel = `${editingIdx == null ? 'Register line added' : 'Register line updated'}${cleaned.particulars ? ' — ' + cleaned.particulars : ''}`;

    const ok = await persistRows(next, buildQtyMerge(netDelta, actionLabel, cleaned.remarks, cleaned.folio));
    if (ok) {
      setAdding(false);
      setEditingIdx(null);
      setRowForm(blankRow);
    }
  };

  const deleteRow = async (idx) => {
    if (!canManage) return;
    const existing = rows[idx];
    if (isRegisterRowLocked(existing)) {
      alert(`This line is from ${monthLabelOf(monthKeyOf(existing.date))} and is locked — only lines dated this month can be removed.`);
      return;
    }
    if (!window.confirm('Remove this line from the register?')) return;
    // Reverse whatever this line moved, so deleting a mistaken Issued or
    // Receipts entry hands the quantity back correctly instead of
    // leaving Warehouse Inventory out of sync with the register.
    const reversedDelta = Number(existing.issued || 0) - Number(receiptsOf(existing) || 0);
    const actionLabel = `Register line removed${existing.particulars ? ' — ' + existing.particulars : ''}`;
    await persistRows(rows.filter((_, i) => i !== idx), buildQtyMerge(reversedDelta, actionLabel, existing.remarks, existing.folio));
  };

  const saveHeader = async () => {
    if (!canManage) return;
    setSaving(true);
    setSaveError('');
    const res = await onEditInventory(item.id, {
      max_stock: headerForm.max_stock === '' ? null : Number(headerForm.max_stock),
      rate: headerForm.rate === '' ? null : Number(headerForm.rate),
    });
    setSaving(false);
    if (res?.error) {
      setSaveError(res.error.message || 'Failed to save.');
      return;
    }
    setHeaderEdit(false);
  };

  const downloadCsv = () => {
    csvExport(
      `${(item.name || 'register').replace(/\s+/g, '-').toLowerCase()}-stock-register.csv`,
      rows.map((r) => ({ ...r, receipts: receiptsOf(r), date: r.date ? formatFullDate(r.date) : '' })),
      [
        { key: 'date', label: 'Date' },
        { key: 'particulars', label: 'Particulars' },
        { key: 'folio', label: 'Folio' },
        { key: 'receipts', label: 'Receipts' },
        { key: 'issued', label: 'Issued' },
        { key: 'balance', label: 'Balance' },
        { key: 'remarks', label: 'Remarks' },
      ]
    );
  };

  // Print / save-as-PDF — deliberately a plain black-and-white copy of
  // the same page so a printout is indistinguishable from a page torn
  // out of the book, filler lines and all.
  const downloadPdf = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const esc = (v) => String(v ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const printable = filteredRows.length ? filteredRows : rows.map((r, idx) => ({ ...r, idx }));
    const bodyRows = printable
      .map(
        (r) => `<tr>
          <td>${r.date ? esc(formatFullDate(r.date)) : ''}</td>
          <td class="l">${esc(r.particulars)}</td>
          <td>${esc(r.folio)}</td>
          <td>${esc(receiptsOf(r))}</td>
          <td>${esc(r.issued)}</td>
          <td>${esc(r.balance)}</td>
          <td class="l">${esc(r.remarks)}</td>
        </tr>`
      )
      .join('');
    const fillerCount = Math.max(0, 24 - printable.length);
    const filler = Array.from({ length: fillerCount })
      .map(() => '<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>')
      .join('');
    win.document.write(`
      <html>
        <head>
          <title>${esc(item.name)} — Stock Register</title>
          <style>
            @page { size: A4 portrait; margin: 14mm; }
            body { font-family: Georgia, 'Times New Roman', serif; color: #000; }
            h1 { text-align: center; font-size: 19px; letter-spacing: 0.06em; margin: 0 0 10px; }
            .fields { font-size: 13px; margin-bottom: 12px; }
            .fields p { margin: 6px 0; }
            .ln { border-bottom: 1px solid #000; padding: 0 10px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; height: 22px; padding: 0 5px; font-size: 11.5px; text-align: center; }
            th { letter-spacing: 0.12em; font-size: 10.5px; }
            td.l, th.l { text-align: left; }
          </style>
        </head>
        <body>
          <h1>STOCK (INWARD &amp; OUTWARD) REGISTER</h1>
          <div class="fields">
            <p>Article <span class="ln">${esc(item.name)}</span>
               &nbsp;&nbsp; Packing / Units <span class="ln">${esc(item.unit || '')}</span></p>
            <p>Maximum level <span class="ln">${esc(item.max_stock ?? '')}</span>
               &nbsp;&nbsp; Minimum Level <span class="ln">${esc(item.min_stock ?? '')}</span>
               &nbsp;&nbsp; Rate <span class="ln">${esc(item.rate ?? '')}</span></p>
          </div>
          <table>
            <thead>
              <tr>
                <th rowspan="2">DATE</th>
                <th rowspan="2" class="l">PARTICULARS</th>
                <th rowspan="2">FOLIO</th>
                <th colspan="3">QUANTITY</th>
                <th rowspan="2" class="l">REMARKS</th>
              </tr>
              <tr><th>RECEIPTS</th><th>ISSUED</th><th>BALANCE</th></tr>
            </thead>
            <tbody>${bodyRows}${filler}</tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const fieldLine = (label, value) => (
    <div style={{ whiteSpace: 'nowrap' }}>
      <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic', fontSize: '13px' }}>{label}</span>
      <span className="wb-reg-blank-line">{value === '' || value == null ? '\u00A0' : value}</span>
    </div>
  );

  return (
    <div className="wb-page-padding" style={{ padding: isMobile ? '16px' : '28px 32px' }}>
      <WarehouseRegisterStylesMemo />
      {/* Shares the exact aurora stylesheet the Warehouse Reports list
          page uses (same blob/chip/title classes), so arriving at one
          article's register feels like the same product as the page you
          just clicked in from — while the actual ledger book below stays
          completely untouched. That book is a deliberate, print-tested
          facsimile of the physical bound register Warehouse keeps on the
          shelf, and its "Download / Print" button already opens a fully
          separate, isolated print window (see downloadPdf below) — so
          restyling this on-screen shell has zero effect on what actually
          gets printed for records. */}
      <WarehouseReportsAuroraStyles />

      <div className="wb-wr-stage wb-reg-noprint" style={{ marginBottom: '18px' }}>
        <span className="wb-wr-blob wb-wr-blob-1" />
        <span className="wb-wr-blob wb-wr-blob-2" />
        <span className="wb-wr-blob wb-wr-blob-3" />
        <span className="wb-wr-blob wb-wr-blob-4" />
        <div className="wb-wr-hero-grid" />
        <span className="wb-wr-hero-beam" />
        <div className="wb-wr-hero-inner">
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              background: 'none',
              color: '#7CF3E0',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              marginBottom: '14px',
            }}
          >
            <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to Warehouse Reports
          </button>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '10px',
            }}
          >
            <div>
              <h1 className="wb-serif wb-wr-title" style={{ fontSize: isMobile ? '21px' : '26px' }}>
                {item.name}
              </h1>
              <p className="wb-wr-sub" style={{ maxWidth: '520px' }}>
                {canManage
                  ? 'Filled in manually by Warehouse. Everyone else can read this page, view-only. Lines from a previous month are locked — only this month\u2019s lines can be edited or removed.'
                  : 'Read-only — filled in and maintained by the Warehouse department.'}
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                {item.unit && <span className="wb-wr-chip">Packing / Units: {item.unit}</span>}
                {(item.max_stock ?? '') !== '' && <span className="wb-wr-chip">Max level: {item.max_stock}</span>}
                {(item.rate ?? '') !== '' && <span className="wb-wr-chip wb-wr-chip-gold">Rate: {item.rate}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={downloadCsv} className="wb-wr-tab" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Download size={13} /> CSV</span>
              </button>
              <button onClick={downloadPdf} className="wb-wr-tab wb-wr-tab-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Download size={13} /> Download / Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="wb-reg-shell">
        <div
          ref={printRef}
          className="wb-reg-book"
          style={{ padding: isMobile ? '16px 12px' : '26px 30px' }}
        >
          {saveError && <p className="wb-reg-noprint" style={{ color: RED, fontSize: '12px', marginTop: 0, marginBottom: '10px' }}>{saveError}</p>}

          {/* Title — same wording, weight and spacing as the printed page */}
          <h2
            className="wb-reg-title"
            style={{
              margin: '0 0 14px',
              textAlign: 'center',
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: 700,
              fontSize: isMobile ? '15px' : '21px',
              letterSpacing: '0.04em',
              color: '#0A1220',
            }}
          >
            STOCK (INWARD &amp; OUTWARD) REGISTER
          </h2>

          {/* Header blanks: Article / Packing–Units, then Maximum level /
              Minimum Level / Rate — the same two lines as the book. */}
          <div
            className="wb-reg-fields"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: isMobile ? '10px 16px' : '10px 34px',
              marginBottom: '16px',
              alignItems: 'center',
            }}
          >
            {fieldLine('Article', item.name)}
            {fieldLine('Packing / Units', item.unit || '')}
            {fieldLine('Maximum level', headerEdit ? '' : item.max_stock ?? '')}
            {fieldLine('Minimum Level', item.min_stock ?? '')}
            {fieldLine('Rate', headerEdit ? '' : item.rate ?? '')}
            {canManage && !headerEdit && (
              <button
                onClick={() => setHeaderEdit(true)}
                className="wb-reg-noprint"
                title="Edit maximum level / rate"
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#0F9C89' }}
              >
                <Pencil size={13} />
              </button>
            )}
          </div>

          {canManage && headerEdit && (
            <div className="wb-reg-noprint" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
              <input type="number" value={headerForm.max_stock} onChange={(e) => setHeaderForm({ ...headerForm, max_stock: e.target.value })} placeholder="Maximum level" style={{ width: '110px', padding: '5px 7px', fontSize: '12px', border: `1px solid ${LINE}`, borderRadius: '6px' }} />
              <input type="number" value={headerForm.rate} onChange={(e) => setHeaderForm({ ...headerForm, rate: e.target.value })} placeholder="Rate" style={{ width: '90px', padding: '5px 7px', fontSize: '12px', border: `1px solid ${LINE}`, borderRadius: '6px' }} />
              <button onClick={saveHeader} disabled={saving} style={{ border: 'none', background: '#0F9C89', color: 'white', borderRadius: '6px', padding: '5px 12px', fontSize: '11.5px', cursor: 'pointer' }}>Save</button>
              <button onClick={() => setHeaderEdit(false)} style={{ border: 'none', background: 'none', color: '#9C9585', fontSize: '11.5px', cursor: 'pointer' }}>Cancel</button>
            </div>
          )}

          <div className="wb-reg-noprint" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <Filter size={13} color="#8A8370" />
            <span style={{ fontSize: '11.5px', color: '#8A8370' }}>Filter by date:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ padding: '5px 7px', fontSize: '12px', border: `1px solid ${LINE}`, borderRadius: '6px' }}
            />
            <span style={{ fontSize: '11.5px', color: '#8A8370' }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ padding: '5px 7px', fontSize: '12px', border: `1px solid ${LINE}`, borderRadius: '6px' }}
            />
            {hasDateFilter && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                style={{ border: 'none', background: 'none', color: '#0F9C89', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="wb-reg-table" style={{ minWidth: isMobile ? '680px' : 'auto' }}>
              <colgroup>
                <col style={{ width: '11%' }} />
                <col style={{ width: '30%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: canManage ? '19%' : '24%' }} />
                {canManage && <col style={{ width: '5%' }} />}
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan={2}>DATE</th>
                  <th rowSpan={2}>PARTICULARS</th>
                  <th rowSpan={2}>FOLIO</th>
                  <th colSpan={3} className="wb-reg-qty">QUANTITY</th>
                  <th rowSpan={2}>REMARKS</th>
                  {canManage && <th rowSpan={2} className="wb-reg-noprint" />}
                </tr>
                <tr>
                  <th>RECEIPTS</th>
                  <th>ISSUED</th>
                  <th>BALANCE</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r, i) => (
                  <tr key={r.idx} className="wb-reg-row" style={{ animationDelay: `${Math.min(i, 14) * 45 + 260}ms` }}>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{r.date ? formatFullDate(r.date) : ''}</td>
                    {/* Lines posted automatically by a Warehouse Inventory
                        transaction carry source:'inventory' — badged so the
                        book plainly shows what was auto-posted from a stock
                        movement versus what someone typed in by hand. */}
                    <td>
                      {r.particulars || ''}
                      {r.source === 'inventory' && (
                        <span
                          className="wb-reg-noprint"
                          title={`Posted automatically from a Warehouse Inventory transaction${r.by ? ` by ${r.by}` : ''}`}
                          style={{
                            marginLeft: 7,
                            fontSize: 9,
                            letterSpacing: '0.08em',
                            padding: '1px 6px',
                            borderRadius: 999,
                            border: '1px solid rgba(10,18,32,0.18)',
                            color: '#5C5646',
                            verticalAlign: 'middle',
                            fontFamily: 'system-ui, sans-serif',
                          }}
                        >
                          AUTO
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>{r.folio || ''}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{receiptsOf(r)}</td>
                    <td style={{ textAlign: 'center', color: RED }}>{r.issued || ''}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.balance || ''}</td>
                    <td>{r.remarks || ''}</td>
                    {canManage && (
                      <td className="wb-reg-noprint" style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {isRegisterRowLocked(r) ? (
                          <span title={`Locked — ${monthLabelOf(monthKeyOf(r.date))}`} style={{ color: '#B0AA96', display: 'inline-flex' }}>
                            <Lock size={12} />
                          </span>
                        ) : (
                        <span className="wb-reg-actions">
                          <button onClick={() => startEditRow(r.idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#0F9C89', marginRight: '3px' }} title="Edit">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => deleteRow(r.idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: RED }} title="Delete">
                            <Trash2 size={12} />
                          </button>
                        </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}

                {/* Ruled but unwritten lines, so a new register still
                    looks like the open page of the book. */}
                {Array.from({ length: blankLineCount }).map((_, i) => (
                  <tr key={`blank-${i}`} className="wb-reg-blank" style={{ animationDelay: `${Math.min(i, 14) * 22 + 320}ms` }}>
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                    {canManage && <td className="wb-reg-noprint" />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length > 0 && filteredRows.length === 0 && (
            <p className="wb-reg-noprint" style={{ fontSize: '12px', color: '#9C9585', marginTop: '10px', textAlign: 'center' }}>
              No entries in that date range.
            </p>
          )}
          {rows.length === 0 && (
            <p className="wb-reg-noprint" style={{ fontSize: '12px', color: '#9C9585', marginTop: '10px', textAlign: 'center' }}>
              {canManage ? 'Empty — add the first line below.' : 'Warehouse hasn\u2019t filled this in yet.'}
            </p>
          )}

          {canManage && (
            <div className="wb-reg-noprint" style={{ marginTop: '14px' }}>
              {!adding ? (
                <button onClick={startAddRow} className="wb-reg-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid #0F9C89`, color: '#0F9C89', background: 'white', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  <Plus size={13} /> Add row
                </button>
              ) : (
                <div style={{ border: `1px solid ${LINE}`, borderRadius: '10px', padding: '12px', background: 'white' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
                    <input type="date" value={rowForm.date} onChange={(e) => setRowForm({ ...rowForm, date: e.target.value })} style={{ padding: '6px', fontSize: '12px', border: `1px solid ${LINE}` }} />
                    <input value={rowForm.folio} onChange={(e) => setRowForm({ ...rowForm, folio: e.target.value })} placeholder="Folio" style={{ padding: '6px', fontSize: '12px', border: `1px solid ${LINE}` }} />
                    <input type="number" value={rowForm.receipts} onChange={(e) => setRowForm({ ...rowForm, receipts: e.target.value })} placeholder="Receipts" style={{ padding: '6px', fontSize: '12px', border: `1px solid ${LINE}` }} />
                    <input type="number" value={rowForm.issued} onChange={(e) => setRowForm({ ...rowForm, issued: e.target.value })} placeholder="Issued" style={{ padding: '6px', fontSize: '12px', border: `1px solid ${LINE}` }} />
                    {/* Raw Material and Packaging Material are consumed
                        into making a specific finished product — so
                        their Particulars line is naming which product
                        the stock was issued for. That's exactly what
                        ProductNameAutocomplete already exists to get
                        right elsewhere (Warehouse Inventory's Item Name,
                        Packing Status's Product Name): it searches the
                        same ~180-product master catalogue and locks in
                        the registered spelling with one click, instead
                        of leaving it to be typed fresh every time.
                        Finished Goods / General Items keep the plain
                        text box — their Particulars usually names a
                        customer or party, which isn't in that
                        catalogue. */}
                    {(item.category === 'Raw Material' || item.category === 'Packaging Material') ? (
                      <div style={{ gridColumn: isMobile ? '1 / -1' : 'span 2' }}>
                        <ProductNameAutocomplete
                          value={rowForm.particulars}
                          onChange={(v) => setRowForm({ ...rowForm, particulars: v })}
                          placeholder="Particulars — search the product…"
                        />
                      </div>
                    ) : (
                      <input value={rowForm.particulars} onChange={(e) => setRowForm({ ...rowForm, particulars: e.target.value })} placeholder="Particulars" style={{ padding: '6px', fontSize: '12px', border: `1px solid ${LINE}`, gridColumn: isMobile ? '1 / -1' : 'span 2' }} />
                    )}
                    <input type="number" value={rowForm.balance} onChange={(e) => setRowForm({ ...rowForm, balance: e.target.value })} placeholder="Balance" style={{ padding: '6px', fontSize: '12px', border: `1px solid ${LINE}` }} />
                    <input value={rowForm.remarks} onChange={(e) => setRowForm({ ...rowForm, remarks: e.target.value })} placeholder="Remarks" style={{ padding: '6px', fontSize: '12px', border: `1px solid ${LINE}`, gridColumn: isMobile ? '1 / -1' : 'span 2' }} />
                  </div>
                  <button onClick={saveRow} disabled={saving} style={{ border: 'none', background: '#0F9C89', color: 'white', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', marginRight: '8px' }}>
                    {editingIdx == null ? 'Save row' : 'Save changes'}
                  </button>
                  <button onClick={() => { setAdding(false); setEditingIdx(null); }} style={{ border: 'none', background: 'none', color: '#9C9585', fontSize: '12px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =======================================================================
// DISPATCH RECORD — a separate report, one date-range level up from the
// per-article register. Instead of opening one article's ledger, you
// pick a date range for the whole section (Finished Goods, or Raw
// Material / Packaging Material) and get every line that was ISSUED out
// in that window, across every article in the section, in one place.
//
// Nothing new is typed in for this — it's read straight out of the same
// `ledger_rows` Warehouse already fills in on each article's register.
// The "where it went" column is whatever Warehouse wrote in that row's
// Particulars box (e.g. a party name for a Finished Goods dispatch, or
// which batch/product a raw material was issued to) — this report just
// collects those Particulars across articles and lines them up against
// a date range, instead of you opening each article's register one at
// a time. Rows with nothing in Issued are movements in, not dispatches,
// so they're left out of this view entirely.
//
// Deliberately a completely different visual language from the ruled
// ledger-book register: a modern animated timeline/card report instead
// of blue rules on cream paper, so the two are never confused for the
// same document.
// =======================================================================

// A small fixed palette, picked deterministically from the destination
// text (party name / usage note) so the same destination always lands
// on the same colour across the whole report — purely a visual cue to
// help the eye group repeat destinations, not a stored value.
const DISPATCH_PALETTE = [
  { c: '#8B7CF6', bg: 'rgba(139,124,246,0.12)' },
  { c: '#3FBE8E', bg: 'rgba(63,190,142,0.12)' },
  { c: '#E0A526', bg: 'rgba(224,165,38,0.14)' },
  { c: '#4FA7E0', bg: 'rgba(79,167,224,0.12)' },
  { c: '#E0616B', bg: 'rgba(224,97,107,0.12)' },
  { c: '#2FBFB0', bg: 'rgba(47,191,176,0.12)' },
  { c: '#C97BC9', bg: 'rgba(201,123,201,0.12)' },
];
function dispatchColorFor(label) {
  const s = String(label || '');
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return DISPATCH_PALETTE[hash % DISPATCH_PALETTE.length];
}

function DispatchRecordStyles() {
  return (
    <style>{`
      .wb-disp-page { animation: wbDispPageIn 480ms cubic-bezier(0.22, 1, 0.36, 1) both; }
      @keyframes wbDispPageIn {
        from { opacity: 0; transform: translateX(24px); }
        to   { opacity: 1; transform: translateX(0); }
      }

      .wb-disp-hero {
        position: relative;
        overflow: hidden;
        border-radius: 16px;
        padding: 22px 26px;
        color: white;
        margin-bottom: 18px;
      }
      .wb-disp-hero-glow {
        position: absolute;
        top: -60%;
        right: -10%;
        width: 260px;
        height: 260px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 70%);
        animation: wbDispGlow 4.5s ease-in-out infinite;
      }
      @keyframes wbDispGlow {
        0%, 100% { transform: scale(0.85) translateY(0); opacity: 0.6; }
        50% { transform: scale(1.15) translateY(10px); opacity: 1; }
      }
      .wb-disp-hero-icon {
        position: relative;
        z-index: 1;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.18);
        backdrop-filter: blur(2px);
        animation: wbDispIconPulse 2.6s ease-in-out infinite;
      }
      @keyframes wbDispIconPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.08); }
      }

      .wb-disp-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin-bottom: 20px;
      }
      .wb-disp-stat {
        background: white;
        border: 1px solid ${LINE};
        border-radius: 12px;
        padding: 14px 16px;
        animation: wbDispStatIn 460ms ease-out both;
      }
      .wb-disp-stat:nth-child(1) { animation-delay: 60ms; }
      .wb-disp-stat:nth-child(2) { animation-delay: 120ms; }
      .wb-disp-stat:nth-child(3) { animation-delay: 180ms; }
      .wb-disp-stat:nth-child(4) { animation-delay: 240ms; }
      @keyframes wbDispStatIn {
        from { opacity: 0; transform: translateY(8px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      .wb-disp-timeline { position: relative; padding-left: 26px; }
      .wb-disp-timeline::before {
        content: '';
        position: absolute;
        left: 7px;
        top: 6px;
        bottom: 6px;
        width: 2px;
        background: linear-gradient(180deg, currentColor 0%, rgba(0,0,0,0.06) 100%);
        opacity: 0.25;
      }
      .wb-disp-card-wrap { position: relative; margin-bottom: 14px; animation: wbDispCardIn 420ms cubic-bezier(0.22,1,0.36,1) both; }
      @keyframes wbDispCardIn {
        from { opacity: 0; transform: translateX(16px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      .wb-disp-dot {
        position: absolute;
        left: -26px;
        top: 16px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 0 2px currentColor;
      }
      .wb-disp-card {
        background: white;
        border: 1px solid ${LINE};
        border-left: 4px solid currentColor;
        border-radius: 12px;
        padding: 14px 16px;
        transition: transform 160ms ease, box-shadow 160ms ease;
      }
      .wb-disp-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 22px rgba(4,7,17,0.10);
      }
      .wb-disp-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
      }
      .wb-disp-empty {
        text-align: center;
        padding: 46px 20px;
        color: #9C9585;
        animation: wbDispStatIn 500ms ease-out both;
      }
      .wb-disp-empty-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #F3F1E8;
        margin-bottom: 12px;
        animation: wbDispIconPulse 2.6s ease-in-out infinite;
      }

      .wb-disp-launcher {
        position: relative;
        overflow: hidden;
        border-radius: 14px;
        padding: 14px 16px;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
        animation: wbDispStatIn 460ms ease-out both;
      }
      .wb-disp-launcher-shimmer {
        position: absolute;
        top: 0; left: -40%;
        width: 40%; height: 100%;
        background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent);
        /* PERFORMANCE FIX: was animating the "left" property, which
           forces a layout reflow on every frame for as long as this
           plays (infinite). transform: translateX() is GPU-composited
           and skips layout entirely — same visual sweep, none of the
           reflow cost. */
        animation: wbDispShimmer 3.4s ease-in-out infinite;
        will-change: transform;
      }
      @keyframes wbDispShimmer {
        0% { transform: translateX(0%); }
        60%, 100% { transform: translateX(400%); }
      }
      .wb-disp-go-btn {
        transition: transform 140ms ease, box-shadow 140ms ease;
      }
      .wb-disp-go-btn:hover:not(:disabled) { transform: translateY(-1px) scale(1.02); box-shadow: 0 8px 18px rgba(4,7,17,0.18); }
      .wb-disp-go-btn:disabled { opacity: 0.55; cursor: not-allowed; }

      @media (prefers-reduced-motion: reduce) {
        .wb-disp-page, .wb-disp-hero-glow, .wb-disp-hero-icon, .wb-disp-stat,
        .wb-disp-card-wrap, .wb-disp-empty, .wb-disp-empty-icon, .wb-disp-launcher,
        .wb-disp-launcher-shimmer {
          animation: none !important;
        }
      }
    `}</style>
  );
}

// The small control bar sitting above the article list on the main
// Warehouse Reports page — pick a date range, then open the Dispatch
// Record for whichever section (Finished Goods / Raw Material /
// Packaging Material / General Items) is currently selected.
function DispatchRecordLauncher({ category, dateFrom, dateTo, onDateFrom, onDateTo, onOpen }) {
  const isFinishedGoods = category === 'Finished Goods';
  const accent = isFinishedGoods ? VIOLET : '#3FBE8E';
  const Icon = isFinishedGoods ? Send : ArrowUpCircle;

  // Quick presets just fill the same From/To fields the person can
  // already edit by hand — picking a preset doesn't lock anything,
  // typing a custom range afterwards simply overrides it.
  const toISO = (d) => d.toISOString().slice(0, 10);
  const applyPreset = (preset) => {
    const today = new Date();
    if (preset === 'today') {
      onDateFrom(toISO(today));
      onDateTo(toISO(today));
    } else if (preset === 'week') {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      onDateFrom(toISO(start));
      onDateTo(toISO(today));
    } else if (preset === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      onDateFrom(toISO(start));
      onDateTo(toISO(today));
    } else if (preset === 'all') {
      onDateFrom('');
      onDateTo('');
    }
  };
  const presetBtn = {
    border: `1px solid ${accent}55`,
    background: 'white',
    color: accent,
    borderRadius: '7px',
    padding: '5px 9px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      className="wb-disp-launcher"
      style={{
        border: `1px solid ${accent}55`,
        background: `linear-gradient(120deg, ${accent}14 0%, ${accent}05 60%)`,
      }}
    >
      <div className="wb-disp-launcher-shimmer" />
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color="white" />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: INK }}>
            {isFinishedGoods ? 'Dispatch Record' : 'Dispensing Record'}
          </p>
          <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#8A8370' }}>
            {isFinishedGoods
              ? 'Pick a date range to see every product dispatched and which party it went to.'
              : 'Pick a date range to see every item dispensed out and what it was used for.'}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        <button style={presetBtn} onClick={() => applyPreset('today')}>Today</button>
        <button style={presetBtn} onClick={() => applyPreset('week')}>Last 7 days</button>
        <button style={presetBtn} onClick={() => applyPreset('month')}>This month</button>
        <button style={presetBtn} onClick={() => applyPreset('all')}>All time</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        <input type="date" value={dateFrom} onChange={(e) => onDateFrom(e.target.value)} style={{ padding: '6px 8px', fontSize: '12px', border: `1px solid ${LINE}`, borderRadius: '7px', background: 'white' }} />
        <span style={{ fontSize: '11.5px', color: '#8A8370' }}>to</span>
        <input type="date" value={dateTo} onChange={(e) => onDateTo(e.target.value)} style={{ padding: '6px 8px', fontSize: '12px', border: `1px solid ${LINE}`, borderRadius: '7px', background: 'white' }} />
        <button
          onClick={onOpen}
          className="wb-disp-go-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: accent, color: 'white', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
        >
          <Icon size={13} /> {isFinishedGoods ? 'View Dispatch Record' : 'View Dispensing Record'}
        </button>
      </div>
    </div>
  );
}

// The Dispatch Record itself — reads every article currently in scope
// (whatever section/subcategory was selected on the page behind it),
// pulls every ledger line with something in Issued, filters to the
// chosen date range, and lines them up as one animated report.
function DispatchRecordPage({ category, subcategoryLabel, items, dateFrom, dateTo, onBack, user, onEditInventory }) {
  const isMobile = useIsMobile();
  const isFinishedGoods = category === 'Finished Goods';
  const accent = isFinishedGoods ? VIOLET : '#3FBE8E';
  const HeaderIcon = isFinishedGoods ? Truck : PackageSearch;
  const destinationLabel = isFinishedGoods ? 'Dispatched To' : 'Used In / Issued To';
  const DestIcon = isFinishedGoods ? Send : ArrowUpCircle;
  // Finished Goods actually leave the building to an outside party —
  // that's a dispatch. Raw Material / Packaging Material going down is
  // stock being dispensed out into production, so every label on this
  // page for those two categories reads "Dispensing Record" instead.
  const recordLabel = isFinishedGoods ? 'Dispatch Record' : 'Dispensing Record';
  const movementNounPlural = isFinishedGoods ? 'dispatches' : 'dispensing entries';
  const movementVerb = isFinishedGoods ? 'issued' : 'dispensed';

  // EDIT / DELETE FROM THIS VIEW — a wrong dispatch line no longer has
  // to be tracked down on the individual article's own register page.
  // This mirrors WarehouseRegisterPage's own edit/delete exactly (same
  // month-lock rule via isRegisterRowLocked, same qty-reversal via a
  // local buildQtyMergeFor mirroring that page's buildQtyMerge) — it
  // just operates on whichever item+row a dispatch card points back to
  // (itemId/rowIdx, added on each dispatch line below), since this
  // report spans every article in the section rather than just one.
  const canManage = canManageInventory(user);
  const itemsById = useMemo(() => {
    const m = {};
    items.forEach((i) => { m[i.id] = i; });
    return m;
  }, [items]);

  const buildQtyMergeFor = (item, deltaQty, actionLabel, remarks, folio) => {
    if (!deltaQty) return {};
    const previousQty = Number(item.qty || 0);
    const newQty = previousQty + deltaQty;
    const historyEntry = {
      dept: user.dept,
      user: user.name,
      action: actionLabel,
      at: now(),
      atISO: nowISO(),
      previousQty,
      newQty,
      quantityReceived: deltaQty > 0 ? deltaQty : 0,
      quantityIssued: deltaQty < 0 ? -deltaQty : 0,
      note: remarks || '',
      folio: folio || '',
      source: 'register',
    };
    return {
      qty: newQty,
      history: [...(Array.isArray(item.history) ? item.history : []), historyEntry],
    };
  };

  const [editingRow, setEditingRow] = useState(null); // { itemId, rowIdx }
  const [editForm, setEditForm] = useState({ date: '', particulars: '', folio: '', issued: '', remarks: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const startEditDispatch = (d) => {
    if (!canManage) return;
    const item = itemsById[d.itemId];
    const rows = item && Array.isArray(item.ledger_rows) ? item.ledger_rows : [];
    const row = rows[d.rowIdx];
    if (!row) return;
    if (isRegisterRowLocked(row)) {
      alert(`This line is from ${monthLabelOf(monthKeyOf(row.date))} and is locked — only lines dated this month can be edited.`);
      return;
    }
    setEditError('');
    setEditForm({
      date: row.date || '',
      particulars: row.particulars || '',
      folio: row.folio || '',
      issued: row.issued || '',
      remarks: row.remarks || '',
    });
    setEditingRow({ itemId: d.itemId, rowIdx: d.rowIdx });
  };

  const saveEditDispatch = async () => {
    if (!editingRow) return;
    const item = itemsById[editingRow.itemId];
    if (!item) { setEditError('This item could not be found — it may have been deleted.'); return; }
    const rows = Array.isArray(item.ledger_rows) ? [...item.ledger_rows] : [];
    const existing = rows[editingRow.rowIdx];
    if (!existing) { setEditError('This line no longer exists.'); return; }
    if (isRegisterRowLocked(existing)) {
      setEditError(`This line is from ${monthLabelOf(monthKeyOf(existing.date))} and is locked — only lines dated this month can be edited.`);
      return;
    }
    const prevIssued = Number(existing.issued || 0);
    const newIssued = Number(editForm.issued || 0);
    const netDelta = -(newIssued - prevIssued);
    rows[editingRow.rowIdx] = {
      ...existing,
      date: editForm.date,
      particulars: editForm.particulars,
      folio: editForm.folio,
      issued: editForm.issued,
      remarks: editForm.remarks,
    };
    const actionLabel = `Register line updated${editForm.particulars ? ' — ' + editForm.particulars : ''}`;
    setSavingEdit(true);
    const res = await onEditInventory(item.id, {
      ledger_rows: rows,
      ...buildQtyMergeFor(item, netDelta, actionLabel, editForm.remarks, editForm.folio),
    });
    setSavingEdit(false);
    if (res?.error) {
      setEditError(res.error.message || 'Failed to save.');
      return;
    }
    setEditingRow(null);
  };

  const deleteDispatch = async (d) => {
    if (!canManage) return;
    const item = itemsById[d.itemId];
    if (!item) return;
    const rows = Array.isArray(item.ledger_rows) ? item.ledger_rows : [];
    const existing = rows[d.rowIdx];
    if (!existing) return;
    if (isRegisterRowLocked(existing)) {
      alert(`This line is from ${monthLabelOf(monthKeyOf(existing.date))} and is locked — only lines dated this month can be removed.`);
      return;
    }
    if (!window.confirm(`Remove this ${isFinishedGoods ? 'dispatch' : 'dispensing entry'} — ${d.productName}, Batch ${d.batch || 'n/a'}? ${existing.issued || 0} will be added back to stock.`)) return;
    setDeletingId(d.id);
    const reversedDelta = Number(existing.issued || 0);
    const actionLabel = `Register line removed${existing.particulars ? ' — ' + existing.particulars : ''}`;
    const res = await onEditInventory(item.id, {
      ledger_rows: rows.filter((_, i) => i !== d.rowIdx),
      ...buildQtyMergeFor(item, reversedDelta, actionLabel, existing.remarks, existing.folio),
    });
    setDeletingId(null);
    if (res?.error) alert('Failed to delete: ' + (res.error.message || ''));
  };

  const receiptsOf = (r) => (r.receipts !== undefined && r.receipts !== '' ? r.receipts : r.opening ?? '');

  // Flatten every article's ledger into one list of dispatch lines —
  // only rows with a real Issued quantity count as a dispatch; a
  // receipt/inward row is a different kind of movement and stays out
  // of this report.
  const dispatches = useMemo(() => {
    const out = [];
    items.forEach((item) => {
      const rows = Array.isArray(item.ledger_rows) ? item.ledger_rows : [];
      rows.forEach((r, idx) => {
        const issuedQty = Number(r.issued || 0);
        if (!issuedQty) return;
        if (dateFrom && (!r.date || r.date < dateFrom)) return;
        if (dateTo && (!r.date || r.date > dateTo)) return;
        out.push({
          id: `${item.id}-${idx}`,
          itemId: item.id,
          rowIdx: idx,
          productName: item.name,
          batch: item.batch,
          unit: item.unit,
          date: r.date,
          issued: issuedQty,
          folio: r.folio,
          particulars: r.particulars || '',
          destination: (r.particulars || '').trim() || (r.remarks || '').trim() || 'Not specified',
          remarks: r.remarks || '',
          receipts: receiptsOf(r),
          balance: r.balance,
          // Pulled straight from the article's own inventory fields (not
          // the ledger row) — Pack Size / MFG / EXP live on the item
          // itself, not per-transaction, so every dispatch line for the
          // same item/batch shows the same values here.
          packSize: item.final_size || '',
          mfgDate: item.mfg_date || '',
          expiryDate: item.expiry || '',
        });
      });
    });
    out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return out;
  }, [items, dateFrom, dateTo]);

  // Single-product filter — lets Warehouse pull (and download) a
  // Dispatch Record narrowed to just one product instead of every
  // product dispatched in the range. "All products" (the default)
  // reproduces the original behaviour exactly.
  const [productFilter, setProductFilter] = useState('all');
  const productOptions = useMemo(
    () => Array.from(new Set(dispatches.map((d) => d.productName))).sort((a, b) => a.localeCompare(b)),
    [dispatches]
  );
  useEffect(() => {
    if (productFilter !== 'all' && !productOptions.includes(productFilter)) setProductFilter('all');
  }, [productOptions, productFilter]);
  const filteredDispatches = useMemo(
    () => (productFilter === 'all' ? dispatches : dispatches.filter((d) => d.productName === productFilter)),
    [dispatches, productFilter]
  );

  const totalQty = useMemo(() => filteredDispatches.reduce((sum, d) => sum + d.issued, 0), [filteredDispatches]);
  const uniqueDestinations = useMemo(() => new Set(filteredDispatches.map((d) => d.destination)).size, [filteredDispatches]);
  const uniqueProducts = useMemo(() => new Set(filteredDispatches.map((d) => d.productName)).size, [filteredDispatches]);

  const rangeLabel = dateFrom || dateTo
    ? `${dateFrom ? formatFullDate(dateFrom) : 'the start'} → ${dateTo ? formatFullDate(dateTo) : 'today'}`
    : 'All recorded dates';

  // DC (Delivery Challan) NUMBER — Finished Goods dispatches only.
  // Format DC/MM/NNN: MM is the current real-world month, NNN is a
  // running count of Finished Goods dispatch lines recorded so far
  // THIS calendar month (zero-padded, resets to 000 the moment the
  // month turns over) — counted straight from the same ledger data
  // this report already reads, across every item in scope, regardless
  // of whatever date range is currently being viewed/printed. So the
  // badge always reflects "the next number in sequence right now",
  // and the very first dispatch of a new month shows DC/<mm>/001 after
  // it's recorded (DC/<mm>/000 beforehand, since nothing's happened
  // yet that month).
  const dcNumber = useMemo(() => {
    if (!isFinishedGoods) return null;
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    let count = 0;
    items.forEach((item) => {
      const rows = Array.isArray(item.ledger_rows) ? item.ledger_rows : [];
      rows.forEach((r) => {
        const issuedQty = Number(r.issued || 0);
        if (!issuedQty || !r.date) return;
        const d = new Date(r.date);
        if (d.getFullYear() === y && d.getMonth() === m) count += 1;
      });
    });
    const mm = String(m + 1).padStart(2, '0');
    return `DC/${mm}/${String(count).padStart(3, '0')}`;
  }, [items, isFinishedGoods]);

  const productSlug = productFilter === 'all' ? '' : `-${productFilter.replace(/\s+/g, '-').toLowerCase()}`;

  const downloadCsv = () => {
    csvExport(
      `${isFinishedGoods ? 'dispatch' : 'dispensing'}-record-${category.replace(/\s+/g, '-').toLowerCase()}${productSlug}${dateFrom ? `-from-${dateFrom}` : ''}${dateTo ? `-to-${dateTo}` : ''}.csv`,
      filteredDispatches.map((d) => ({
        ...d,
        date: d.date ? formatFullDate(d.date) : '',
        mfgDate: d.mfgDate ? formatDate(d.mfgDate) : '',
        expiryDate: d.expiryDate ? formatDate(d.expiryDate) : '',
      })),
      [
        { key: 'date', label: 'Date' },
        { key: 'productName', label: 'Product' },
        { key: 'batch', label: 'Batch' },
        { key: 'packSize', label: 'Pack Size' },
        { key: 'mfgDate', label: 'MFG' },
        { key: 'expiryDate', label: 'EXP' },
        { key: 'issued', label: 'Quantity Issued' },
        { key: 'unit', label: 'Unit' },
        { key: 'destination', label: isFinishedGoods ? 'Dispatched To' : 'Used In / Issued To' },
        { key: 'folio', label: 'Folio' },
        { key: 'remarks', label: 'Remarks' },
      ]
    );
  };

  const downloadPdf = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const esc = (v) => String(v ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const rowsHtml = filteredDispatches.length
      ? filteredDispatches
          .map(
            (d) => `<tr>
              <td>${d.date ? esc(formatFullDate(d.date)) : ''}</td>
              <td class="l">${esc(d.productName)}</td>
              <td>${esc(d.batch)}</td>
              <td>${esc(d.packSize)}</td>
              <td>${d.mfgDate ? esc(formatDate(d.mfgDate)) : ''}</td>
              <td>${d.expiryDate ? esc(formatDate(d.expiryDate)) : ''}</td>
              <td>${esc(d.issued)} ${esc(d.unit || '')}</td>
              <td class="l">${esc(d.destination)}</td>
              <td>${esc(d.folio)}</td>
              <td class="l">${esc(d.remarks)}</td>
            </tr>`
          )
          .join('')
      : `<tr><td colspan="10" style="color:#9C9585;padding:18px">No ${movementNounPlural} recorded in this date range.</td></tr>`;
    win.document.write(`
      <html>
        <head>
          <title>${esc(recordLabel)} — ${esc(category)}</title>
          <style>
            @page { size: A4 landscape; margin: 14mm; }
            body { font-family: Georgia, 'Times New Roman', serif; color: #0A1220; padding: 10px; }
            .doc-header { position: relative; margin-bottom: 4px; }
            .dc-badge {
              position: absolute; top: 0; right: 0;
              font-size: 12.5px; font-weight: bold; letter-spacing: 0.04em;
              border: 1px solid #8C6A2E; border-radius: 4px; padding: 4px 10px;
              color: #0A1220; background: #EFEADA;
            }
            h1 { text-align: center; font-size: 20px; margin: 0 0 4px; letter-spacing: 0.03em; }
            .sub { text-align: center; font-size: 12.5px; color: #5C5646; margin: 0 0 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #8C6A2E; padding: 6px 8px; text-align: center; }
            th { background: #EFEADA; letter-spacing: 0.05em; font-size: 11px; }
            td.l, th.l { text-align: left; }
            .sign-block {
              display: flex;
              justify-content: space-between;
              gap: 18px;
              margin-top: 46px;
              page-break-inside: avoid;
            }
            .sign-col { flex: 1; }
            .sign-line {
              border-top: 1px solid #0A1220;
              margin-bottom: 6px;
            }
            .sign-label { font-size: 12px; font-weight: bold; letter-spacing: 0.03em; margin: 0; }
            .sign-role { font-size: 10.5px; color: #5C5646; margin: 2px 0 0; }
          </style>
        </head>
        <body>
          <div class="doc-header">
            ${dcNumber ? `<div class="dc-badge">${esc(dcNumber)}</div>` : ''}
            <h1>${esc(recordLabel.toUpperCase())}</h1>
          </div>
          <p class="sub">${esc(category)}${subcategoryLabel ? ' · ' + esc(subcategoryLabel) : ''}${productFilter !== 'all' ? ' · ' + esc(productFilter) : ''} — ${esc(rangeLabel)}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th><th class="l">Product</th><th>Batch</th><th>Pack Size</th>
                <th>MFG</th><th>EXP</th><th>Qty Issued</th>
                <th class="l">${isFinishedGoods ? 'Dispatched To' : 'Used In / Issued To'}</th>
                <th>Folio</th><th class="l">Remarks</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="sign-block">
            <div class="sign-col">
              <div class="sign-line"></div>
              <p class="sign-label">PREPARED BY</p>
              <p class="sign-role">${isFinishedGoods ? '(Assistant Warehouse)' : '(Warehouse Incharge)'}</p>
            </div>
            <div class="sign-col">
              <div class="sign-line"></div>
              <p class="sign-label">CHECKED BY</p>
              <p class="sign-role">${isFinishedGoods ? '(Finished Goods Incharge)' : '(Store Incharge)'}</p>
            </div>
            <div class="sign-col">
              <div class="sign-line"></div>
              <p class="sign-label">CHECKED BY</p>
              <p class="sign-role">(Production / Q.A.I)</p>
            </div>
            <div class="sign-col">
              <div class="sign-line"></div>
              <p class="sign-label">AUTHORIZED BY</p>
              <p class="sign-role">(Finance Manager)</p>
            </div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="wb-page-padding wb-disp-page" style={{ padding: isMobile ? '16px' : '28px 32px' }}>
      <DispatchRecordStylesMemo />

      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'none', color: '#0F9C89', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: '16px' }}
      >
        <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to Warehouse Reports
      </button>

      <div
        className="wb-disp-hero"
        style={{ background: isFinishedGoods ? `linear-gradient(135deg, ${VIOLET} 0%, #5C4FCC 100%)` : 'linear-gradient(135deg, #3FBE8E 0%, #0F9C89 100%)' }}
      >
        <div className="wb-disp-hero-glow" />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="wb-disp-hero-icon">
              <HeaderIcon size={22} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '21px', fontWeight: 700 }}>{recordLabel}</h1>
              <p style={{ margin: '3px 0 0', fontSize: '12.5px', opacity: 0.9 }}>
                {category}{subcategoryLabel ? ` · ${subcategoryLabel}` : ''} — {rangeLabel}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: '8px' }}>
            {dcNumber && (
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '6px', padding: '3px 10px' }}>
                {dcNumber}
              </span>
            )}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={downloadCsv} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.14)', color: 'white', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}>
                <Download size={13} /> CSV
              </button>
              <button onClick={downloadPdf} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'white', color: accent, fontWeight: 700, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}>
                <Download size={13} /> Download / Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {productOptions.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '12px', color: '#8A8370', fontWeight: 600 }}>Product:</label>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            style={{ padding: '6px 10px', fontSize: '12.5px', border: `1px solid ${LINE}`, borderRadius: '7px', background: 'white', color: INK }}
          >
            <option value="all">All products ({dispatches.length})</option>
            {productOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {productFilter !== 'all' && (
            <button
              onClick={() => setProductFilter('all')}
              style={{ border: 'none', background: 'none', color: accent, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      <div className="wb-disp-stats">
        <div className="wb-disp-stat">
          <p style={{ margin: 0, fontSize: '11px', color: '#8A8370' }}>{isFinishedGoods ? 'Total Dispatches' : 'Total Dispensed'}</p>
          <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 700, color: INK }}>{filteredDispatches.length}</p>
        </div>
        <div className="wb-disp-stat">
          <p style={{ margin: 0, fontSize: '11px', color: '#8A8370' }}>Total Quantity Issued</p>
          <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 700, color: INK }}>{totalQty.toLocaleString()}</p>
        </div>
        <div className="wb-disp-stat">
          <p style={{ margin: 0, fontSize: '11px', color: '#8A8370' }}>Products Involved</p>
          <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 700, color: INK }}>{uniqueProducts}</p>
        </div>
        <div className="wb-disp-stat">
          <p style={{ margin: 0, fontSize: '11px', color: '#8A8370' }}>{isFinishedGoods ? 'Parties Dispatched To' : 'Distinct Uses'}</p>
          <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 700, color: INK }}>{uniqueDestinations}</p>
        </div>
      </div>

      {filteredDispatches.length === 0 ? (
        <div className="wb-disp-empty">
          <div className="wb-disp-empty-icon">
            <HeaderIcon size={24} color="#B0AA96" />
          </div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
            No {movementNounPlural} {productFilter !== 'all' ? `for ${productFilter} ` : ''}recorded in this date range.
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
            {isFinishedGoods ? 'Dispatches' : 'Dispensing entries'} are pulled from the Issued column on each article's register — try widening the date range{productFilter !== 'all' ? ' or clearing the product filter' : ''}.
          </p>
        </div>
      ) : (
        <div className="wb-disp-timeline" style={{ color: accent }}>
          {filteredDispatches.map((d, i) => {
            const color = dispatchColorFor(d.destination);
            return (
              <div key={d.id} className="wb-disp-card-wrap" style={{ animationDelay: `${Math.min(i, 16) * 55}ms` }}>
                <div className="wb-disp-dot" style={{ color: color.c }} />
                <div className="wb-disp-card" style={{ color: color.c }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: INK }}>{d.productName}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#8A8370' }}>
                        Batch {d.batch || '—'} {d.date ? `· ${formatFullDate(d.date)}` : ''}{d.folio ? ` · Folio ${d.folio}` : ''}
                      </p>
                      {isFinishedGoods && (d.packSize || d.mfgDate || d.expiryDate) && (
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#8A8370' }}>
                          {d.packSize ? `Pack: ${d.packSize}` : ''}
                          {d.mfgDate ? `${d.packSize ? ' · ' : ''}MFG: ${formatDate(d.mfgDate)}` : ''}
                          {d.expiryDate ? `${(d.packSize || d.mfgDate) ? ' · ' : ''}EXP: ${formatDate(d.expiryDate)}` : ''}
                        </p>
                      )}
                    </div>
                    <span className="wb-disp-pill" style={{ background: 'rgba(138,46,46,0.10)', color: RED }}>
                      <ArrowUpCircle size={12} /> {d.issued} {d.unit || ''} {movementVerb}
                    </span>
                  </div>
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                    <span className="wb-disp-pill" style={{ background: color.bg, color: color.c }}>
                      <DestIcon size={12} /> {destinationLabel}: {d.destination}
                    </span>
                  </div>
                  {d.remarks && d.remarks.trim() && d.remarks.trim() !== d.destination && (
                    <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: '#8A8370' }}>{d.remarks}</p>
                  )}
                  {canManage && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isRegisterRowLocked(d) ? (
                        <span title={`Locked — ${monthLabelOf(monthKeyOf(d.date))}`} style={{ color: '#B0AA96', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                          <Lock size={12} /> Locked
                        </span>
                      ) : (
                        <>
                          <button onClick={() => startEditDispatch(d)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#0F9C89', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                            <Pencil size={12} /> Edit
                          </button>
                          <button onClick={() => deleteDispatch(d)} disabled={deletingId === d.id} style={{ border: 'none', background: 'none', cursor: 'pointer', color: RED, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', padding: 0, opacity: deletingId === d.id ? 0.5 : 1 }}>
                            <Trash2 size={12} /> {deletingId === d.id ? 'Removing…' : 'Delete'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingRow && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={() => setEditingRow(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(4,7,17,0.5)' }} />
          <div style={{ position: 'relative', background: 'white', borderRadius: 14, width: '100%', maxWidth: 420, padding: 24, boxShadow: '0 32px 80px rgba(4,7,17,0.35)' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: INK, margin: '0 0 14px' }}>
              Edit {isFinishedGoods ? 'Dispatch' : 'Dispensing Entry'}
            </h3>
            {editError && <div style={{ background: '#FBEAEA', color: RED, fontSize: 12, padding: '8px 10px', borderRadius: 6, marginBottom: 12 }}>{editError}</div>}
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: '#8A8370' }}>Date</label>
                <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} style={{ width: '100%', padding: 8, marginTop: 4, border: `1px solid ${LINE}`, borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#8A8370' }}>{destinationLabel}</label>
                <input value={editForm.particulars} onChange={(e) => setEditForm({ ...editForm, particulars: e.target.value })} style={{ width: '100%', padding: 8, marginTop: 4, border: `1px solid ${LINE}`, borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: '#8A8370' }}>Quantity {movementVerb}</label>
                  <input type="number" value={editForm.issued} onChange={(e) => setEditForm({ ...editForm, issued: e.target.value })} style={{ width: '100%', padding: 8, marginTop: 4, border: `1px solid ${LINE}`, borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: '#8A8370' }}>Folio</label>
                  <input value={editForm.folio} onChange={(e) => setEditForm({ ...editForm, folio: e.target.value })} style={{ width: '100%', padding: 8, marginTop: 4, border: `1px solid ${LINE}`, borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#8A8370' }}>Remarks</label>
                <input value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} style={{ width: '100%', padding: 8, marginTop: 4, border: `1px solid ${LINE}`, borderRadius: 6, boxSizing: 'border-box' }} />
              </div>
            </div>
            <p style={{ color: '#B0AA96', fontSize: 11, margin: '12px 0 16px' }}>
              Changing the quantity adjusts this article's stock immediately to match — the same as editing it from the register itself.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={savingEdit} onClick={saveEditDispatch} style={{ background: GOLD, color: 'white', border: 'none', padding: '9px 16px', borderRadius: 8, cursor: 'pointer' }}>
                {savingEdit ? 'Saving…' : 'Save changes'}
              </button>
              <button onClick={() => setEditingRow(null)} style={{ background: 'none', border: 'none', color: '#7A7460', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// Top-level Warehouse Reports page: dashboard + category picker + article
// list. Picking an article swaps the whole view over to
// WarehouseRegisterPage — a full, standalone page rather than a side
// panel — and "Back to Warehouse Reports" returns here.
// ---------------------------------------------------------------------
// WAREHOUSE REPORTS - full-page aurora treatment.
//
// The design idea is a single sheet of dark glass with several coloured
// lights blending THROUGH it, rather than a cream page with a few coloured
// boxes sitting ON it. Gold, cyan, violet and emerald blobs overlap at low
// opacity and drift at different periods, so the colours mix and re-mix and
// the background never repeats a frame exactly.
//
// PERFORMANCE FIX: the first version of this used filter:blur() plus
// mix-blend-mode on the colour blobs, a rotating full-container conic
// gradient, backdrop-filter on the date chips, a second copy of the blobs
// behind the (potentially very long) article grid, and an infinite pulse
// animation on every card's status dot. Each of those is individually
// expensive, and several ran simultaneously or scaled with inventory size
// rather than viewport size - see the matching PERFORMANCE FIX comments on
// .wb-prod-figure and .wb-vault-figure elsewhere in this file for the same
// backdrop-filter mistake made once before. All of it has been swapped for
// cheaper equivalents below: soft-edged gradients instead of blurred ones,
// ordinary alpha overlap instead of blend modes, a flat panel background
// instead of a second animated layer, hover-only instead of always-on dot
// pulses, and content-visibility so off-screen cards cost nothing at all.
//
// Performance rules followed throughout, because this page can hold a few
// hundred article cards:
//   - no filter:blur() and no mix-blend-mode anywhere on this page - both
//     force expensive compositor work, and are doubly expensive layered;
//   - every looping animation drives transform / opacity only, so it is
//     composited and never triggers layout or paint;
//   - nothing animates per-card except on :hover, so running cost is
//     bounded by how many cards the mouse is over (0 or 1), not by how
//     many cards exist;
//   - card entrance stagger is capped, so card 300 does not wait ten
//     seconds to appear, and content-visibility:auto means far-offscreen
//     cards are skipped for layout/paint entirely;
//   - hover colour comes from a CSS variable set once per card at render,
//     not from JS running on pointer move.
// ---------------------------------------------------------------------
const WarehouseReportsAuroraStyles = React.memo(function WarehouseReportsAuroraStyles() {
  return (
    <style>{`
      .wb-wr-stage {
        position: relative;
        border-radius: 20px;
        overflow: hidden;
        background:
          linear-gradient(135deg, #04151A 0%, #061B24 40%, #0A1220 75%, #040711 100%);
        border: 1px solid rgba(47,224,201,0.22);
        box-shadow: 0 24px 60px rgba(4,7,17,0.45);
        padding: 26px 26px 0;
        margin-bottom: 20px;
      }
      /* A soft horizontal seam between the title block and the monthly
         figures, instead of a hard rule — it reads as one panel with two
         sections rather than two panels stacked. */
      .wb-wr-divider {
        position: relative;
        z-index: 2;
        height: 1px;
        margin-top: 22px;
        background: linear-gradient(90deg,
          transparent, rgba(214,251,243,0.22) 20%, rgba(242,217,153,0.28) 50%,
          rgba(214,251,243,0.22) 80%, transparent);
      }
      /* Strips the boxed-card look from the monthly tiles so they sit as
         part of the hero's own glass surface: no separate background, no
         border, no shadow, no gap between them — just a hairline seam
         where one tile meets the next. */
      .wb-wr-tiles-merged {
        position: relative;
        z-index: 2;
      }
      .wb-wr-tiles-merged .wb-pulse-grid {
        margin-bottom: 0;
        gap: 1px;
        background: rgba(214,251,243,0.10);
        border-radius: 0 0 19px 19px;
        overflow: hidden;
      }
      .wb-wr-tiles-merged .wb-pulse-tile {
        border: none;
        border-radius: 0;
        background: rgba(4,10,14,0.35);
        box-shadow: none;
      }
      .wb-wr-tiles-merged .wb-pulse-tile:hover {
        background: rgba(124,243,224,0.07);
        box-shadow: none;
        transform: translateY(-1px);
      }
      @media (max-width: 860px) {
        .wb-wr-tiles-merged .wb-pulse-grid { border-radius: 0 0 15px 15px; }
      }
      /* The mixed-colour field: four soft-edged blobs at low opacity, each
         on its own drift period so they slide in and out of overlap
         forever. No filter:blur() and no mix-blend-mode - the softness
         comes from the gradient's own fade-to-transparent stops, and the
         colour mixing comes from ordinary alpha overlap where they cross.
         Both look almost identical to the blurred/blended version and
         cost a small fraction as much to render. */
      .wb-wr-blob {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        will-change: transform, opacity;
      }
      .wb-wr-blob-1 {
        width: 46%; padding-bottom: 46%; top: -18%; left: -8%;
        background: radial-gradient(circle, rgba(242,217,153,0.34) 0%, rgba(242,217,153,0.16) 34%, transparent 70%);
        animation: wb-wr-drift-1 17s ease-in-out infinite;
      }
      .wb-wr-blob-2 {
        width: 42%; padding-bottom: 42%; top: 10%; right: -10%;
        background: radial-gradient(circle, rgba(47,224,201,0.32) 0%, rgba(47,224,201,0.15) 34%, transparent 70%);
        animation: wb-wr-drift-2 23s ease-in-out infinite;
      }
      .wb-wr-blob-3 {
        width: 38%; padding-bottom: 38%; bottom: -22%; left: 28%;
        background: radial-gradient(circle, rgba(139,124,246,0.30) 0%, rgba(139,124,246,0.13) 36%, transparent 72%);
        animation: wb-wr-drift-3 29s ease-in-out infinite;
      }
      .wb-wr-blob-4 {
        width: 30%; padding-bottom: 30%; top: 30%; left: 12%;
        background: radial-gradient(circle, rgba(63,190,142,0.28) 0%, rgba(63,190,142,0.12) 36%, transparent 72%);
        animation: wb-wr-drift-2 35s ease-in-out infinite reverse;
      }
      @keyframes wb-wr-drift-1 {
        0%,100% { transform: translate3d(0,0,0) scale(1); opacity: 0.75; }
        50%     { transform: translate3d(14%, 10%, 0) scale(1.18); opacity: 1; }
      }
      @keyframes wb-wr-drift-2 {
        0%,100% { transform: translate3d(0,0,0) scale(1.1); opacity: 0.6; }
        50%     { transform: translate3d(-16%, 12%, 0) scale(0.92); opacity: 1; }
      }
      @keyframes wb-wr-drift-3 {
        0%,100% { transform: translate3d(0,0,0) scale(0.95); opacity: 0.55; }
        50%     { transform: translate3d(10%, -14%, 0) scale(1.22); opacity: 0.95; }
      }


      /* PERFORMANCE FIX: this used to animate background-position, which —
         unlike transform or opacity — is NOT something the compositor can
         run on its own. Every frame of that animation forced the browser to
         actually repaint the pattern across the full width of the header,
         continuously, for as long as this page was open. Same visual pan,
         but now done by translating an oversized copy of the pattern with
         transform instead: identical result, compositor-only, no repaint. */
      .wb-wr-hero-grid {
        position: absolute;
        inset: -34px; /* one full tile larger on every side, so a one-tile
                          translate below never reveals a bare edge */
        pointer-events: none;
        opacity: 0.10;
        background-image:
          linear-gradient(rgba(214,251,243,0.85) 1px, transparent 1px),
          linear-gradient(90deg, rgba(214,251,243,0.85) 1px, transparent 1px);
        background-size: 34px 34px;
        mask-image: radial-gradient(ellipse 80% 70% at 30% 20%, black 10%, transparent 80%);
        -webkit-mask-image: radial-gradient(ellipse 80% 70% at 30% 20%, black 10%, transparent 80%);
        animation: wb-wr-grid-pan 22s linear infinite;
        will-change: transform;
      }
      @keyframes wb-wr-grid-pan {
        from { transform: translate3d(0, 0, 0); }
        to   { transform: translate3d(34px, 34px, 0); }
      }

      .wb-wr-hero-beam {
        position: absolute;
        top: -50%; left: -30%;
        width: 26%; height: 200%;
        pointer-events: none;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10) 48%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0.10) 52%, transparent);
        transform: rotate(16deg);
        animation: wb-wr-beam 9s ease-in-out infinite;
        will-change: transform;
      }
      @keyframes wb-wr-beam {
        0%, 70%, 100% { transform: rotate(16deg) translateX(0); }
        35%           { transform: rotate(16deg) translateX(560%); }
      }

      .wb-wr-hero-inner { position: relative; z-index: 2; }

      /* Title with a gradient that slides across the letterforms. */
      .wb-wr-title {
        margin: 0;
        font-size: 30px;
        letter-spacing: 0.01em;
        background: linear-gradient(100deg, #F2D999 0%, #FFFFFF 22%, #7CF3E0 46%, #C8BCFF 68%, #F2D999 92%);
        background-size: 250% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: wb-wr-title-flow 9s ease-in-out infinite;
      }
      @keyframes wb-wr-title-flow {
        0%, 100% { background-position: 0% 50%; }
        50%      { background-position: 100% 50%; }
      }
      .wb-wr-sub {
        margin: 7px 0 0;
        font-size: 13px;
        line-height: 1.55;
        color: rgba(214,251,243,0.62);
        max-width: 640px;
      }

      /* PERFORMANCE FIX: see .wb-prod-figure / .wb-vault-figure elsewhere in
         this file for the same mistake made once before - backdrop-filter
         continuously re-blurs whatever is behind it, in real time, and
         these chips sit directly on top of the hero's animated drifting
         blobs. Swapped for a flatter, slightly more opaque background -
         visually almost identical "frosted glass" read, near-zero cost. */
      .wb-wr-chip {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 6px 13px;
        border-radius: 999px;
        font-size: 12px;
        white-space: nowrap;
        color: rgba(233,252,247,0.9);
        background: rgba(10,20,28,0.55);
        border: 1px solid rgba(214,251,243,0.20);
        transition: border-color 0.3s ease, background 0.3s ease, transform 0.3s ease;
      }
      .wb-wr-chip:hover { transform: translateY(-1px); background: rgba(255,255,255,0.10); }
      .wb-wr-chip-gold {
        color: #FFF0C9;
        border-color: rgba(242,217,153,0.45);
        background: linear-gradient(120deg, rgba(242,217,153,0.16), rgba(242,217,153,0.05));
        font-weight: 600;
        position: relative;
        overflow: hidden;
      }
      .wb-wr-chip-gold::after {
        content: '';
        position: absolute; top: 0; left: -70%;
        width: 45%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
        transform: skewX(-18deg);
        animation: wb-wr-chip-shine 5.5s ease-in-out infinite;
      }
      @keyframes wb-wr-chip-shine {
        0%, 65%, 100% { transform: translateX(0) skewX(-18deg); }
        30%           { transform: translateX(420%) skewX(-18deg); }
      }

      /* ---------------- Tab rails ---------------- */
      .wb-wr-tab {
        position: relative;
        padding: 8px 16px;
        border-radius: 10px;
        font-size: 12.5px;
        font-weight: 600;
        white-space: nowrap;
        cursor: pointer;
        font-family: inherit;
        overflow: hidden;
        color: #5C5646;
        background: rgba(255,255,255,0.85);
        border: 1px solid ${LINE};
        transition: transform 180ms cubic-bezier(0.22,1,0.36,1),
                    box-shadow 180ms ease, color 180ms ease, border-color 180ms ease;
      }
      .wb-wr-tab:hover {
        transform: translateY(-2px);
        color: #0A1220;
        border-color: rgba(47,224,201,0.55);
        box-shadow: 0 8px 20px rgba(4,7,17,0.12);
      }
      .wb-wr-tab-active {
        color: #04241F;
        border-color: transparent;
        box-shadow: 0 10px 26px rgba(15,156,137,0.35);
      }
      /* The active pill's fill is an animated multi-stop gradient, so the
         current tab visibly shifts through the palette instead of sitting
         on one flat green. */
      .wb-wr-tab-active::before {
        content: '';
        position: absolute; inset: 0;
        background: linear-gradient(100deg, #7CF3E0, #3FBE8E 28%, #F2D999 55%, #7CF3E0 80%, #8B7CF6);
        background-size: 280% 100%;
        animation: wb-wr-tab-flow 7s ease-in-out infinite;
        z-index: 0;
      }
      @keyframes wb-wr-tab-flow {
        0%, 100% { background-position: 0% 50%; }
        50%      { background-position: 100% 50%; }
      }
      .wb-wr-tab > span { position: relative; z-index: 1; }

      /* ---------------- Article grid ---------------- */
      .wb-wr-panel {
        position: relative;
        border-radius: 16px;
        overflow: hidden;
        background: linear-gradient(160deg, #061A20 0%, #071723 55%, #050B14 100%);
        border: 1px solid rgba(47,224,201,0.20);
        box-shadow: 0 18px 44px rgba(4,7,17,0.35);
      }
      .wb-wr-searchbar {
        position: relative;
        z-index: 2;
        padding: 12px;
        border-bottom: 1px solid rgba(47,224,201,0.16);
        background: rgba(255,255,255,0.03);
      }
      .wb-wr-search {
        width: 100%;
        padding: 9px 12px 9px 32px;
        border-radius: 10px;
        font-size: 12.5px;
        box-sizing: border-box;
        color: #E9FCF7;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(214,251,243,0.18);
        outline: none;
        font-family: inherit;
        transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
      }
      .wb-wr-search::placeholder { color: rgba(214,251,243,0.35); }
      .wb-wr-search:focus {
        border-color: rgba(124,243,224,0.7);
        background: rgba(255,255,255,0.08);
        box-shadow: 0 0 0 3px rgba(47,224,201,0.16), 0 0 22px rgba(47,224,201,0.22);
      }

      .wb-wr-grid {
        position: relative;
        z-index: 2;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(232px, 1fr));
        gap: 1px;
        background: rgba(47,224,201,0.10);
      }
      @media (max-width: 860px) {
        .wb-wr-grid { grid-template-columns: 1fr; }
        .wb-wr-stage { padding: 20px 18px 18px; border-radius: 16px; }
        .wb-wr-title { font-size: 23px; }
      }

      /* Each card carries its own --c / --c2 accent pair, assigned round
         robin at render, so the grid reads as a mixed-colour mosaic rather
         than one repeated tint. */
      .wb-wr-card {
        position: relative;
        display: block;
        width: 100%;
        text-align: left;
        padding: 14px 16px 15px;
        border: none;
        cursor: pointer;
        font-family: inherit;
        overflow: hidden;
        background: linear-gradient(150deg, #071C24 0%, #061620 100%);
        opacity: 0;
        animation: wb-wr-card-in 0.52s cubic-bezier(0.16,1,0.3,1) forwards;
        animation-delay: var(--cd, 0s);
        transition: transform 200ms cubic-bezier(0.22,1,0.36,1),
                    box-shadow 200ms ease, background 200ms ease;
        /* This grid's length depends on how many articles are in the
           warehouse, not on the screen size - it can run to hundreds of
           cards. content-visibility:auto tells the browser to skip layout
           and paint entirely for cards currently scrolled out of view,
           which is the one change here that scales correctly as inventory
           grows. contain-intrinsic-size gives it a realistic placeholder
           height so the scrollbar doesn't jump around before a card has
           ever been rendered. */
        content-visibility: auto;
        contain-intrinsic-size: 0 84px;
      }
      @keyframes wb-wr-card-in {
        from { opacity: 0; transform: translateY(14px) scale(0.975); }
        to   { opacity: 1; transform: none; }
      }
      .wb-wr-card:hover {
        transform: translateY(-3px);
        background: linear-gradient(150deg, #0A2530 0%, #081C28 100%);
        box-shadow: 0 16px 34px rgba(4,7,17,0.5), 0 0 26px -6px var(--c);
        z-index: 3;
      }
      .wb-wr-card:active { transform: translateY(-1px) scale(0.997); }
      .wb-wr-card:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 2px var(--c);
        z-index: 3;
      }

      /* Accent bar down the left edge that grows on hover. */
      .wb-wr-card::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, var(--c), var(--c2));
        transform: scaleY(0.35);
        transform-origin: center;
        opacity: 0.65;
        transition: transform 280ms cubic-bezier(0.22,1,0.36,1), opacity 280ms ease, width 280ms ease;
      }
      .wb-wr-card:hover::before { transform: scaleY(1); opacity: 1; width: 4px; }

      /* Corner bloom in the card's own accent. */
      .wb-wr-card::after {
        content: '';
        position: absolute;
        top: -40px; right: -40px;
        width: 130px; height: 130px;
        border-radius: 50%;
        background: radial-gradient(circle, var(--c), transparent 68%);
        opacity: 0.10;
        pointer-events: none;
        transition: opacity 280ms ease, transform 280ms ease;
      }
      .wb-wr-card:hover::after { opacity: 0.30; transform: scale(1.25); }

      .wb-wr-card-name {
        position: relative; z-index: 1;
        margin: 0;
        font-size: 13.5px;
        font-weight: 600;
        color: #EFFBF8;
        transition: color 200ms ease;
      }
      .wb-wr-card:hover .wb-wr-card-name {
        color: #FFFFFF;
        text-shadow: 0 0 16px var(--c);
      }
      .wb-wr-card-meta {
        position: relative; z-index: 1;
        margin: 4px 0 0;
        font-size: 11px;
        color: rgba(214,251,243,0.58);
      }
      .wb-wr-card-foot {
        position: relative; z-index: 1;
        margin: 5px 0 0;
        font-size: 10.5px;
        color: rgba(214,251,243,0.38);
        display: flex; align-items: center; gap: 4px;
      }
      /* PERFORMANCE FIX: this used to pulse forever on every card at once.
         Animating transform/opacity promotes an element to its own
         GPU-composited layer, so on a few hundred cards that's a few
         hundred permanently-running layers competing for layer budget -
         exactly the kind of thing that turns a smooth page into a
         stuttery one. It now only pulses on the card the mouse is over,
         so the running cost is bounded by 0-1 instead of "every article
         in the warehouse". */
      .wb-wr-card-dot {
        display: inline-block;
        width: 6px; height: 6px;
        border-radius: 50%;
        background: var(--c);
        box-shadow: 0 0 8px var(--c);
        margin-right: 6px;
        vertical-align: middle;
        opacity: 0.7;
      }
      .wb-wr-card:hover .wb-wr-card-dot,
      .wb-wr-card:focus-visible .wb-wr-card-dot {
        animation: wb-wr-dot-pulse 1.1s ease-in-out infinite;
      }
      @keyframes wb-wr-dot-pulse {
        0%, 100% { opacity: 0.6; transform: scale(0.9); }
        50%      { opacity: 1;   transform: scale(1.2); }
      }
      .wb-wr-empty {
        position: relative; z-index: 2;
        padding: 30px 18px;
        text-align: center;
        font-size: 12.5px;
        color: rgba(214,251,243,0.45);
      }

      @media (prefers-reduced-motion: reduce) {
        .wb-wr-blob, .wb-wr-hero-grid, .wb-wr-hero-beam,
        .wb-wr-title, .wb-wr-chip-gold::after, .wb-wr-tab-active::before,
        .wb-wr-card, .wb-wr-card-dot {
          animation: none !important;
        }
        .wb-wr-card { opacity: 1 !important; }
        .wb-wr-title { color: #F2D999; -webkit-text-fill-color: #F2D999; }
      }
    `}</style>
  );
});

// Round-robin accent pairs for the article mosaic.
const WB_WR_ACCENTS = [
  ['#F2D999', '#C9A55C'],
  ['#7CF3E0', '#1FA396'],
  ['#8B7CF6', '#5B4BD6'],
  ['#3FBE8E', '#17795C'],
  ['#F0A93E', '#B8761B'],
];

function WarehouseReportsPage({ user, inventory, onEditInventory, initialItemId, onConsumeInitialItem }) {
  const isMobile = useIsMobile();
  const [category, setCategory] = useState(INVENTORY_CATEGORIES[0].key);
  const [subcategory, setSubcategory] = useState(RAW_MATERIAL_SUBCATEGORIES[0].key);
  const [apiSection, setApiSection] = useState(API_SUBSECTIONS[0].key);
  const [search, setSearch] = useState('');
  const [openItemId, setOpenItemId] = useState(initialItemId || null);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchFrom, setDispatchFrom] = useState('');
  const [dispatchTo, setDispatchTo] = useState('');

  // Consume the jump-to-article shortcut exactly once — clearing it at
  // the App level right away means a later plain visit to Warehouse
  // Reports (sidebar click, "Back") starts at the normal overview
  // instead of silently re-opening whatever article was last jumped to.
  useEffect(() => {
    if (initialItemId) onConsumeInitialItem?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const isRawMaterial = category === 'Raw Material';
  const isAPIs = isRawMaterial && subcategory === 'APIs';

  const sectionItems = useMemo(
    () => inventory.filter((i) => (i.category || 'General Items') === category),
    [inventory, category]
  );
  const subItems = useMemo(
    () =>
      isRawMaterial
        ? sectionItems.filter((i) => (i.subcategory || RAW_MATERIAL_SUBCATEGORIES[0].key) === subcategory)
        : sectionItems,
    [sectionItems, isRawMaterial, subcategory]
  );
  const scopedItems = useMemo(
    () => (isAPIs ? subItems.filter((i) => (i.subcategory2 || API_SUBSECTIONS[0].key) === apiSection) : subItems),
    [subItems, isAPIs, apiSection]
  );
  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return scopedItems;
    return scopedItems.filter((i) => (i.name || '').toLowerCase().includes(q) || (i.batch || '').toLowerCase().includes(q));
  }, [scopedItems, search]);

  const openItem = useMemo(() => inventory.find((i) => i.id === openItemId) || null, [inventory, openItemId]);

  // The connected article list can change under us at any time (new
  // stock added, an item renamed/removed in Warehouse Inventory) — if
  // the article currently open disappears from that live list, fall
  // back to the picker instead of showing a stale page.
  useEffect(() => {
    if (openItemId && !inventory.some((i) => i.id === openItemId)) setOpenItemId(null);
  }, [inventory, openItemId]);

  if (openItem) {
    return (
      <WarehouseRegisterPage
        user={user}
        item={openItem}
        onEditInventory={onEditInventory}
        onBack={() => setOpenItemId(null)}
      />
    );
  }

  // The Dispatch Record sits one level above a single article's
  // register: instead of one item's ledger, it's every Issued line
  // across the whole scoped section (subcategory/API-section included)
  // within the chosen date range — see DispatchRecordPage above.
  if (dispatchOpen) {
    const subcategoryLabel = isRawMaterial
      ? [RAW_MATERIAL_SUBCATEGORIES.find((s) => s.key === subcategory)?.label, isAPIs ? API_SUBSECTIONS.find((s) => s.key === apiSection)?.label : null]
          .filter(Boolean)
          .join(' · ')
      : null;
    return (
      <DispatchRecordPage
        category={category}
        subcategoryLabel={subcategoryLabel}
        items={scopedItems}
        dateFrom={dispatchFrom}
        dateTo={dispatchTo}
        onBack={() => setDispatchOpen(false)}
        user={user}
        onEditInventory={onEditInventory}
      />
    );
  }

  // Tabs are class-driven now so the active pill can carry an animated
  // gradient fill, which a style object cannot express.
  const tabCls = (active) => `wb-wr-tab${active ? ' wb-wr-tab-active' : ''}`;

  return (
    <div className="wb-page-padding" style={{ padding: isMobile ? '16px' : '28px 32px' }}>
      <WarehouseReportsAuroraStyles />

      <div className="wb-wr-stage">
        {/* Four soft colour fields drifting on different periods. They
            overlap and separate continuously via ordinary alpha blending
            (no filter:blur, no mix-blend-mode — see the performance note
            above), so the background colour is always a live mix rather
            than a fixed gradient. */}
        <span className="wb-wr-blob wb-wr-blob-1" />
        <span className="wb-wr-blob wb-wr-blob-2" />
        <span className="wb-wr-blob wb-wr-blob-3" />
        <span className="wb-wr-blob wb-wr-blob-4" />
        <div className="wb-wr-hero-grid" />
        <span className="wb-wr-hero-beam" />

        <div className="wb-wr-hero-inner">
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap',
            }}
          >
            <h1 className="wb-serif wb-wr-title">Warehouse Reports</h1>
            {/* Today's date, and the calendar month the "This Month" tiles
                below are counting. Both are shown because they answer two
                different questions: when was this page read, and which
                month do the figures on it cover. The month is derived from
                currentMonthKey()/monthLabelOf() - the same pair isThisMonth()
                filters the tiles by and the register's monthly edit-lock
                uses - so the caption can never claim a different month than
                the numbers it sits above. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="wb-wr-chip">
                <CalendarDays size={13} color={GOLD_LIGHT} />
                {new Date().toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span
                className="wb-wr-chip wb-wr-chip-gold"
                title="The calendar month the monthly figures below are counted over"
              >
                Reporting month: {monthLabelOf(currentMonthKey())}
              </span>
            </div>
          </div>
          <p className="wb-wr-sub">
            Every article from Warehouse Inventory, one tap from its own stock register. Registers
            are filled in manually and can only be edited by Warehouse - everyone else can read them.
          </p>

          {/* The three monthly figures used to sit in their own boxed
              teal cards below this panel, with a visible gap and a
              different colour language - they read as a separate
              component bolted under the header rather than part of one
              dashboard. Bringing them inside the hero, on a shared
              divider line and a transparent shared background, makes the
              header and the figures read as a single merged surface. */}
          <div className="wb-wr-divider" />
          <div className="wb-wr-tiles-merged">
            <WarehouseReportsDashboard inventory={inventory} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {INVENTORY_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              setCategory(c.key);
              setSubcategory(RAW_MATERIAL_SUBCATEGORIES[0].key);
              setApiSection(API_SUBSECTIONS[0].key);
            }}
            className={tabCls(category === c.key)}
          >
            <span>{c.key}</span>
          </button>
        ))}
      </div>

      {isRawMaterial && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {RAW_MATERIAL_SUBCATEGORIES.map((s) => (
            <button key={s.key} onClick={() => { setSubcategory(s.key); setApiSection(API_SUBSECTIONS[0].key); }} className={tabCls(subcategory === s.key)}>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {isAPIs && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {API_SUBSECTIONS.map((s) => (
            <button key={s.key} onClick={() => setApiSection(s.key)} className={tabCls(apiSection === s.key)}>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}

      <DispatchRecordLauncher
        category={category}
        dateFrom={dispatchFrom}
        dateTo={dispatchTo}
        onDateFrom={setDispatchFrom}
        onDateTo={setDispatchTo}
        onOpen={() => setDispatchOpen(true)}
      />

      <div className="wb-wr-panel">
        <div className="wb-wr-searchbar">
          <div style={{ position: 'relative' }}>
            <Search size={14} color="rgba(214,251,243,0.5)" style={{ position: 'absolute', left: '11px', top: '11px', zIndex: 1 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search article or batch…"
              className="wb-wr-search"
            />
          </div>
        </div>
        <div className="wb-wr-grid">
          {visibleItems.length === 0 && (
            <p className="wb-wr-empty">No items in this section.</p>
          )}
          {visibleItems.map((i, idx) => {
            const rowCount = Array.isArray(i.ledger_rows) ? i.ledger_rows.length : 0;
            // Round-robin accent so the grid is a mixed-colour mosaic. The
            // entrance stagger is capped at 12 steps: without the cap, an
            // 800-article section would leave the last card waiting almost a
            // minute to fade in.
            const [accent, accent2] = WB_WR_ACCENTS[idx % WB_WR_ACCENTS.length];
            const delay = `${Math.min(idx, 12) * 0.04}s`;
            // Last activity date — the same value isItemLockedForEdit()
            // already checks against to decide whether the item is
            // locked for direct edits, so this is the one true "when was
            // this article last touched" answer, not a second guess at
            // it. Falls back to created_at when there's no history yet
            // (a brand-new item), and to '—' only if neither exists.
            const lastActivityISO = itemLastActivityISO(i);
            const lastActivityLabel = lastActivityISO ? formatDateTime(lastActivityISO) : '—';
            return (
              <button
                key={i.id}
                onClick={() => setOpenItemId(i.id)}
                className="wb-wr-card"
                style={{ '--c': accent, '--c2': accent2, '--cd': delay }}
              >
                <p className="wb-wr-card-name">
                  <span className="wb-wr-card-dot" />
                  {i.name}
                </p>
                <p className="wb-wr-card-meta">
                  Batch {i.batch || '—'} · {i.qty} {i.unit} · {rowCount} register {rowCount === 1 ? 'entry' : 'entries'}
                </p>
                <p className="wb-wr-card-foot">
                  <CalendarDays size={11} color="rgba(214,251,243,0.38)" /> Last activity: {lastActivityLabel}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// =======================================================================
// Packing Status — Daily Packing log + Batches Overview.
// Merged directly into App.jsx (instead of a separate imported file) so
// there is nothing extra to create or misplace — everything the app needs
// lives in this one file.
// =======================================================================

// Production's own id generator — adds a random suffix on top of the
// timestamp (App.jsx's shared nextId() also does this now), so two
// Daily Packing entries logged in the same millisecond never collide.
const nextProdId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const PROCESS_STEPS = [
  { key: 'Dispensing',       icon: Beaker,        color: '#177d71' },
  { key: 'Washing',          icon: Zap,           color: '#8B7CF6' },
  { key: 'Sterilization',     icon: FlaskConical,  color: '#7a5b1d' },
  { key: 'Mixing',           icon: Layers,        color: '#177d71' },
  { key: 'Compression',      icon: Gauge,         color: '#8B7CF6' },
  { key: 'Filling',          icon: PackageSearch, color: '#7a5b1d' },
  { key: 'Coating',          icon: Sparkles,      color: '#177d71' },
  { key: 'Blistering',       icon: Boxes,         color: '#8B7CF6' },
  { key: 'Labeling',         icon: Stamp,         color: '#7a5b1d' },
  { key: 'Over Printing',    icon: Pencil,        color: '#177d71' },
  { key: 'Optical Checking', icon: Eye,           color: '#8B7CF6' },
  { key: 'Packing',          icon: Archive,       color: '#7a5b1d' },
  { key: 'Audit',            icon: ClipboardList, color: '#177d71' },
  { key: 'IPQ',              icon: PauseCircle,          color: '#910d0d' },
];
// ---------------------------------------------------------------------
// ROLE MATRIX
// ---------------------------------------------------------------------
// Daily Packing (the log of what Production packed, batch by batch, day
// by day) can ONLY be added, edited, deleted, or put on/off IPQ hold by
// the Production department. Every other department that has any access
// to this page at all (Warehouse, Plant Manager, Admin) gets full
// read/search/history access but is strictly view-only for Daily
// Packing — exactly the same "hide the controls in the UI AND refuse
// the mutation in the handler" two-layer pattern used for Warehouse
// Inventory in App.jsx's canManageInventory().

// Warehouse receives/rejects transfers Production sends them — that is
// the ONLY mutation right Warehouse has on this page. They cannot touch
// Daily Packing at all.
function canManageProduction(user) {
  return user.dept === 'Production';
}

// Supabase/Postgres errors carry far more than `.message` — `.code` is
// the raw Postgres error code (42501 = RLS policy blocked it, 23503 =
// a foreign key elsewhere still points at this row), and `.details` /
// `.hint` usually spell out which policy or constraint fired. The
// plain `error.message` alone often just says "new row violates row-
// level security policy" with no clue *which* policy or table, so
// deletes in particular (see handleDeleteEntry/handleDeleteBatch
// below) surface the whole thing — this is what tells you, the next
// time a delete is refused, whether it's an RLS policy or a foreign
// key, instead of having to guess.
function describeSupabaseError(error) {
  if (!error) return 'Unknown error.';
  const parts = [error.message || 'Unknown error.'];
  if (error.code) parts.push(`(code ${error.code})`);
  if (error.details) parts.push(`— ${error.details}`);
  if (error.hint) parts.push(`Hint: ${error.hint}`);
  return parts.join(' ');
}
function canReceiveWarehouse(user) {
  return user.dept === 'Warehouse';
}
function isReadOnlyViewer(user) {
  return user.dept === 'Plant Manager' || user.dept === 'Admin';
}
function canManageProcesses(user) {
  return user.dept === 'Production';
}
async function logAudit({ action, table, recordId, user, oldValue, newValue }) {
  await supabase.from('audit_log').insert([
    {
      id: nextProdId('AUD'),
      action,
      table_name: table,
      record_id: recordId,
      user_name: user.name,
      user_dept: user.dept,
      old_value: oldValue || null,
      new_value: newValue || null,
    },
  ]);
}

function csvExport(filename, rows, columns) {
  const header = columns.map((c) => `"${c.label}"`).join(',');
  const body = rows
    .map((r) =>
      columns.map((c) => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');
  const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------
// CONFIRM DIALOG — in-app replacement for window.confirm(). The native
// browser confirm() renders as an unstyled OS/browser chrome popup (the
// "react-2gvllg3k.stackblitz.io says…" box) that can't be themed to
// match the rest of the portal. This component is a normal modal so
// every confirmation in Packing Status looks consistent with the
// rest of the app instead of dropping into a jarring native dialog.
// ---------------------------------------------------------------------
// ---------------------------------------------------------------------
// PROCESS BADGE — small glowing pill showing a process's icon + color,
// with a pulsing dot so "ongoing" reads as genuinely live.
// ---------------------------------------------------------------------
function ProcessBadge({ process, size = 'md' }) {
  const step = PROCESS_STEPS.find((p) => p.key === process) || PROCESS_STEPS[0];
  const Icon = step.icon;
  const small = size === 'sm';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: small ? 5 : 7,
        padding: small ? '4px 10px' : '6px 14px',
        borderRadius: 999,
        fontSize: small ? 11 : 12,
        fontWeight: 700,
        color: step.color,
        background: `${step.color}1A`,
        border: `1px solid ${step.color}55`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        className="wb-process-dot"
        style={{ background: step.color, boxShadow: `0 0 8px ${step.color}` }}
      />
      <Icon size={small ? 11 : 13} />
      {step.key}
    </span>
  );
}

// ---------------------------------------------------------------------
// PROCESS PICKER GRID — the 13 processes as animated, glowing selectable
// cards. Used both when starting a new process and when changing one.
// ---------------------------------------------------------------------
function ProcessPickerGrid({ selected, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
      {PROCESS_STEPS.map((s) => {
        const Icon = s.icon;
        const active = selected === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onSelect(s.key)}
            className={active ? 'wb-process-card wb-process-card-active' : 'wb-process-card'}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: '14px 8px',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
              border: `1.5px solid ${s.color}`,
              background: active ? s.color : `${s.color}14`,
              color: active ? '#fff' : '#3A3628',
              boxShadow: active ? `0 0 0 4px ${s.color}33, 0 10px 24px ${s.color}55` : 'none',
            }}
          >
            <Icon size={18} color={active ? '#fff' : s.color} />
            {s.key}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------
// GLOWING "ONGOING PROCESSES" BUTTON — animated conic-gradient glow,
// opens the full Ongoing Processes page/modal.
// ---------------------------------------------------------------------
function OngoingProcessesButton({ onClick, count }) {
  return (
    <button onClick={onClick} className="wb-glow-btn">
      <span className="wb-glow-btn-bg" />
      <Radar size={16} />
      <span>Ongoing Processes</span>
      {count > 0 && <span className="wb-glow-btn-count">{count}</span>}
    </button>
  );
}

// ---------------------------------------------------------------------
// LIVE ONGOING PROCESSES BOARD — sits directly on the Packing Status
// dashboard so every department sees current processes without opening
// the full manager. Click a tile to jump straight into changing it
// (Production) or viewing its history (everyone else).
// ---------------------------------------------------------------------
function OngoingProcessesBoard({ processes, onOpenBoard, onSelect }) {
  // Previously capped at the first 6 with .slice(0, 6), so the live
  // snapshot silently hid any process beyond the sixth even though the
  // hero above it counted every one of them. Now every ongoing process
  // is shown; once there are more than 9 (three rows) the grid scrolls
  // internally instead of pushing the rest of the page down forever.
  const active = processes;
  const many = active.length > 9;
  return (
    <div
      className="wb-card"
      style={{ background: 'white', border: `1px solid ${LINE}`, borderRadius: 14, padding: '20px 22px', marginTop: 22, marginBottom: 22 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Radar size={16} color={CYAN_DEEP} />
          <p className="wb-serif" style={{ color: INK, fontSize: 17, margin: 0 }}>Ongoing Processes — Live</p>
        </div>
        <button onClick={onOpenBoard} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: GOLD, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          Manage all <ArrowUpRight size={13} />
        </button>
      </div>
      {active.length === 0 && <p style={{ color: '#9C9585', fontSize: 13 }}>No ongoing processes logged yet.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, maxHeight: many ? 460 : 'none', overflowY: many ? 'auto' : 'visible', paddingRight: many ? 4 : 0 }}>
        {active.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="wb-process-tile"
            style={{ textAlign: 'left', background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, cursor: 'pointer' }}
          >
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: INK }}>{p.product_name}</p>
            <p style={{ margin: '0 0 10px', fontSize: 11, color: '#9C9585' }}>Batch {p.batch_number}</p>
            <ProcessBadge process={p.current_process} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// CHANGE PROCESS — moving a product+batch to a new process. The OLD
// process is pushed into history with who/when; the record's
// current_process becomes the new one. Production only.
// ---------------------------------------------------------------------
function ProcessChangeModal({ user, record, onClose, onSaved }) {
  const [selected, setSelected] = useState(record.current_process);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (selected === record.current_process) { onClose(); return; }
    setSaving(true);
    const historyEntry = {
      dept: user.dept,
      user: user.name,
      action: `Moved from ${record.current_process} to ${selected}${note ? ' — ' + note : ''}`,
      at: now(),
      atISO: nowISO(),
      from: record.current_process,
      to: selected,
    };
    const newHistory = Array.isArray(record.history) ? [...record.history, historyEntry] : [historyEntry];
    const { error: err } = await supabase
      .from('production_processes')
      .update({ current_process: selected, history: newHistory, updated_at: nowISO() })
      .eq('id', record.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(4,7,17,0.55)', backdropFilter: 'blur(3px)' }} />
      <div className="wb-history-modal" style={{ position: 'relative', background: 'white', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(4,7,17,0.35)' }}>
        <div style={{ padding: '20px 24px', background: `linear-gradient(120deg, ${INK_DEEP}, ${INK})` }}>
          <p style={{ color: 'rgba(248,244,233,0.55)', fontSize: 11, margin: 0, letterSpacing: '0.06em' }}>CHANGE PROCESS</p>
          <h2 className="wb-serif" style={{ color: '#F8F4E9', fontSize: 20, margin: '4px 0 0' }}>{record.product_name}</h2>
          <p style={{ color: 'rgba(248,244,233,0.5)', fontSize: 12, margin: '6px 0 0' }}>
            Batch {record.batch_number} · Currently: {record.current_process}
          </p>
        </div>
        <div style={{ padding: 24 }}>
          {error && <div style={{ background: '#FBEAEA', color: IPQ_RED, fontSize: 12, padding: '8px 10px', borderRadius: 6, marginBottom: 14 }}>{error}</div>}
          <p style={{ fontSize: 12, color: '#8A8370', marginBottom: 10 }}>SELECT NEW PROCESS</p>
          <ProcessPickerGrid selected={selected} onSelect={setSelected} />
          <label style={{ fontSize: 11, color: '#8A8370', display: 'block', margin: '16px 0 6px' }}>Note (optional)</label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ width: '100%', padding: 8, border: `1px solid ${LINE}`, borderRadius: 6, boxSizing: 'border-box', marginBottom: 16 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={saving} onClick={submit} className="wb-btn wb-btn-gold" style={{ background: GOLD, color: 'white', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              {saving ? 'Saving…' : 'Confirm change'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7A7460', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// PROCESS HISTORY — every move this product+batch has made, newest
// first: old process → new process, who, which department, and when.
// Read-only for everyone, including Production.
// ---------------------------------------------------------------------
function ProcessHistoryModal({ record, onClose }) {
  if (!record) return null;
  const entries = Array.isArray(record.history) ? [...record.history].reverse() : [];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(4,7,17,0.5)', backdropFilter: 'blur(3px)' }} />
      <div className="wb-history-modal" style={{ position: 'relative', background: 'white', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(4,7,17,0.35)' }}>
        <div style={{ padding: '20px 24px', background: `linear-gradient(120deg, ${INK_DEEP}, ${INK})` }}>
          <p style={{ color: 'rgba(248,244,233,0.55)', fontSize: 11, margin: 0 }}>PROCESS HISTORY</p>
          <h2 className="wb-serif" style={{ color: '#F8F4E9', fontSize: 20, margin: '4px 0 0' }}>{record.product_name}</h2>
          <div style={{ marginTop: 8 }}>
            <span style={{ color: 'rgba(248,244,233,0.5)', fontSize: 12 }}>Batch {record.batch_number} · Current: </span>
            <ProcessBadge process={record.current_process} size="sm" />
          </div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {entries.length === 0 && <p style={{ color: '#9C9585', fontSize: 13 }}>No history yet.</p>}
          {entries.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', marginTop: 4, background: i === 0 ? CYAN_DEEP : '#C9C2AE' }} />
                {i < entries.length - 1 && <span style={{ width: 1, flex: 1, background: LINE, minHeight: 18 }} />}
              </div>
              <div style={{ paddingBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 13, color: INK }}><b>{h.user}</b> ({h.dept}) — {h.action}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#B0AA96' }}>
                  {formatDateTime(h.atISO) !== '—' ? formatDateTime(h.atISO) : h.at}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// ONGOING PROCESSES — full manager page (modal). Table of every
// product+batch with its current process; only Production sees the
// Add / Change / Delete controls. Everyone else gets search + history.
// ---------------------------------------------------------------------
function ProcessesModal({ user, processes, onClose, onReload }) {
  const canManage = canManageProcesses(user);
  const [addOpen, setAddOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [newProcess, setNewProcess] = useState(PROCESS_STEPS[0].key);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [changeRecord, setChangeRecord] = useState(null);
  const [historyRecord, setHistoryRecord] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Memoized — typing into the "Start new process" form below (Product
  // Name / Batch Number) lives in this same component and used to
  // re-filter the whole processes list on every keystroke even though
  // only `search` should trigger that.
  const visible = useMemo(
    () =>
      processes.filter(
        (p) =>
          !search ||
          (p.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
          (p.batch_number || '').toLowerCase().includes(search.toLowerCase())
      ),
    [processes, search]
  );

  const submitAdd = async () => {
    if (!productName || !batchNumber) { setError('Product Name and Batch Number are required.'); return; }
    setSaving(true);
    const record = {
      id: nextProdId('PROC'),
      product_name: productName,
      batch_number: batchNumber,
      current_process: newProcess,
      history: [{ dept: user.dept, user: user.name, action: `Process started — ${newProcess}`, at: now(), atISO: nowISO() }],
      created_by: user.name,
      created_dept: user.dept,
      updated_at: nowISO(),
    };
    const { error: err } = await supabase.from('production_processes').insert([record]);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setAddOpen(false);
    setProductName('');
    setBatchNumber('');
    setNewProcess(PROCESS_STEPS[0].key);
    onReload();
  };

  const deleteRecord = async (rec) => {
    const { error: err } = await supabase.from('production_processes').delete().eq('id', rec.id);
    if (err) { alert('Failed to delete: ' + describeSupabaseError(err)); return; }
    onReload();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 65, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '32px 20px', overflowY: 'auto' }}>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(4,7,17,0.55)', backdropFilter: 'blur(4px)' }} />
      <div className="wb-history-modal" style={{ position: 'relative', background: 'white', borderRadius: 20, width: '100%', maxWidth: 920, boxShadow: '0 40px 90px rgba(4,7,17,0.4)', overflow: 'hidden' }}>
        <div style={{ padding: '26px 30px', background: `linear-gradient(120deg, ${INK_DEEP} 0%, ${INK} 60%, ${MIDNIGHT} 100%)`, position: 'relative', overflow: 'hidden' }}>
          <div className="wb-prod-hero-gridlines" />
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#9EEBE0', fontSize: 11, letterSpacing: '0.14em', margin: 0 }}>PRODUCTION FLOOR</p>
              <h2 className="wb-serif" style={{ color: '#F8F4E9', fontSize: 26, margin: '6px 0 0' }}>Ongoing Processes</h2>
              <p style={{ color: 'rgba(248,244,233,0.5)', fontSize: 13, margin: '6px 0 0' }}>
                Live process tracking, per product &amp; batch — {canManage ? 'Production has full control.' : 'view only.'}
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }}>
              <X size={18} color="#F8F4E9" />
            </button>
          </div>
        </div>

        <div style={{ padding: '22px 30px', maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} color="#9C9585" style={{ position: 'absolute', left: 10, top: 10 }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product or batch…" style={{ padding: '9px 12px 9px 30px', border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 13, width: 220 }} />
            </div>
            {canManage && (
              <button onClick={() => setAddOpen((o) => !o)} className="wb-btn wb-btn-gold" style={{ display: 'flex', alignItems: 'center', gap: 6, background: GOLD, color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                <Plus size={14} /> Start new process
              </button>
            )}
          </div>

          {addOpen && canManage && (
            <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
              {error && <div style={{ background: '#FBEAEA', color: IPQ_RED, fontSize: 12, padding: '8px 10px', borderRadius: 6, marginBottom: 12 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, color: '#8A8370' }}>Product Name</label>
                  <div style={{ marginTop: 4 }}>
                    <ProductNameAutocomplete
                      value={productName}
                      onChange={setProductName}
                      placeholder="Start typing… e.g. Paracetamol, Titek, Amvazide"
                    />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: 11, color: '#8A8370' }}>Batch Number</label>
                  <input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4, border: `1px solid ${LINE}`, borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#8A8370', marginBottom: 10 }}>STARTING PROCESS</p>
              <ProcessPickerGrid selected={newProcess} onSelect={setNewProcess} />
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button disabled={saving} onClick={submitAdd} style={{ background: GOLD, color: 'white', border: 'none', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                  {saving ? 'Saving…' : 'Add & start tracking'}
                </button>
                <button onClick={() => setAddOpen(false)} style={{ background: 'none', border: 'none', color: '#7A7460', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ background: 'white', borderRadius: 12, border: `1px solid ${LINE}`, overflow: 'auto' }}>
            <table style={{ width: '100%', minWidth: 640, fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: PAPER, textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Product Name</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Batch No.</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Current Process</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Last Updated</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}> </th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9C9585' }}>No processes tracked yet.</td></tr>
                )}
                {visible.map((p) => (
                  <tr key={p.id} className="wb-inv-row" style={{ borderTop: `1px solid ${LINE}` }}>
                    <td style={{ padding: '13px 16px', color: INK, fontWeight: 500 }}>{p.product_name}</td>
                    <td style={{ padding: '13px 16px', color: '#7A7460' }}>{p.batch_number}</td>
                    <td style={{ padding: '13px 16px' }}><ProcessBadge process={p.current_process} /></td>
                    <td style={{ padding: '13px 16px', color: '#7A7460', whiteSpace: 'nowrap' }}>{formatDateTime(p.updated_at)}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <button onClick={() => setHistoryRecord(p)} title="History" style={{ background: 'none', border: 'none', color: '#5C5646', cursor: 'pointer', display: 'flex' }}>
                          <History size={14} />
                        </button>
                        {canManage && (
                          <>
                            <button onClick={() => setChangeRecord(p)} title="Change process" style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', display: 'flex' }}>
                              <Repeat size={14} />
                            </button>
                            <button onClick={() => setConfirmDelete(p)} title="Delete" style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', display: 'flex' }}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {changeRecord && <ProcessChangeModal user={user} record={changeRecord} onClose={() => setChangeRecord(null)} onSaved={onReload} />}
      {historyRecord && <ProcessHistoryModal record={historyRecord} onClose={() => setHistoryRecord(null)} />}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this process record?"
        message={confirmDelete ? `Delete "${confirmDelete.product_name}" — Batch ${confirmDelete.batch_number}? This removes its full process history. This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={() => { deleteRecord(confirmDelete); setConfirmDelete(null); }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
function ConfirmDialog({ open, title, message, confirmLabel = 'OK', danger = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(4,7,17,0.5)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', background: 'white', borderRadius: 14, width: '100%', maxWidth: 420, padding: 24, boxShadow: '0 32px 80px rgba(4,7,17,0.35)' }}>
        <p style={{ fontFamily: "'Playfair Display', serif", color: INK, fontSize: 17, margin: '0 0 10px' }}>{title}</p>
        <p style={{ color: '#5C5646', fontSize: 13, margin: '0 0 20px', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ background: 'white', border: `1px solid ${LINE}`, color: '#7A7460', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={onConfirm} style={{ background: danger ? RED : GOLD, color: 'white', border: 'none', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// DAILY PACKING FORM — Add AND Edit share this modal.
//
// ADD mode: logs a new packing_done entry against a batch (an existing
// one, or a brand-new one created right here). Date/time are always
// server-generated.
//
// EDIT mode: only the department that owns the record (Production) can
// get here — enforced by DailyPackingTable only rendering the Edit
// button for canManageProduction(user). Editing only changes the
// Packing Done amount and note for THIS entry; the batch/product it
// belongs to cannot be changed (that would corrupt the running total
// for a different batch) — to move an entry to a different batch,
// delete it and log a fresh one.
// ---------------------------------------------------------------------
function DailyPackingModal({ user, batches, entry, onClose, onSaved }) {
  const isEdit = !!entry;
  const [batchMode, setBatchMode] = useState('existing'); // 'existing' | 'new'
  const [productName, setProductName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [batchSize, setBatchSize] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');
  const [packingDone, setPackingDone] = useState(isEdit ? String(entry.packing_done) : '');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const activeBatches = useMemo(() => batches.filter((b) => b.status === 'Active'), [batches]);

  // Live preview of the same-batch-number auto-merge for the "New
  // batch" form below — memoized on batch number + product name only,
  // so typing in Packing Done or the Note field doesn't re-scan the
  // batches list.
  const liveNewBatchMatch = useMemo(() => {
    if (batchMode !== 'new') return null;
    return wbFindBatchMatch(
      activeBatches,
      batchNumber,
      (b) => (b.product_name || '').trim().toLowerCase() === (productName || '').trim().toLowerCase()
    );
  }, [batchMode, activeBatches, batchNumber, productName]);

  const submit = async () => {
    setError('');
    if (!packingDone || Number(packingDone) <= 0) {
      setError('Enter a valid Packing Done (Packs) amount.');
      return;
    }
    setSaving(true);

    // ---- EDIT an existing Daily Packing entry -------------------------
    if (isEdit) {
      const previousQty = Number(entry.packing_done);
      const newQty = Number(packingDone);
      const historyEntry = {
        dept: user.dept,
        user: user.name,
        action: 'Packing Done amount updated',
        at: now(),
        atISO: nowISO(),
        previousQty,
        newQty,
        note: note || '',
      };
      const newHistory = Array.isArray(entry.history)
        ? [...entry.history, historyEntry]
        : [historyEntry];

      const { error: updErr } = await supabase
        .from('production_packing_entries')
        .update({
          packing_done: newQty,
          history: newHistory,
          updated_at: nowISO(),
        })
        .eq('id', entry.id);

      setSaving(false);
      if (updErr) {
        setError(updErr.message);
        return;
      }
      await logAudit({
        action: 'Packing Entry Updated',
        table: 'production_packing_entries',
        recordId: entry.id,
        user,
        oldValue: { packing_done: previousQty },
        newValue: { packing_done: newQty },
      });
      onSaved();
      onClose();
      return;
    }

    // ---- ADD a new Daily Packing entry --------------------------------
    try {
      let batchId = selectedBatchId;
      let product = productName;
      let batchNo = batchNumber;

      if (batchMode === 'new') {
        if (!productName || !batchNumber || !batchSize) {
          setError('Product Name, Batch Number and Batch Size are required for a new batch.');
          setSaving(false);
          return;
        }

        // Same-batch-number auto-merge: if an Active batch already
        // exists with this exact batch number (trimmed, case-insensitive)
        // for this product, log straight against it instead of creating
        // a duplicate batch row.
        const autoMerge = wbFindBatchMatch(
          activeBatches,
          batchNumber,
          (b) => (b.product_name || '').trim().toLowerCase() === productName.trim().toLowerCase()
        );

        if (autoMerge) {
          batchId = autoMerge.id;
          product = autoMerge.product_name;
          batchNo = autoMerge.batch_number;
        } else {
          const newBatch = {
            id: nextProdId('BATCH'),
            product_name: productName,
            batch_number: batchNumber,
            batch_size: Number(batchSize),
            status: 'Active',
            created_by: user.name,
            created_dept: user.dept,
          };
          const { data, error: insErr } = await supabase
            .from('production_batches')
            .insert([newBatch])
            .select();
          if (insErr) {
            if (insErr.message.includes('duplicate')) {
              // Race with another user, or a batch matched on batch
              // number + product under different casing/whitespace —
              // fall back to whichever batch actually exists now.
              const fallback = wbFindBatchMatch(
                batches,
                batchNumber,
                (b) => (b.product_name || '').trim().toLowerCase() === productName.trim().toLowerCase()
              );
              if (fallback) {
                batchId = fallback.id;
                product = fallback.product_name;
                batchNo = fallback.batch_number;
              } else {
                setError(insErr.message);
                setSaving(false);
                return;
              }
            } else {
              setError(insErr.message);
              setSaving(false);
              return;
            }
          } else {
            batchId = data[0].id;
            await logAudit({
              action: 'Created',
              table: 'production_batches',
              recordId: batchId,
              user,
              newValue: newBatch,
            });
          }
        }
      } else {
        const b = batches.find((x) => x.id === selectedBatchId);
        if (!b) {
          setError('Select a batch.');
          setSaving(false);
          return;
        }
        product = b.product_name;
        batchNo = b.batch_number;
      }

      const packEntry = {
        id: nextProdId('PACK'),
        batch_id: batchId,
        product_name: product,
        batch_number: batchNo,
        packing_done: Number(packingDone),
        status: 'Logged',
        ipq_reason: null,
        history: [
          {
            dept: user.dept,
            user: user.name,
            action: 'Daily packing logged',
            at: now(),
            atISO: nowISO(),
            newQty: Number(packingDone),
            note: note || '',
          },
        ],
        created_by: user.name,
        created_dept: user.dept,
      };
      const { error: packErr } = await supabase
        .from('production_packing_entries')
        .insert([packEntry]);
      if (packErr) {
        setError(packErr.message);
        setSaving(false);
        return;
      }
      await logAudit({
        action: 'Packing Entry',
        table: 'production_packing_entries',
        recordId: packEntry.id,
        user,
        newValue: packEntry,
      });

      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(4,7,17,0.5)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', background: 'white', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 32px 80px rgba(4,7,17,0.35)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', background: `linear-gradient(120deg, ${INK_DEEP} 0%, ${INK} 100%)`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: 'rgba(248,244,233,0.55)', fontSize: 11, margin: 0, letterSpacing: '0.06em' }}>PRODUCTION</p>
            <h2 style={{ color: '#F8F4E9', fontSize: 20, margin: '4px 0 0', fontFamily: "'Playfair Display', serif" }}>
              {isEdit ? 'Edit Daily Packing Entry' : 'Daily Packing Entry'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' }}>
            <X size={16} color="#F8F4E9" />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {error && (
            <div style={{ background: '#FBEAEA', border: `1px solid ${IPQ_RED}`, borderRadius: 8, padding: '10px 12px', color: IPQ_RED, fontSize: 12, marginBottom: 14 }}>
              {error}
            </div>
          )}

          {isEdit ? (
            <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: INK }}>
                {entry.product_name} — Batch {entry.batch_number}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7A7460' }}>
                Product and batch can't be changed on an existing entry — delete
                and log a fresh entry if it belongs to the wrong batch.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  onClick={() => setBatchMode('existing')}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', border: batchMode === 'existing' ? `2px solid ${GOLD}` : `1px solid ${LINE}`, background: batchMode === 'existing' ? '#FBF3E3' : 'white', fontSize: 13, fontWeight: 600, color: INK }}
                >
                  Existing batch
                </button>
                <button
                  onClick={() => setBatchMode('new')}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', border: batchMode === 'new' ? `2px solid ${GOLD}` : `1px solid ${LINE}`, background: batchMode === 'new' ? '#FBF3E3' : 'white', fontSize: 13, fontWeight: 600, color: INK }}
                >
                  New batch
                </button>
              </div>

              {batchMode === 'existing' ? (
                <>
                  <label style={{ fontSize: 11, color: '#8A8370' }}>Product + Batch Number</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 16, border: `1px solid ${LINE}`, borderRadius: 6 }}
                  >
                    {activeBatches.length === 0 && <option value="">No active batches — create one</option>}
                    {activeBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.product_name} — {b.batch_number} ({b.total_packed}/{b.batch_size} packed)
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label style={{ fontSize: 11, color: '#8A8370' }}>Product Name</label>
                  <div style={{ marginTop: 4, marginBottom: 12 }}>
                    <ProductNameAutocomplete
                      value={productName}
                      onChange={setProductName}
                      placeholder="Start typing… e.g. Paracetamol, Titek, Amvazide"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: '#8A8370' }}>Batch Number</label>
                      <input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 16, border: `1px solid ${LINE}`, borderRadius: 6, boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: '#8A8370' }}>Batch Size (Packs)</label>
                      <input type="number" value={batchSize} onChange={(e) => setBatchSize(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 16, border: `1px solid ${LINE}`, borderRadius: 6, boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  {liveNewBatchMatch && (
                    <p className="wb-pna-merge-hint" style={{ margin: '-10px 0 14px', fontSize: 11, color: CYAN_DEEP, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Repeat size={11} /> Will merge into existing batch "{liveNewBatchMatch.batch_number}" ({liveNewBatchMatch.total_packed}/{liveNewBatchMatch.batch_size} packed so far) — no duplicate batch created
                    </p>
                  )}
                </>
              )}
            </>
          )}

          <label style={{ fontSize: 11, color: '#8A8370' }}>Packing Done (Packs) — this entry</label>
          <input type="number" value={packingDone} onChange={(e) => setPackingDone(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 16, border: `1px solid ${LINE}`, borderRadius: 6, boxSizing: 'border-box' }} />

          <label style={{ fontSize: 11, color: '#8A8370' }}>
            Note — reason for {isEdit ? 'this correction' : 'this entry'} (optional)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isEdit ? 'e.g. Miscount corrected, re-verified against packing slip…' : 'e.g. Morning shift run, line 2…'}
            style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 16, border: `1px solid ${LINE}`, borderRadius: 6, boxSizing: 'border-box' }}
          />

          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#7A7460', marginBottom: 18 }}>
            <span>Date/Time: <b>auto-generated on save</b></span>
            <span>{isEdit ? 'Edited by' : 'Created by'}: <b>{user.name}</b></span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={saving}
              onClick={submit}
              style={{ background: saving ? '#D8D2C0' : GOLD, color: 'white', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save packing entry'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7A7460', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// MARK / RESUME IPQ ON A DAILY PACKING ENTRY — same pattern as the main
// document workflow's IPQ hold in App.jsx: a manual, red "on hold" flag
// with a reason, logged into the entry's own history. Production-only.
// ---------------------------------------------------------------------
function PackingIPQModal({ user, entry, onClose, onSaved }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isResuming = entry.status === 'IPQ';

  const submit = async () => {
    setSaving(true);
    setError('');
    const historyEntry = isResuming
      ? {
          dept: user.dept,
          user: user.name,
          action: 'Resumed from IPQ — back to Logged',
          at: now(),
          atISO: nowISO(),
        }
      : {
          dept: user.dept,
          user: user.name,
          action: `Marked as IPQ (Holding)${reason ? ' — ' + reason : ''}`,
          at: now(),
          atISO: nowISO(),
          ipq: true,
        };
    const newHistory = Array.isArray(entry.history)
      ? [...entry.history, historyEntry]
      : [historyEntry];

    const { error: err } = await supabase
      .from('production_packing_entries')
      .update({
        status: isResuming ? 'Logged' : 'IPQ',
        ipq_reason: isResuming ? null : reason,
        history: newHistory,
        updated_at: nowISO(),
      })
      .eq('id', entry.id);

    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    await logAudit({
      action: isResuming ? 'Packing Entry Resumed' : 'Packing Entry IPQ',
      table: 'production_packing_entries',
      recordId: entry.id,
      user,
      newValue: { status: isResuming ? 'Logged' : 'IPQ', reason },
    });
    onSaved();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(4,7,17,0.5)' }} />
      <div style={{ position: 'relative', background: 'white', borderRadius: 14, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 32px 80px rgba(4,7,17,0.35)' }}>
        <p style={{
          color: isResuming ? '#1F4B3F' : IPQ_RED,
          fontSize: 15,
          fontWeight: 700,
          margin: '0 0 6px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          {isResuming ? <PlayCircle size={17} /> : <PauseCircle size={17} />}
          {isResuming ? 'Resume this packing entry' : 'Mark as IPQ — Holding'}
        </p>
        <p style={{ color: '#7A7460', fontSize: 13, margin: '0 0 16px' }}>
          {entry.product_name} — Batch {entry.batch_number} · {entry.packing_done} packs
        </p>
        {error && <div style={{ background: '#FBEAEA', color: IPQ_RED, fontSize: 12, padding: '8px 10px', borderRadius: 6, marginBottom: 12 }}>{error}</div>}

        {!isResuming && (
          <>
            <label style={{ fontSize: 11, color: '#8A8370' }}>Reason for holding this entry</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Count under review, quality query raised…"
              style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 16, border: `1px solid ${IPQ_RED}`, borderRadius: 6, boxSizing: 'border-box' }}
            />
          </>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            disabled={saving}
            onClick={submit}
            style={{
              background: saving ? '#D8D2C0' : isResuming ? '#1F4B3F' : IPQ_RED,
              color: 'white',
              border: 'none',
              padding: '9px 16px',
              borderRadius: 8,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {saving ? 'Saving…' : isResuming ? 'Confirm — Resume' : 'Confirm — Mark as IPQ'}
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7A7460', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// DAILY PACKING HISTORY — every change made to a single packing entry,
// newest first: the original log, any Packing Done corrections (with
// previous → new amount), and every IPQ hold / resume, each with who,
// which department, and exactly when. Item name, batch number and batch
// size are shown in the header so the record is fully identifiable at a
// glance. Read-only for everyone, including Production — history is a
// log, not an editable record.
// ---------------------------------------------------------------------
function PackingHistoryModal({ entry, batch, onClose }) {
  if (!entry) return null;
  const entries = Array.isArray(entry.history) ? [...entry.history].reverse() : [];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(4,7,17,0.5)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'relative', background: 'white', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(4,7,17,0.35)', overflow: 'hidden' }}>
        <div style={{ borderBottom: `1px solid ${LINE}`, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: `linear-gradient(120deg, ${INK_DEEP} 0%, ${INK} 100%)` }}>
          <div>
            <p style={{ color: 'rgba(248,244,233,0.55)', fontSize: 11, margin: 0, letterSpacing: '0.06em' }}>DAILY PACKING — RECORD HISTORY</p>
            <h2 style={{ color: '#F8F4E9', fontSize: 20, margin: '4px 0 0', fontFamily: "'Playfair Display', serif" }}>
              {entry.product_name}
            </h2>
            <p style={{ color: 'rgba(248,244,233,0.5)', fontSize: 12, margin: '6px 0 0' }}>
              Batch No. {entry.batch_number} · Batch Size {batch ? batch.batch_size : '—'} packs · This entry: {entry.packing_done} packs
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer' }}>
            <X size={16} color="#F8F4E9" />
          </button>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: entry.status === 'IPQ' ? '#FBEAEA' : '#E9F3EC', color: entry.status === 'IPQ' ? IPQ_RED : '#1F4B3F', fontWeight: 600 }}>
              {entry.status === 'IPQ' ? 'IPQ — Holding' : 'Logged'}
            </span>
            <span style={{ fontSize: 11, color: '#9C9585' }}>
              Logged by {entry.created_by} ({entry.created_dept}) · {formatDateTime(entry.created_at)}
            </span>
          </div>

          <p style={{ color: '#8A8370', fontSize: 12, marginBottom: 12 }}>
            COMPLETE HISTORY — every change, newest first
          </p>

          {entries.length === 0 && (
            <p style={{ color: '#9C9585', fontSize: 13 }}>No recorded changes yet for this entry.</p>
          )}

          {entries.map((h, i) => (
            <div key={i} style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: '14px 16px', marginBottom: 12, background: i === 0 ? '#FBF3E3' : 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <p style={{ color: h.ipq ? IPQ_RED : INK, fontSize: 13, fontWeight: 600, margin: 0 }}>{h.action}</p>
                  <p style={{ color: '#7A7460', fontSize: 12, margin: '2px 0 0' }}>{h.user} ({h.dept})</p>
                </div>
                <p style={{ color: '#B0AA96', fontSize: 11, margin: 0, whiteSpace: 'nowrap' }}>
                  {formatDateTime(h.atISO) !== '—' ? formatDateTime(h.atISO) : h.at}
                </p>
              </div>
              {(h.previousQty != null || h.newQty != null) && (
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#5C5646', marginTop: 8 }}>
                  {h.previousQty != null && (
                    <span><span style={{ color: '#9C9585' }}>Previous: </span><b>{h.previousQty} packs</b></span>
                  )}
                  {h.newQty != null && (
                    <span><span style={{ color: '#9C9585' }}>New: </span><b>{h.newQty} packs</b></span>
                  )}
                </div>
              )}
              {h.note && (
                <p style={{ color: '#5C5646', fontSize: 12, margin: '10px 0 0', paddingTop: 10, borderTop: `1px solid ${LINE}` }}>
                  {h.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// SEND TO WAREHOUSE — deliberately its own separate control, kept on
// the Batches Overview table (not inside the Daily Packing table). It
// creates a warehouse_transfers row pulling product/batch/quantity
// straight from the completed batch — nothing to do with individual
// Daily Packing entries or their IPQ status.
//
// The quantity field is hard-capped to `remaining` (the packs not yet
// sent for this batch) via the input's max attribute AND a client-side
// check before submit — so a user can never type in more than what's
// actually left, and whatever amount they DO send is what gets
// subtracted from "Remaining to Send" the moment the transfer is
// recorded (see batchesWithSendInfo below, which recomputes
// remainingToSend from live transfer totals every time transfers or
// batches reload). Each subsequent "Send to Warehouse" on the same batch
// then starts from whatever is left over — never double-counting an
// amount that was already sent.
// ---------------------------------------------------------------------
function SendToWarehouseModal({ user, batch, onClose, onSaved }) {
  const remaining = batch.remainingToSend != null ? batch.remainingToSend : batch.total_packed;
  const [quantity, setQuantity] = useState(remaining || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!quantity || Number(quantity) <= 0) {
      setError('Enter a valid quantity.');
      return;
    }
    if (remaining != null && Number(quantity) > Number(remaining)) {
      setError(`Only ${remaining} packs from this batch haven't been sent yet — lower the quantity or check with Production.`);
      return;
    }
    setSaving(true);
    const transfer = {
      id: nextProdId('WT'),
      product_name: batch.product_name,
      batch_number: batch.batch_number,
      batch_id: batch.id,
      quantity: Number(quantity),
      status: 'Pending',
      sent_by: user.name,
    };
    const { error: err } = await supabase.from('warehouse_transfers').insert([transfer]);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    await logAudit({ action: 'Warehouse Transfer', table: 'warehouse_transfers', recordId: transfer.id, user, newValue: transfer });
    onSaved();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(4,7,17,0.5)' }} />
      <div style={{ position: 'relative', background: 'white', borderRadius: 14, width: '100%', maxWidth: 420, padding: 24, boxShadow: '0 32px 80px rgba(4,7,17,0.35)' }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", color: INK, margin: '0 0 6px' }}>Send to Warehouse</h3>
        <p style={{ color: '#7A7460', fontSize: 13, margin: '0 0 6px' }}>
          {batch.product_name} — Batch {batch.batch_number}
        </p>
        <p style={{ color: '#9C9585', fontSize: 12, margin: '0 0 16px' }}>
          {batch.total_packed} packed total · {batch.alreadySent || 0} already sent · {remaining} not yet sent
        </p>
        {error && <div style={{ background: '#FBEAEA', color: IPQ_RED, fontSize: 12, padding: '8px 10px', borderRadius: 6, marginBottom: 12 }}>{error}</div>}
        <label style={{ fontSize: 11, color: '#8A8370' }}>Quantity to transfer</label>
        <input
          type="number"
          min={1}
          max={remaining || undefined}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 6, border: `1px solid ${LINE}`, borderRadius: 6, boxSizing: 'border-box' }}
        />
        <p style={{ color: '#B0AA96', fontSize: 11, margin: '0 0 16px' }}>
          Whatever amount you send here is subtracted from this batch's remaining-to-send total immediately — the next time you send, it starts from what's left.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={saving} onClick={submit} style={{ background: GOLD, color: 'white', border: 'none', padding: '9px 16px', borderRadius: 8, cursor: 'pointer' }}>
            {saving ? 'Sending…' : 'Confirm & send'}
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7A7460', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// WAREHOUSE RECEIVING PANEL — visible to Warehouse only. Accept calls
// the fn_accept_warehouse_transfer RPC (one atomic transaction): it
// marks the transfer Received AND upserts the quantity straight into
// the shared "inventory" table under category = 'Finished Goods', so it
// appears on the Warehouse Inventory > Finished Goods tab immediately
// via that table's realtime subscription — no reload needed, and
// duplicate accepts are impossible even if clicked twice.
//
// UNIT CHOICE ON ACCEPT — Finished Goods now lives inside the CEPH. /
// GENERAL unit split (see WAREHOUSE_UNITS / unitOf above), but a
// warehouse_transfers row itself carries no unit — Production's "Send
// to Warehouse" only ever records product/batch/quantity. So the
// moment Warehouse clicks "Accept", instead of firing the RPC straight
// away, this now opens a small inline CEPH. / GENERAL picker on that
// row; whichever one is clicked is passed to the RPC as p_unit_group,
// and that's the unit_group the new/updated Finished Goods row is
// tagged with — so it lands on the CEPH. unit's Finished Goods tab or
// the GENERAL unit's, never both, and never ambiguous.
//
// Server-side requirement: fn_accept_warehouse_transfer must accept a
// p_unit_group parameter and write it onto the inventory row's
// unit_group column when it upserts. Existing calls without this
// picker will break once the function is updated — the SQL below
// updates the function to take a p_unit_group text default 'CEPH' as
// well, so nothing else in the app has to change:
//
//   -- adjust body to match whatever the existing function already
//   -- does; the only addition is p_unit_group being written onto the
//   -- inventory upsert's unit_group column.
//   -- (Run only after checking the current function definition in
//   -- the Supabase SQL editor — this is a template, not a blind copy/
//   -- paste, since the existing body's exact upsert logic isn't
//   -- visible from the client code.)
// ---------------------------------------------------------------------
function WarehouseReceivingPanel({ user, transfers, onChanged }) {
  const [busyId, setBusyId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');
  const [choosingUnitId, setChoosingUnitId] = useState(null);

  const pending = transfers.filter((t) => t.status === 'Pending');

  const accept = async (t, unitGroup) => {
    setBusyId(t.id);
    const { error } = await supabase.rpc('fn_accept_warehouse_transfer', {
      p_transfer_id: t.id,
      p_received_by: user.name,
      p_unit_group: unitGroup,
    });
    setBusyId(null);
    setChoosingUnitId(null);
    if (error) {
      alert('Failed to accept: ' + error.message);
      return;
    }
    onChanged();
  };

  const reject = async (t) => {
    setBusyId(t.id);
    const { error } = await supabase.rpc('fn_reject_warehouse_transfer', {
      p_transfer_id: t.id,
      p_rejected_by: user.name,
      p_reason: reason,
    });
    setBusyId(null);
    setRejectingId(null);
    setReason('');
    if (error) {
      alert('Failed to reject: ' + error.message);
      return;
    }
    onChanged();
  };

  if (pending.length === 0) return null;

  return (
    <div style={{ background: 'white', border: `1px solid ${GOLD}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <InboxIcon size={16} color={GOLD} />
        <p style={{ fontFamily: "'Playfair Display', serif", color: INK, fontSize: 16, margin: 0 }}>
          Incoming from Production — {pending.length} pending
        </p>
      </div>
      {pending.map((t) => (
        <div key={t.id} style={{ borderTop: `1px solid ${LINE}`, padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: INK, fontWeight: 600 }}>{t.product_name} — Batch {t.batch_number}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7A7460' }}>
              Qty {t.quantity} · Sent by {t.sent_by} · {formatDateTime(t.sent_at)}
            </p>
          </div>
          {rejectingId === t.id ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} style={{ padding: 6, border: `1px solid ${LINE}`, borderRadius: 6, fontSize: 12 }} />
              <button onClick={() => reject(t)} disabled={busyId === t.id} style={{ background: RED, color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Confirm</button>
              <button onClick={() => setRejectingId(null)} style={{ background: 'none', border: 'none', color: '#7A7460', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
            </div>
          ) : choosingUnitId === t.id ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#7A7460' }}>Receive into:</span>
              {WAREHOUSE_UNITS.map((u) => (
                <button
                  key={u.key}
                  onClick={() => accept(t, u.key)}
                  disabled={busyId === t.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: u.accent, color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  <u.icon size={13} /> {busyId === t.id ? 'Accepting…' : `${u.label} Finished Goods`}
                </button>
              ))}
              <button onClick={() => setChoosingUnitId(null)} disabled={busyId === t.id} style={{ background: 'none', border: 'none', color: '#7A7460', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setChoosingUnitId(t.id)} disabled={busyId === t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1F4B3F', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
                <CheckCircle2 size={13} /> Accept
              </button>
              <button onClick={() => setRejectingId(t.id)} style={{ background: 'white', border: `1px solid ${RED}`, color: RED, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// WAREHOUSE TRANSFERS — HISTORY PANEL
//
// WarehouseReceivingPanel above only ever shows transfers where
// status === 'Pending'. The moment Warehouse accepts or rejects one, it
// disappears from that panel entirely — this panel is the fix: it lists
// every transfer with its real status, so an Accepted/Rejected outcome
// never just vanishes.
// ---------------------------------------------------------------------
function TransfersHistoryPanel({ transfers }) {
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today'

  const sorted = [...transfers].sort(
    (a, b) => new Date(b.sent_at || 0) - new Date(a.sent_at || 0)
  );
  const list = dateFilter === 'today' ? sorted.filter((t) => isToday(t.sent_at)) : sorted;

  const statusStyle = (status) => {
    if (status === 'Received') return { bg: '#E9F3EC', fg: '#1F4B3F' };
    if (status === 'Rejected') return { bg: '#FBEAEA', fg: IPQ_RED };
    return { bg: '#FBF3E3', fg: AMBER }; // Pending
  };

  return (
    <div style={{ background: 'white', border: `1px solid ${LINE}`, borderRadius: 12, padding: 18, marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Truck size={16} color={GOLD} />
          <p style={{ fontFamily: "'Playfair Display', serif", color: INK, fontSize: 16, margin: 0 }}>
            Warehouse Transfers
          </p>
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{ padding: '6px 10px', border: `1px solid ${LINE}`, borderRadius: 6, fontSize: 12 }}
        >
          <option value="all">All time</option>
          <option value="today">Today</option>
        </select>
      </div>

      {list.length === 0 && (
        <p style={{ color: '#9C9585', fontSize: 13 }}>No transfers yet.</p>
      )}

      {list.map((t) => {
        const s = statusStyle(t.status);
        const label = t.status === 'Received' ? 'Accepted' : t.status;
        return (
          <div
            key={t.id}
            style={{
              borderTop: `1px solid ${LINE}`,
              padding: '10px 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 13, color: INK, fontWeight: 600 }}>
                {t.product_name} — Batch {t.batch_number}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7A7460' }}>
                Qty {t.quantity} · Sent by {t.sent_by} · {formatDateTime(t.sent_at)}
                {t.status === 'Received' && t.received_by
                  ? ` · Accepted by ${t.received_by}${t.received_at ? ' · ' + formatDateTime(t.received_at) : ''}`
                  : ''}
                {t.status === 'Rejected' && t.rejected_reason ? ` · Reason: ${t.rejected_reason}` : ''}
              </p>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 999,
                background: s.bg,
                color: s.fg,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------
// DAILY PACKING TABLE — the primary record on this page. Every
// department with access can VIEW it (search, filter, open history);
// ONLY Production can Add, Edit, Delete, or toggle IPQ. This mirrors
// canManageInventory()'s two-layer enforcement in App.jsx exactly:
//   1. UI level (here) — hides the Add/Edit/Delete/IPQ controls for
//      anyone who isn't Production.
//   2. Application-logic level (the handleXxx functions in the parent
//      component below) — refuses the mutation even if it were somehow
//      triggered without going through this hidden UI.
// ---------------------------------------------------------------------
function DailyPackingTable({ user, entries, batches, onAddClick, onEditClick, onDelete, onIpqClick, onHistoryClick }) {
  const canManage = canManageProduction(user);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('today'); // 'today' | 'all'

  const batchById = useMemo(() => {
    const m = {};
    batches.forEach((b) => { m[b.id] = b; });
    return m;
  }, [batches]);

  // Memoized — previously ran on every render of this table (including
  // ones caused by unrelated state elsewhere on the page), re-scanning
  // every packing entry each time even when search/filters/entries
  // hadn't changed. Now it only re-filters when one of its actual
  // inputs changes.
  const filtered = useMemo(() => entries.filter((e) => {
    if (statusFilter !== 'All' && e.status !== statusFilter) return false;
    if (dateFilter === 'today' && !isToday(e.created_at)) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(e.product_name || '').toLowerCase().includes(s) && !(e.batch_number || '').toLowerCase().includes(s)) return false;
    }
    return true;
  }), [entries, statusFilter, dateFilter, search]);

  const exportCsv = () => {
    csvExport(
      `daily-packing-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((e) => ({
        ...e,
        batch_size: batchById[e.batch_id]?.batch_size ?? '',
      })),
      [
        { key: 'product_name', label: 'Product Name' },
        { key: 'batch_number', label: 'Batch Number' },
        { key: 'batch_size', label: 'Batch Size (Packs)' },
        { key: 'packing_done', label: 'Packing Done (Packs)' },
        { key: 'status', label: 'Status' },
        { key: 'ipq_reason', label: 'IPQ Reason' },
        { key: 'created_by', label: 'Logged By' },
        { key: 'created_dept', label: 'Department' },
      ]
    );
  };

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: canManage ? PAPER : '#FBF3E3', border: `1px solid ${canManage ? LINE : GOLD}`, borderRadius: 8, padding: '8px 12px', marginBottom: 14, color: canManage ? '#7A7460' : AMBER, fontSize: 12 }}>
        <Eye size={13} />
        {canManage
          ? ' Visible to every department with access. As Production, you can log, edit, delete and mark IPQ on Daily Packing entries below.'
          : ' View only — Daily Packing is logged, edited, deleted and put on IPQ hold exclusively by the Production department.'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={16} color={GOLD} />
          <p style={{ fontFamily: "'Playfair Display', serif", color: INK, fontSize: 17, margin: 0 }}>Daily Packing</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} color="#9C9585" style={{ position: 'absolute', left: 10, top: 9 }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product or batch…" style={{ padding: '8px 10px 8px 30px', border: `1px solid ${LINE}`, borderRadius: 6, fontSize: 12, width: 190 }} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 10px', border: `1px solid ${LINE}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All statuses</option>
            <option value="Logged">Logged</option>
            <option value="IPQ">IPQ — Holding</option>
          </select>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ padding: '8px 10px', border: `1px solid ${LINE}`, borderRadius: 6, fontSize: 12 }}>
            <option value="today">Today's entries</option>
            <option value="all">All time</option>
          </select>
          <button onClick={exportCsv} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: `1px solid ${LINE}`, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#5C5646' }}>
            <Download size={13} /> CSV
          </button>
          {canManage && (
            <button onClick={onAddClick} style={{ display: 'flex', alignItems: 'center', gap: 6, background: GOLD, color: 'white', border: 'none', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
              <Plus size={14} /> Log Daily Packing
            </button>
          )}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: `1px solid ${LINE}`, overflow: 'auto' }}>
        <table style={{ width: '100%', minWidth: 860, fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: PAPER, textAlign: 'left' }}>
              <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Item / Product Name</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Batch No.</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Batch Size (Packs)</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Packing Done (Packs)</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Status</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Logged By</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Date &amp; Time</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}> </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#9C9585' }}>No Daily Packing entries match this filter.</td></tr>
            )}
            {filtered.map((e) => {
              const batch = batchById[e.batch_id];
              const isIpq = e.status === 'IPQ';
              return (
                <tr
                  key={e.id}
                  onClick={() => onHistoryClick(e)}
                  className="wb-inv-row"
                  style={{ borderTop: `1px solid ${LINE}`, background: isIpq ? '#FDF4F4' : 'transparent', cursor: 'pointer' }}
                >
                  <td style={{ padding: '13px 16px', color: INK, fontWeight: 500 }}>
                    {e.product_name}
                    {Array.isArray(e.history) && e.history.length > 1 && (
                      <History size={12} color="#B0AA96" style={{ display: 'inline', marginLeft: 6, verticalAlign: 'middle' }} />
                    )}
                  </td>
                  <td style={{ padding: '13px 16px', color: '#7A7460' }}>{e.batch_number}</td>
                  <td style={{ padding: '13px 16px', color: '#7A7460' }}>{batch ? batch.batch_size : '—'}</td>
                  <td style={{ padding: '13px 16px', color: '#7A7460', fontWeight: 600 }}>{e.packing_done}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: isIpq ? '#FBEAEA' : '#E9F3EC', color: isIpq ? IPQ_RED : '#1F4B3F', fontWeight: 600 }}>
                      {isIpq ? 'IPQ — Holding' : 'Logged'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', color: '#7A7460' }}>{e.created_by} <span style={{ color: '#B0AA96' }}>({e.created_dept})</span></td>
                  <td style={{ padding: '13px 16px', color: '#7A7460', whiteSpace: 'nowrap' }}>{formatDateTime(e.created_at)}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={(ev) => { ev.stopPropagation(); onHistoryClick(e); }} title="View history" style={{ background: 'none', border: 'none', color: '#5C5646', cursor: 'pointer', display: 'flex' }}>
                        <History size={14} />
                      </button>
                      {canManage && (
                        <>
                          <button onClick={(ev) => { ev.stopPropagation(); onEditClick(e); }} title="Edit" style={{ background: 'none', border: 'none', color: '#5C5646', cursor: 'pointer', display: 'flex' }}>
                            <Pencil size={14} />
                          </button>
                          <button onClick={(ev) => { ev.stopPropagation(); onIpqClick(e); }} title={isIpq ? 'Resume' : 'Mark as IPQ'} style={{ background: 'none', border: 'none', color: isIpq ? '#1F4B3F' : IPQ_RED, cursor: 'pointer', display: 'flex' }}>
                            {isIpq ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                          </button>
                          <button onClick={(ev) => { ev.stopPropagation(); onDelete(e); }} title="Delete" style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', display: 'flex' }}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// BATCHES OVERVIEW — one row per batch with its running total (summed
// live from Daily Packing entries), remaining-to-pack, remaining-to-send,
// and status. "Send to Warehouse" and "Mark Completed" live here,
// deliberately separate from the Daily Packing table above — they act on
// the whole batch, not on an individual packing entry.
// ---------------------------------------------------------------------
function BatchesOverviewTable({ user, batches, onSendToWarehouse, onMarkCompleted, onDeleteBatch }) {
  const canManage = canManageProduction(user);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Memoized for the same reason as DailyPackingTable's `filtered`
  // above — avoids re-scanning every batch on renders that aren't
  // caused by a change to batches/search/statusFilter.
  const filtered = useMemo(() => batches.filter((b) => {
    if (statusFilter !== 'All' && b.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(b.product_name || '').toLowerCase().includes(s) && !(b.batch_number || '').toLowerCase().includes(s)) return false;
    }
    return true;
  }), [batches, statusFilter, search]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PackageSearch size={16} color={GOLD} />
          <p style={{ fontFamily: "'Playfair Display', serif", color: INK, fontSize: 17, margin: 0 }}>Batches Overview</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} color="#9C9585" style={{ position: 'absolute', left: 10, top: 9 }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product or batch…" style={{ padding: '8px 10px 8px 30px', border: `1px solid ${LINE}`, borderRadius: 6, fontSize: 12, width: 190 }} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 10px', border: `1px solid ${LINE}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: `1px solid ${LINE}`, overflow: 'auto' }}>
        <table style={{ width: '100%', minWidth: 860, fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: PAPER, textAlign: 'left' }}>
              <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Product Name</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Batch No.</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Batch Size (Packs)</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Total Packed</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Remaining to Pack</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Sent to Warehouse</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Remaining to Send</th>
              <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}>Status</th>
              {canManage && <th style={{ padding: '12px 16px', fontSize: 11, color: '#8A8370' }}> </th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#9C9585' }}>No batches match this filter.</td></tr>
            )}
            {filtered.map((b) => {
              const pct = b.batch_size ? Math.min(100, (b.total_packed / b.batch_size) * 100) : 0;
              const readyToComplete = b.status === 'Active' && Number(b.total_packed) >= Number(b.batch_size);
              return (
                <tr key={b.id} style={{ borderTop: `1px solid ${LINE}` }}>
                  <td style={{ padding: '13px 16px', color: INK, fontWeight: 500 }}>{b.product_name}</td>
                  <td style={{ padding: '13px 16px', color: '#7A7460' }}>{b.batch_number}</td>
                  <td style={{ padding: '13px 16px', color: '#7A7460' }}>{b.batch_size}</td>
                  <td style={{ padding: '13px 16px', color: '#7A7460' }}>
                    {b.total_packed}
                    <div style={{ height: 4, background: LINE, borderRadius: 2, marginTop: 4, width: 80 }}>
                      <div style={{ height: 4, width: `${pct}%`, background: GOLD, borderRadius: 2 }} />
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', color: Number(b.remainingToPack) > 0 ? AMBER : '#1F4B3F', fontWeight: 600 }}>
                    {b.remainingToPack} left to pack
                  </td>
                  <td style={{ padding: '13px 16px', color: '#1F4B3F', fontWeight: 600 }}>
                    {b.alreadySent}
                  </td>
                  <td style={{ padding: '13px 16px', color: Number(b.remainingToSend) > 0 ? IPQ_RED : '#1F4B3F', fontWeight: 600 }}>
                    {b.remainingToSend} remaining
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: b.status === 'Completed' ? '#E9F3EC' : '#FBF3E3', color: b.status === 'Completed' ? '#1F4B3F' : AMBER }}>
                      {b.status}
                    </span>
                  </td>
                  {canManage && (
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {b.status === 'Active' && (
                          <button
                            onClick={() => onMarkCompleted(b)}
                            title={readyToComplete ? 'Mark this batch Completed' : `Still ${b.batch_size - b.total_packed} packs left to pack — you can still mark it complete manually`}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: readyToComplete ? '#1F4B3F' : GOLD, color: 'white', border: 'none', padding: '7px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                          >
                            <CheckCircle2 size={13} /> Mark Completed
                          </button>
                        )}
                        <button
                          onClick={() => onSendToWarehouse(b)}
                          disabled={Number(b.remainingToSend) <= 0}
                          title={Number(b.remainingToSend) <= 0 ? (Number(b.total_packed) <= 0 ? 'Nothing packed yet for this batch' : 'Everything packed so far has already been sent') : `Send the ${b.remainingToSend} packs not yet sent`}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, background: Number(b.remainingToSend) > 0 ? INK : '#D8D2C0', color: 'white', border: 'none', padding: '7px 12px', borderRadius: 6, cursor: Number(b.remainingToSend) > 0 ? 'pointer' : 'not-allowed', fontSize: 12 }}
                        >
                          <Truck size={13} /> Send to Warehouse
                        </button>
                        <button
                          onClick={() => onDeleteBatch(b)}
                          title="Delete this batch"
                          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: `1px solid ${RED}`, color: RED, padding: '7px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// ERROR BOUNDARY — without this, any uncaught exception while rendering
// Packing Status (e.g. a legacy row with an unexpected null field)
// unmounts the ENTIRE app and leaves a blank white screen with no clue
// why. This catches it locally, shows a readable message, and lets the
// rest of the portal (sidebar, other pages) keep working.
// ---------------------------------------------------------------------
class ProductionInventoryErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('Packing Status crashed:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '28px 32px' }}>
          <div
            style={{
              background: '#FBEAEA',
              border: `1px solid ${IPQ_RED}`,
              borderRadius: 12,
              padding: '20px 24px',
              maxWidth: 640,
            }}
          >
            <p style={{ color: IPQ_RED, fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>
            Packing Status couldn't load
            </p>
            <p style={{ color: '#7A3A3A', fontSize: 13, margin: '0 0 12px' }}>
              Something in the data or connection made this page fail to
              render. Reloading usually fixes a one-off issue; if it keeps
              happening, share the technical detail below with whoever
              maintains the app.
            </p>
            <details style={{ fontSize: 12, color: '#7A3A3A' }}>
              <summary style={{ cursor: 'pointer' }}>Technical detail</summary>
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>
                {String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error)}
              </pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------
// PACKING STATUS HERO — now built on the shared VaultStyleHero (see
// above) so it matches Warehouse Inventory's emerald/gold marble-and-
// gem look exactly, rather than its old standalone ink/cyan radar
// treatment. "Sent today" gets the uniquely-animated truck tile, the
// same way "Received from Production" does on the Warehouse hero —
// batches leaving Production and arriving at Warehouse are really the
// same physical truck, so the two pages sharing that motion is
// intentional.
// ---------------------------------------------------------------------
function PackingStatusHero({ activeBatches, transfersToday, ipqHold, completedBatches }) {
  const cActive = useCountUp(activeBatches);
  const cIpq = useCountUp(ipqHold);
  const cCompleted = useCountUp(completedBatches);
  const cTransfers = useCountUp(transfersToday);

  const figures = [
    { label: 'Active batches', value: cActive, icon: Layers },
    { label: 'Completed', value: cCompleted, icon: CheckCircle2 },
    { label: 'IPQ hold', value: cIpq, icon: PauseCircle, alert: ipqHold > 0 },
  ];

  return (
    <VaultStyleHero
      idSuffix="packing"
      liveLabel="PACKING STATUS · LIVE"
      title="Packing Status"
      subtitle="Daily packing, batches and Warehouse transfers — tracked in real time"
      figures={figures}
      truckFigure={{
        label: 'Sent today',
        value: cTransfers,
        icon: ArrowUpCircle,
        badge: 0,
      }}
    />
  );
}

// ONGOING PROCESSES HERO — same shared vault look, as a clickable
// button (tapping it opens the full Ongoing Processes board). No truck
// tile here — four even stat tiles instead, since there's no single
// "shipment" figure that deserves the extra animation.
function OngoingProcessesHero({ processes, onOpenBoard }) {
  const total = processes.length;
  const uniqueProducts = new Set(processes.map((p) => p.product_name)).size;
  const updatedToday = processes.filter((p) => isToday(p.updated_at)).length;
  const uniqueStages = new Set(processes.map((p) => p.current_process)).size;

  const cTotal = useCountUp(total);
  const cProducts = useCountUp(uniqueProducts);
  const cToday = useCountUp(updatedToday);
  const cStages = useCountUp(uniqueStages);

  const figures = [
    { label: 'Ongoing processes', value: cTotal, icon: Radar },
    { label: 'Products tracked', value: cProducts, icon: Boxes },
    { label: 'Moved today', value: cToday, icon: Activity },
    { label: 'Stages in use', value: cStages, icon: Layers },
  ];

  return (
    <VaultStyleHero
      as="button"
      onClick={onOpenBoard}
      idSuffix="ongoing"
      liveLabel="PROCESS TRACKING · LIVE"
      title="Ongoing Processes"
      subtitle="Every product + batch currently moving through the floor — tap to manage"
      figures={figures}
    />
  );
}

 // ---------------------------------------------------------------------
// MAIN PAGE
// ---------------------------------------------------------------------
function ProductionInventoryPageInner({ user }) {
  const [batches, setBatches] = useState([]);
  const [entries, setEntries] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [packingModalOpen, setPackingModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [ipqEntry, setIpqEntry] = useState(null);
  const [historyEntry, setHistoryEntry] = useState(null);
  const [sendToWarehouseBatch, setSendToWarehouseBatch] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [processesModalOpen, setProcessesModalOpen] = useState(false);
  const [boardHistoryRecord, setBoardHistoryRecord] = useState(null);
  const canManage = canManageProduction(user);
  const canReceive = canReceiveWarehouse(user);
  const loadBatches = useCallback(async () => {
    const { data, error } = await supabase
      .from('production_batch_status')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.log('Error loading production batches:', error.message);
      return;
    }
    setBatches(data || []);
  }, []);

  const loadEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from('production_packing_entries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.log('Error loading daily packing entries:', error.message);
      return;
    }
    setEntries(
      (data || []).map((e) => ({
        ...e,
        history: Array.isArray(e.history) ? e.history : [],
      }))
    );
  }, []);

  const loadTransfers = useCallback(async () => {
    const { data, error } = await supabase
      .from('warehouse_transfers')
      .select('*')
      .order('sent_at', { ascending: false });
    if (error) {
      console.log('Error loading warehouse transfers:', error.message);
      return;
    }
    setTransfers(data || []);
  }, []);
  const loadProcesses = useCallback(async () => {
    const { data, error } = await supabase
      .from('production_processes')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) { console.log('Error loading processes:', error.message); return; }
    setProcesses((data || []).map((p) => ({ ...p, history: Array.isArray(p.history) ? p.history : [] })));
  }, []);
  const debouncedLoadProcesses = useDebouncedCallback(loadProcesses, 250);
  // Debounced — a batch update and its related packing-entry update tend
  // to arrive within milliseconds of each other, so without this a single
  // "log packing" action could trigger loadBatches() + loadEntries() two
  // or three times over instead of once each.
  const debouncedLoadBatches = useDebouncedCallback(loadBatches, 250);
  const debouncedLoadEntries = useDebouncedCallback(loadEntries, 250);
  const debouncedLoadTransfers = useDebouncedCallback(loadTransfers, 250);

  useEffect(() => {
    loadBatches();
    loadEntries();
    loadTransfers();
    const ch1 = supabase
      .channel(`prod-batches-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_batches' }, () => { debouncedLoadBatches(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_packing_entries' }, () => { debouncedLoadBatches(); debouncedLoadEntries(); })
      .subscribe();
    const ch2 = supabase
      .channel(`prod-transfers-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_transfers' }, debouncedLoadTransfers)
      .subscribe();
      loadProcesses(); // add next to loadBatches(); loadEntries(); loadTransfers();

const ch3 = supabase
  .channel(`prod-processes-${Math.random().toString(36).slice(2)}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'production_processes' }, debouncedLoadProcesses)
  .subscribe();
    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      supabase.removeChannel(ch3);
    };
  }, [loadBatches, loadEntries, loadTransfers, debouncedLoadBatches, debouncedLoadEntries, debouncedLoadTransfers]);

  // This useMemo used to sit BELOW the permission gate just under it, which
  // meant a user without access ran fewer hooks than one with access. React
  // identifies hooks purely by call order, so a render that skips one can
  // silently hand the wrong state to whichever hooks follow. Hoisting it
  // above every early return keeps the hook count identical on all paths.
  // It is safe to run unconditionally: `batches` and `transfers` both start
  // as [], so on the no-access path this just maps an empty array.
  const batchesWithSendInfo = useMemo(() => {
    return batches.map((b) => {
      const alreadySent = transfers
        .filter((t) => t.batch_id === b.id && t.status !== 'Rejected')
        .reduce((sum, t) => sum + Number(t.quantity || 0), 0);
      const remainingToSend = Math.max(Number(b.total_packed) - alreadySent, 0);
      const remainingToPack = Math.max(Number(b.batch_size) - Number(b.total_packed), 0);
      return { ...b, alreadySent, remainingToSend, remainingToPack };
    });
  }, [batches, transfers]);

  if (!canSeeProductionInventory(user)) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#9C9585' }}>
        You don't have access to Packing Status. Ask an Administrator for permission.
      </div>
    );
  }

  const handleDeleteEntry = (entry) => {
    if (!canManage) {
      alert("Only the Production department can delete Daily Packing entries. Your account doesn't have permission.");
      return;
    }
    setConfirmState({
      title: 'Delete this Daily Packing entry?',
      message: `Delete this Daily Packing entry — ${entry.product_name} (Batch ${entry.batch_number}, ${entry.packing_done} packs)? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        setConfirmState(null);
        const { error } = await supabase.from('production_packing_entries').delete().eq('id', entry.id);
        if (error) {
          alert('Failed to delete: ' + describeSupabaseError(error));
          return;
        }
        await logAudit({ action: 'Packing Entry Deleted', table: 'production_packing_entries', recordId: entry.id, user, oldValue: entry });
        loadEntries();
        loadBatches();
      },
    });
  };

  const handleMarkCompleted = (batch) => {
    if (!canManage) {
      alert("Only the Production department can mark a batch as Completed. Your account doesn't have permission.");
      return;
    }
    const remaining = Number(batch.batch_size) - Number(batch.total_packed);
    const message =
      remaining > 0
        ? `"${batch.product_name}" — Batch ${batch.batch_number} still has ${remaining} packs remaining to reach its batch size. Mark it Completed anyway and send it to Warehouse as-is?`
        : `Mark "${batch.product_name}" — Batch ${batch.batch_number} as Completed? It will then be ready to send to Warehouse.`;
    setConfirmState({
      title: 'Mark batch as Completed?',
      message,
      confirmLabel: 'Mark Completed',
      danger: false,
      onConfirm: async () => {
        setConfirmState(null);
        const { error } = await supabase
          .from('production_batches')
          .update({ status: 'Completed' })
          .eq('id', batch.id);
        if (error) {
          alert('Failed to mark completed: ' + error.message);
          return;
        }
        await logAudit({ action: 'Batch Marked Completed', table: 'production_batches', recordId: batch.id, user, newValue: { status: 'Completed' } });
        loadBatches();
      },
    });
  };

  // ---------------------------------------------------------------------
  // DELETE BATCH — Production department only. Deletes in dependency
  // order (finished_goods → warehouse_transfers → production_batches) so
  // this keeps working even against an older/un-migrated database (the
  // live schema also carries ON DELETE CASCADE / SET NULL rules for the
  // same relationships). Daily Packing entries cascade-delete
  // automatically via production_packing_entries_batch_id_fkey.
  // ---------------------------------------------------------------------
  const handleDeleteBatch = (batch) => {
    if (!canManage) {
      alert("Only the Production department can delete a batch. Your account doesn't have permission.");
      return;
    }
    setConfirmState({
      title: 'Delete this batch?',
      message: `Delete "${batch.product_name}" — Batch ${batch.batch_number}? This permanently deletes every Daily Packing entry and Warehouse transfer record logged against it — even if it was already sent to, accepted by, or rejected by Warehouse. This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        setConfirmState(null);

        const { data: transferRows, error: findErr } = await supabase
          .from('warehouse_transfers')
          .select('id')
          .eq('batch_id', batch.id);
        if (findErr) {
          alert('Failed to delete batch: ' + describeSupabaseError(findErr));
          return;
        }
        const transferIds = (transferRows || []).map((t) => t.id);

        if (transferIds.length > 0) {
          const { error: fgErr } = await supabase
            .from('finished_goods')
            .delete()
            .in('transfer_id', transferIds);
          if (fgErr) {
            alert('Failed to delete batch: ' + describeSupabaseError(fgErr));
            return;
          }
        }

        const { error: transferErr } = await supabase
          .from('warehouse_transfers')
          .delete()
          .eq('batch_id', batch.id);
        if (transferErr) {
          alert('Failed to delete batch: ' + describeSupabaseError(transferErr));
          return;
        }

        const { error } = await supabase
          .from('production_batches')
          .delete()
          .eq('id', batch.id);
        if (error) {
          alert('Failed to delete batch: ' + describeSupabaseError(error));
          return;
        }

        await logAudit({ action: 'Batch Deleted', table: 'production_batches', recordId: batch.id, user, oldValue: batch });
        loadBatches();
        loadEntries();
        loadTransfers();
      },
    });
  };

  const batchForEntry = (entry) => batches.find((b) => b.id === entry.batch_id);

  const canSeeWarehouseFeatures = canManage || canReceive;

  const activeIpqEntries = entries.filter((e) => e.status === 'IPQ').length;
  const activeBatches = batches.filter((b) => b.status === 'Active').length;
  const completedBatches = batches.filter((b) => b.status === 'Completed').length;
  const transfersToday = transfers.filter((t) => isToday(t.sent_at)).length;

  return (
    <div className="wb-prod-page" style={{ padding: '28px 32px' }}>
            <OngoingProcessesHero
        processes={processes}
        onOpenBoard={() => setProcessesModalOpen(true)}
      />

      <OngoingProcessesBoard
        processes={processes}
        onOpenBoard={() => setProcessesModalOpen(true)}
        onSelect={(p) => (canManageProcesses(user) ? setProcessesModalOpen(true) : setBoardHistoryRecord(p))}
      />

      <PackingStatusHero
        activeBatches={activeBatches}
        transfersToday={transfersToday}
        ipqHold={activeIpqEntries}
        completedBatches={completedBatches}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: canManage ? PAPER : '#FBF3E3', border: `1px solid ${canManage ? LINE : GOLD}`, borderRadius: 8, padding: '8px 12px', marginBottom: 18, color: canManage ? '#7A7460' : AMBER, fontSize: 12 }}>
        <Eye size={13} />
        {canManage
          ? ' Production department — full access: log, edit and delete Daily Packing entries, mark entries as IPQ, mark batches Completed, and send completed stock to Warehouse.'
          : canReceive
          ? ' Warehouse department — you can view Packing Status and receive transferred batches below. Daily Packing itself is view only.'
          : ` ${user.dept} — read-only view of Packing Status. Logging, editing and IPQ are handled by Production; accepting transfers is handled by Warehouse.`}
      </div>

      <div className="wb-prod-stat-grid">
        {[
          { label: 'Active Batches', value: activeBatches, icon: Layers },
          { label: 'Completed Batches', value: completedBatches, icon: CheckCircle2 },
          { label: 'Daily Packing on IPQ Hold', value: activeIpqEntries, icon: PauseCircle, alert: activeIpqEntries > 0 },
          { label: 'Warehouse Transfers Today', value: transfersToday, icon: Truck },
        ].map((c) => (
          <div key={c.label} className="wb-prod-stat-card" style={{ background: 'white', border: `1px solid ${c.alert ? IPQ_RED : LINE}`, borderRadius: 12, padding: 16 }}>
            <span className="wb-prod-stat-sweep" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="wb-prod-stat-icon" style={{ background: c.alert ? '#FBEAEA' : 'linear-gradient(135deg, #FBF3E3, #F3E4C4)' }}>
                <c.icon size={15} color={c.alert ? IPQ_RED : GOLD} />
              </div>
            </div>
            <p style={{ color: '#8A8370', fontSize: 11, margin: '0 0 4px' }}>{c.label}</p>
            <p style={{ fontFamily: "'Playfair Display', serif", color: c.alert ? IPQ_RED : INK, fontSize: 24, margin: 0 }}>{c.value}</p>
          </div>
        ))}
      </div>

      {canReceive && <WarehouseReceivingPanel user={user} transfers={transfers} onChanged={loadTransfers} />}

      <TransfersHistoryPanel transfers={transfers} />

      <DailyPackingTable
        user={user}
        entries={entries}
        batches={batches}
        onAddClick={() => { setEditingEntry(null); setPackingModalOpen(true); }}
        onEditClick={(e) => { setEditingEntry(e); setPackingModalOpen(true); }}
        onDelete={handleDeleteEntry}
        onIpqClick={(e) => setIpqEntry(e)}
        onHistoryClick={(e) => setHistoryEntry(e)}
      />

      <BatchesOverviewTable
        user={user}
        batches={batchesWithSendInfo}
        onSendToWarehouse={(b) => setSendToWarehouseBatch(b)}
        onMarkCompleted={handleMarkCompleted}
        onDeleteBatch={handleDeleteBatch}
      />

      {packingModalOpen && (
        <DailyPackingModal
          user={user}
          batches={batches}
          entry={editingEntry}
          onClose={() => { setPackingModalOpen(false); setEditingEntry(null); }}
          onSaved={() => { loadEntries(); loadBatches(); }}
        />
      )}
      {ipqEntry && (
        <PackingIPQModal
          user={user}
          entry={ipqEntry}
          onClose={() => setIpqEntry(null)}
          onSaved={loadEntries}
        />
      )}
      {historyEntry && (
        <PackingHistoryModal
          entry={historyEntry}
          batch={batchForEntry(historyEntry)}
          onClose={() => setHistoryEntry(null)}
        />
      )}
      {sendToWarehouseBatch && (
  <SendToWarehouseModal
    user={user}
    batch={sendToWarehouseBatch}
    onClose={() => setSendToWarehouseBatch(null)}
    onSaved={loadTransfers}
  />
)}
{processesModalOpen && (
  <ProcessesModal
    user={user}
    processes={processes}
    onClose={() => setProcessesModalOpen(false)}
    onReload={loadProcesses}
  />
)}
{boardHistoryRecord && (
  <ProcessHistoryModal
    record={boardHistoryRecord}
    onClose={() => setBoardHistoryRecord(null)}
  />
)}
<ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}

function ProductionInventoryPage({ user }) {
  return (
    <ProductionInventoryErrorBoundary>
      <ProductionInventoryPageInner user={user} />
    </ProductionInventoryErrorBoundary>
  );
}

// ---------------------------------------------------------------------
// Global premium styling — futuristic ink-and-gold luxury theme.
//
// This stylesheet carries:
//   - the sidebar/topbar/card system in a deep midnight-ink base with a
//     champagne-gold + cyan dual accent (a genuinely distinct dark/light
//     pairing rather than gold-on-navy alone);
//   - the Dashboard hero "command deck": animated gridlines, a slow
//     rotating orbit-ring graphic, drifting light blooms, a scanline
//     sweep, a shimmering title, a live ticking clock and a radial
//     "queue clarity" gauge — one orchestrated, restrained set of
//     motion effects rather than scattered per-element animation;
//   - the Packing Status hero "production floor" command deck: a radar
//     sweep, cyan/violet drifting blooms and four live glass figures;
//   - the Sign In page's glassmorphism/aurora treatment, extended with a
//     faint moving gridline field and three slow-orbiting particles;
//   - a restrained gold "shine" sweep reserved for the portal's crest
//     marks and primary calls to action (wb-crest, wb-btn-gold,
//     wb-login-submit, wb-login-mark);
//   - every mobile (≤860px) layout override — sidebar-as-drawer,
//     single-column grids, tighter spacing, horizontally scrollable
//     tables — so the desktop experience stays exactly as-is above that
//     width.
// ---------------------------------------------------------------------
function PremiumStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

      body, input, textarea, select, button {
        font-family: 'Inter', system-ui, sans-serif;
      }
      .wb-serif {
        font-family: 'Playfair Display', Georgia, serif;
        letter-spacing: 0.005em;
      }

      * { scrollbar-width: thin; scrollbar-color: #F2D999 #FAF7EF; }
      ::-webkit-scrollbar { width: 9px; height: 9px; }
      ::-webkit-scrollbar-track { background: #FAF7EF; }
      ::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #F2D999, #C9A55C);
        border-radius: 8px;
        border: 2px solid #FAF7EF;
      }
      ::-webkit-scrollbar-thumb:hover { background: #C9A55C; }

      ::selection { background: rgba(201,165,92,0.28); color: #0A1220; }

      /* Browsers apply an 8px default margin to <body>, which shows as a
         thin white border around the app shell on every side — most
         noticeable on mobile once the browser chrome is hidden (fullscreen
         or an installed PWA), since there's no address bar to draw
         attention away from it. Zeroing margin/padding here and matching
         the background to the app shell's own cream tone removes it, and
         also stops a flash of plain white behind the shell during load or
         iOS's elastic overscroll bounce. */
      html, body, #root {
        margin: 0;
        padding: 0;
        max-width: 100%;
        width: 100%;
        min-height: 100%;
        overflow-x: hidden;
        background: #FAF7EF;
      }

      button { transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease, background 0.18s ease; }
      button:not(:disabled):hover {
        transform: translateY(-1px);
        filter: brightness(1.04);
      }
      button:not(:disabled):active { transform: translateY(0); }
      button:disabled { cursor: not-allowed; }

      .wb-btn:not(:disabled):hover {
        box-shadow: 0 6px 18px rgba(10,18,32,0.22);
      }
      .wb-btn-gold:not(:disabled):hover {
        box-shadow: 0 8px 24px rgba(242,217,153,0.55), 0 0 0 1px rgba(242,217,153,0.35);
      }
      .wb-nav-btn:hover {
        background: rgba(242,217,153,0.08) !important;
        transform: none;
      }
      .wb-nav-btn {
        transition: background 0.25s ease, color 0.25s ease, box-shadow 0.4s ease;
      }
      .wb-nav-badge { transition: background 0.4s ease, box-shadow 0.4s ease; }

      /* ================================================================= */
      /* DEPARTMENT ACCENT SYSTEM — the sidebar's ambient glow, the top     */
      /* bar's underglow comet, and the page-behind-content wash all read   */
      /* their colour from PAGE_ACCENTS[page] and cross-fade together      */
      /* whenever the person changes pages, so the whole shell always      */
      /* agrees with whichever department is open — instead of a fixed     */
      /* ink/navy frame sitting on top of a differently-themed page.       */
      /* ================================================================= */
      .wb-sidebar-glow {
        position: absolute;
        width: 320px;
        height: 320px;
        left: -120px;
        bottom: -100px;
        border-radius: 50%;
        filter: blur(50px);
        pointer-events: none;
        animation: wb-drift-a 14s ease-in-out infinite;
      }
      .wb-topbar-underglow-wrap {
        position: absolute;
        left: 0; right: 0; bottom: -1px;
        height: 2px;
        overflow: hidden;
        pointer-events: none;
      }
      .wb-topbar-underglow {
        position: absolute;
        top: 0; left: -40%;
        width: 60%;
        height: 100%;
        /* PERFORMANCE FIX: was animating the "left" property on an
           element inside the topbar, which is mounted for the entire
           logged-in session on every single page — that meant a
           continuous layout reflow running forever in the background.
           transform: translateX() produces the same sweep but is
           handled on the GPU compositor, with no layout cost. */
        animation: wb-topbar-underglow-move 5s ease-in-out infinite;
        will-change: transform;
      }
      @keyframes wb-topbar-underglow-move {
        0%, 100% { transform: translateX(0%); }
        50% { transform: translateX(200%); }
      }
      .wb-page-ambient {
        position: fixed;
        top: 0; left: 0; right: 0;
        height: 420px;
        pointer-events: none;
        z-index: 0;
      }
      /* Everything actually routed by the current page sits above the   */
      /* ambient wash and gets a gentle rise-in the instant a new page   */
      /* mounts, so navigating between departments feels like a soft     */
      /* materialise rather than an abrupt cut. */
      .wb-page-rise {
        position: relative;
        z-index: 1;
        /* Two animations instead of one, on purpose: opacity keeps
           "forwards" fill-mode so the page stays visible after it
           finishes, but transform uses "backwards" (not "both"), so once
           the 0.4s is over the animation stops touching 'transform' at
           all and it reverts to this element's real, un-animated value —
           which is 'none', since no plain 'transform' rule is set below.
           A non-'none' transform (even translateY(0), which is what the
           old single "both" animation left behind permanently) makes an
           element the containing block for any position:fixed descendant
           instead of the real viewport — which is exactly why popups like
           an item's ledger (InventoryHistoryModal) used to render partway
           down a long Finished Goods/Packaging Material list instead of
           centred on screen: they were "fixed" to this wrapper, not to
           the browser window. Same visual entrance, no lingering
           transform once it's done. */
        animation:
          wb-page-fade-in 0.4s cubic-bezier(0.16,1,0.3,1) forwards,
          wb-page-slide-in 0.4s cubic-bezier(0.16,1,0.3,1) backwards;
      }
      @keyframes wb-page-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes wb-page-slide-in {
        from { transform: translateY(8px); }
        to { transform: translateY(0); }
      }
      .wb-pill:hover {
        background: rgba(255,255,255,0.12) !important;
        box-shadow: 0 4px 16px rgba(95,224,208,0.28);
      }

      /* --------------------------------------------------------------- */
      /* GOLD SHINE — a single, slow diagonal sweep of light, reserved   */
      /* for the crest marks and the portal's primary gold surfaces, so  */
      /* it reads as a deliberate flourish rather than scattered motion. */
      /* --------------------------------------------------------------- */
      .wb-crest, .wb-btn-gold, .wb-login-submit {
        position: relative;
        overflow: hidden;
      }
      /* PERFORMANCE FIX: this rule applies to EVERY gold button across the
         whole portal (Add item, Sign & Send, Post announcement, Confirm,
         Log Daily Packing, etc.) — with dozens of them mounted across the
         app, animating the "left" property here forced the browser to
         recompute layout and repaint every single one of them, every
         frame, forever, on every page. That is very likely the main
         cause of portal-wide slowness. Switched to translateX(), which
         the browser can run entirely on the GPU compositor without
         touching layout, at zero ongoing CPU cost once the browser has
         started the animation. */
      .wb-crest::after, .wb-btn-gold::after, .wb-login-submit::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 35%;
        height: 100%;
        background: linear-gradient(115deg, transparent, rgba(255,255,255,0.55), transparent);
        transform: skewX(-18deg) translateX(-260%);
        animation: wb-shine 5.5s ease-in-out infinite;
        pointer-events: none;
        will-change: transform;
      }
      @keyframes wb-shine {
        0% { transform: skewX(-18deg) translateX(-260%); }
        28% { transform: skewX(-18deg) translateX(430%); }
        100% { transform: skewX(-18deg) translateX(430%); }
      }

      .wb-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
      .wb-stat:hover, .wb-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 18px 38px rgba(10,18,32,0.14), 0 0 0 1px rgba(242,217,153,0.16) !important;
      }
      .wb-stat {
        opacity: 0;
        animation: wb-rise 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
      }
      @keyframes wb-rise {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .wb-inv-row { transition: background 0.15s ease; }
      .wb-inv-row:hover { background: #FBF3E3 !important; }

      .wb-mini-stat { transition: transform 0.2s ease, box-shadow 0.2s ease; }
      .wb-mini-stat:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(10,18,32,0.1); }

      input, textarea, select {
        transition: border-color 0.18s ease, box-shadow 0.18s ease;
      }
      input:focus, textarea:focus, select:focus {
        outline: none;
        border-color: #C9A55C !important;
        box-shadow: 0 0 0 3px rgba(201,165,92,0.14);
      }

      .wb-drawer { animation: wb-slide-in 0.28s cubic-bezier(0.16,1,0.3,1); }
      @keyframes wb-slide-in {
        from { transform: translateX(24px); opacity: 0.6; }
        to { transform: translateX(0); opacity: 1; }
      }
      .wb-history-modal { animation: wb-pop-in 0.24s cubic-bezier(0.16,1,0.3,1); }
      @keyframes wb-pop-in {
        from { transform: scale(0.97) translateY(8px); opacity: 0; }
        to { transform: scale(1) translateY(0); opacity: 1; }
      }

      /* Product Name Autocomplete — colourful drop-down used in         */
      /* Warehouse Inventory and Packing Status wherever a product name  */
      /* is typed, plus the "will merge" hint shown for matching batches.*/
      .wb-pna-drop { animation: wb-pna-drop-in 0.16s cubic-bezier(0.16,1,0.3,1); }
      @keyframes wb-pna-drop-in {
        from { transform: translateY(-6px) scaleY(0.96); opacity: 0; }
        to { transform: translateY(0) scaleY(1); opacity: 1; }
      }
      .wb-pna-row:hover { filter: brightness(1.0); }
      .wb-pna-merge-hint {
        animation: wb-pna-hint-in 0.22s cubic-bezier(0.16,1,0.3,1);
      }
      @keyframes wb-pna-hint-in {
        from { opacity: 0; transform: translateY(-3px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* ------------------------------------------------------------- */
      /* Layout helpers that need to collapse from 2 columns to 1 on    */
      /* mobile — plain CSS classes so the media query below can own    */
      /* them, instead of fighting inline gridTemplateColumns values.   */
      /* ------------------------------------------------------------- */
      .wb-dashboard-columns {
        display: grid;
        grid-template-columns: 1.1fr 1fr;
        gap: 20px;
        align-items: start;
      }
      .wb-directory-grid,
      .wb-hse-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .wb-routing-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 18px;
      }
      .wb-routing-card {
        position: relative;
        overflow: hidden;
        text-align: left;
        padding: 14px;
        border-radius: 10px;
        cursor: pointer;
        border: 1px solid #E9E2D0;
        background: white;
        transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
      }
      .wb-routing-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(10,18,32,0.08);
      }
      .wb-routing-card-selected {
        border: 2px solid #C9A55C;
        background: #FBF3E3;
      }
      .wb-routing-card-glow {
        position: absolute; inset: -30%;
        background: conic-gradient(from 0deg, rgba(201,165,92,0) 0%, rgba(201,165,92,0.25) 15%, rgba(201,165,92,0) 30%);
        animation: wb-orbit-spin 4s linear infinite;
        pointer-events: none;
      }
      .wb-inv-form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .wb-history-summary-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-bottom: 22px;
      }
      /* Tables get an explicit horizontal-scroll wrapper on every page —
         this class just gives it a touch-friendly momentum scroll and a
         thin bottom fade so it's obvious there's more to the right. */
      .wb-table-scroll {
        -webkit-overflow-scrolling: touch;
      }

      /* ================================================================= */
      /* DASHBOARD HERO — "command deck": layered ink gradient, animated   */
      /* gridlines, a slow rotating orbit-ring graphic top-right, drifting */
      /* light blooms, a soft scanline sweep, a shimmering title reveal,   */
      /* a live ticking clock, and a radial gauge visualising queue        */
      /* clarity. All motion is slow and continuous — one composed scene, */
      /* not a pile of separate effects.                                  */
      /* ================================================================= */
      .wb-hero {
        background: linear-gradient(135deg, #040711 0%, #0A1220 55%, #0D1B2E 100%);
        border-radius: 22px;
        padding: 40px 44px;
        margin-bottom: 28px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        box-shadow: 0 28px 60px rgba(4,7,17,0.4), inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(242,217,153,0.12);
        animation: wb-hero-in 0.7s cubic-bezier(0.16,1,0.3,1);
      }
      @keyframes wb-hero-in {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .wb-hero-top { position: relative; z-index: 3; flex: 1; min-width: 0; }
      /* PERFORMANCE FIX: this used to animate "background-position" under
         a mask, which repaints the whole element every frame for as
         long as it's on screen — this pattern was duplicated across
         three separate panels (Dashboard hero, Packing Status hero,
         Sign-in screen), so it was three continuous repaint loops
         running at once. Extending the element beyond its own box and
         animating "transform: translate3d()" instead gets the identical
         drifting-grid look fully on the compositor, at effectively zero
         ongoing CPU/GPU cost. */
      .wb-hero-gridlines {
        position: absolute;
        inset: -68px;
        background-image:
          linear-gradient(rgba(242,217,153,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(242,217,153,0.05) 1px, transparent 1px);
        background-size: 34px 34px;
        mask-image: radial-gradient(ellipse 90% 90% at 30% 30%, black 30%, transparent 78%);
        -webkit-mask-image: radial-gradient(ellipse 90% 90% at 30% 30%, black 30%, transparent 78%);
        animation: wb-grid-pan-t 22s linear infinite;
        will-change: transform;
        pointer-events: none;
      }
      @keyframes wb-grid-pan-t {
        from { transform: translate3d(0, 0, 0); }
        to { transform: translate3d(-68px, -68px, 0); }
      }
      /* PERFORMANCE FIX: this used to animate "top", which forces the
         browser to re-run layout on every frame for as long as the
         Dashboard is open — one of the most expensive things a
         continuous animation can do. translateY() achieves the same
         sweep on the compositor only, with no layout cost. */
      .wb-hero-scanline {
        position: absolute;
        left: 0; right: 0;
        top: -90px;
        height: 90px;
        background: linear-gradient(180deg, rgba(95,224,208,0.08), transparent);
        animation: wb-scan 7s ease-in-out infinite;
        pointer-events: none;
        will-change: transform;
      }
      @keyframes wb-scan {
        0% { transform: translateY(0); opacity: 0; }
        10% { opacity: 1; }
        50% { transform: translateY(360px); opacity: 0.6; }
        60% { opacity: 0; }
        100% { transform: translateY(360px); opacity: 0; }
      }
      .wb-hero-glow-a, .wb-hero-glow-b, .wb-hero-glow-c {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
      }
      .wb-hero-glow-a {
        top: -90px; right: -40px; width: 320px; height: 320px;
        background: radial-gradient(circle, rgba(242,217,153,0.22) 0%, rgba(242,217,153,0) 70%);
        animation: wb-drift-a 13s ease-in-out infinite;
      }
      .wb-hero-glow-b {
        bottom: -100px; left: 14%; width: 260px; height: 260px;
        background: radial-gradient(circle, rgba(95,224,208,0.14) 0%, rgba(95,224,208,0) 70%);
        animation: wb-drift-b 17s ease-in-out infinite;
      }
      .wb-hero-glow-c {
        top: 20%; right: 22%; width: 180px; height: 180px;
        background: radial-gradient(circle, rgba(139,124,246,0.14) 0%, rgba(139,124,246,0) 70%);
        animation: wb-drift-a 20s ease-in-out infinite reverse;
      }
      @keyframes wb-drift-a {
        0%, 100% { transform: translate(0,0); }
        50% { transform: translate(-16px, 12px); }
      }
      @keyframes wb-drift-b {
        0%, 100% { transform: translate(0,0); }
        50% { transform: translate(14px, -12px); }
      }
      .wb-hero-orbit-svg {
        position: absolute;
        top: 0; right: 0;
        width: 380px; height: 380px;
        opacity: 0.9;
        pointer-events: none;
      }
      .wb-orbit-ring { transform-origin: 330px 70px; }
      .wb-orbit-ring-a { animation: wb-orbit-spin 40s linear infinite; }
      .wb-orbit-ring-b { animation: wb-orbit-spin 60s linear infinite reverse; }
      @keyframes wb-orbit-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .wb-orbit-node { transform-origin: 330px 70px; }
      .wb-orbit-node-a { animation: wb-orbit-spin 40s linear infinite; }
      .wb-orbit-node-b { animation: wb-orbit-spin 60s linear infinite reverse; }

      .wb-hero-eyebrow {
        display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
        color: #F2D999; font-size: 12px; letter-spacing: 0.1em;
      }
      .wb-hero-eyebrow-sep { color: rgba(242,217,153,0.4); }
      .wb-hero-clock {
        font-variant-numeric: tabular-nums;
        color: rgba(95,224,208,0.9);
        letter-spacing: 0.06em;
      }
      .wb-live-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: #5FE0D0;
        box-shadow: 0 0 0 0 rgba(95,224,208,0.6);
        animation: wb-pulse-dot 2s ease-in-out infinite;
        flex-shrink: 0;
      }
      .wb-live-dot-cyan { background: #5FE0D0; box-shadow: 0 0 0 0 rgba(95,224,208,0.6); }
      @keyframes wb-pulse-dot {
        0% { box-shadow: 0 0 0 0 rgba(95,224,208,0.55); }
        70% { box-shadow: 0 0 0 8px rgba(95,224,208,0); }
        100% { box-shadow: 0 0 0 0 rgba(95,224,208,0); }
      }
      .wb-hero-title { font-size: 32px; margin: 0 0 6px; font-weight: 600; }
      .wb-hero-title-shine {
        background: linear-gradient(100deg, #F8F4E9 20%, #F2D999 42%, #F8F4E9 58%, #F8F4E9 100%);
        background-size: 220% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: wb-title-shine 6s ease-in-out infinite;
      }
      @keyframes wb-title-shine {
        0% { background-position: 0% 0; }
        50% { background-position: 100% 0; }
        100% { background-position: 0% 0; }
      }
      .wb-hero-sub { color: rgba(248,244,233,0.6); font-size: 14px; margin: 0; }
      .wb-hero-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 24px; }
      .wb-pill {
        display: flex; align-items: center; gap: 8px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(242,217,153,0.28);
        color: #F8F4E9;
        padding: 9px 16px;
        border-radius: 999px;
        font-size: 13px;
        cursor: pointer;
      }

      .wb-hero-gauge-wrap {
        position: relative;
        z-index: 3;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .wb-hero-gauge {
        position: relative;
        width: 76px;
        height: 76px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .wb-hero-gauge-arc {
        transition: stroke-dashoffset 0.6s ease;
        filter: drop-shadow(0 0 6px rgba(242,217,153,0.35));
      }
      .wb-hero-gauge-label {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .wb-hero-gauge-value {
        color: #F8F4E9;
        font-size: 20px;
        font-weight: 700;
        line-height: 1;
      }
      .wb-hero-gauge-text {
        color: rgba(248,244,233,0.45);
        font-size: 8px;
        letter-spacing: 0.02em;
        margin-top: 2px;
        max-width: 52px;
        text-align: center;
        line-height: 1.1;
      }

      .wb-stat-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 18px;
        margin-bottom: 24px;
      }

      /* ----------------------------------------------------------------- */
      /* DASHBOARD JEWEL TILES — replaces the flat wb-stat cards with a     */
      /* distinct pale-glass, colour-per-metric design: a breathing tinted  */
      /* glow, a raised medallion icon, a count-up number and a self-       */
      /* drawing accent bar. Deliberately different from the dark command-  */
      /* deck heroes used elsewhere. Motion is one-shot (rise-in, bar fill) */
      /* plus a single slow opacity breathe — no continuous transforms.    */
      /* ----------------------------------------------------------------- */
      .wb-jewel-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 18px;
        margin-bottom: 24px;
      }
      .wb-jewel-card {
        position: relative;
        text-align: left;
        background: linear-gradient(165deg, #FFFFFF 0%, #FDFBF6 100%);
        border-radius: 18px;
        border: 1px solid #EFE9D8;
        padding: 20px 20px 18px;
        overflow: hidden;
        opacity: 0;
        animation: wb-rise 0.55s cubic-bezier(0.16,1,0.3,1) forwards;
        transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease, border-color 0.25s ease;
      }
      .wb-jewel-card:hover {
        transform: translateY(-4px);
        border-color: var(--jewel-ring);
        box-shadow: 0 20px 40px rgba(10,18,32,0.12), 0 0 0 1px var(--jewel-ring);
      }
      .wb-jewel-glow {
        position: absolute;
        top: -46px; right: -36px;
        width: 130px; height: 130px;
        border-radius: 50%;
        background: radial-gradient(circle, var(--jewel-tint) 0%, transparent 72%);
        animation: wb-jewel-breathe 5s ease-in-out infinite;
        pointer-events: none;
      }
      @keyframes wb-jewel-breathe {
        0%, 100% { opacity: 0.55; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.14); }
      }
      .wb-jewel-top {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .wb-jewel-medal {
        width: 44px; height: 44px;
        border-radius: 13px;
        display: flex; align-items: center; justify-content: center;
      }
      .wb-jewel-arrow {
        display: flex;
        transition: transform 0.2s ease;
      }
      .wb-jewel-card:hover .wb-jewel-arrow { transform: translate(3px, -3px); }
      .wb-jewel-label {
        position: relative;
        z-index: 1;
        color: #8A8370;
        font-size: 11.5px;
        letter-spacing: 0.03em;
        margin: 0 0 6px;
      }
      .wb-jewel-value {
        position: relative;
        z-index: 1;
        font-size: 30px;
        margin: 0;
        font-variant-numeric: tabular-nums;
      }
      .wb-jewel-bar-track {
        position: relative;
        z-index: 1;
        height: 3px;
        border-radius: 3px;
        background: rgba(10,18,32,0.05);
        margin-top: 14px;
        overflow: hidden;
      }
      .wb-jewel-bar {
        height: 100%;
        border-radius: 3px;
        transform: scaleX(0);
        transform-origin: left;
        animation: wb-jewel-fill 0.9s cubic-bezier(0.16,1,0.3,1) forwards;
      }
      @keyframes wb-jewel-fill {
        to { transform: scaleX(1); }
      }

      .wb-spotlight {
        width: 100%;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 16px;
        background: linear-gradient(90deg, #FBF3E3 0%, #FAF7EF 100%);
        border: 1px solid #E9E2D0;
        border-radius: 14px;
        padding: 18px 22px;
        margin-bottom: 24px;
        cursor: pointer;
      }

      /* ================================================================= */
      /* "PROD HERO" — originally Packing Status's own ink/cyan radar      */
      /* command deck. Packing Status and Ongoing Processes have since     */
      /* moved to the shared emerald/gold .wb-vault-hero look (see         */
      /* VaultStyleHero in the JS above) to match Warehouse Inventory.     */
      /* These classes remain in use by the Documents ("In Process") and   */
      /* Announcements heroes further down, which still share this base.  */
      /* ================================================================= */
      .wb-prod-hero {
        background: linear-gradient(150deg, #040711 0%, #0A1220 45%, #0D1B2E 100%);
        border-radius: 22px;
        padding: 34px 38px;
        margin-bottom: 24px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 28px;
        flex-wrap: wrap;
        box-shadow: 0 28px 60px rgba(4,7,17,0.4), inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(95,224,208,0.14);
        animation: wb-hero-in 0.7s cubic-bezier(0.16,1,0.3,1);
      }
      .wb-prod-hero-top { position: relative; z-index: 3; flex: 1; min-width: 220px; }
      .wb-prod-hero-gridlines {
        position: absolute;
        inset: -68px;
        background-image:
          linear-gradient(rgba(95,224,208,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(95,224,208,0.05) 1px, transparent 1px);
        background-size: 30px 30px;
        mask-image: radial-gradient(ellipse 90% 90% at 70% 40%, black 30%, transparent 78%);
        -webkit-mask-image: radial-gradient(ellipse 90% 90% at 70% 40%, black 30%, transparent 78%);
        animation: wb-grid-pan-t 26s linear infinite;
        will-change: transform;
        pointer-events: none;
      }
      .wb-prod-hero-glow-a {
        position: absolute; top: -70px; right: 6%; width: 260px; height: 260px; border-radius: 50%;
        background: radial-gradient(circle, rgba(95,224,208,0.2) 0%, rgba(95,224,208,0) 70%);
        animation: wb-drift-a 15s ease-in-out infinite;
        pointer-events: none;
      }
      .wb-prod-hero-glow-b {
        position: absolute; bottom: -90px; left: 10%; width: 220px; height: 220px; border-radius: 50%;
        background: radial-gradient(circle, rgba(139,124,246,0.16) 0%, rgba(139,124,246,0) 70%);
        animation: wb-drift-b 19s ease-in-out infinite;
        pointer-events: none;
      }
      .wb-prod-radar {
        position: absolute;
        top: 50%; right: 6%;
        width: 190px; height: 190px;
        transform: translateY(-50%);
        opacity: 0.85;
        pointer-events: none;
      }
      .wb-prod-radar-sweep {
        transform-origin: 100px 100px;
        animation: wb-orbit-spin 4.5s linear infinite;
      }
      .wb-prod-radar-core {
        filter: drop-shadow(0 0 6px rgba(95,224,208,0.9));
        animation: wb-pulse-dot 2s ease-in-out infinite;
      }
      .wb-prod-hero-eyebrow {
        display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
        color: #9EEBE0; font-size: 11px; letter-spacing: 0.14em;
      }
      .wb-prod-hero-title { font-size: 28px; margin: 0 0 4px; font-weight: 600; }
      .wb-prod-hero-title-shine {
        background: linear-gradient(100deg, #F8F4E9 20%, #9EEBE0 42%, #F8F4E9 58%, #F8F4E9 100%);
        background-size: 220% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: wb-title-shine 6s ease-in-out infinite;
      }
      .wb-prod-hero-figures {
        position: relative;
        z-index: 3;
        display: grid;
        grid-template-columns: repeat(4, minmax(88px, 1fr));
        gap: 10px;
      }
      /* PERFORMANCE FIX: backdrop-filter continuously re-samples and     */
      /* re-blurs whatever is behind the element, in real time — and     */
      /* these tiles sit directly on top of the hero's animated glow     */
      /* blobs and drifting dust, so the browser was re-computing a live */
      /* blur, every frame, for as long as any hero was on screen (worse */
      /* now that Packing Status mounts two heroes at once). Swapped for */
      /* a slightly more opaque flat background — visually almost        */
      /* identical "frosted" look, at a fraction of the render cost.     */
      .wb-prod-figure {
        background: rgba(18,26,42,0.62);
        border: 1px solid rgba(95,224,208,0.2);
        border-radius: 12px;
        padding: 12px 14px;
        min-width: 88px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .wb-prod-figure:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(95,224,208,0.14); }
      .wb-prod-figure-alert { border-color: rgba(178,58,58,0.55); background: rgba(178,58,58,0.08); }
      .wb-prod-figure-icon {
        width: 24px; height: 24px; border-radius: 7px;
        background: rgba(95,224,208,0.12);
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 8px;
      }
      .wb-prod-figure-value {
        color: #F8F4E9; font-size: 22px; font-weight: 700; margin: 0; line-height: 1;
        font-variant-numeric: tabular-nums;
      }
      .wb-prod-figure-label {
        color: rgba(248,244,233,0.5); font-size: 10px; margin: 4px 0 0; letter-spacing: 0.02em;
      }

      /* ----------------------------------------------------------------- */
      /* IN PROCESS (Documents) — cyan+gold hero. Reuses .wb-prod-hero-top, */
      /* -eyebrow, -title, -title-shine, -figures and .wb-prod-figure as-is */
      /* since they're already cyan-themed; only the background layer here */
      /* is new, kept to the same drift/grid-pan keyframes as every other   */
      /* hero on the portal.                                                */
      /* ----------------------------------------------------------------- */
      .wb-doc-hero {
        background: linear-gradient(150deg, #040711 0%, #0A1220 45%, #0D1B2E 100%);
        border-radius: 22px;
        padding: 30px 34px;
        margin-bottom: 22px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        flex-wrap: wrap;
        box-shadow: 0 28px 60px rgba(4,7,17,0.4), inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(95,224,208,0.14);
        animation: wb-hero-in 0.7s cubic-bezier(0.16,1,0.3,1);
      }
      .wb-doc-hero-top { position: relative; z-index: 3; flex: 1; min-width: 220px; }
      .wb-doc-hero-gridlines {
        position: absolute;
        inset: -68px;
        background-image:
          linear-gradient(rgba(95,224,208,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(95,224,208,0.05) 1px, transparent 1px);
        background-size: 30px 30px;
        mask-image: radial-gradient(ellipse 90% 90% at 65% 45%, black 30%, transparent 78%);
        -webkit-mask-image: radial-gradient(ellipse 90% 90% at 65% 45%, black 30%, transparent 78%);
        animation: wb-grid-pan-t 26s linear infinite;
        will-change: transform;
        pointer-events: none;
      }
      .wb-doc-hero-glow-a {
        position: absolute; top: -70px; right: 8%; width: 260px; height: 260px; border-radius: 50%;
        background: radial-gradient(circle, rgba(95,224,208,0.2) 0%, rgba(95,224,208,0) 70%);
        animation: wb-drift-a 15s ease-in-out infinite;
        pointer-events: none;
      }
      .wb-doc-hero-glow-b {
        position: absolute; bottom: -90px; left: 10%; width: 220px; height: 220px; border-radius: 50%;
        background: radial-gradient(circle, rgba(242,217,153,0.16) 0%, rgba(242,217,153,0) 70%);
        animation: wb-drift-b 19s ease-in-out infinite;
        pointer-events: none;
      }

      /* ----------------------------------------------------------------- */
      /* ANNOUNCEMENTS — the same dark hero language re-themed gold/violet, */
      /* plus a small set of card/badge/composer touches. Reuses existing   */
      /* keyframes (wb-hero-in, wb-grid-pan-t, wb-drift-a/b, wb-pulse-dot,   */
      /* wb-title-shine, wb-rise) rather than adding new continuous ones,   */
      /* so this stays as cheap as everything else already on the page.     */
      /* ----------------------------------------------------------------- */
      .wb-ann-hero {
        background: linear-gradient(150deg, #040711 0%, #0A1220 45%, #1B1508 100%);
        border-radius: 22px;
        padding: 30px 34px;
        margin-bottom: 22px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        flex-wrap: wrap;
        box-shadow: 0 28px 60px rgba(4,7,17,0.4), inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(242,217,153,0.16);
        animation: wb-hero-in 0.7s cubic-bezier(0.16,1,0.3,1);
      }
      .wb-ann-hero-top { position: relative; z-index: 3; flex: 1; min-width: 220px; }
      .wb-ann-hero-gridlines {
        position: absolute;
        inset: -68px;
        background-image:
          linear-gradient(rgba(242,217,153,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(242,217,153,0.05) 1px, transparent 1px);
        background-size: 30px 30px;
        mask-image: radial-gradient(ellipse 90% 90% at 30% 50%, black 30%, transparent 78%);
        -webkit-mask-image: radial-gradient(ellipse 90% 90% at 30% 50%, black 30%, transparent 78%);
        animation: wb-grid-pan-t 26s linear infinite;
        will-change: transform;
        pointer-events: none;
      }
      .wb-ann-hero-glow-a {
        position: absolute; top: -70px; right: 10%; width: 260px; height: 260px; border-radius: 50%;
        background: radial-gradient(circle, rgba(242,217,153,0.22) 0%, rgba(242,217,153,0) 70%);
        animation: wb-drift-a 15s ease-in-out infinite;
        pointer-events: none;
      }
      .wb-ann-hero-glow-b {
        position: absolute; bottom: -90px; left: 8%; width: 220px; height: 220px; border-radius: 50%;
        background: radial-gradient(circle, rgba(139,124,246,0.18) 0%, rgba(139,124,246,0) 70%);
        animation: wb-drift-b 19s ease-in-out infinite;
        pointer-events: none;
      }
      .wb-ann-hero-title-shine {
        background: linear-gradient(100deg, #F8F4E9 20%, #F2D999 42%, #F8F4E9 58%, #F8F4E9 100%);
        background-size: 220% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: wb-title-shine 6s ease-in-out infinite;
      }
      .wb-live-dot-gold {
        background: #F2D999;
        box-shadow: 0 0 0 0 rgba(242,217,153,0.6);
        animation: wb-pulse-dot-gold 2s ease-in-out infinite;
      }
      @keyframes wb-pulse-dot-gold {
        0% { box-shadow: 0 0 0 0 rgba(242,217,153,0.55); }
        70% { box-shadow: 0 0 0 8px rgba(242,217,153,0); }
        100% { box-shadow: 0 0 0 0 rgba(242,217,153,0); }
      }

      .wb-ann-composer { position: relative; }
      .wb-ann-composer:focus-within {
        box-shadow: 0 18px 38px rgba(10,18,32,0.14), 0 0 0 1px rgba(242,217,153,0.4) !important;
      }
      .wb-ann-composer-icon {
        width: 28px; height: 28px; border-radius: 8px;
        background: rgba(201,165,92,0.12);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .wb-ann-pin-toggle {
        display: flex; align-items: center; gap: 8px;
        font-size: 13px; color: #5C5646; margin-bottom: 14px; cursor: pointer;
        width: fit-content;
      }
      .wb-ann-pin-toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
      .wb-ann-pin-toggle-box {
        width: 20px; height: 20px; border-radius: 6px;
        border: 1px solid #E9E2D0;
        display: flex; align-items: center; justify-content: center;
        color: transparent;
        transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
      }
      .wb-ann-pin-toggle input:checked + .wb-ann-pin-toggle-box {
        background: #C9A55C; border-color: #C9A55C; color: white;
      }

      .wb-ann-empty {
        text-align: center;
        padding: 36px 20px;
        border: 1px dashed #E9E2D0;
        border-radius: 14px;
        background: rgba(250,247,239,0.6);
      }

      .wb-ann-in {
        opacity: 0;
        animation: wb-rise 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
      }
      .wb-ann-card {
        position: relative;
        overflow: hidden;
        background: white;
        border: 1px solid #E9E2D0;
        border-radius: 14px;
        padding: 16px 18px;
        margin-bottom: 12px;
      }
      .wb-ann-card-pinned {
        border-color: rgba(201,165,92,0.5);
        background: linear-gradient(180deg, rgba(252,244,222,0.6) 0%, rgba(255,255,255,1) 60%);
        box-shadow: 0 10px 26px rgba(201,165,92,0.14);
      }
      .wb-ann-card-shine {
        position: absolute;
        top: 0; left: 0;
        width: 35%; height: 100%;
        background: linear-gradient(115deg, transparent, rgba(242,217,153,0.35), transparent);
        transform: skewX(-18deg) translateX(-260%);
        animation: wb-shine 7s ease-in-out infinite;
        pointer-events: none;
        will-change: transform;
      }
      .wb-ann-avatar {
        width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
        background: #0A1220;
        color: #F2D999;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 700;
        font-family: 'Playfair Display', Georgia, serif;
      }
      .wb-ann-avatar-gold {
        background: linear-gradient(140deg, #C9A55C, #8C6A2E);
        color: white;
        box-shadow: 0 0 0 3px rgba(201,165,92,0.18);
      }
      .wb-ann-badge {
        display: inline-flex; align-items: center; gap: 4px;
        font-size: 10px; font-weight: 700; letter-spacing: 0.03em;
        padding: 3px 8px; border-radius: 999px;
      }
      .wb-ann-badge-new {
        background: rgba(95,224,208,0.12); color: #1FA396;
      }
      .wb-ann-badge-pinned {
        background: #FBF3E3; color: #8A5A24;
      }
      .wb-ann-delete-btn {
        background: none; border: none; color: #8A2E2E; cursor: pointer;
        display: flex; align-items: center; padding: 4px; border-radius: 6px;
        transition: background 0.15s ease;
      }
      .wb-ann-delete-btn:hover { background: rgba(138,46,46,0.1); }

      /* Packing Status page background + stat cards */
      .wb-prod-page {
        position: relative;
      }
      .wb-prod-stat-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 22px;
      }
      .wb-prod-stat-card {
        position: relative;
        overflow: hidden;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .wb-prod-stat-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 16px 34px rgba(10,18,32,0.12);
      }
      .wb-prod-stat-icon {
        width: 32px; height: 32px; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
      }
      .wb-prod-stat-sweep {
        content: '';
        position: absolute;
        top: 0; left: -60%;
        width: 40%; height: 100%;
        background: linear-gradient(115deg, transparent, rgba(201,165,92,0.16), transparent);
        transform: skewX(-18deg);
        animation: wb-shine 7s ease-in-out infinite;
        pointer-events: none;
      }

      /* ------------------------------------------------------------- */
      /* Sign In — glassmorphism panel over a deep ink gradient stage,  */
      /* now with a faint moving gridline field and three slow-orbiting */
      /* particles layered under the aurora blooms and grain overlay.   */
      /* One orchestrated entrance on load; everything else stays slow  */
      /* and continuous rather than reactive.                           */
      /* ------------------------------------------------------------- */
      .wb-login-stage {
        min-height: 100vh;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: radial-gradient(130% 110% at 50% -10%, #101c30 0%, #040711 55%, #020409 100%);
      }
      .wb-login-gridlines {
        position: absolute;
        inset: -68px;
        background-image:
          linear-gradient(rgba(242,217,153,0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(242,217,153,0.045) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 75%);
        -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 75%);
        animation: wb-grid-pan-t 30s linear infinite;
        will-change: transform;
        pointer-events: none;
      }
      .wb-orbit-field {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .wb-orbit-dot {
        position: absolute;
        border-radius: 50%;
        background: #F2D999;
        box-shadow: 0 0 12px rgba(242,217,153,0.7);
      }
      .wb-orbit-dot-1 { width: 5px; height: 5px; top: 22%; left: 18%; animation: wb-float-1 14s ease-in-out infinite; }
      .wb-orbit-dot-2 { width: 4px; height: 4px; top: 66%; left: 76%; background: #5FE0D0; box-shadow: 0 0 12px rgba(95,224,208,0.7); animation: wb-float-2 18s ease-in-out infinite; }
      .wb-orbit-dot-3 { width: 3px; height: 3px; top: 40%; left: 82%; background: #8B7CF6; box-shadow: 0 0 10px rgba(139,124,246,0.6); animation: wb-float-1 22s ease-in-out infinite reverse; }
      .wb-orbit-dot-4 { width: 4px; height: 4px; top: 80%; left: 28%; background: #F2D999; box-shadow: 0 0 12px rgba(242,217,153,0.65); animation: wb-float-2 26s ease-in-out infinite; animation-delay: -8s; }
      .wb-orbit-dot-5 { width: 3px; height: 3px; top: 12%; left: 62%; background: #5FE0D0; box-shadow: 0 0 10px rgba(95,224,208,0.6); animation: wb-float-1 30s ease-in-out infinite; animation-delay: -15s; }
      @keyframes wb-float-1 {
        0%, 100% { transform: translate(0,0); opacity: 0.6; }
        50% { transform: translate(30px, -22px); opacity: 1; }
      }
      @keyframes wb-float-2 {
        0%, 100% { transform: translate(0,0); opacity: 0.5; }
        50% { transform: translate(-26px, 20px); opacity: 1; }
      }
      .wb-login-aurora {
        position: absolute;
        border-radius: 50%;
        filter: blur(2px);
        pointer-events: none;
      }
      .wb-login-aurora-a {
        top: -18%; left: -10%; width: 60vw; height: 60vw; max-width: 620px; max-height: 620px;
        background: radial-gradient(circle, rgba(242,217,153,0.16) 0%, rgba(242,217,153,0) 68%);
        animation: wb-drift-a 18s ease-in-out infinite;
      }
      .wb-login-aurora-b {
        bottom: -22%; right: -8%; width: 55vw; height: 55vw; max-width: 560px; max-height: 560px;
        background: radial-gradient(circle, rgba(95,224,208,0.13) 0%, rgba(95,224,208,0) 70%);
        animation: wb-drift-b 22s ease-in-out infinite;
      }
      .wb-login-aurora-c {
        top: 30%; left: 60%; width: 40vw; height: 40vw; max-width: 420px; max-height: 420px;
        background: radial-gradient(circle, rgba(139,124,246,0.1) 0%, rgba(139,124,246,0) 72%);
        animation: wb-drift-a 26s ease-in-out infinite reverse;
      }
      .wb-login-grain {
        position: absolute; inset: 0; pointer-events: none; opacity: 0.5;
        background-image: radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px);
        background-size: 3px 3px;
      }

      /* ---------------------------------------------------------------- */
      /* LOGIN - additional depth layers.                                   */
      /* Everything here animates transform/opacity only, so each layer is  */
      /* handed straight to the compositor and never triggers layout or     */
      /* paint. That is what lets five simultaneous background animations   */
      /* hold 60fps instead of stuttering the sign-in form.                 */
      /* ---------------------------------------------------------------- */
      .wb-login-beams {
        position: absolute; inset: 0;
        overflow: hidden;
        pointer-events: none;
      }
      .wb-login-beam {
        position: absolute;
        top: -60%;
        width: 44vw;
        height: 220%;
        transform: rotate(18deg) translateX(-140%);
        will-change: transform, opacity;
      }
      .wb-login-beam-1 {
        left: 4%;
        background: linear-gradient(90deg, transparent, rgba(242,217,153,0.07) 45%, rgba(242,217,153,0.13) 50%, rgba(242,217,153,0.07) 55%, transparent);
        animation: wb-beam-sweep 13s cubic-bezier(0.45,0,0.55,1) infinite;
      }
      .wb-login-beam-2 {
        left: 28%;
        width: 30vw;
        background: linear-gradient(90deg, transparent, rgba(95,224,208,0.06) 48%, rgba(95,224,208,0.11) 50%, rgba(95,224,208,0.06) 52%, transparent);
        animation: wb-beam-sweep 19s cubic-bezier(0.45,0,0.55,1) infinite;
        animation-delay: -6s;
      }
      .wb-login-beam-3 {
        left: 52%;
        width: 22vw;
        background: linear-gradient(90deg, transparent, rgba(139,124,246,0.06) 50%, transparent);
        animation: wb-beam-sweep 25s cubic-bezier(0.45,0,0.55,1) infinite;
        animation-delay: -14s;
      }
      @keyframes wb-beam-sweep {
        0%   { transform: rotate(18deg) translateX(-160%); opacity: 0; }
        12%  { opacity: 1; }
        88%  { opacity: 1; }
        100% { transform: rotate(18deg) translateX(320%); opacity: 0; }
      }

      /* Starfield: three nodes, ~24 stars, zero extra DOM. */
      .wb-login-stars {
        position: absolute;
        top: 0; left: 0;
        width: 2px; height: 2px;
        border-radius: 50%;
        pointer-events: none;
        will-change: transform;
      }
      .wb-login-stars-1 {
        background: rgba(255,252,240,0.85);
        box-shadow:
          8vw 12vh 0 0 rgba(255,252,240,0.55), 22vw 68vh 0 0 rgba(255,252,240,0.30),
          35vw 24vh 0 0 rgba(242,217,153,0.60), 47vw 82vh 0 0 rgba(255,252,240,0.40),
          61vw 16vh 0 0 rgba(255,252,240,0.50), 73vw 55vh 0 0 rgba(242,217,153,0.45),
          88vw 31vh 0 0 rgba(255,252,240,0.35), 94vw 74vh 0 0 rgba(255,252,240,0.55),
          15vw 44vh 0 0 rgba(255,252,240,0.25), 55vw 90vh 0 0 rgba(242,217,153,0.35);
        animation: wb-stars-drift-a 46s linear infinite, wb-stars-twinkle 5.5s ease-in-out infinite;
      }
      .wb-login-stars-2 {
        background: rgba(95,224,208,0.7);
        box-shadow:
          13vw 78vh 0 0 rgba(95,224,208,0.45), 29vw 9vh 0 0 rgba(255,252,240,0.40),
          41vw 51vh 0 0 rgba(95,224,208,0.30), 58vw 33vh 0 0 rgba(255,252,240,0.45),
          67vw 88vh 0 0 rgba(95,224,208,0.35), 81vw 61vh 0 0 rgba(255,252,240,0.30),
          92vw 19vh 0 0 rgba(95,224,208,0.40), 4vw 57vh 0 0 rgba(255,252,240,0.35);
        animation: wb-stars-drift-b 68s linear infinite, wb-stars-twinkle 7.5s ease-in-out infinite;
        animation-delay: 0s, -2.5s;
      }
      .wb-login-stars-3 {
        background: rgba(139,124,246,0.6);
        box-shadow:
          19vw 27vh 0 0 rgba(139,124,246,0.40), 37vw 71vh 0 0 rgba(242,217,153,0.30),
          52vw 6vh 0 0 rgba(139,124,246,0.35), 70vw 43vh 0 0 rgba(255,252,240,0.30),
          85vw 84vh 0 0 rgba(139,124,246,0.35), 2vw 91vh 0 0 rgba(242,217,153,0.25);
        animation: wb-stars-drift-a 92s linear infinite reverse, wb-stars-twinkle 9s ease-in-out infinite;
        animation-delay: 0s, -5s;
      }
      @keyframes wb-stars-drift-a {
        from { transform: translate3d(0, 0, 0); }
        to   { transform: translate3d(3vw, -8vh, 0); }
      }
      @keyframes wb-stars-drift-b {
        from { transform: translate3d(0, 0, 0); }
        to   { transform: translate3d(-4vw, 6vh, 0); }
      }
      @keyframes wb-stars-twinkle {
        0%, 100% { opacity: 0.45; }
        50%      { opacity: 1; }
      }

      .wb-login-vignette {
        position: absolute; inset: 0; pointer-events: none;
        background: radial-gradient(ellipse 78% 68% at 50% 45%, transparent 40%, rgba(2,4,9,0.55) 100%);
      }

      /* Counter-rotating halo rings behind the crest. */
      .wb-login-crest-stack {
        position: relative;
        width: 60px; height: 60px;
        margin: 0 auto 16px;
      }
      .wb-login-crest-stack .wb-login-mark { margin: 0; }
      .wb-login-halo {
        position: absolute;
        top: 50%; left: 50%;
        border-radius: 50%;
        pointer-events: none;
        transform: translate(-50%, -50%);
        will-change: transform, opacity;
      }
      .wb-login-halo-a {
        width: 108px; height: 108px;
        border: 1px solid rgba(242,217,153,0.30);
        border-top-color: rgba(242,217,153,0.85);
        border-right-color: transparent;
        animation: wb-halo-spin 7s linear infinite, wb-halo-breathe 4s ease-in-out infinite;
      }
      .wb-login-halo-b {
        width: 148px; height: 148px;
        border: 1px solid rgba(95,224,208,0.16);
        border-bottom-color: rgba(95,224,208,0.55);
        border-left-color: transparent;
        animation: wb-halo-spin 12s linear infinite reverse;
      }
      @keyframes wb-halo-spin {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to   { transform: translate(-50%, -50%) rotate(360deg); }
      }
      @keyframes wb-halo-breathe {
        0%, 100% { opacity: 0.55; }
        50%      { opacity: 1; }
      }

      /* One slow sheen crossing the sign-in card. */
      .wb-login-card-sheen {
        position: absolute;
        top: 0; left: -60%;
        width: 55%; height: 100%;
        pointer-events: none;
        background: linear-gradient(100deg, transparent, rgba(242,217,153,0.10) 45%, rgba(255,255,255,0.14) 50%, rgba(242,217,153,0.10) 55%, transparent);
        transform: skewX(-14deg);
        animation: wb-card-sheen 7.5s ease-in-out infinite;
        animation-delay: 1.2s;
        will-change: transform;
      }
      @keyframes wb-card-sheen {
        0%, 62%, 100% { transform: translateX(0) skewX(-14deg); }
        30%           { transform: translateX(320%) skewX(-14deg); }
      }

      /* Staggered reveal for the fields inside the card. */
      .wb-login-stagger {
        opacity: 0;
        animation: wb-login-stagger-in 0.62s cubic-bezier(0.16,1,0.3,1) forwards;
        animation-delay: var(--d, 0s);
      }
      @keyframes wb-login-stagger-in {
        from { opacity: 0; transform: translateY(9px); }
        to   { opacity: 1; transform: none; }
      }

      /* Notifications dropdown - now portalled to <body>, so it needs its
         own presentation rules rather than inheriting the header's. */
      .wb-notif-panel {
        animation: wb-notif-in 0.22s cubic-bezier(0.22,1,0.36,1) both;
        transform-origin: top right;
        scrollbar-width: thin;
      }
      @keyframes wb-notif-in {
        from { opacity: 0; transform: translateY(-6px) scale(0.975); }
        to   { opacity: 1; transform: none; }
      }
      .wb-notif-panel::-webkit-scrollbar { width: 8px; }
      .wb-notif-panel::-webkit-scrollbar-thumb {
        background: rgba(201,165,92,0.35);
        border-radius: 999px;
      }
      .wb-notif-panel button { transition: background 0.14s ease; }
      .wb-notif-panel button:hover { background: rgba(242,217,153,0.10) !important; }
      .wb-notif-panel button:last-child { border-bottom: none !important; }
      .wb-login-wrap {
        position: relative;
        width: 100%;
        max-width: 420px;
        animation: wb-login-in 0.7s cubic-bezier(0.16,1,0.3,1);
      }
      @keyframes wb-login-in {
        from { opacity: 0; transform: translateY(14px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .wb-login-brand { text-align: center; margin-bottom: 30px; }
      .wb-login-mark {
        width: 60px; height: 60px; margin: 0 auto 16px; border-radius: 16px;
        background: linear-gradient(135deg, #C9A55C 0%, #F2D999 100%);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 0 1px rgba(242,217,153,0.35), 0 16px 36px rgba(201,165,92,0.4);
      }
      .wb-login-wordmark { color: #F8F4E9; font-size: 34px; letter-spacing: 0.02em; font-weight: 600; }
      .wb-login-sub {
        color: #F2D999; font-size: 11px; letter-spacing: 0.42em;
        margin-top: 4px; padding-left: 0.42em;
      }
      .wb-login-rule {
        width: 44px; height: 1px;
        background: linear-gradient(90deg, transparent, #C9A55C, transparent);
        margin: 20px auto 0;
      }
      .wb-login-tag { color: rgba(248,244,233,0.5); font-size: 13px; margin-top: 14px; }

      /* WELCOME SPLASH — post-login greeting screen */
      .wb-welcome-content {
        position: relative;
        z-index: 1;
        text-align: center;
        cursor: pointer;
        animation: wb-welcome-in 0.8s cubic-bezier(0.16,1,0.3,1);
      }
      @keyframes wb-welcome-in {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .wb-welcome-mark {
        width: 64px; height: 64px; margin: 0 auto 22px; border-radius: 18px;
        background: linear-gradient(135deg, #C9A55C 0%, #F2D999 100%);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 0 1px rgba(242,217,153,0.35), 0 16px 36px rgba(201,165,92,0.4);
        animation: wb-welcome-mark-pulse 2.2s ease-in-out infinite;
      }
      @keyframes wb-welcome-mark-pulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 1px rgba(242,217,153,0.35), 0 16px 36px rgba(201,165,92,0.4); }
        50% { transform: scale(1.06); box-shadow: 0 0 0 1px rgba(242,217,153,0.5), 0 20px 46px rgba(201,165,92,0.55); }
      }
      .wb-welcome-greeting {
        color: #F2D999;
        font-size: 14px;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        margin: 0 0 10px;
      }
      .wb-welcome-title {
        color: #F8F4E9;
        font-size: 38px;
        margin: 0;
        background: linear-gradient(120deg, #F8F4E9 30%, #F2D999 50%, #F8F4E9 70%);
        background-size: 220% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: wb-title-shine 3.2s ease-in-out infinite;
      }
      .wb-welcome-dept {
        color: rgba(248,244,233,0.6);
        font-size: 13px;
        margin: 14px 0 0;
        letter-spacing: 0.04em;
      }
      .wb-welcome-skip {
        color: rgba(248,244,233,0.32);
        font-size: 11px;
        margin: 30px 0 0;
        animation: wb-welcome-skip-fade 2.4s ease-in-out infinite;
      }
      @keyframes wb-welcome-skip-fade {
        0%, 100% { opacity: 0.32; }
        50% { opacity: 0.7; }
      }
      .wb-login-card {
        position: relative;
        overflow: hidden;
        transition: border-color 0.5s ease, box-shadow 0.5s ease;
        background: rgba(255,255,255,0.045);
        backdrop-filter: blur(18px) saturate(140%);
        -webkit-backdrop-filter: blur(18px) saturate(140%);
        border: 1px solid rgba(242,217,153,0.16);
        border-radius: 18px;
        padding: 34px 32px;
        box-shadow: 0 30px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05);
      }
      .wb-login-card:focus-within {
        border-color: rgba(242,217,153,0.34);
        box-shadow: 0 34px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(242,217,153,0.18), inset 0 1px 0 rgba(255,255,255,0.07);
      }
      .wb-login-label {
        color: rgba(248,244,233,0.55); font-size: 11px; letter-spacing: 0.08em;
        display: block; margin-bottom: 6px;
      }
      .wb-login-field { margin-bottom: 18px; }
      .wb-login-input {
        width: 100%; padding: 12px 14px; border-radius: 10px;
        border: 1px solid rgba(242,217,153,0.22);
        background: rgba(255,255,255,0.035);
        color: #F8F4E9;
        outline: none;
        box-sizing: border-box;
        font-size: 14px;
      }
      .wb-login-input::placeholder { color: rgba(248,244,233,0.28); }
      .wb-login-input {
        transition: border-color 0.28s ease, box-shadow 0.28s ease, background 0.28s ease;
      }
      .wb-login-input:focus {
        border-color: #F2D999 !important;
        box-shadow: 0 0 0 3px rgba(242,217,153,0.16), 0 0 22px rgba(242,217,153,0.20);
        background: rgba(255,255,255,0.055);
      }
      .wb-login-error { color: #E29A9A; font-size: 12px; margin-bottom: 12px; }
      .wb-login-submit {
        width: 100%;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        background: linear-gradient(120deg, #C9A55C 0%, #F2D999 100%);
        color: #040711;
        border: none;
        padding: 13px;
        border-radius: 10px;
        font-size: 14px;
        letter-spacing: 0.02em;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 10px 28px rgba(201,165,92,0.42);
        position: relative;
        overflow: hidden;
        transition: transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.18s ease;
      }
      .wb-login-submit:active {
        transform: translateY(1px) scale(0.985);
        box-shadow: 0 6px 16px rgba(201,165,92,0.38);
      }
      .wb-login-submit svg {
        transition: transform 0.22s cubic-bezier(0.22,1,0.36,1);
      }
      .wb-login-submit:hover svg { transform: translateX(3px); }
      .wb-login-submit:hover {
        box-shadow: 0 14px 36px rgba(242,217,153,0.55);
      }
      .wb-login-note {
        display: flex; align-items: center; gap: 6px;
        color: rgba(248,244,233,0.35); font-size: 11px;
        margin-top: 18px; margin-bottom: 0;
      }
      .wb-login-footer {
        text-align: center; color: rgba(248,244,233,0.3); font-size: 11px;
        letter-spacing: 0.04em; margin-top: 26px;
      }

      /* ------------------------------------------------------------- */
      /* MOBILE (≤860px) — sidebar becomes a slide-in drawer behind a   */
      /* hamburger button, every 2/3/4-column grid collapses to one     */
      /* column, page padding tightens, and every data table scrolls    */
      /* horizontally inside its card instead of squeezing columns.     */
      /* Nothing here changes anything above the breakpoint.            */
      /* ------------------------------------------------------------- */
      @media (max-width: 860px) {
        .wb-hamburger-btn { display: flex !important; }

        .wb-page-padding { padding: 16px 14px 28px !important; }

        .wb-hero { padding: 26px 20px; flex-direction: column; align-items: flex-start; }
        .wb-hero-title { font-size: 23px; }
        .wb-hero-actions { gap: 8px; }
        .wb-pill { padding: 8px 12px; font-size: 12px; }
        .wb-hero-gauge-wrap { align-self: flex-end; margin-top: -12px; }
        .wb-hero-orbit-svg { width: 260px; height: 260px; }

        .wb-prod-hero { padding: 22px 18px; }
        .wb-prod-hero-title { font-size: 21px; }
        .wb-prod-radar { display: none; }
        .wb-prod-hero-figures { grid-template-columns: repeat(2, 1fr); width: 100%; }
        .wb-prod-stat-grid { grid-template-columns: repeat(2, 1fr); }

        .wb-ann-hero { padding: 22px 18px; }
        .wb-ann-hero .wb-prod-hero-title { font-size: 21px; }
        .wb-ann-hero .wb-prod-hero-figures { grid-template-columns: repeat(2, 1fr); width: 100%; }

        .wb-doc-hero { padding: 22px 18px; }
        .wb-doc-hero .wb-prod-hero-title { font-size: 21px; }
        .wb-doc-hero .wb-prod-hero-figures { grid-template-columns: repeat(2, 1fr); width: 100%; }

        .wb-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .wb-jewel-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }

        .wb-dashboard-columns,
        .wb-directory-grid,
        .wb-hse-grid,
        .wb-routing-grid,
        .wb-inv-form-grid {
          grid-template-columns: 1fr;
        }

        .wb-history-summary-grid { grid-template-columns: 1fr 1fr; }

        .wb-spotlight { padding: 16px; gap: 12px; }
        .wb-spotlight span { display: none; }

        .wb-table-scroll { overflow-x: auto; }

        .wb-drawer { max-width: 100% !important; }
        .wb-callpanel { max-width: 100% !important; }
      }

      @media (max-width: 480px) {
        .wb-stat-grid { grid-template-columns: 1fr 1fr; }
        .wb-jewel-grid { grid-template-columns: 1fr 1fr; }
        .wb-history-summary-grid { grid-template-columns: 1fr; }
        .wb-hero-title { font-size: 21px; }
        .wb-prod-hero-figures { grid-template-columns: repeat(2, 1fr); }
        .wb-prod-stat-grid { grid-template-columns: 1fr 1fr; }
      }
      .wb-process-dot {
        width: 6px; height: 6px; border-radius: 50%;
        animation: wb-pulse-dot 1.8s ease-in-out infinite;
        flex-shrink: 0;
      }
      .wb-process-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
      .wb-process-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(0,0,0,0.12); }
      .wb-process-card-active { animation: wb-glow-pulse 2s ease-in-out infinite; }
      .wb-process-tile { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
      .wb-process-tile:hover { transform: translateY(-2px); border-color: #5FE0D0 !important; box-shadow: 0 10px 26px rgba(95,224,208,0.18); }
      
      .wb-glow-btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 11px 20px;
        border-radius: 999px;
        border: 1px solid rgba(95,224,208,0.4);
        background: linear-gradient(120deg, #0D1B2E, #0A1220);
        color: #F8F4E9;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        overflow: hidden;
        box-shadow: 0 0 0 1px rgba(95,224,208,0.15), 0 8px 24px rgba(95,224,208,0.25);
        animation: wb-glow-pulse 2.4s ease-in-out infinite;
      }
      .wb-glow-btn-bg {
        position: absolute; inset: -2px;
        background: conic-gradient(from 0deg, #5FE0D0, #8B7CF6, #F2D999, #5FE0D0);
        filter: blur(10px);
        opacity: 0.35;
        z-index: 0;
        animation: wb-orbit-spin 6s linear infinite;
      }
      .wb-glow-btn > *:not(.wb-glow-btn-bg) { position: relative; z-index: 1; }
      .wb-glow-btn-count {
        background: #5FE0D0; color: #040711; font-size: 11px; font-weight: 800;
        padding: 1px 7px; border-radius: 999px;
      }
      @keyframes wb-glow-pulse {
        0%, 100% { box-shadow: 0 0 0 1px rgba(95,224,208,0.15), 0 8px 24px rgba(95,224,208,0.25); }
        50% { box-shadow: 0 0 0 1px rgba(95,224,208,0.3), 0 8px 34px rgba(95,224,208,0.5); }
      }
      /* VAULT-STYLE HERO — deep emerald marble, liquid-gold shimmer, a  */
      /* slow-rotating faceted gem and a drift of fine gold dust. Shared */
      /* by Warehouse Inventory, Packing Status and Ongoing Processes    */
      /* (see VaultStyleHero in the JS above) — distinct from the        */
      /* Dashboard's ink + cyan orbit look.                              */
      .wb-vault-hero {
        position: relative;
        overflow: hidden;
        border-radius: 20px;
        padding: 28px 30px 24px;
        background:
          radial-gradient(120% 140% at 12% 0%, rgba(110,231,183,0.14) 0%, rgba(110,231,183,0) 55%),
          linear-gradient(135deg, #06231B 0%, #0B2B22 45%, #061B15 100%);
        box-shadow: 0 20px 50px rgba(4,25,18,0.45), inset 0 1px 0 rgba(242,217,153,0.08);
        animation: wb-hero-in 0.6s cubic-bezier(0.22,1,0.36,1) both;
      }
      .wb-vault-marble {
        position: absolute; inset: 0;
        background-image:
          linear-gradient(115deg, transparent 40%, rgba(242,217,153,0.05) 48%, transparent 56%),
          linear-gradient(65deg, transparent 60%, rgba(110,231,183,0.05) 68%, transparent 76%);
        pointer-events: none;
      }
      /* PERFORMANCE FIX: this used to animate "left" on a large (55% x  */
      /* 180%) layer, which forces the browser to re-run layout on every */
      /* frame for as long as the hero is on screen — one of the most    */
      /* expensive things a continuous animation can do, and it got      */
      /* noticeably worse once Packing Status started mounting TWO of    */
      /* these vault heroes on the same page. "left" is now static and   */
      /* the sweep is moved with transform: translateX() instead, which  */
      /* the browser can composite on the GPU without touching layout.   */
      .wb-vault-sweep {
        position: absolute;
        top: -40%; left: -45%;
        width: 55%; height: 180%;
        background: linear-gradient(100deg, rgba(242,217,153,0) 0%, rgba(242,217,153,0.16) 45%, rgba(255,255,255,0.22) 50%, rgba(242,217,153,0.16) 55%, rgba(242,217,153,0) 100%);
        transform: rotate(8deg) translateX(0%);
        animation: wb-vault-sweep-move 5.5s ease-in-out infinite;
        will-change: transform, opacity;
        pointer-events: none;
      }
      @keyframes wb-vault-sweep-move {
        0% { transform: rotate(8deg) translateX(0%); opacity: 0; }
        12% { opacity: 1; }
        50% { transform: rotate(8deg) translateX(273%); opacity: 1; }
        62%, 100% { transform: rotate(8deg) translateX(273%); opacity: 0; }
      }
      .wb-vault-glow-a, .wb-vault-glow-b {
        position: absolute; border-radius: 50%; filter: blur(50px); pointer-events: none;
      }
      .wb-vault-glow-a {
        width: 260px; height: 260px; right: -60px; top: -80px;
        background: rgba(110,231,183,0.22);
        animation: wb-drift-a 9s ease-in-out infinite;
      }
      .wb-vault-glow-b {
        width: 220px; height: 220px; left: -50px; bottom: -70px;
        background: rgba(242,217,153,0.18);
        animation: wb-drift-b 11s ease-in-out infinite;
      }
      .wb-vault-dust {
        position: absolute;
        width: 4px; height: 4px;
        border-radius: 50%;
        background: #F2D999;
        box-shadow: 0 0 6px 1px rgba(242,217,153,0.7);
        opacity: 0.75;
        pointer-events: none;
      }
      .wb-vault-dust-1 { left: 18%; top: 70%; animation: wb-vault-dust-rise 6.5s ease-in-out infinite; }
      .wb-vault-dust-2 { left: 32%; top: 82%; animation: wb-vault-dust-rise 8s ease-in-out infinite 1.2s; }
      .wb-vault-dust-3 { left: 55%; top: 75%; animation: wb-vault-dust-rise 7.2s ease-in-out infinite 2.4s; }
      .wb-vault-dust-4 { left: 70%; top: 85%; animation: wb-vault-dust-rise 9s ease-in-out infinite 0.6s; }
      .wb-vault-dust-5 { left: 88%; top: 68%; animation: wb-vault-dust-rise 7.8s ease-in-out infinite 3.1s; }
      @keyframes wb-vault-dust-rise {
        0% { transform: translateY(0) scale(0.8); opacity: 0; }
        15% { opacity: 0.9; }
        50% { transform: translateY(-60px) scale(1.15); opacity: 0.6; }
        100% { transform: translateY(-130px) scale(0.6); opacity: 0; }
      }
      .wb-vault-gem {
        position: absolute;
        right: 18px;
        top: 50%;
        transform: translateY(-50%);
        width: 132px; height: 132px;
        opacity: 0.92;
        pointer-events: none;
      }
      .wb-vault-gem-halo { animation: wb-jewel-breathe 3.4s ease-in-out infinite; }
      .wb-vault-gem-spin {
        transform-origin: 100px 100px;
        animation: wb-vault-gem-rotate 10s linear infinite;
      }
      @keyframes wb-vault-gem-rotate {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(1.05); }
        100% { transform: rotate(360deg) scale(1); }
      }
      .wb-vault-top { position: relative; z-index: 1; }
      .wb-vault-eyebrow {
        display: flex; align-items: center; gap: 8px;
        font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
        color: rgba(226,247,236,0.7);
        margin-bottom: 10px;
      }
      .wb-vault-clock { color: rgba(226,247,236,0.5); }
      .wb-live-dot-emerald {
        background: #6EE7B7;
        box-shadow: 0 0 0 0 rgba(110,231,183,0.6);
      }
      .wb-vault-title {
        font-size: 30px; margin: 0 0 6px; color: #FAF7EF;
        max-width: 60%;
      }
      .wb-vault-title-shine {
        background: linear-gradient(100deg, #F2D999 0%, #FFF3D6 20%, #F2D999 40%, #C9A55C 60%, #F2D999 80%);
        background-size: 250% auto;
        -webkit-background-clip: text; background-clip: text; color: transparent;
        animation: wb-title-shine 4.5s linear infinite;
      }
      .wb-vault-figures {
        position: relative; z-index: 1;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-top: 22px;
        max-width: 78%;
      }
      /* PERFORMANCE FIX: see the matching note on .wb-prod-figure above —
         backdrop-filter here was continuously re-blurring the animated
         marble/glow/dust layers behind it. Flat, slightly more opaque
         background instead — same "frosted tile" read, far cheaper. */
      .wb-vault-figure {
        background: rgba(6,35,27,0.72);
        border: 1px solid rgba(242,217,153,0.18);
        border-radius: 12px;
        padding: 10px 12px;
        animation: wb-rise 0.5s cubic-bezier(0.22,1,0.36,1) both;
        transition: border-color 0.25s ease, transform 0.25s ease;
      }
      .wb-vault-figure:hover { border-color: rgba(242,217,153,0.4); transform: translateY(-2px); }
      .wb-vault-figure-alert {
        border-color: rgba(178,58,58,0.5);
        background: rgba(58,17,17,0.4);
      }
      .wb-vault-figure-icon { margin-bottom: 6px; }
      .wb-vault-figure-value {
        font-size: 18px; font-weight: 800; color: #FAF7EF; margin: 0 0 2px;
        font-variant-numeric: tabular-nums;
      }
      .wb-vault-figure-label {
        font-size: 10.5px; color: rgba(226,247,236,0.55); margin: 0;
        text-transform: uppercase; letter-spacing: 0.04em;
      }
      /* RECEIVED FROM PRODUCTION — a tiny truck actually drives across a */
      /* dashed road inside its own tile, unlike the static count tiles. */
      .wb-vault-figure-truck { position: relative; overflow: hidden; }
      .wb-vault-truck-road {
        position: relative;
        height: 14px;
        margin-top: 6px;
        overflow: hidden;
      }
      .wb-vault-truck-dash {
        position: absolute;
        top: 50%; left: 0; right: 0;
        height: 1px;
        transform: translateY(-50%);
        background-image: repeating-linear-gradient(90deg, rgba(242,217,153,0.4) 0 6px, transparent 6px 12px);
      }
      /* PERFORMANCE FIX: this used to animate "left" every frame, which
         forces a full layout recalculation for the entire 3.4s loop,
         repeating forever. translateX (as a % of the element's own box,
         combined with the parent's width via a wrapper) achieves the same
         drive-across sweep on the compositor only. */
      .wb-vault-truck-icon {
        position: absolute;
        top: 50%; left: -18px;
        transform: translateY(-50%) translateX(0);
        animation: wb-vault-truck-drive 3.4s linear infinite;
        filter: drop-shadow(0 0 3px rgba(242,217,153,0.6));
        will-change: transform;
      }
      @keyframes wb-vault-truck-drive {
        0% { transform: translateY(-50%) translateX(0); opacity: 0; }
        8% { opacity: 1; }
        92% { opacity: 1; }
        100% { transform: translateY(-50%) translateX(150px); opacity: 0; }
      }
      .wb-vault-truck-badge {
        position: absolute;
        top: 10px; right: 10px;
        background: rgba(110,231,183,0.18);
        border: 1px solid rgba(110,231,183,0.4);
        color: #6EE7B7;
        font-size: 9px; font-weight: 700;
        padding: 2px 6px;
        border-radius: 999px;
        animation: wb-pop-in 0.4s cubic-bezier(0.22,1,0.36,1) both;
      }
      @media (max-width: 900px) {
        .wb-vault-title { max-width: 100%; }
        .wb-vault-figures { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 100%; }
        .wb-vault-gem { opacity: 0.25; width: 100px; height: 100px; }
      }

      /* DOCUMENT DRAWER HERO — compact ink + violet "signal" header for  */
      /* the document detail drawer.                                    */
      .wb-docdrawer-hero {
        position: relative;
        overflow: hidden;
        padding: 20px 46px 18px 24px;
        background: linear-gradient(135deg, #0A0F1E 0%, #151033 55%, #0A0F1E 100%);
      }
      .wb-docdrawer-hero-rose { background: linear-gradient(135deg, #1A0A0A 0%, #2E0F0F 55%, #1A0A0A 100%); }
      .wb-docdrawer-hero-emerald { background: linear-gradient(135deg, #06231B 0%, #0B2B22 55%, #06231B 100%); }
      .wb-docdrawer-hero-gridlines {
        position: absolute; inset: -20%;
        background-image:
          linear-gradient(90deg, rgba(139,124,246,0.06) 1px, transparent 1px),
          linear-gradient(0deg, rgba(139,124,246,0.06) 1px, transparent 1px);
        background-size: 26px 26px;
        animation: wb-grid-pan-t 16s linear infinite;
        pointer-events: none;
      }
      .wb-docdrawer-hero-glow-a, .wb-docdrawer-hero-glow-b {
        position: absolute; border-radius: 50%; filter: blur(40px); pointer-events: none;
      }
      .wb-docdrawer-hero-glow-a { width: 160px; height: 160px; right: -30px; top: -50px; background: rgba(139,124,246,0.28); animation: wb-drift-a 8s ease-in-out infinite; }
      .wb-docdrawer-hero-glow-b { width: 140px; height: 140px; left: -30px; bottom: -50px; background: rgba(95,224,208,0.14); animation: wb-drift-b 10s ease-in-out infinite; }
      .wb-docdrawer-hero-rose .wb-docdrawer-hero-glow-a { background: rgba(178,58,58,0.3); }
      .wb-docdrawer-hero-emerald .wb-docdrawer-hero-glow-a { background: rgba(110,231,183,0.28); }
      .wb-docdrawer-signal {
        position: absolute; top: 0; left: 0; width: 100%; height: 12px;
        pointer-events: none;
      }
      .wb-docdrawer-signal-dot {
        fill: #8B7CF6;
        filter: drop-shadow(0 0 4px rgba(139,124,246,0.9));
        animation: wb-docdrawer-signal-move 3.2s ease-in-out infinite;
      }
      .wb-docdrawer-hero-rose .wb-docdrawer-signal-dot { fill: #E08A8A; filter: drop-shadow(0 0 4px rgba(224,138,138,0.9)); }
      .wb-docdrawer-hero-emerald .wb-docdrawer-signal-dot { fill: #6EE7B7; filter: drop-shadow(0 0 4px rgba(110,231,183,0.9)); }
      @keyframes wb-docdrawer-signal-move {
        0% { transform: translateX(0); }
        50% { transform: translateX(388px); }
        100% { transform: translateX(0); }
      }
      .wb-docdrawer-close {
        position: absolute; top: 16px; right: 16px; z-index: 2;
        background: rgba(255,255,255,0.08); border: none; cursor: pointer;
        width: 30px; height: 30px; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        color: #F8F4E9;
        transition: background 0.2s ease;
      }
      .wb-docdrawer-close:hover { background: rgba(255,255,255,0.16); }
      .wb-docdrawer-eyebrow {
        position: relative; z-index: 1;
        display: flex; align-items: center; gap: 8px;
        color: rgba(248,244,233,0.55); font-size: 12px; margin: 6px 0 0;
      }
      .wb-docdrawer-title {
        position: relative; z-index: 1;
        font-size: 21px; margin: 6px 0 0; color: #F8F4E9;
      }
      .wb-docdrawer-title-shine {
        background: linear-gradient(100deg, #F8F4E9 20%, #C9BEFA 42%, #F8F4E9 58%, #F8F4E9 100%);
        background-size: 220% 100%;
        -webkit-background-clip: text; background-clip: text; color: transparent;
        animation: wb-title-shine 4.5s linear infinite;
      }
      .wb-docdrawer-sub {
        position: relative; z-index: 1;
        color: rgba(248,244,233,0.45); font-size: 11px; margin: 4px 0 0;
      }
      .wb-live-dot-violet { background: #8B7CF6; box-shadow: 0 0 0 0 rgba(139,124,246,0.6); animation: wb-pulse-dot-violet 2s ease-in-out infinite; }
      @keyframes wb-pulse-dot-violet {
        0% { box-shadow: 0 0 0 0 rgba(139,124,246,0.55); }
        70% { box-shadow: 0 0 0 8px rgba(139,124,246,0); }
        100% { box-shadow: 0 0 0 0 rgba(139,124,246,0); }
      }
      .wb-live-dot-rose { background: #E08A8A; box-shadow: 0 0 0 0 rgba(224,138,138,0.6); animation: wb-pulse-dot-rose 2s ease-in-out infinite; }
      @keyframes wb-pulse-dot-rose {
        0% { box-shadow: 0 0 0 0 rgba(224,138,138,0.55); }
        70% { box-shadow: 0 0 0 8px rgba(224,138,138,0); }
        100% { box-shadow: 0 0 0 0 rgba(224,138,138,0); }
      }
      /* SEAL PATH — the "path travelled" row of stamps on a document.   */
      .wb-seal-pop {
        animation: wb-pop-in 0.4s cubic-bezier(0.22,1,0.36,1) both;
      }
      .wb-seal-glow {
        position: absolute; inset: -6px; border-radius: 50%;
        background: radial-gradient(circle, rgba(201,165,92,0.5) 0%, rgba(201,165,92,0) 70%);
        animation: wb-jewel-breathe 2s ease-in-out infinite;
        pointer-events: none;
      }
      .wb-seal-glow-rose {
        background: radial-gradient(circle, rgba(178,58,58,0.55) 0%, rgba(178,58,58,0) 70%);
      }

      /* COMPOSE HERO — "Create & send a document" header, same ink +    */
      /* violet signal language as the Document Drawer hero.            */
      .wb-compose-hero {
        position: relative;
        overflow: hidden;
        border-radius: 16px;
        padding: 22px 26px 20px;
        background: linear-gradient(135deg, #0A0F1E 0%, #151033 55%, #0A0F1E 100%);
        box-shadow: 0 16px 40px rgba(10,10,25,0.35);
      }
      .wb-compose-hero-gridlines {
        position: absolute; inset: -20%;
        background-image:
          linear-gradient(90deg, rgba(139,124,246,0.06) 1px, transparent 1px),
          linear-gradient(0deg, rgba(139,124,246,0.06) 1px, transparent 1px);
        background-size: 26px 26px;
        animation: wb-grid-pan-t 16s linear infinite;
        pointer-events: none;
      }
      .wb-compose-hero-glow-a, .wb-compose-hero-glow-b {
        position: absolute; border-radius: 50%; filter: blur(46px); pointer-events: none;
      }
      .wb-compose-hero-glow-a { width: 200px; height: 200px; right: -40px; top: -60px; background: rgba(139,124,246,0.3); animation: wb-drift-a 8s ease-in-out infinite; }
      .wb-compose-hero-glow-b { width: 170px; height: 170px; left: -40px; bottom: -60px; background: rgba(95,224,208,0.16); animation: wb-drift-b 10s ease-in-out infinite; }
      .wb-compose-signal {
        position: absolute; top: 0; left: 0; width: 100%; height: 14px; pointer-events: none;
      }
      .wb-compose-signal-dot {
        fill: #8B7CF6;
        filter: drop-shadow(0 0 5px rgba(139,124,246,0.9));
        animation: wb-compose-signal-move 4s ease-in-out infinite;
      }
      @keyframes wb-compose-signal-move {
        0% { transform: translateX(0); }
        50% { transform: translateX(586px); }
        100% { transform: translateX(0); }
      }
      .wb-compose-eyebrow {
        position: relative; z-index: 1;
        display: flex; align-items: center; gap: 8px;
        color: rgba(248,244,233,0.6); font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
        margin: 4px 0 0;
      }
      .wb-compose-title {
        position: relative; z-index: 1;
        font-size: 24px; margin: 8px 0 0; color: #F8F4E9;
      }
      .wb-compose-title-shine {
        background: linear-gradient(100deg, #F8F4E9 20%, #C9BEFA 42%, #F8F4E9 58%, #F8F4E9 100%);
        background-size: 220% 100%;
        -webkit-background-clip: text; background-clip: text; color: transparent;
        animation: wb-title-shine 4.5s linear infinite;
      }
      .wb-compose-sub {
        position: relative; z-index: 1;
        color: rgba(248,244,233,0.5); font-size: 12px; margin: 6px 0 0;
      }

      /* ============================================================= */
      /* MAIN DASHBOARD HERO — dark "jewel vault" per-department theme  */
      /* used only on the landing Dashboard page right after login.     */
      /* Everything here animates transform/opacity/background-position */
      /* only (compositor-only), so richer visuals don't cost layout or */
      /* paint the way box-shadow/top/filter animation loops would.     */
      /* ============================================================= */
      .wb-dept-hero {
        position: relative;
        overflow: hidden;
        border-radius: 28px;
        padding: 40px 44px;
        min-height: 260px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 26px;
        box-shadow: 0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
        animation: wb-dept-hero-in 0.5s cubic-bezier(0.16,1,0.3,1);
      }
      @keyframes wb-dept-hero-in {
        from { opacity: 0; transform: translateY(10px) scale(0.99); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .wb-dept-hero-gridlines {
        position: absolute; inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
        background-size: 34px 34px;
        opacity: 0.6;
        mask-image: radial-gradient(ellipse 85% 85% at 50% 40%, black 20%, transparent 78%);
        -webkit-mask-image: radial-gradient(ellipse 85% 85% at 50% 40%, black 20%, transparent 78%);
      }
      .wb-dept-hero-glow-a, .wb-dept-hero-glow-b, .wb-dept-hero-glow-c {
        position: absolute;
        border-radius: 50%;
        filter: blur(46px);
        opacity: 0.85;
        will-change: transform;
      }
      .wb-dept-hero-glow-a { width: 300px; height: 300px; top: -100px; right: 8%; animation: wb-dept-blob-a 9s ease-in-out infinite; }
      .wb-dept-hero-glow-b { width: 240px; height: 240px; bottom: -90px; left: 6%; animation: wb-dept-blob-b 11s ease-in-out infinite; }
      .wb-dept-hero-glow-c { width: 190px; height: 190px; top: 28%; right: 30%; animation: wb-dept-blob-c 13s ease-in-out infinite; }
      @keyframes wb-dept-blob-a {
        0%, 100% { transform: translate(0,0) scale(1); }
        50% { transform: translate(-18px, 22px) scale(1.12); }
      }
      @keyframes wb-dept-blob-b {
        0%, 100% { transform: translate(0,0) scale(1); }
        50% { transform: translate(20px, -16px) scale(1.08); }
      }
      @keyframes wb-dept-blob-c {
        0%, 100% { transform: translate(0,0) scale(1); }
        50% { transform: translate(14px, 14px) scale(0.9); }
      }
      /* Tiny drifting twinkle points — cheap (opacity + transform only,   */
      /* 3 elements) — reads as "gem dust" scattered across the vault.    */
      .wb-dept-hero-sparkle {
        position: absolute;
        width: 3px; height: 3px;
        border-radius: 50%;
        z-index: 1;
        will-change: transform, opacity;
      }
      .wb-dept-hero-sparkle-1 { top: 18%; left: 42%; box-shadow: 0 0 6px 1px currentColor; animation: wb-twinkle 3.4s ease-in-out infinite; }
      .wb-dept-hero-sparkle-2 { top: 62%; left: 30%; width: 2px; height: 2px; box-shadow: 0 0 5px 1px currentColor; animation: wb-twinkle 4.1s ease-in-out infinite 0.8s; }
      .wb-dept-hero-sparkle-3 { top: 40%; left: 55%; box-shadow: 0 0 6px 1px currentColor; animation: wb-twinkle 3.8s ease-in-out infinite 1.6s; }
      @keyframes wb-twinkle {
        0%, 100% { opacity: 0; transform: scale(0.6); }
        50% { opacity: 1; transform: scale(1.6); }
      }
      .wb-dept-hero-top { position: relative; z-index: 2; max-width: 62%; }
      .wb-dept-hero-eyebrow {
        display: flex; align-items: center; gap: 8px;
        font-size: 12.5px; font-weight: 600; letter-spacing: 0.04em;
        text-transform: uppercase;
        margin-bottom: 14px;
      }
      .wb-dept-live-dot {
        width: 8px; height: 8px; border-radius: 50%;
        animation: wb-pulse-dot 1.6s ease-in-out infinite;
      }
      .wb-dept-hero-clock { font-variant-numeric: tabular-nums; }
      .wb-dept-hero-title {
        font-size: 40px;
        line-height: 1.08;
        margin: 0 0 8px;
        letter-spacing: -0.01em;
      }
      /* Slow gold-cream shine sweeping across the greeting text — a one   */
      /* -property (background-position) text-clip animation, same cost   */
      /* class as wb-hero-title-shine used elsewhere in the app.          */
      .wb-dept-hero-title-shine {
        background-image: linear-gradient(100deg, var(--dept-shine-a) 20%, var(--dept-shine-b) 42%, var(--dept-shine-a) 58%, var(--dept-shine-a) 100%);
        background-size: 220% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: wb-title-shine 6s ease-in-out infinite;
      }
      .wb-dept-hero-sub {
        font-size: 15px;
        font-weight: 600;
        margin: 0 0 22px;
        opacity: 0.92;
      }
      .wb-dept-hero-actions { display: flex; flex-wrap: wrap; gap: 10px; }
      .wb-dept-pill {
        display: flex; align-items: center; gap: 8px;
        background: rgba(255,255,255,0.07);
        border: 1.5px solid;
        border-radius: 999px;
        padding: 9px 16px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        backdrop-filter: blur(4px);
        transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      }
      .wb-dept-pill:hover { transform: translateY(-2px); background: rgba(255,255,255,0.12); box-shadow: 0 8px 18px rgba(0,0,0,0.3); }
      .wb-dept-hero-orbit {
        position: absolute;
        top: 26px; right: 40px;
        width: 120px; height: 120px;
        z-index: 1;
        animation: wb-dept-orbit-spin 16s linear infinite;
      }
      @keyframes wb-dept-orbit-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      /* Faceted gem badge — replaces the old flat icon circle. A hexagon */
      /* clip-path "cut" plus a single rotating conic-gradient sweep      */
      /* (one element, transform-only) gives the light-catching gem look */
      /* without per-frame shadow/filter cost.                            */
      .wb-dept-gem {
        position: absolute;
        top: 50%; left: 50%;
        width: 66px; height: 66px;
        margin: -33px 0 0 -33px;
        clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 16px 32px rgba(0,0,0,0.45);
        animation: wb-dept-icon-counter-spin 16s linear infinite;
      }
      .wb-dept-gem-sweep {
        position: absolute;
        inset: -40%;
        background: conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.55) 18deg, transparent 40deg, transparent 360deg);
        animation: wb-gem-sweep-spin 5s linear infinite;
        pointer-events: none;
      }
      @keyframes wb-gem-sweep-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes wb-dept-icon-counter-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(-360deg); }
      }
      .wb-dept-hero-orbit-dot { position: absolute; width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 12px currentColor; }
      .wb-dept-hero-orbit-dot-a { top: 0; left: 50%; margin-left: -5px; }
      .wb-dept-hero-orbit-dot-b { bottom: 6px; right: 6px; }
      .wb-dept-hero-gauge-wrap { position: relative; z-index: 2; flex-shrink: 0; }
      .wb-dept-hero-gauge { position: relative; width: 88px; height: 88px; }
      .wb-dept-hero-gauge-label {
        position: absolute; inset: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
      }
      .wb-dept-hero-gauge-value { font-size: 22px; font-weight: 800; line-height: 1; }
      .wb-dept-hero-gauge-text { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; margin-top: 2px; text-align: center; }
      @media (max-width: 860px) {
        .wb-dept-hero { flex-direction: column; align-items: flex-start; padding: 28px 24px; min-height: unset; }
        .wb-dept-hero-top { max-width: 100%; }
        .wb-dept-hero-title { font-size: 30px; }
        .wb-dept-hero-orbit { display: none; }
        .wb-dept-hero-gauge-wrap { align-self: flex-end; }
      }

      /* ============================================================= */
      /* HSE HERO — bold animated red command header                    */
      /* ============================================================= */
      .wb-hse-hero {
        position: relative;
        overflow: hidden;
        border-radius: 26px;
        padding: 34px 38px;
        margin-bottom: 22px;
        min-height: 200px;
        background: linear-gradient(135deg, #B23A3A 0%, #8A2E2E 55%, #5C1414 100%);
        box-shadow: 0 22px 50px rgba(140,30,30,0.32);
        animation: wb-dept-hero-in 0.5s cubic-bezier(0.16,1,0.3,1);
      }
      .wb-hse-hero-gridlines {
        position: absolute; inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px);
        background-size: 30px 30px;
        mask-image: radial-gradient(ellipse 85% 85% at 40% 40%, black 20%, transparent 78%);
        -webkit-mask-image: radial-gradient(ellipse 85% 85% at 40% 40%, black 20%, transparent 78%);
      }
      .wb-hse-hero-glow-a, .wb-hse-hero-glow-b, .wb-hse-hero-glow-c {
        position: absolute; border-radius: 50%; filter: blur(46px); opacity: 0.55;
      }
      .wb-hse-hero-glow-a { width: 260px; height: 260px; top: -80px; right: 12%; background: rgba(255,120,110,0.55); animation: wb-dept-blob-a 8s ease-in-out infinite; }
      .wb-hse-hero-glow-b { width: 220px; height: 220px; bottom: -90px; left: 6%; background: rgba(255,80,70,0.4); animation: wb-dept-blob-b 10s ease-in-out infinite; }
      .wb-hse-hero-glow-c { width: 160px; height: 160px; top: 40%; left: 42%; background: rgba(255,180,170,0.35); animation: wb-dept-blob-c 12s ease-in-out infinite; }
      .wb-hse-float-icon {
        position: absolute;
        opacity: 0.9;
        animation: wb-hse-float 5s ease-in-out infinite;
      }
      @keyframes wb-hse-float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-14px) rotate(8deg); }
      }
      .wb-hse-hero-orbit {
        position: absolute; top: 26px; right: 40px;
        width: 64px; height: 64px;
        animation: wb-dept-orbit-spin 14s linear infinite;
      }
      .wb-hse-hero-badge {
        width: 64px; height: 64px;
        border-radius: 20px;
        background: linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.06));
        border: 1.5px solid rgba(255,255,255,0.4);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 0 0 rgba(255,255,255,0.35);
        animation: wb-call-ring-pulse 2s ease-in-out infinite, wb-dept-icon-counter-spin 14s linear infinite;
      }
      .wb-hse-hero-top { position: relative; z-index: 2; max-width: 60%; }
      .wb-hse-hero-eyebrow {
        display: flex; align-items: center; gap: 8px;
        font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
        color: rgba(255,235,232,0.85); margin-bottom: 12px;
      }
      .wb-hse-live-dot {
        width: 8px; height: 8px; border-radius: 50%; background: #FFD3D0;
        animation: wb-pulse-dot 1.6s ease-in-out infinite;
      }
      .wb-hse-hero-title { font-size: 32px; color: #fff; margin: 0 0 8px; letter-spacing: -0.01em; }
      .wb-hse-hero-sub { font-size: 14px; color: rgba(255,235,232,0.82); margin: 0; max-width: 480px; }
      .wb-hse-hero-figures {
        position: relative; z-index: 2;
        display: flex; flex-wrap: wrap; gap: 10px;
        margin-top: 22px;
      }
      .wb-hse-fig {
        display: flex; align-items: center; gap: 7px;
        background: rgba(255,255,255,0.14);
        border: 1px solid rgba(255,255,255,0.22);
        border-radius: 999px;
        padding: 8px 14px;
        color: #fff;
        backdrop-filter: blur(4px);
      }
      .wb-hse-fig-alert { background: rgba(255,255,255,0.26); animation: wb-hse-fig-alert-pulse 1.8s ease-in-out infinite; }
      @keyframes wb-hse-fig-alert-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
        50% { box-shadow: 0 0 0 6px rgba(255,255,255,0); }
      }
      .wb-hse-fig-value { font-weight: 800; font-size: 14px; }
      .wb-hse-fig-label { font-size: 11.5px; opacity: 0.85; }
      @media (max-width: 860px) {
        .wb-hse-hero-top { max-width: 100%; }
        .wb-hse-hero-orbit { display: none; }
      }

      /* ============================================================= */
      /* DIRECTORY — colourful animated hero + per-department cards     */
      /* ============================================================= */
      .wb-dir-hero {
        position: relative;
        overflow: hidden;
        border-radius: 26px;
        padding: 38px 42px;
        margin-bottom: 26px;
        min-height: 190px;
        background: radial-gradient(130% 130% at 15% 20%, #16233A 0%, #0A1220 55%, #040711 100%);
        box-shadow: 0 26px 60px rgba(4,7,17,0.4), inset 0 1px 0 rgba(242,217,153,0.08);
        border: 1px solid rgba(201,165,92,0.22);
        animation: wb-dept-hero-in 0.5s cubic-bezier(0.16,1,0.3,1);
      }
      .wb-dir-hero-sweep {
        position: absolute;
        top: -60%; left: -30%;
        width: 70%; height: 220%;
        background: linear-gradient(100deg, transparent 30%, rgba(242,217,153,0.1) 45%, rgba(242,217,153,0.22) 50%, rgba(242,217,153,0.1) 55%, transparent 70%);
        transform: rotate(12deg);
        animation: wb-dir-sweep-move 7s ease-in-out infinite;
        pointer-events: none;
      }
      @keyframes wb-dir-sweep-move {
        0%, 100% { transform: translateX(0) rotate(12deg); }
        50% { transform: translateX(70%) rotate(12deg); }
      }
      .wb-dir-hero-glow-a, .wb-dir-hero-glow-b {
        position: absolute; border-radius: 50%; filter: blur(50px); opacity: 0.5;
      }
      .wb-dir-hero-glow-a { width: 260px; height: 260px; top: -70px; right: 8%; background: radial-gradient(circle, rgba(242,217,153,0.35), transparent 70%); animation: wb-dept-blob-a 10s ease-in-out infinite; }
      .wb-dir-hero-glow-b { width: 220px; height: 220px; bottom: -90px; left: 30%; background: radial-gradient(circle, rgba(95,224,208,0.25), transparent 70%); animation: wb-dept-blob-b 12s ease-in-out infinite; }
      .wb-dir-hero-dust {
        position: absolute; inset: 0;
        background-image: radial-gradient(rgba(242,217,153,0.5) 1px, transparent 1px);
        background-size: 46px 46px;
        opacity: 0.18;
        animation: wb-dir-dust-drift 22s linear infinite;
        mask-image: radial-gradient(ellipse 90% 90% at 40% 40%, black 20%, transparent 78%);
        -webkit-mask-image: radial-gradient(ellipse 90% 90% at 40% 40%, black 20%, transparent 78%);
      }
      @keyframes wb-dir-dust-drift {
        0% { background-position: 0 0; }
        100% { background-position: 120px 200px; }
      }
      .wb-dir-hero-gridlines {
        position: absolute; inset: 0;
        background-image:
          linear-gradient(rgba(242,217,153,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(242,217,153,0.06) 1px, transparent 1px);
        background-size: 34px 34px;
        mask-image: radial-gradient(ellipse 85% 85% at 30% 40%, black 15%, transparent 78%);
        -webkit-mask-image: radial-gradient(ellipse 85% 85% at 30% 40%, black 15%, transparent 78%);
      }
      .wb-dir-jewel {
        position: absolute;
        width: 40px; height: 40px;
        animation: wb-dir-jewel-float 5.5s ease-in-out infinite;
      }
      @keyframes wb-dir-jewel-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-12px); }
      }
      .wb-dir-jewel-halo {
        position: absolute; inset: -8px;
        border-radius: 50%;
        filter: blur(12px);
        opacity: 0.55;
      }
      .wb-dir-jewel-badge {
        position: relative;
        width: 38px; height: 38px;
        border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 8px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.3);
        border: 1px solid rgba(255,255,255,0.25);
      }
      .wb-dir-hero-content { position: relative; z-index: 2; max-width: 70%; }
      .wb-dir-hero-eyebrow {
        display: flex; align-items: center; gap: 8px;
        font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
        color: ${GOLD_LIGHT}; margin-bottom: 14px;
      }
      .wb-dir-live-dot {
        width: 7px; height: 7px; border-radius: 50%; background: ${CYAN};
        box-shadow: 0 0 8px ${CYAN};
        animation: wb-pulse-dot 1.6s ease-in-out infinite;
      }
      .wb-dir-hero-title { font-size: 34px; margin: 0 0 10px; letter-spacing: -0.01em; }
      .wb-dir-hero-title-shine {
        background: linear-gradient(100deg, ${GOLD_LIGHT} 20%, #fff 40%, ${GOLD_LIGHT} 60%);
        background-size: 220% auto;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: wb-dir-title-shine 5s linear infinite;
      }
      @keyframes wb-dir-title-shine {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }
      .wb-dir-hero-sub { font-size: 14.5px; color: rgba(248,244,233,0.62); margin: 0; }
      .wb-dir-dept-section { margin-bottom: 26px; }
      .wb-dir-dept-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
      .wb-dir-dept-heading h3 { font-size: 15px; margin: 0; letter-spacing: 0.01em; }
      .wb-dir-dept-dot { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 10px currentColor; animation: wb-pulse-dot 2s ease-in-out infinite; }
      .wb-dir-dept-count {
        font-size: 11px; font-weight: 700; border-radius: 999px; padding: 2px 9px;
      }
      .wb-dir-card-v2 {
        display: flex; align-items: center; gap: 12px;
        background: white;
        border: 1px solid ${LINE};
        border-left: 3px solid var(--dir-accent, #C9A55C);
        border-radius: 14px;
        padding: 14px 16px;
        position: relative;
        animation: wb-dept-hero-in 0.4s cubic-bezier(0.16,1,0.3,1) both;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .wb-dir-card-v2:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(10,18,32,0.1); }
      .wb-dir-card-avatar {
        width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-size: 13px; font-weight: 700;
        box-shadow: 0 4px 12px rgba(0,0,0,0.16);
      }
      .wb-dir-card-name { font-size: 13.5px; font-weight: 600; color: #0A1220; margin: 0 0 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .wb-dir-card-title { font-size: 12px; color: #7A7460; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .wb-dir-head-badge {
        position: absolute; top: 10px; right: 10px;
        font-size: 9.5px; font-weight: 700; text-transform: uppercase;
        border: 1px solid; border-radius: 999px; padding: 2px 7px;
      }

      /* ============================================================= */
      /* TOP BAR — luxury ink/gold header shown across every inner page */
      /* ============================================================= */
      .wb-topbar-luxe {
        position: relative;
        background: linear-gradient(100deg, ${INK_DEEP} 0%, ${INK} 55%, ${MIDNIGHT} 100%);
        box-shadow: inset 0 -1px 0 rgba(201,165,92,0.35), 0 6px 20px rgba(4,7,17,0.18);
      }
      /* The gold "sweep" light animation used to live directly on
         .wb-topbar-luxe with overflow:hidden on that same element. That
         overflow:hidden was also clipping anything else absolutely
         positioned inside the header — including the notifications
         dropdown — so the bell's panel got sliced down to a sliver
         instead of showing below the header. Moving the clip onto its
         own zero-footprint wrapper keeps the sweep contained without
         cutting off the dropdown. */
      .wb-topbar-luxe-sweep-wrap {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 0;
      }
      .wb-topbar-luxe-sweep {
        position: absolute;
        top: -140%; left: -20%;
        width: 40%; height: 380%;
        background: linear-gradient(100deg, transparent 35%, rgba(242,217,153,0.12) 48%, rgba(242,217,153,0.22) 50%, rgba(242,217,153,0.12) 52%, transparent 65%);
        transform: rotate(8deg);
        animation: wb-topbar-sweep-move 6s ease-in-out infinite;
        pointer-events: none;
      }
      @keyframes wb-topbar-sweep-move {
        0%, 100% { transform: translateX(0) rotate(8deg); }
        50% { transform: translateX(420%) rotate(8deg); }
      }
      .wb-topbar-luxe-title {
        color: ${GOLD_LIGHT};
        text-shadow: 0 0 18px rgba(242,217,153,0.25);
      }
      .wb-topbar-luxe-menu {
        background: rgba(242,217,153,0.08);
        border: 1px solid rgba(201,165,92,0.35);
      }
      .wb-topbar-luxe-icon-btn {
        display: flex; align-items: center; justify-content: center;
        width: 36px; height: 36px;
        border-radius: 10px;
        background: rgba(242,217,153,0.08);
        border: 1px solid rgba(201,165,92,0.35);
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
      }
      .wb-topbar-luxe-icon-btn:hover {
        background: rgba(242,217,153,0.16);
        border-color: ${GOLD};
        transform: translateY(-1px);
      }
      /* Without this, the bell/phone buttons pick up the browser's
         default focus outline (a plain white/grey rectangle) any time
         they're clicked — that's the square ring seen around the bell
         after opening its panel. Swap it for a themed gold glow instead
         of removing focus styling outright, so keyboard users still get
         a visible indicator. */
      .wb-topbar-luxe-icon-btn:focus {
        outline: none;
      }
      .wb-topbar-luxe-icon-btn:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px rgba(242,217,153,0.45);
      }
      /* Mobile top bar: the fixed 18px/32px padding and 16px icon gap
         were sized for a 4th icon-button (fullscreen) alongside phone,
         bell and avatar on desktop widths. Below 860px we tighten both
         so the title still has room to breathe instead of being
         squeezed into a sliver of ellipsis text; below 480px the icon
         buttons themselves shrink a touch so all of them still fit on
         one line without wrapping to a second row. */
      @media (max-width: 860px) {
        .wb-topbar-luxe { padding: 14px 16px !important; }
        .wb-topbar-luxe-actions { gap: 8px !important; }

        /* Fullscreen icon-button flourish — phone only. The button gets
           this class for a moment on every tap regardless of screen
           size, but the keyframes only exist inside this breakpoint, so
           desktop clicks stay flourish-free. */
        @keyframes wb-fullscreen-pulse {
          0%   { transform: scale(1) rotate(0deg); }
          45%  { transform: scale(0.82) rotate(-14deg); }
          75%  { transform: scale(1.08) rotate(4deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .wb-fullscreen-btn-animate {
          animation: wb-fullscreen-pulse 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      }
      @media (max-width: 480px) {
        .wb-topbar-luxe-icon-btn { width: 32px !important; height: 32px !important; border-radius: 9px !important; }
        .wb-topbar-luxe-avatar { width: 30px !important; height: 30px !important; font-size: 10px !important; }
        .wb-topbar-luxe-title { font-size: 18px !important; }
      }
      .wb-topbar-luxe-avatar {
        background: linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 60%, ${GOLD_DEEP} 100%);
        width: 36px; height: 36px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: ${INK_DEEP};
        font-size: 12px;
        font-weight: 700;
        border: 1px solid rgba(242,217,153,0.6);
        box-shadow: 0 3px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4);
      }

      /* Packing accept/reject gate (Warehouse) --------------------------- */
      .wb-packing-gate-glow {
        position: absolute; inset: 0;
        background: radial-gradient(circle at 15% 0%, rgba(240,169,62,0.28), transparent 60%);
        pointer-events: none;
        animation: wb-packing-glow-pulse 2.4s ease-in-out infinite;
      }
      @keyframes wb-packing-glow-pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      /* Department calling ------------------------------------------- */
      .wb-icon-btn {
        display: flex; align-items: center; justify-content: center;
        width: 34px; height: 34px;
        border-radius: 10px;
        background: #FAF7EF;
        border: 1px solid #E9E2D0;
        cursor: pointer;
      }
      /* Little shake on the top-bar bell while something is still      */
      /* unseen in the Inbox — cheap (transform only, one small icon).   */
      .wb-bell-ring { animation: wb-bell-shake 0.9s ease-in-out infinite; transform-origin: top center; }
      @keyframes wb-bell-shake {
        0%, 100% { transform: rotate(0deg); }
        20% { transform: rotate(-14deg); }
        40% { transform: rotate(11deg); }
        60% { transform: rotate(-8deg); }
        80% { transform: rotate(5deg); }
      }
      .wb-icon-btn-active { position: relative; }
      .wb-icon-btn-active::after {
        content: '';
        position: absolute;
        top: 4px; right: 4px;
        width: 8px; height: 8px;
        border-radius: 50%;
        background: #B23A3A;
        box-shadow: 0 0 0 2px white;
        animation: wb-pulse-dot 1.4s ease-in-out infinite;
      }
      .wb-call-modal-backdrop {
        position: fixed; inset: 0;
        background: rgba(4,7,17,0.55);
        backdrop-filter: blur(3px);
        display: flex; align-items: center; justify-content: center;
        z-index: 400;
        animation: wb-fade-in 0.18s ease;
      }
      @keyframes wb-fade-in { from { opacity: 0; } to { opacity: 1; } }
      .wb-call-modal {
        background: white;
        border-radius: 18px;
        padding: 22px;
        width: min(420px, 90vw);
        box-shadow: 0 30px 60px rgba(4,7,17,0.35);
        animation: wb-pop-in 0.24s cubic-bezier(0.16,1,0.3,1);
      }
      .wb-call-modal-head {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 16px;
      }
      .wb-call-dept-grid { display: flex; flex-direction: column; gap: 8px; }
      .wb-call-dept-btn {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid #E9E2D0;
        background: #FDFBF6;
        cursor: pointer;
        font-size: 13.5px;
        color: #0A1220;
        text-align: left;
      }
      .wb-call-dept-btn:hover { background: #FBF3E3; border-color: #F2D999; }
      .wb-call-dept-btn span { flex: 1; font-weight: 500; }
      .wb-call-dept-icon {
        width: 34px; height: 34px;
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .wb-call-incoming {
        background: white;
        border-radius: 20px;
        padding: 32px 28px;
        width: min(340px, 90vw);
        text-align: center;
        box-shadow: 0 30px 60px rgba(4,7,17,0.35);
        animation: wb-pop-in 0.24s cubic-bezier(0.16,1,0.3,1);
      }
      .wb-call-incoming-avatar {
        width: 74px; height: 74px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto;
        position: relative;
        animation: wb-call-ring-pulse 1.6s ease-in-out infinite;
      }
      @keyframes wb-call-ring-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(178,58,58,0.28); }
        50% { box-shadow: 0 0 0 14px rgba(178,58,58,0); }
      }
      .wb-call-incoming-actions {
        display: flex; justify-content: center; gap: 18px;
        margin-top: 22px;
      }
      .wb-call-btn {
        width: 52px; height: 52px;
        border-radius: 50%;
        border: none;
        display: flex; align-items: center; justify-content: center;
        color: white;
        cursor: pointer;
      }
      .wb-call-btn-accept { background: linear-gradient(135deg, #1F4B3F, #2E6E5B); animation: wb-call-ring-pulse-green 1.6s ease-in-out infinite; }
      @keyframes wb-call-ring-pulse-green {
        0%, 100% { box-shadow: 0 0 0 0 rgba(46,110,91,0.35); }
        50% { box-shadow: 0 0 0 12px rgba(46,110,91,0); }
      }
      .wb-call-btn-decline { background: linear-gradient(135deg, #8A2E2E, #B23A3A); }
      .wb-call-bar {
        position: fixed;
        bottom: 22px; right: 22px;
        display: flex; align-items: center; gap: 10px;
        background: white;
        border-radius: 16px;
        padding: 10px 14px;
        box-shadow: 0 18px 38px rgba(10,18,32,0.22);
        z-index: 390;
        animation: wb-slide-in 0.28s cubic-bezier(0.16,1,0.3,1);
        min-width: 220px;
      }
      .wb-call-bar-icon {
        width: 34px; height: 34px;
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .wb-call-mini-btn {
        width: 30px; height: 30px;
        border-radius: 9px;
        border: 1px solid #E9E2D0;
        background: #FAF7EF;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        color: #0A1220;
      }
      .wb-call-mini-btn-end { background: #B23A3A; border-color: #B23A3A; color: white; }

      /* Call launcher / active-call panel ---------------------------- */
      /* A wide "half of the page" surface (sibling of the document      */
      /* drawer) that slides in from the right and covers every stage   */
      /* of a call: picking department(s), an incoming invite, and the  */
      /* live roster. Mirrors the drawer/doc-hero visual language: a    */
      /* dark ink header with a gold sweep, paper body underneath.      */
      .wb-callpanel-backdrop {
        position: fixed; inset: 0;
        background: rgba(4,7,17,0.6);
        backdrop-filter: blur(4px);
        display: flex; justify-content: flex-end;
        z-index: 480;
        animation: wb-fade-in 0.18s ease;
      }
      .wb-callpanel {
        position: relative;
        width: min(460px, 100vw);
        height: 100%;
        background: #FDFBF6;
        display: flex; flex-direction: column;
        overflow-y: auto;
        box-shadow: -20px 0 60px rgba(4,7,17,0.35);
        animation: wb-slide-in 0.28s cubic-bezier(0.16,1,0.3,1);
      }
      .wb-callpanel-sweep {
        position: absolute;
        top: -20%; left: -45%;
        width: 55%; height: 110%;
        background: linear-gradient(100deg, rgba(242,217,153,0) 0%, rgba(242,217,153,0.16) 45%, rgba(255,255,255,0.22) 50%, rgba(242,217,153,0.16) 55%, rgba(242,217,153,0) 100%);
        transform: rotate(8deg) translateX(0%);
        animation: wb-vault-sweep-move 5.5s ease-in-out infinite;
        will-change: transform, opacity;
        pointer-events: none;
      }
      .wb-callpanel-head {
        position: relative;
        overflow: hidden;
        flex-shrink: 0;
        display: flex; align-items: flex-start; justify-content: space-between;
        gap: 12px;
        padding: 28px 24px 22px;
        background: linear-gradient(135deg, #0A1220 0%, #0D1B2E 55%, #040711 100%);
      }
      .wb-callpanel-eyebrow {
        position: relative; z-index: 1;
        margin: 0;
        font-size: 11.5px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase;
        color: #F2D999;
      }
      .wb-callpanel-title {
        position: relative; z-index: 1;
        margin: 6px 0 0;
        font-size: 22px; line-height: 1.25;
        color: #FBF0D6;
      }
      .wb-callpanel-min-btn {
        position: relative; z-index: 1;
        flex-shrink: 0;
        width: 32px; height: 32px;
        border-radius: 9px;
        border: 1px solid rgba(242,217,153,0.25);
        background: rgba(255,255,255,0.06);
        color: #F2D999;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        transform: rotate(90deg);
        transition: background 0.15s ease;
      }
      .wb-callpanel-min-btn:hover { background: rgba(255,255,255,0.14); }
      .wb-callpanel-body {
        flex: 1;
        display: flex; flex-direction: column; gap: 16px;
        padding: 22px 24px 28px;
      }
      .wb-callpanel-hint {
        margin: 0;
        font-size: 13px; color: #7A7460; line-height: 1.5;
      }
      .wb-callpanel-primary-btn {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        width: 100%;
        padding: 13px 16px;
        border-radius: 12px;
        border: none;
        background: linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD});
        color: #0A1220;
        font-weight: 700; font-size: 14px;
        cursor: pointer;
        transition: opacity 0.15s ease, transform 0.15s ease;
      }
      .wb-callpanel-primary-btn:hover:not(:disabled) { transform: translateY(-1px); }
      .wb-callpanel-primary-btn:disabled { background: #E9E2D0; color: #B0AA96; cursor: not-allowed; }
      .wb-callpanel-secondary-btn {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        padding: 11px 16px;
        border-radius: 12px;
        border: 1px dashed #E9E2D0;
        background: #FAF7EF;
        color: #5A5440;
        font-weight: 600; font-size: 13px;
        cursor: pointer;
      }
      .wb-callpanel-secondary-btn:hover { background: #FBF3E3; border-color: #F2D999; }
      .wb-callpanel-roster { display: flex; flex-direction: column; gap: 8px; }
      .wb-callpanel-roster-row {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid #E9E2D0;
        background: #FDFBF6;
      }
      .wb-callpanel-roster-avatar {
        width: 38px; height: 38px; flex-shrink: 0;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        background: linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD});
        color: #0A1220;
        font-size: 12.5px; font-weight: 700;
      }
      .wb-callpanel-roster-name { margin: 0; font-size: 13.5px; font-weight: 600; color: #0A1220; }
      .wb-callpanel-roster-dept { margin: 1px 0 0; font-size: 11.5px; color: #9A9380; }
      .wb-callpanel-roster-status { flex-shrink: 0; font-size: 11.5px; font-weight: 600; }
      .wb-callpanel-incoming-actions { display: flex; justify-content: center; gap: 22px; margin-top: 8px; }
      .wb-callpanel-incoming-actions .wb-call-btn { width: 60px; height: 60px; }
      .wb-callpanel-add-block {
        padding: 14px;
        border-radius: 14px;
        border: 1px solid #E9E2D0;
        background: #FAF7EF;
      }
      .wb-callpanel-active-controls { display: flex; justify-content: center; gap: 14px; margin-top: 4px; }

      /* Department picker "picked" state — otherwise a selected dept   */
      /* only differs by the tiny checkmark icon, easy to miss.          */
      .wb-call-dept-btn-picked {
        border-color: ${GOLD};
        background: linear-gradient(135deg, rgba(242,217,153,0.22), rgba(201,165,92,0.1));
        box-shadow: 0 0 0 1px ${GOLD} inset;
      }

      /* The floating mini pill (CallMiniBar) is a real <button>, so     */
      /* reset the browser defaults and give its icon a proper badge.    */
      .wb-call-bar {
        border: none; text-align: left; font-family: inherit; cursor: pointer;
      }
      .wb-call-bar-icon {
        background: linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD});
        color: #0A1220;
      }
      .wb-call-bar-incoming { animation: wb-slide-in 0.28s cubic-bezier(0.16,1,0.3,1), wb-call-ring-pulse 1.6s ease-in-out infinite; }
      .wb-call-bar-incoming .wb-call-bar-icon {
        background: linear-gradient(135deg, #FF8A80, #B23A3A);
        color: white;
      }

      /* Inbox arrival toast --------------------------------------------- */
      /* Sized generously for laptop/desktop screens — this is the thing  */
      /* someone is meant to notice and act on, not a tiny corner label.  */
      .wb-toast-stack {
        position: fixed;
        top: 22px; right: 22px;
        z-index: 500;
        display: flex; flex-direction: column; gap: 12px;
        width: min(420px, 92vw);
      }
      .wb-toast {
        display: flex; align-items: flex-start; gap: 14px;
        background: linear-gradient(180deg, #FDFBF6 0%, #FAF7EF 100%);
        border: 1px solid #E9E2D0;
        border-radius: 18px;
        padding: 18px 18px;
        box-shadow: 0 22px 50px rgba(10,18,32,0.28);
        animation: wb-toast-in 0.32s cubic-bezier(0.16,1,0.3,1);
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .wb-toast:hover {
        transform: translateY(-2px);
        box-shadow: 0 26px 56px rgba(10,18,32,0.34);
      }
      .wb-toast-urgent {
        background: linear-gradient(135deg, #1A1006 0%, #241605 55%, #120B03 100%);
        border: 1px solid ${GOLD_DEEP};
        box-shadow: 0 22px 50px rgba(140,90,20,0.4);
      }
      .wb-toast-urgent .wb-toast-title { color: ${GOLD_LIGHT}; }
      .wb-toast-urgent .wb-toast-body { color: #E9D9B8; }
      .wb-toast-urgent .wb-toast-cta { color: ${GOLD_LIGHT}; }
      .wb-toast-urgent .wb-toast-close { color: rgba(242,217,153,0.7); }
      .wb-toast-leaving { animation: wb-toast-out 0.22s ease forwards; }
      @keyframes wb-toast-in {
        from { opacity: 0; transform: translateX(28px) scale(0.97); }
        to { opacity: 1; transform: translateX(0) scale(1); }
      }
      @keyframes wb-toast-out {
        from { opacity: 1; transform: translateX(0) scale(1); }
        to { opacity: 0; transform: translateX(28px) scale(0.97); }
      }
      .wb-toast-icon {
        width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        background: linear-gradient(135deg, #1FA396, #5FE0D0);
        color: white;
        animation: wb-toast-icon-pulse 1.8s ease-in-out infinite;
      }
      .wb-toast-icon-urgent {
        background: linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD});
        color: ${INK_DEEP};
        animation: wb-toast-icon-pulse-gold 1.4s ease-in-out infinite;
      }
      @keyframes wb-toast-icon-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(31,163,150,0.35); }
        50% { box-shadow: 0 0 0 8px rgba(31,163,150,0); }
      }
      @keyframes wb-toast-icon-pulse-gold {
        0%, 100% { box-shadow: 0 0 0 0 rgba(201,165,92,0.5); }
        50% { box-shadow: 0 0 0 10px rgba(201,165,92,0); }
      }
      .wb-toast-title { font-size: 14px; font-weight: 700; color: #0A1220; margin: 0 0 3px; }
      .wb-toast-body { font-size: 13px; color: #7A7460; margin: 0; line-height: 1.45; }
      .wb-toast-cta { font-size: 11.5px; color: ${CYAN_DEEP}; margin: 6px 0 0; font-weight: 600; }
      .wb-toast-close {
        background: none; border: none; cursor: pointer; color: #B8AF95;
        flex-shrink: 0; padding: 2px;
      }

      @media (prefers-reduced-motion: reduce) {
        .wb-hero-glow-a, .wb-hero-glow-b, .wb-hero-glow-c, .wb-login-aurora-a, .wb-login-aurora-b,
        .wb-login-aurora-c, .wb-hero, .wb-login-wrap, .wb-stat, .wb-drawer, .wb-history-modal,
        .wb-crest::after, .wb-btn-gold::after, .wb-login-submit::after, .wb-hero-gridlines,
        .wb-hero-scanline, .wb-orbit-ring-a, .wb-orbit-ring-b, .wb-orbit-node-a, .wb-orbit-node-b,
        .wb-hero-title-shine, .wb-live-dot, .wb-login-gridlines, .wb-orbit-dot-1, .wb-orbit-dot-2,
        .wb-orbit-dot-3, .wb-prod-hero, .wb-prod-hero-gridlines, .wb-prod-hero-glow-a,
        .wb-prod-hero-glow-b, .wb-prod-radar-sweep, .wb-prod-radar-core, .wb-prod-hero-title-shine,
        .wb-prod-stat-sweep, .wb-ann-hero, .wb-ann-hero-gridlines, .wb-ann-hero-glow-a,
        .wb-ann-hero-glow-b, .wb-ann-hero-title-shine, .wb-live-dot-gold, .wb-ann-in,
        .wb-ann-card-shine, .wb-doc-hero, .wb-doc-hero-gridlines, .wb-doc-hero-glow-a,
        .wb-doc-hero-glow-b, .wb-vault-hero, .wb-vault-sweep, .wb-vault-glow-a, .wb-vault-glow-b,
        .wb-vault-dust, .wb-vault-gem-halo, .wb-vault-gem-spin, .wb-vault-title-shine,
        .wb-live-dot-emerald, .wb-docdrawer-hero-gridlines, .wb-docdrawer-hero-glow-a,
        .wb-docdrawer-hero-glow-b, .wb-docdrawer-signal-dot, .wb-docdrawer-title-shine,
        .wb-live-dot-violet, .wb-live-dot-rose, .wb-seal-glow, .wb-compose-hero-gridlines,
        .wb-compose-hero-glow-a, .wb-compose-hero-glow-b, .wb-compose-signal-dot,
        .wb-compose-title-shine, .wb-routing-card-glow, .wb-vault-truck-icon, .wb-vault-truck-badge,
        .wb-icon-btn-active::after, .wb-call-incoming-avatar, .wb-call-btn-accept, .wb-toast,
        .wb-toast-icon, .wb-call-bar, .wb-dept-hero, .wb-dept-hero-glow-a, .wb-dept-hero-glow-b,
        .wb-dept-hero-glow-c, .wb-dept-live-dot, .wb-dept-hero-orbit, .wb-dept-gem, .wb-dept-gem-sweep,
        .wb-dept-hero-sparkle-1, .wb-dept-hero-sparkle-2, .wb-dept-hero-sparkle-3, .wb-dept-hero-title-shine,
        .wb-hse-hero, .wb-hse-hero-glow-a, .wb-hse-hero-glow-b, .wb-hse-hero-glow-c,
        .wb-hse-float-icon, .wb-hse-hero-orbit, .wb-hse-hero-badge, .wb-hse-live-dot,
        .wb-hse-fig-alert, .wb-dir-hero, .wb-dir-hero-sweep, .wb-dir-hero-glow-a, .wb-dir-hero-glow-b,
        .wb-dir-hero-dust, .wb-dir-jewel, .wb-dir-live-dot, .wb-dir-hero-title-shine,
        .wb-dir-dept-dot, .wb-dir-card-v2, .wb-topbar-luxe-sweep, .wb-tune-note-bounce,
        .wb-callpanel-sweep, .wb-call-bar-incoming {
          animation: none !important;
        }
        .wb-jewel-card, .wb-jewel-glow, .wb-jewel-bar {
          animation: none !important;
        }
      }
    `}</style>
  );
}

const CALL_SIGNAL_CHANNEL = 'department-calls';
const CALL_RING_TIMEOUT_MS = 45000;
const RTC_CONFIG = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    // STUN alone only works when both sides can reach each other directly
    // (e.g. plain same-subnet LAN). The moment one side is on mobile data,
    // a guest WiFi, behind a firewall, or behind "symmetric" NAT, direct
    // candidates never match up and the call sits on "Connecting…"
    // forever with STUN alone — there's no fallback path for the audio
    // to travel over. A TURN relay is that fallback: if a direct route
    // can't be found, media is relayed through this server instead.
    //
    // freestun.net — a genuinely open, no-signup-required TURN relay.
    // Unlike the "openrelayproject/openrelayproject" credentials that
    // are copy-pasted across nearly every WebRTC tutorial online (and
    // no longer actually authenticate — Metered now requires a real
    // account), this one works out of the box. It's a small
    // community-run service though, not an enterprise SLA — if calls
    // are still unreliable, swap in a personal Metered/Open Relay
    // account's credentials here instead (free signup, 20GB/month).
    { urls: 'stun:freestun.net:3478' },
    { urls: 'turn:freestun.net:3478', username: 'free', credential: 'free' },
  ],
};

// Turns the raw getUserMedia rejection into a message that actually says
// what to do about it, instead of a bare browser error string.
function micErrorMessage(e) {
  const msg = (e && e.message) || String(e);
  if (msg.startsWith('INSECURE_CONTEXT:')) return msg.replace('INSECURE_CONTEXT: ', '');
  if (e && e.name === 'NotAllowedError') {
    return 'Microphone permission was blocked for this site. Allow it in the browser\'s site settings (the padlock icon in the address bar) and try again.';
  }
  if (e && e.name === 'NotFoundError') {
    return 'No microphone was found on this device.';
  }
  return msg;
}

function formatCallDuration(total) {
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = Math.floor(total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ---------------------------------------------------------------------
// Department-to-department calling — now a true group/conference system.
// Any number of departments can be on one call together (a mesh: every
// participant holds a direct WebRTC connection to every other
// participant, so no extra server is needed beyond the existing
// Supabase realtime channel used purely for signalling). The ringing
// tune keeps going for as long as an invite is outstanding — it only
// stops once that department actually accepts or rejects, exactly like
// the inbox tune above.
// ---------------------------------------------------------------------
function useDepartmentCalling(user) {
  const [callState, setCallState] = useState('idle'); // idle | incoming | active
  const [callInfo, setCallInfo] = useState(null); // { callId, isGroup, hostId }
  const [participants, setParticipants] = useState([]); // [{id,dept,name,status}]
  const [muted, setMuted] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [remoteStreams, setRemoteStreams] = useState({}); // id -> MediaStream

  const pcMapRef = useRef(new Map());
  const announcedRef = useRef(new Set());
  const pendingCandidatesRef = useRef(new Map()); // peerId -> candidates queued before remoteDescription was set
  const localStreamRef = useRef(null);
  const channelRef = useRef(null);
  const myIdRef = useRef(Math.random().toString(36).slice(2));
  const ringTimerRef = useRef(null);
  const ringToneRef = useRef(null);
  const durationTimerRef = useRef(null);
  const callInfoRef = useRef(null);
  callInfoRef.current = callInfo;
  const callStateRef = useRef(callState);
  callStateRef.current = callState;
  const participantsRef = useRef(participants);
  participantsRef.current = participants;

  const stopRingtone = useCallback(() => {
    if (ringToneRef.current) {
      clearInterval(ringToneRef.current);
      ringToneRef.current = null;
    }
  }, []);

  const startRingtone = useCallback(() => {
    stopRingtone();
    const ctx = getWbAudioCtx();
    if (!ctx) return;
    playLuxuryCallRing();
    ringToneRef.current = setInterval(() => playLuxuryCallRing(), 2000);
  }, [stopRingtone]);

  const send = useCallback((payload) => {
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'signal', payload });
    }
  }, []);

  const closePeer = useCallback((id) => {
    const pc = pcMapRef.current.get(id);
    if (pc) {
      try { pc.close(); } catch (e) {}
      pcMapRef.current.delete(id);
    }
    announcedRef.current.delete(id);
    pendingCandidatesRef.current.delete(id);
    setRemoteStreams((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const teardownAll = useCallback(() => {
    stopRingtone();
    if (ringTimerRef.current) { clearTimeout(ringTimerRef.current); ringTimerRef.current = null; }
    if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null; }
    pcMapRef.current.forEach((pc) => { try { pc.close(); } catch (e) {} });
    pcMapRef.current.clear();
    announcedRef.current.clear();
    pendingCandidatesRef.current.clear();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setRemoteStreams({});
    setCallSeconds(0);
  }, [stopRingtone]);

  const resetToIdle = useCallback(() => {
    teardownAll();
    setCallState('idle');
    setCallInfo(null);
    setParticipants([]);
    setMuted(false);
  }, [teardownAll]);

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    // getUserMedia is only exposed by the browser in a "secure context" —
    // https://, or http://localhost. Opened over plain http:// from
    // another machine's IP on the LAN (the normal way to reach an
    // internal app like this one), navigator.mediaDevices is simply
    // undefined and every call would fail silently at this exact line —
    // no audio in or out, and the caller's side never even gets far
    // enough to send a usable offer, so it would just sit on
    // "Connecting…". Fail loudly and specifically here instead of
    // throwing a generic TypeError.
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'INSECURE_CONTEXT: Microphone access is blocked because this page isn\'t loaded over HTTPS (or localhost). Serve the app over https:// — voice calls cannot work over plain http:// on any device except the one running the dev server itself.'
      );
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    return stream;
  }, []);

  const flushPendingCandidates = useCallback(async (peerId, pc) => {
    const queue = pendingCandidatesRef.current.get(peerId);
    if (!queue || !queue.length) return;
    pendingCandidatesRef.current.delete(peerId);
    for (const candidate of queue) {
      try { await pc.addIceCandidate(candidate); } catch (e) { console.warn('[call] queued addIceCandidate failed', e); }
    }
  }, []);

  const maybeEndIfEveryoneGone = useCallback((list) => {
    const stillGoing = list.some(
      (p) => p.id !== myIdRef.current && ['ringing', 'connecting', 'connected'].includes(p.status)
    );
    if (!stillGoing) setTimeout(() => resetToIdle(), 1400);
  }, [resetToIdle]);

  const createPeerConnectionFor = useCallback((peerId, callId) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        send({ kind: 'ice', callId, toId: peerId, fromId: myIdRef.current, candidate: e.candidate });
      }
    };
    pc.ontrack = (e) => {
      setRemoteStreams((prev) => ({ ...prev, [peerId]: e.streams[0] }));
    };
    // Diagnostics only — open the browser console (F12) during a test
    // call and these lines show exactly where a stuck call is stalling:
    // ICE never leaving "checking" means no viable network route was
    // found (a TURN relay, added above, is what rescues that case).
    pc.oniceconnectionstatechange = () => {
      console.log(`[call] ICE state for ${peerId}:`, pc.iceConnectionState);
    };
    pc.onconnectionstatechange = () => {
      console.log(`[call] connection state for ${peerId}:`, pc.connectionState);
      if (pc.connectionState === 'connected') {
        setParticipants((list) => list.map((p) => (p.id === peerId ? { ...p, status: 'connected' } : p)));
        if (!durationTimerRef.current) {
          durationTimerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
        }
      } else if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
        closePeer(peerId);
        setParticipants((list) => {
          const next = list.map((p) => (p.id === peerId ? { ...p, status: 'left' } : p));
          maybeEndIfEveryoneGone(next);
          return next;
        });
      }
    };
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
    }
    pcMapRef.current.set(peerId, pc);
    return pc;
  }, [send, closePeer, maybeEndIfEveryoneGone]);

  const connectToPeer = useCallback(async (peerId, callId) => {
    if (peerId === myIdRef.current || announcedRef.current.has(peerId)) return;
    announcedRef.current.add(peerId);
    try {
      await ensureLocalStream();
    } catch (e) {
      announcedRef.current.delete(peerId); // don't permanently block a retry
      alert(micErrorMessage(e));
      return;
    }
    const pc = createPeerConnectionFor(peerId, callId);
    if (myIdRef.current < peerId) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      send({ kind: 'offer', callId, toId: peerId, fromId: myIdRef.current, sdp: offer });
    }
  }, [ensureLocalStream, createPeerConnectionFor, send]);

  // Start a call with one department, or several at once (a group call).
  const startCall = useCallback((toDepts) => {
    if (!user) return;
    const depts = [...new Set((Array.isArray(toDepts) ? toDepts : [toDepts]).filter((d) => d && d !== user.dept))];
    if (!depts.length) return;
    const callId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const myId = myIdRef.current;
    setCallInfo({ callId, isGroup: depts.length > 1, hostId: myId });
    setParticipants([
      { id: myId, dept: user.dept, name: user.name, status: 'you' },
      ...depts.map((d) => ({ id: `pending-${d}`, dept: d, name: d, status: 'ringing' })),
    ]);
    setCallState('active');
    startRingtone();
    send({ kind: 'invite', callId, fromId: myId, fromDept: user.dept, fromUser: user.name, toDepts: depts, isGroup: depts.length > 1 });
    ringTimerRef.current = setTimeout(() => {
      setParticipants((list) => {
        const next = list.map((p) => (p.status === 'ringing' ? { ...p, status: 'timeout' } : p));
        maybeEndIfEveryoneGone(next);
        if (next.some((p) => ['connecting', 'connected'].includes(p.status))) stopRingtone();
        return next;
      });
    }, CALL_RING_TIMEOUT_MS);
  }, [user, send, startRingtone, stopRingtone, maybeEndIfEveryoneGone]);

  // Invite additional department(s) into an already-active call.
  const inviteMore = useCallback((toDepts) => {
    const info = callInfoRef.current;
    if (!info || !user) return;
    const busyDepts = new Set(
      participantsRef.current
        .filter((p) => !['declined', 'left', 'timeout'].includes(p.status))
        .map((p) => p.dept)
    );
    const depts = [...new Set((Array.isArray(toDepts) ? toDepts : [toDepts]).filter((d) => d && d !== user.dept && !busyDepts.has(d)))];
    if (!depts.length) return;
    setParticipants((list) => [
      ...list,
      ...depts.map((d) => ({ id: `pending-${d}-${Date.now()}`, dept: d, name: d, status: 'ringing' })),
    ]);
    setCallInfo((ci) => (ci ? { ...ci, isGroup: true } : ci));
    send({ kind: 'invite', callId: info.callId, fromId: myIdRef.current, fromDept: user.dept, fromUser: user.name, toDepts: depts, isGroup: true, midCall: true });
  }, [send, user]);

  const acceptCall = useCallback(async () => {
    const info = callInfoRef.current;
    if (!info || !user) return;
    stopRingtone();
    if (ringTimerRef.current) { clearTimeout(ringTimerRef.current); ringTimerRef.current = null; }
    setCallState('active');
    try {
      await ensureLocalStream();
    } catch (e) {
      alert(micErrorMessage(e));
      send({ kind: 'decline', callId: info.callId, byId: myIdRef.current, byDept: user.dept, byUser: user.name, reason: 'no-mic' });
      resetToIdle();
      return;
    }
    send({ kind: 'accept', callId: info.callId, byId: myIdRef.current, byDept: user.dept, byUser: user.name });
    // Connect to everyone already on the call (the host, and anyone else
    // who joined before us). Without this, whichever side's random peer
    // id happened to sort *after* the other's would never send an SDP
    // offer on this leg — nobody would, on either end — and the call
    // would sit on "Connecting…" forever instead of actually connecting.
    participantsRef.current.forEach((p) => {
      if (p.id !== myIdRef.current && p.status !== 'you' && !String(p.id).startsWith('pending-')) {
        connectToPeer(p.id, info.callId);
      }
    });
  }, [user, send, stopRingtone, ensureLocalStream, resetToIdle, connectToPeer]);

  const declineCall = useCallback(() => {
    const info = callInfoRef.current;
    if (info && user) {
      send({ kind: 'decline', callId: info.callId, byId: myIdRef.current, byDept: user.dept, byUser: user.name });
    }
    resetToIdle();
  }, [send, resetToIdle, user]);

  // Leaving a call — whether that's cancelling before anyone picked up,
  // or hanging up on a live conversation.
  const endCall = useCallback(() => {
    const info = callInfoRef.current;
    if (info) {
      const nobodyJoinedYet = participantsRef.current.every(
        (p) => p.id === myIdRef.current || ['ringing', 'timeout', 'declined'].includes(p.status)
      );
      send({ kind: nobodyJoinedYet ? 'cancel' : 'leave', callId: info.callId, byId: myIdRef.current });
    }
    resetToIdle();
  }, [send, resetToIdle]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const nextMuted = !muted;
      localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !nextMuted; });
      setMuted(nextMuted);
    }
  }, [muted]);

  useEffect(() => {
    if (!user) return undefined;
    const channel = supabase.channel(CALL_SIGNAL_CHANNEL);
    channelRef.current = channel;

    channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
      if (!payload) return;
      const myId = myIdRef.current;

      if (payload.kind === 'invite' && Array.isArray(payload.toDepts) && payload.toDepts.includes(user.dept)) {
        const info = callInfoRef.current;
        if (info && info.callId === payload.callId) return; // already part of this call
        if (callStateRef.current !== 'idle') {
          send({ kind: 'decline', callId: payload.callId, byId: myId, byDept: user.dept, byUser: user.name, reason: 'busy' });
          return;
        }
        const others = payload.toDepts.filter((d) => d !== user.dept);
        setCallInfo({ callId: payload.callId, isGroup: !!payload.isGroup, hostId: payload.fromId });
        setParticipants([
          { id: payload.fromId, dept: payload.fromDept, name: payload.fromUser, status: 'connecting' },
          { id: myId, dept: user.dept, name: user.name, status: 'you' },
          ...others.map((d) => ({ id: `pending-${d}`, dept: d, name: d, status: 'ringing' })),
        ]);
        setCallState('incoming');
        startRingtone();
        ringTimerRef.current = setTimeout(() => {
          if (callInfoRef.current && callInfoRef.current.callId === payload.callId && callStateRef.current === 'incoming') {
            send({ kind: 'decline', callId: payload.callId, byId: myId, byDept: user.dept, byUser: user.name, reason: 'timeout' });
            resetToIdle();
          }
        }, CALL_RING_TIMEOUT_MS);
        return;
      }

      const info = callInfoRef.current;
      if (!info || payload.callId !== info.callId) return;

      if (payload.kind === 'cancel') {
        if (callStateRef.current === 'incoming') resetToIdle();
        return;
      }

      if (payload.kind === 'accept') {
        if (payload.byId === myId) return;
        setParticipants((list) => {
          const existingIdx = list.findIndex((p) => p.id === payload.byId);
          if (existingIdx !== -1) {
            const next = [...list];
            next[existingIdx] = { ...next[existingIdx], name: payload.byUser, status: next[existingIdx].status === 'connected' ? 'connected' : 'connecting' };
            return next;
          }
          const placeholderIdx = list.findIndex((p) => p.dept === payload.byDept && String(p.id).startsWith('pending-'));
          if (placeholderIdx !== -1) {
            const next = [...list];
            next[placeholderIdx] = { id: payload.byId, dept: payload.byDept, name: payload.byUser, status: 'connecting' };
            return next;
          }
          return [...list, { id: payload.byId, dept: payload.byDept, name: payload.byUser, status: 'connecting' }];
        });
        stopRingtone();
        if (ringTimerRef.current) { clearTimeout(ringTimerRef.current); ringTimerRef.current = null; }
        connectToPeer(payload.byId, info.callId);
        return;
      }

      if (payload.kind === 'decline') {
        setParticipants((list) => {
          const next = list.map((p) =>
            p.id === payload.byId || (p.dept === payload.byDept && String(p.id).startsWith('pending-'))
              ? { id: payload.byId, dept: payload.byDept, name: payload.byUser, status: 'declined' }
              : p
          );
          maybeEndIfEveryoneGone(next);
          return next;
        });
        return;
      }

      if (payload.kind === 'offer' && payload.toId === myId) {
        try {
          await ensureLocalStream();
        } catch (e) {
          alert(micErrorMessage(e));
          return;
        }
        announcedRef.current.add(payload.fromId);
        const pc = createPeerConnectionFor(payload.fromId, info.callId);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        await flushPendingCandidates(payload.fromId, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send({ kind: 'answer', callId: info.callId, toId: payload.fromId, fromId: myId, sdp: answer });
        setParticipants((list) =>
          list.some((p) => p.id === payload.fromId)
            ? list
            : [...list, { id: payload.fromId, dept: '', name: 'Participant', status: 'connecting' }]
        );
        return;
      }
      if (payload.kind === 'answer' && payload.toId === myId) {
        const pc = pcMapRef.current.get(payload.fromId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          await flushPendingCandidates(payload.fromId, pc);
        }
        return;
      }
      if (payload.kind === 'ice' && payload.toId === myId) {
        const pc = pcMapRef.current.get(payload.fromId);
        // A candidate can legitimately arrive over the signalling channel
        // before the offer/answer round trip that creates this peer's
        // remoteDescription has finished — candidates and the SDP race
        // each other independently. The old code just swallowed that
        // failure (empty catch) and dropped the candidate for good,
        // which silently starved the connection of routes and was a
        // real contributor to calls hanging on "Connecting…" with no
        // audio. Queue it instead and replay it once the description is
        // actually set (see flushPendingCandidates above).
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try { await pc.addIceCandidate(payload.candidate); } catch (e) { console.warn('[call] addIceCandidate failed', e); }
        } else {
          const queue = pendingCandidatesRef.current.get(payload.fromId) || [];
          queue.push(payload.candidate);
          pendingCandidatesRef.current.set(payload.fromId, queue);
        }
        return;
      }
      if (payload.kind === 'leave') {
        closePeer(payload.byId);
        setParticipants((list) => {
          const next = list.map((p) => (p.id === payload.byId ? { ...p, status: 'left' } : p));
          maybeEndIfEveryoneGone(next);
          return next;
        });
        return;
      }
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user && user.dept]);

  return {
    callState,
    callInfo,
    participants,
    muted,
    callSeconds,
    remoteStreams,
    myId: myIdRef.current,
    startCall,
    inviteMore,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
  };
}

// ---------------------------------------------------------------------
// CallPanel — the single, "half of the page" luxury surface that
// handles every stage of a call: picking department(s) to ring, an
// incoming invite, and the live/active roster. It slides in over the
// right half of the screen (a wide sibling of the document drawer)
// rather than a small centred box, so it reads as a proper calling
// suite rather than a popup. It can be minimised to a small floating
// pill (CallMiniBar, below) without ending the call — audio keeps
// flowing either way.
// ---------------------------------------------------------------------
function CallPanel({
  open,
  onMinimize,
  user,
  callState,
  callInfo,
  participants,
  muted,
  callSeconds,
  onStartCall,
  onAccept,
  onDecline,
  onEnd,
  onToggleMute,
  onInviteMore,
}) {
  const [picked, setPicked] = useState([]);
  const [addPicked, setAddPicked] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  if (!open) return null;

  const isLauncher = callState === 'idle';
  const isIncoming = callState === 'incoming';
  const targets = user ? DEPARTMENTS.filter((d) => d !== user.dept) : [];
  const busyDepts = new Set(
    participants.filter((p) => !['declined', 'left', 'timeout'].includes(p.status)).map((p) => p.dept)
  );
  const addTargets = targets.filter((d) => !busyDepts.has(d));
  const host = participants.find((p) => p.id === (callInfo && callInfo.hostId));
  const others = participants.filter((p) => p.status !== 'you');
  const connectedCount = participants.filter((p) => p.status === 'connected').length;

  const togglePicked = (dept) => {
    setPicked((list) => (list.includes(dept) ? list.filter((d) => d !== dept) : [...list, dept]));
  };
  const toggleAddPicked = (dept) => {
    setAddPicked((list) => (list.includes(dept) ? list.filter((d) => d !== dept) : [...list, dept]));
  };

  const statusLabel = (status) => {
    if (status === 'you') return 'You';
    if (status === 'ringing') return 'Ringing…';
    if (status === 'connecting') return 'Connecting…';
    if (status === 'connected') return 'Connected';
    if (status === 'declined') return 'Declined';
    if (status === 'timeout') return "Didn't answer";
    if (status === 'left') return 'Left the call';
    return '';
  };
  const statusColor = (status) => {
    if (status === 'connected') return '#2FE0C9';
    if (status === 'ringing' || status === 'connecting') return GOLD_LIGHT;
    if (status === 'declined' || status === 'timeout' || status === 'left') return '#B0AA96';
    return GOLD_LIGHT;
  };

  return (
    <div className="wb-callpanel-backdrop" onClick={isIncoming ? undefined : onMinimize}>
      <div className="wb-callpanel" onClick={(e) => e.stopPropagation()}>
        <div className="wb-callpanel-sweep" />
        <div className="wb-callpanel-head">
          <div>
            <p className="wb-callpanel-eyebrow">
              {isLauncher ? 'New call' : callInfo && callInfo.isGroup ? 'Group call' : 'Department call'}
            </p>
            <h3 className="wb-serif wb-callpanel-title">
              {isLauncher
                ? 'Call another department'
                : isIncoming
                ? `${host ? host.name : 'A department'} is calling`
                : callState === 'active'
                ? formatCallDuration(callSeconds)
                : ''}
            </h3>
          </div>
          {!isIncoming && (
            <button onClick={onMinimize} className="wb-callpanel-min-btn" aria-label="Minimize">
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {isLauncher && (
          <div className="wb-callpanel-body">
            <p className="wb-callpanel-hint">
              Select one department for a direct call, or several for a group call.
            </p>
            <div className="wb-call-dept-grid">
              {targets.map((dept) => {
                const meta = getDeptTheme(dept);
                const isPicked = picked.includes(dept);
                return (
                  <button
                    key={dept}
                    className={`wb-call-dept-btn${isPicked ? ' wb-call-dept-btn-picked' : ''}`}
                    onClick={() => togglePicked(dept)}
                  >
                    <div className="wb-call-dept-icon" style={{ background: `${meta.accent}1F`, color: meta.accent }}>
                      <meta.icon size={18} />
                    </div>
                    <span>{dept}</span>
                    {isPicked ? <CheckCircle2 size={16} color={GOLD} /> : <Phone size={14} color="#B0AA96" />}
                  </button>
                );
              })}
            </div>
            <button
              className="wb-callpanel-primary-btn"
              disabled={!picked.length}
              onClick={() => onStartCall(picked)}
            >
              <Phone size={16} />
              {picked.length > 1 ? `Start group call (${picked.length})` : picked.length === 1 ? `Call ${picked[0]}` : 'Select a department'}
            </button>
          </div>
        )}

        {!isLauncher && (
          <div className="wb-callpanel-body">
            <div className="wb-callpanel-roster">
              {participants.map((p) => (
                <div key={p.id} className="wb-callpanel-roster-row">
                  <div className="wb-callpanel-roster-avatar">
                    {(p.name || p.dept || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="wb-callpanel-roster-name">{p.name || p.dept}</p>
                    <p className="wb-callpanel-roster-dept">{p.dept}</p>
                  </div>
                  <span className="wb-callpanel-roster-status" style={{ color: statusColor(p.status) }}>
                    {statusLabel(p.status)}
                  </span>
                </div>
              ))}
            </div>

            {isIncoming ? (
              <div className="wb-callpanel-incoming-actions">
                <button className="wb-call-btn wb-call-btn-decline" onClick={onDecline} aria-label="Decline">
                  <PhoneOff size={20} />
                </button>
                <button className="wb-call-btn wb-call-btn-accept" onClick={onAccept} aria-label="Accept">
                  <Phone size={20} />
                </button>
              </div>
            ) : (
              <>
                {showAdd ? (
                  <div className="wb-callpanel-add-block">
                    <p className="wb-callpanel-hint">Bring another department into this call</p>
                    <div className="wb-call-dept-grid">
                      {addTargets.map((dept) => {
                        const meta = getDeptTheme(dept);
                        const isPicked = addPicked.includes(dept);
                        return (
                          <button
                            key={dept}
                            className={`wb-call-dept-btn${isPicked ? ' wb-call-dept-btn-picked' : ''}`}
                            onClick={() => toggleAddPicked(dept)}
                          >
                            <div className="wb-call-dept-icon" style={{ background: `${meta.accent}1F`, color: meta.accent }}>
                              <meta.icon size={18} />
                            </div>
                            <span>{dept}</span>
                            {isPicked ? <CheckCircle2 size={16} color={GOLD} /> : <Plus size={14} color="#B0AA96" />}
                          </button>
                        );
                      })}
                      {!addTargets.length && (
                        <p style={{ color: '#B0AA96', fontSize: '12.5px', margin: 0 }}>
                          Every other department is already on this call.
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button
                        className="wb-callpanel-primary-btn"
                        style={{ flex: 1 }}
                        disabled={!addPicked.length}
                        onClick={() => {
                          onInviteMore(addPicked);
                          setAddPicked([]);
                          setShowAdd(false);
                        }}
                      >
                        <Plus size={15} /> Add to call
                      </button>
                      <button
                        className="wb-callpanel-secondary-btn"
                        onClick={() => { setShowAdd(false); setAddPicked([]); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="wb-callpanel-secondary-btn" style={{ width: '100%' }} onClick={() => setShowAdd(true)}>
                    <Plus size={15} /> Add a department
                  </button>
                )}

                <div className="wb-callpanel-active-controls">
                  <button className="wb-call-mini-btn" onClick={onToggleMute} aria-label="Toggle mute" style={{ width: '48px', height: '48px' }}>
                    {muted ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  <button
                    className="wb-call-mini-btn wb-call-mini-btn-end"
                    onClick={onEnd}
                    aria-label="End call"
                    style={{ width: '48px', height: '48px' }}
                  >
                    <PhoneOff size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Small floating pill shown once a call is minimized (or hasn't been
// opened to the full panel yet) — tapping it re-opens the half-page
// CallPanel above. The call itself (audio, ringing) is unaffected by
// whether this pill or the full panel is showing.
function CallMiniBar({ callState, callInfo, participants, callSeconds, onOpen }) {
  if (callState === 'idle') return null;
  const others = participants.filter((p) => p.status !== 'you');
  const label = others.length === 1 ? (others[0].name || others[0].dept) : `${others.length} departments`;
  const statusLabel =
    callState === 'incoming' ? 'Incoming call…' :
    participants.some((p) => p.status === 'connected') ? formatCallDuration(callSeconds) :
    'Ringing…';
  return (
    <button className={`wb-call-bar${callState === 'incoming' ? ' wb-call-bar-incoming' : ''}`} onClick={onOpen}>
      <div className="wb-call-bar-icon">
        <Phone size={16} />
      </div>
      <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: '#7A7460' }}>{statusLabel}</p>
      </div>
      <ChevronRight size={16} color="#B0AA96" style={{ transform: 'rotate(180deg)' }} />
    </button>
  );
}


// ---------------------------------------------------------------------
// Style components are pure and take no props, but each one rebuilds a
// large CSS template literal every time its parent re-renders -
// PremiumStyles alone is well over two thousand lines. Wrapping them in
// React.memo gives a complete bailout, so after the first paint they cost
// nothing at all. Aliased here rather than changing the declarations so
// every existing call site keeps working unchanged.
// ---------------------------------------------------------------------
const PremiumStylesMemo = React.memo(PremiumStyles);
const WarehouseMonthlyStylesMemo = React.memo(WarehouseMonthlyStyles);
const WarehouseRegisterStylesMemo = React.memo(WarehouseRegisterStyles);
const DispatchRecordStylesMemo = React.memo(DispatchRecordStyles);
const InventoryRegisterLinkStylesMemo = React.memo(InventoryRegisterLinkStyles);

export default function App() {
  // ---- SESSION PERSISTENCE ---------------------------------------------
  // Previously `user` lived only in memory, so ANY full reload of the tab
  // — including one caused by the browser's own Back button, see below —
  // wiped it and dropped straight back to the Login screen even though
  // nothing about the actual session had ended. The logged-in user is now
  // mirrored into localStorage the moment it's set, and read back once on
  // first mount, so a reload (from Back, a refresh, reopening the tab...)
  // restores exactly who was logged in instead of forcing a fresh login.
  const [user, setUserState] = useState(() => {
    try {
      const raw = window.localStorage.getItem('wb_session_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const setUser = React.useCallback((u) => {
    setUserState(u);
    try {
      if (u) window.localStorage.setItem('wb_session_user', JSON.stringify(u));
      else window.localStorage.removeItem('wb_session_user');
    } catch {}
  }, []);

  // ---- PAGE STATE + IN-APP BACK/FORWARD ---------------------------------
  // The app never touched the browser's own history before, so its Back
  // button wasn't "app-aware": it just left (or reloaded) the page, which
  // — combined with there being no saved session — is the other half of
  // why Back used to dump everyone on the Login screen. Every page change
  // now pushes one entry onto the browser's history stack, and the
  // browser's Back/Forward buttons are listened for and turned back into
  // an in-app page change, so Back/Forward move through Warehouse
  // Inventory → Warehouse Reports → wherever else exactly the way they'd
  // move through pages on any ordinary website, instead of leaving the
  // app or reloading it. The current page is also mirrored into
  // sessionStorage purely as a fallback for the rare reload that isn't
  // caught by the history state (e.g. the very first load after a crash).
  const [page, setPageState] = useState(() => {
    try {
      return window.sessionStorage.getItem('wb_last_page') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const historyReadyRef = useRef(false);
  const setPage = React.useCallback((next) => {
    setPageState(next);
    try {
      window.sessionStorage.setItem('wb_last_page', next);
    } catch {}
    // Skip the very first call (the initial render setting the starting
    // page) — that one is handled by the replaceState in the effect
    // below instead, so the app doesn't start with two history entries
    // for the same page.
    if (historyReadyRef.current) {
      try {
        window.history.pushState({ wbPage: next }, '');
      } catch {}
    }
  }, []);
  useEffect(() => {
    try {
      window.history.replaceState({ wbPage: page }, '');
    } catch {}
    historyReadyRef.current = true;
    const onPopState = (e) => {
      const target = (e.state && e.state.wbPage) || 'dashboard';
      setPageState(target);
      try {
        window.sessionStorage.setItem('wb_last_page', target);
      } catch {}
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // Runs once on mount only — this is seeding the base history entry,
    // not reacting to page changes (setPage already handles those).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [documents, setDocuments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [hse, setHse] = useState({
    riskAssessments: [],
    incidents: [],
    permits: [],
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Set when Warehouse Inventory's "Open Register" shortcut is clicked —
  // consumed once by WarehouseReportsPage on mount (it jumps straight to
  // that article's register instead of the picker), then cleared, so a
  // later plain click on "Warehouse Reports" in the sidebar lands back on
  // the normal overview instead of re-opening a stale article.
  const [registerJumpItemId, setRegisterJumpItemId] = useState(null);
  const isMobile = useIsMobile();
  const calling = useDepartmentCalling(user);
  const [callLauncherOpen, setCallLauncherOpen] = useState(false);
  // Auto-open the call panel the moment an invite comes in, and auto-close
  // it once the call ends (whether it was ever fully opened or not).
  useEffect(() => {
    if (calling.callState === 'incoming') setCallLauncherOpen(true);
    if (calling.callState === 'idle') setCallLauncherOpen(false);
  }, [calling.callState]);

  // ---- Mobile autoplay handling for call audio -------------------------
  // On a phone (especially iOS Safari, but plenty of Android browsers
  // too), an <audio> element created dynamically once a remote track
  // arrives is usually NOT considered "tied to a user gesture" anymore
  // by the time it exists — the browser silently blocks .play() and the
  // call connects with no sound in either direction, even though
  // everything about the WebRTC connection itself is fine. A handful of
  // pre-mounted, reusable audio elements plus retrying .play() on every
  // tap while a call is up is the standard fix: one of those taps
  // (Accept, mute, anything) unlocks playback for the rest of the call.
  const CALL_AUDIO_SLOTS = 6;
  const callAudioElsRef = useRef([]);
  const callAudioSlotMapRef = useRef(new Map()); // peerId -> slot index

  // Unlocks every pooled <audio> element for autoplay. MUST be called
  // synchronously, directly inside the Start Call / Accept onClick —
  // before any `await` (mic permission, signalling) — so the browser
  // still attributes the .play() call to that click. Once an element
  // has successfully played once from a real user gesture, browsers let
  // it keep playing later even after its srcObject is swapped out for
  // the real remote stream with no further gesture required. Doing the
  // unlock only later inside a useEffect (the old approach) reacts to
  // the remote track arriving — by then it's mic-permission + SDP/ICE
  // round-trips removed from the click, which is why calls were
  // connecting with no audio in either direction.
  const primeCallAudio = React.useCallback(() => {
    callAudioElsRef.current.forEach((el) => {
      if (!el) return;
      const p = el.play();
      if (p && p.catch) p.catch(() => {}); // no source yet — rejection here is expected and harmless
    });
  }, []);
  const getCallAudioSlot = React.useCallback((peerId) => {
    if (!callAudioSlotMapRef.current.has(peerId)) {
      const used = new Set(callAudioSlotMapRef.current.values());
      let slot = 0;
      while (used.has(slot) && slot < CALL_AUDIO_SLOTS - 1) slot++;
      callAudioSlotMapRef.current.set(peerId, slot);
    }
    return callAudioSlotMapRef.current.get(peerId);
  }, []);

  useEffect(() => {
    const ids = Object.keys(calling.remoteStreams);
    ids.forEach((id) => {
      const slot = getCallAudioSlot(id);
      const el = callAudioElsRef.current[slot];
      const stream = calling.remoteStreams[id];
      if (el && el.srcObject !== stream) {
        el.srcObject = stream;
        el.play().catch((err) => console.warn('[call] audio playback blocked, will retry on next tap', err));
      }
    });
    // Free slots for peers who've left.
    callAudioSlotMapRef.current.forEach((slot, id) => {
      if (!ids.includes(id)) {
        const el = callAudioElsRef.current[slot];
        if (el) el.srcObject = null;
        callAudioSlotMapRef.current.delete(id);
      }
    });
  }, [calling.remoteStreams, getCallAudioSlot]);

  useEffect(() => {
    if (calling.callState === 'idle') return undefined;
    // Any tap anywhere while the call is up (Accept, mute, whatever) is a
    // fresh user gesture — use it to retry any audio element that's
    // still paused because its earlier .play() attempt got blocked.
    const unlock = () => {
      callAudioElsRef.current.forEach((el) => {
        if (el && el.srcObject && el.paused) el.play().catch(() => {});
      });
    };
    document.addEventListener('click', unlock, true);
    document.addEventListener('touchstart', unlock, true);
    return () => {
      document.removeEventListener('click', unlock, true);
      document.removeEventListener('touchstart', unlock, true);
    };
  }, [calling.callState]);

  // ---- Inbox arrival toasts --------------------------------------------
  // A small stack of pop-up notification cards (top-right) that appears
  // whenever a new document lands in the current user's inbox — on top
  // of the sound cue below. Auto-dismisses after a few seconds; clicking
  // one jumps straight into the Inbox.
  const [toasts, setToasts] = useState([]);
  const dismissToast = React.useCallback((id) => {
    setToasts((list) =>
      list.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 220);
  }, []);
  const pushToast = React.useCallback((toast) => {
    const id = nextId('toast');
    setToasts((list) => [...list, { id, leaving: false, ...toast }]);
    setTimeout(() => dismissToast(id), toast.urgent ? 12000 : 6000);
  }, [dismissToast]);

  // ---- Documents: load + realtime sync -------------------------------
  const loadDocuments = React.useCallback(async () => {
    const { data, error } = await supabase.from('documents').select('*');
    if (error) {
      console.log('Error loading documents:', error.message);
      return;
    }
    setDocuments(
      data.map((d) => ({
        ...d,
        createdBy: d.created_by,
        createdDept: d.created_dept,
        currentIndex: d.current_index,
        attachmentUrl: d.attachment_url || '',
        routing: d.routing || 'custom',
        qaSignedOff: !!d.qa_signed_off,
        qcSignedOff: !!d.qc_signed_off,
        history: Array.isArray(d.history) ? d.history : [],
      }))
    );
  }, []);

  // Debounced so a burst of events (e.g. an insert immediately followed
  // by a history update on the same document) triggers one reload, not
  // several stacked ones.
  const debouncedLoadDocuments = useDebouncedCallback(loadDocuments, 250);

  React.useEffect(() => {
    loadDocuments();
    let cancelled = false;
    const channel = supabase
      .channel(`documents-realtime-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        () => {
          if (!cancelled) debouncedLoadDocuments();
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [loadDocuments, debouncedLoadDocuments]);

  // ---- Inbox arrival sounds + pop-up toast -----------------------------
  // Fires purely off documents actually landing in *this* user's inbox —
  // whether that's from this browser's own send or a realtime update
  // triggered by someone else on another machine. A short chime plays
  // for an ordinary arrival; Warehouse gets the longer tune specifically
  // when the item was sent to it straight from Production. Alongside the
  // sound, a pop-up toast appears top-right so an arrival is never missed
  // even with audio off.
  const prevInboxIdsRef = React.useRef(null);
  React.useEffect(() => {
    if (!user) {
      prevInboxIdsRef.current = null;
      return;
    }
    const myInboxIds = new Set(
      documents
        .filter((d) => currentDeptOf(d) === user.dept && d.status !== 'Completed')
        .map((d) => d.id)
    );
    const prev = prevInboxIdsRef.current;
    if (prev) {
      const arrivedIds = [...myInboxIds].filter((id) => !prev.has(id));
      if (arrivedIds.length) {
        const arrivedFromProduction = arrivedIds.some((id) => {
          const doc = documents.find((d) => d.id === id);
          const last = doc && doc.history && doc.history[doc.history.length - 1];
          return last && last.dept === 'Production';
        });
        if (user.dept === 'Warehouse' && arrivedFromProduction) {
          playWarehouseReceiveTune();
        } else {
          playInboxChime();
        }
        arrivedIds.slice(0, 3).forEach((id) => {
          const doc = documents.find((d) => d.id === id);
          if (!doc) return;
          const last = doc.history && doc.history[doc.history.length - 1];
          const isPackingHandoff = user.dept === 'Warehouse' && last && last.dept === 'Production';
          pushToast({
            doc,
            urgent: isPackingHandoff,
            title: isPackingHandoff ? 'Packing hand-off — action required' : 'New in your inbox',
            body: `${doc.type || 'Document'} — "${doc.title || 'Untitled'}" from ${
              (last && last.dept) || 'another department'
            }`,
          });
        });
      }
    }
    prevInboxIdsRef.current = myInboxIds;
  }, [documents, user, pushToast]);

  // ---- Announcements: load + realtime sync ----------------------------
  const loadAnnouncements = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.log('Error loading announcements:', error.message);
      return;
    }
    setNotices(
      data.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        priority: !!n.priority,
        postedBy: n.posted_by,
        postedDept: n.posted_dept,
        createdAt: n.created_at,
        date: new Date(n.created_at).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }))
    );
  }, []);

  const debouncedLoadAnnouncements = useDebouncedCallback(loadAnnouncements, 250);

  React.useEffect(() => {
    loadAnnouncements();
    let cancelled = false;
    const channel = supabase
      .channel(`notices-realtime-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notices' },
        () => {
          if (!cancelled) debouncedLoadAnnouncements();
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [loadAnnouncements, debouncedLoadAnnouncements]);

  // ---- Inventory: load + realtime sync --------------------------------
  const loadInventory = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.log('Error loading inventory:', error.message);
      return;
    }
    setInventory(
      (data || []).map((i) => ({
        ...i,
        history: Array.isArray(i.history) ? i.history : [],
      }))
    );
  }, []);

  const debouncedLoadInventory = useDebouncedCallback(loadInventory, 250);

  // ---- PERFORMANCE: patch the row, don't refetch the table ------------
  // This subscription used to answer every realtime event by running the
  // whole `select('*')` above again. `inventory` rows are heavy — each
  // one carries two jsonb columns (`history` and `ledger_rows`) that
  // grow with every movement ever recorded — so one person issuing one
  // item meant every open browser pulled the entire warehouse down the
  // wire again and then rebuilt every object in the array, which changed
  // the identity of all of them and re-rendered the whole page. That is
  // the lag: the work was proportional to the size of the warehouse,
  // when only one row had actually changed.
  //
  // Supabase already ships the changed row inside the event, so the new
  // state is spliced in directly: one object changes identity, the other
  // rows keep theirs, and only the affected row re-renders. Full reload
  // is kept strictly as a fallback for the cases where the payload can't
  // be trusted on its own — realtime drops oversized payloads, so a row
  // whose jsonb has grown past the limit arrives empty and must be
  // fetched the slow way.
  React.useEffect(() => {
    loadInventory();
    let cancelled = false;
    const channel = supabase
      .channel(`inventory-realtime-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => {
          if (cancelled) return;
          const { eventType, new: row, old: prev } = payload || {};

          if (eventType === 'DELETE' && prev?.id) {
            setInventory((items) => items.filter((i) => i.id !== prev.id));
            return;
          }

          if ((eventType === 'INSERT' || eventType === 'UPDATE') && row?.id) {
            // Supabase Realtime silently nulls out a row's own oversized
            // jsonb columns when the whole payload would otherwise exceed
            // its size limit — the row still arrives (with its id, qty,
            // name...), it just quietly loses `history`/`ledger_rows`.
            // Finished Goods items are exactly the ones that grow those
            // columns fastest (every daily packing→warehouse accept adds
            // another entry), so this is the case that used to slip past
            // the "payload unusable" fallback below: `row?.id` was still
            // truthy, so it took the branch that trusts `row` — and wiped
            // out every OTHER connected browser's copy of that item's
            // ledger with an empty array, even though nothing was
            // actually deleted. The browser that made the change was
            // never affected (its own optimistic local update already
            // had the real data), which is why this only ever showed up
            // for people watching live rather than the person editing.
            let droppedPayload = false;
            setInventory((items) => {
              const idx = items.findIndex((i) => i.id === row.id);
              const current = idx !== -1 ? items[idx] : null;
              const historyLooksDropped =
                eventType === 'UPDATE' &&
                current &&
                Array.isArray(current.history) &&
                current.history.length > 0 &&
                !Array.isArray(row.history);
              const ledgerLooksDropped =
                eventType === 'UPDATE' &&
                current &&
                Array.isArray(current.ledger_rows) &&
                current.ledger_rows.length > 0 &&
                !Array.isArray(row.ledger_rows);
              if (historyLooksDropped || ledgerLooksDropped) {
                droppedPayload = true;
                return items; // don't touch state yet — refetch below
              }
              const normalised = {
                ...row,
                history: Array.isArray(row.history) ? row.history : [],
              };
              if (idx === -1) return [...items, normalised];
              // Same values already in state (this browser is the one that
              // made the change, and the CRUD handler patched state
              // optimistically) — return the identical array so React
              // skips the re-render entirely.
              if (
                current.qty === normalised.qty &&
                current.name === normalised.name &&
                JSON.stringify(current.history) === JSON.stringify(normalised.history) &&
                JSON.stringify(current.ledger_rows) === JSON.stringify(normalised.ledger_rows)
              ) {
                return items;
              }
              const next = items.slice();
              next[idx] = normalised;
              return next;
            });
            if (droppedPayload) {
              // Go fetch this one row's real content directly instead of
              // trusting the truncated broadcast, and instead of paying
              // for a full-table reload for a single row.
              supabase
                .from('inventory')
                .select('*')
                .eq('id', row.id)
                .single()
                .then(({ data: freshRow, error: fetchErr }) => {
                  if (cancelled) return;
                  if (fetchErr || !freshRow) {
                    debouncedLoadInventory();
                    return;
                  }
                  const freshNormalised = {
                    ...freshRow,
                    history: Array.isArray(freshRow.history) ? freshRow.history : [],
                  };
                  setInventory((items) => {
                    const idx = items.findIndex((i) => i.id === freshRow.id);
                    if (idx === -1) return [...items, freshNormalised];
                    const next = items.slice();
                    next[idx] = freshNormalised;
                    return next;
                  });
                });
            }
            return;
          }

          // Payload unusable (dropped for size, or an event shape this
          // doesn't recognise) — fall back to the full reload.
          debouncedLoadInventory();
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [loadInventory, debouncedLoadInventory]);

  // ---- HSE records: load + realtime sync -------------------------------
  const loadHse = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('hse_records')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.log('Error loading HSE records:', error.message);
      return;
    }
    const grouped = { riskAssessments: [], incidents: [], permits: [] };
    (data || []).forEach((r) => {
      if (grouped[r.category]) grouped[r.category].push(r);
    });
    setHse(grouped);
  }, []);

  const debouncedLoadHse = useDebouncedCallback(loadHse, 250);

  React.useEffect(() => {
    loadHse();
    let cancelled = false;
    const channel = supabase
      .channel(`hse-realtime-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hse_records' },
        () => {
          if (!cancelled) debouncedLoadHse();
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [loadHse, debouncedLoadHse]);

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  React.useEffect(() => {
    if (!selectedDoc) return;
    const fresh = documents.find((d) => d.id === selectedDoc.id);
    if (fresh && fresh !== selectedDoc) setSelectedDoc(fresh);
    if (!fresh) setSelectedDoc(null);
  }, [documents]);

  // ---- "Opened" tracking, for the non-stop inbox tune -------------------
  // A set of document ids this person has actually opened while it was
  // sitting in their inbox. Persisted per-account in localStorage so a
  // page refresh doesn't make everything ring again. Anything currently
  // in the inbox that ISN'T in this set keeps the tune going; opening it
  // (from the toast, the Dashboard, or the In Process list) adds it here
  // and the tune drops it on the very next check.
  const openedDocIdsRef = useRef(new Set());
  const [openedTick, forceOpenedTick] = useState(0);
  useEffect(() => {
    if (!user) {
      openedDocIdsRef.current = new Set();
      return;
    }
    try {
      const raw = window.localStorage.getItem(`wb_opened_docs_${user.name}`);
      openedDocIdsRef.current = new Set(raw ? JSON.parse(raw) : []);
    } catch (e) {
      openedDocIdsRef.current = new Set();
    }
    forceOpenedTick((n) => n + 1);
  }, [user && user.name]);

  const markDocOpened = React.useCallback(
    (docId) => {
      if (!docId || !user) return;
      if (openedDocIdsRef.current.has(docId)) return;
      openedDocIdsRef.current = new Set(openedDocIdsRef.current).add(docId);
      try {
        window.localStorage.setItem(
          `wb_opened_docs_${user.name}`,
          JSON.stringify([...openedDocIdsRef.current])
        );
      } catch (e) {}
      forceOpenedTick((n) => n + 1);
    },
    [user]
  );

  // Opening a document — from anywhere (toast, Dashboard, In Process
  // list) — always goes through this so the tune knows it's been seen.
  const openDoc = React.useCallback(
    (doc) => {
      if (!doc) return;
      markDocOpened(doc.id);
      setSelectedDoc(doc);
    },
    [markDocOpened]
  );

  // Every document sitting in this person's inbox right now.
  const myInboxDocs = React.useMemo(
    () =>
      user
        ? documents.filter(
            (d) => currentDeptOf(d) === user.dept && d.status !== 'Completed'
          )
        : [],
    [documents, user]
  );

  // Inbox items that haven't been opened yet — the ordinary, "you have
  // an unread arrival" tune keeps going as long as this is non-empty.
  const pendingUnopenedDocs = React.useMemo(
    () => myInboxDocs.filter((d) => !openedDocIdsRef.current.has(d.id)),
    [myInboxDocs, user, openedTick]
  );

  // Warehouse-only: packing hand-offs straight from Production that
  // haven't been explicitly accepted or rejected yet. This is more
  // urgent than a plain unread arrival — opening the document isn't
  // enough to quiet it, only Accept/Reject does (see DocDrawer).
  const pendingPackingDocs = React.useMemo(() => {
    if (!user || user.dept !== 'Warehouse') return [];
    return myInboxDocs.filter((d) => {
      if (d.routing !== 'default' || d.status !== 'In Progress') return false;
      const last = d.history && d.history.length ? d.history[d.history.length - 1] : null;
      return !!last && last.dept === 'Production';
    });
  }, [myInboxDocs, user]);

  const hasUrgentPending = pendingPackingDocs.length > 0;
  const hasAnyPending = hasUrgentPending || pendingUnopenedDocs.length > 0;

  // The full notification list shown in the bell dropdown — urgent
  // packing hand-offs first (oldest first), then plain unread arrivals,
  // deduplicated by id since a packing hand-off is also unopened.
  const notificationItems = React.useMemo(() => {
    const seen = new Set();
    const items = [];
    pendingPackingDocs.forEach((d) => {
      if (seen.has(d.id)) return;
      seen.add(d.id);
      items.push({ doc: d, urgent: true });
    });
    pendingUnopenedDocs.forEach((d) => {
      if (seen.has(d.id)) return;
      seen.add(d.id);
      items.push({ doc: d, urgent: false });
    });
    return items;
  }, [pendingPackingDocs, pendingUnopenedDocs]);

  // Opening the bell dropdown silences the *sound* right away — same as
  // tapping the bell in any other app — without pretending the items
  // are resolved: the badge count and the list itself still reflect
  // whatever's actually still pending/urgent. The moment a genuinely
  // new item shows up (an id we hadn't seen before), the sound resumes
  // even if the dropdown is still open, so a fresh arrival is never
  // silently swallowed.
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [notifAcked, setNotifAcked] = useState(false);
  const seenNotifIdsRef = useRef(new Set());
  useEffect(() => {
    const currentIds = notificationItems.map((it) => it.doc.id);
    const hasNewArrival = currentIds.some((id) => !seenNotifIdsRef.current.has(id));
    seenNotifIdsRef.current = new Set(currentIds);
    if (hasNewArrival) setNotifAcked(false);
    if (currentIds.length === 0) setNotifAcked(false);
  }, [notificationItems]);

  usePersistentRing(hasAnyPending && !notifAcked, hasUrgentPending);

  const toggleNotifPanel = React.useCallback(() => {
    setNotifPanelOpen((open) => {
      const next = !open;
      if (next) setNotifAcked(true);
      return next;
    });
  }, []);

  const closeNotifPanel = React.useCallback(() => setNotifPanelOpen(false), []);

  const selectNotifItem = React.useCallback(
    (doc) => {
      setNotifPanelOpen(false);
      setPage('documents');
      openDoc(doc);
    },
    [openDoc]
  );

  // Jump straight to the single most pressing pending item — kept for
  // the empty-inbox case (bell with nothing pending just goes to Inbox).
  const openMostPressingPending = React.useCallback(() => {
    setPage('documents');
  }, []);

  const priorityNotice = notices.find((n) => n.priority);
  const inboxCount = user
    ? documents.filter(
        (d) => currentDeptOf(d) === user.dept && d.status !== 'Completed'
      ).length
    : 0;
  const titles = {
    dashboard: 'Dashboard',
    documents: 'In Process',
    new: 'New Activity',
    inventory: 'Warehouse Inventory',
    'warehouse-reports': 'Warehouse Reports',
    production: 'Packing Status',
    hse: 'Health & Safety',
    announcements: 'Announcements',
    directory: 'Department Directory',
  };

  const handleForward = async (docId, recipient, note, attachmentUrl) => {
    const doc = documents.find((d) => d.id === docId);
    const newPath = [...doc.path, recipient];
    const newIndex = doc.currentIndex + 1;
    const nextAttachment = attachmentUrl || doc.attachmentUrl || '';
    const entry = {
      dept: user.dept,
      user: user.name,
      action: `Approved & sent to ${recipient}${note ? ' — ' + note : ''}`,
      at: now(),
      atISO: nowISO(),
    };
    const newHistory = [...doc.history, entry];

    const { error } = await supabase
      .from('documents')
      .update({
        path: newPath,
        current_index: newIndex,
        attachment_url: nextAttachment,
        history: newHistory,
        status: 'In Progress',
      })
      .eq('id', docId);

    if (error) {
      alert('Failed to send: ' + error.message);
      return;
    }

    setDocuments((docs) =>
      docs.map((d) =>
        d.id !== docId
          ? d
          : {
              ...d,
              path: newPath,
              currentIndex: newIndex,
              attachmentUrl: nextAttachment,
              history: newHistory,
              status: 'In Progress',
            }
      )
    );
  };

  const handleComplete = async (docId) => {
    const doc = documents.find((d) => d.id === docId);
    const entry = {
      dept: user.dept,
      user: user.name,
      action: 'Approved & marked complete',
      at: now(),
      atISO: nowISO(),
    };
    const newHistory = [...doc.history, entry];

    const { error } = await supabase
      .from('documents')
      .update({ status: 'Completed', history: newHistory })
      .eq('id', docId);
    if (error) {
      alert('Failed to mark complete: ' + error.message);
      return;
    }

    setDocuments((docs) =>
      docs.map((d) =>
        d.id !== docId ? d : { ...d, status: 'Completed', history: newHistory }
      )
    );
  };

  // Sends a document back one step to whichever department is
  // immediately before the current one in its path. Critically, this
  // must also DROP everything after that point in `path` — otherwise
  // those already-recorded "future" steps stay sitting in the array,
  // and the next time this department forwards the document again,
  // handleForward's `currentIndex + 1` lands on that stale leftover
  // entry instead of the department actually being sent to. The path
  // then silently grows longer than the real, current chain of custody,
  // and forwarding starts skipping/duplicating steps instead of moving
  // exactly one step at a time.
  const handleReturn = async (docId, note) => {
    const doc = documents.find((d) => d.id === docId);
    const newIndex = doc.currentIndex - 1;
    const prevDept = doc.path[newIndex];
    const newPath = doc.path.slice(0, newIndex + 1);
    const entry = {
      dept: user.dept,
      user: user.name,
      action: `Returned to ${prevDept}${note ? ' — ' + note : ''}`,
      at: now(),
      atISO: nowISO(),
    };
    const newHistory = [...doc.history, entry];

    const { error } = await supabase
      .from('documents')
      .update({ path: newPath, current_index: newIndex, history: newHistory, status: 'In Progress' })
      .eq('id', docId);
    if (error) {
      alert('Failed: ' + error.message);
      return;
    }

    setDocuments((docs) =>
      docs.map((d) =>
        d.id !== docId
          ? d
          : { ...d, path: newPath, currentIndex: newIndex, history: newHistory, status: 'In Progress' }
      )
    );
  };

  const handleWarehouseDemand = async (docId, demand) => {
    if (!demand) {
      handleComplete(docId);
      return;
    }
    handleForward(
      docId,
      'Procurement Manager',
      'Additional stock / procurement required',
      ''
    );
  };

  // Warehouse explicitly accepting a packing hand-off straight from
  // Production. This is what silences the non-stop "action required"
  // tune for that document — simply opening/viewing it is NOT enough,
  // only this (or Reject, below) resolves it.
  const handleAcceptPacking = async (docId) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    const entry = {
      dept: user.dept,
      user: user.name,
      action: 'Accepted packing hand-off from Production',
      at: now(),
      atISO: nowISO(),
    };
    const newHistory = [...doc.history, entry];
    const { error } = await supabase
      .from('documents')
      .update({ history: newHistory })
      .eq('id', docId);
    if (error) {
      alert('Failed to accept packing: ' + error.message);
      return;
    }
    setDocuments((docs) =>
      docs.map((d) => (d.id !== docId ? d : { ...d, history: newHistory }))
    );
  };

  // Warehouse rejecting a packing hand-off — sends the activity straight
  // back to Production with a note, same as this also resolves (and
  // silences) the pending tune for it. Same rule as handleReturn above:
  // path must be truncated to the rewound point, not just the index
  // moved back, or the next forward from Production will skip ahead
  // onto a stale leftover path entry instead of the real recipient.
  const handleRejectPacking = async (docId) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    const newIndex = Math.max(0, doc.currentIndex - 1);
    const newPath = doc.path.slice(0, newIndex + 1);
    const entry = {
      dept: user.dept,
      user: user.name,
      action: 'Rejected packing hand-off — sent back to Production',
      at: now(),
      atISO: nowISO(),
    };
    const newHistory = [...doc.history, entry];
    const { error } = await supabase
      .from('documents')
      .update({ path: newPath, current_index: newIndex, history: newHistory, status: 'In Progress' })
      .eq('id', docId);
    if (error) {
      alert('Failed to reject packing: ' + error.message);
      return;
    }
    setDocuments((docs) =>
      docs.map((d) =>
        d.id !== docId
          ? d
          : { ...d, path: newPath, currentIndex: newIndex, history: newHistory, status: 'In Progress' }
      )
    );
  };

  const handleSetIPQ = async (docId, reason) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    const entry = {
      dept: user.dept,
      user: user.name,
      action: `Marked as IPQ (Holding)${reason ? ' — ' + reason : ''}`,
      at: now(),
      atISO: nowISO(),
      ipq: true,
    };
    const newHistory = [...doc.history, entry];

    const { error } = await supabase
      .from('documents')
      .update({ status: 'IPQ', history: newHistory })
      .eq('id', docId);
    if (error) {
      alert('Failed to mark as IPQ: ' + error.message);
      return;
    }

    setDocuments((docs) =>
      docs.map((d) =>
        d.id !== docId ? d : { ...d, status: 'IPQ', history: newHistory }
      )
    );
  };

  const handleResumeIPQ = async (docId) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    const entry = {
      dept: user.dept,
      user: user.name,
      action: 'Resumed from IPQ — back to In Progress',
      at: now(),
      atISO: nowISO(),
    };
    const newHistory = [...doc.history, entry];

    const { error } = await supabase
      .from('documents')
      .update({ status: 'In Progress', history: newHistory })
      .eq('id', docId);
    if (error) {
      alert('Failed to resume: ' + error.message);
      return;
    }

    setDocuments((docs) =>
      docs.map((d) =>
        d.id !== docId ? d : { ...d, status: 'In Progress', history: newHistory }
      )
    );
  };

  const handleCreate = async ({
    type,
    title,
    note,
    attachmentUrl,
    routing,
    recipient,
  }) => {
    const entry = {
      dept: user.dept,
      user: user.name,
      action:
        routing === 'default'
          ? `Started default company flow & sent to ${recipient}${
              note ? ' — ' + note : ''
            }`
          : `Created & sent to ${recipient}${note ? ' — ' + note : ''}`,
      at: now(),
      atISO: nowISO(),
    };
    const newDoc = {
      id: nextId('WB'),
      title,
      type,
      created_by: user.name,
      created_dept: user.dept,
      status: 'In Progress',
      path: [user.dept, recipient],
      current_index: 1,
      attachment_url: attachmentUrl || '',
      routing,
      qa_signed_off: false,
      qc_signed_off: false,
      history: [entry],
    };

    const { data, error } = await supabase
      .from('documents')
      .insert([newDoc])
      .select();

    if (error) {
      console.log('Error saving document:', error.message);
      alert('Failed to save: ' + error.message);
    } else {
      const saved = data[0];
      const savedDoc = {
        ...saved,
        createdBy: saved.created_by,
        createdDept: saved.created_dept,
        currentIndex: saved.current_index,
        attachmentUrl: saved.attachment_url || '',
        routing: saved.routing || 'custom',
        qaSignedOff: !!saved.qa_signed_off,
        qcSignedOff: !!saved.qc_signed_off,
        history: Array.isArray(saved.history) ? saved.history : [entry],
      };
      // The realtime subscription above will also refresh the full list
      // from the database — this optimistic update just means the new
      // document appears immediately instead of waiting on that round
      // trip. Because nextId() is now collision-proof (see its comment
      // at the top of the file), the two updates always converge on a
      // single copy of this document, never a duplicate.
      setDocuments((docs) => [savedDoc, ...docs]);
    }
  };

  const handleDeleteDocument = async (docId) => {
    const { error } = await supabase.from('documents').delete().eq('id', docId);
    if (error) {
      alert('Failed to delete: ' + error.message);
      return;
    }
    setDocuments((docs) => docs.filter((d) => d.id !== docId));
  };

  const handlePostAnnouncement = async (title, body, priority) => {
    const newNotice = {
      id: nextId('N'),
      title,
      body,
      priority,
      posted_by: user.name,
      posted_dept: user.dept,
    };
    const { data, error } = await supabase
      .from('notices')
      .insert([newNotice])
      .select();
    if (error) {
      alert('Failed to post: ' + error.message);
      return;
    }
    const saved = data[0];
    setNotices((list) => [
      {
        id: saved.id,
        title: saved.title,
        body: saved.body,
        priority: !!saved.priority,
        postedBy: saved.posted_by,
        postedDept: saved.posted_dept,
        createdAt: saved.created_at,
        date: new Date(saved.created_at).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
      ...list,
    ]);
  };

  const handleDeleteAnnouncement = async (noticeId) => {
    const { error } = await supabase.from('notices').delete().eq('id', noticeId);
    if (error) {
      alert('Failed to delete announcement: ' + error.message);
      return;
    }
    setNotices((list) => list.filter((n) => n.id !== noticeId));
  };

  // ---- Inventory CRUD ---------------------------------------------------
  const INVENTORY_PERMISSION_ERROR = {
    error: {
      message:
        "Only the Warehouse department can add, edit, or delete inventory. Your account doesn't have permission to modify warehouse data.",
    },
  };

  const handleAddInventory = async (item) => {
    if (!canManageInventory(user)) {
      console.log('Blocked inventory add: user is not in the Warehouse department.');
      return INVENTORY_PERMISSION_ERROR;
    }
    const newItem = { id: nextId('MED'), ...item };
    const { data, error } = await supabase
      .from('inventory')
      .insert([newItem])
      .select();
    if (error) {
      console.log('Error adding stock item:', error.message);
      return { error };
    }
    setInventory((items) => [
      ...items,
      { ...data[0], history: Array.isArray(data[0].history) ? data[0].history : [] },
    ]);
    return {};
  };

  const handleEditInventory = async (itemId, item) => {
    if (!canManageInventory(user)) {
      console.log('Blocked inventory edit: user is not in the Warehouse department.');
      return INVENTORY_PERMISSION_ERROR;
    }
    const { error } = await supabase
      .from('inventory')
      .update(item)
      .eq('id', itemId);
    if (error) {
      console.log('Error updating stock item:', error.message);
      return { error };
    }
    setInventory((items) =>
      items.map((i) => (i.id === itemId ? { ...i, ...item } : i))
    );
    return {};
  };

  const handleDeleteInventory = async (itemId) => {
    if (!canManageInventory(user)) {
      alert(
        "Only the Warehouse department can delete inventory. Your account doesn't have permission to modify warehouse data."
      );
      return;
    }
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', itemId);
    if (error) {
      alert('Failed to delete stock item: ' + error.message);
      return;
    }
    setInventory((items) => items.filter((i) => i.id !== itemId));
  };

  // ---- HSE CRUD -----------------------------------------------------------
  const handleAddHse = async (record) => {
    const newRecord = { id: nextId('HSE'), ...record };
    const { data, error } = await supabase
      .from('hse_records')
      .insert([newRecord])
      .select();
    if (error) {
      alert('Failed to add HSE record: ' + error.message);
      return;
    }
    setHse((prev) => ({
      ...prev,
      [record.category]: [data[0], ...(prev[record.category] || [])],
    }));
  };

  const handleEditHse = async (recordId, record) => {
    const { error } = await supabase
      .from('hse_records')
      .update(record)
      .eq('id', recordId);
    if (error) {
      alert('Failed to update HSE record: ' + error.message);
      return;
    }
    setHse((prev) => ({
      ...prev,
      [record.category]: (prev[record.category] || []).map((r) =>
        r.id === recordId ? { ...r, ...record } : r
      ),
    }));
  };

  const handleDeleteHse = async (recordId) => {
    const { error } = await supabase
      .from('hse_records')
      .delete()
      .eq('id', recordId);
    if (error) {
      alert('Failed to delete HSE record: ' + error.message);
      return;
    }
    setHse((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => {
        next[k] = prev[k].filter((r) => r.id !== recordId);
      });
      return next;
    });
  };

  if (!user) {
    return (
      <>
        <PremiumStylesMemo />
        <LoginScreen onLogin={(u) => setUser(u)} />
      </>
    );
  }

  // getShellAccent was being called twice in the tree below with identical
  // arguments. One call, reused.
  const shellAccent = getShellAccent(page, user);

  return (
    <div
      className="wb-app-shell"
      style={{
        background: `linear-gradient(180deg, #FDFBF6 0%, ${PAPER} 100%)`,
        minHeight: '100vh',
        display: 'flex',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <PremiumStylesMemo />
      {isMobile && mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(4,7,17,0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 250,
          }}
        />
      )}
      <Sidebar
        user={user}
        page={page}
        setPage={setPage}
        onLogout={() => setUser(null)}
        inboxCount={inboxCount}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <TopBar
          title={titles[page]}
          accent={shellAccent}
          user={user}
          onMenuClick={() => setMobileNavOpen(true)}
          onOpenCall={() => setCallLauncherOpen(true)}
          callActive={calling.callState !== 'idle'}
          ringing={hasAnyPending && !notifAcked}
          onOpenInbox={openMostPressingPending}
          notifPanelOpen={notifPanelOpen}
          notificationItems={notificationItems}
          onToggleNotif={toggleNotifPanel}
          onSelectNotifItem={selectNotifItem}
          onCloseNotifPanel={closeNotifPanel}
        />
        {!bannerDismissed && (
          <NoticeBanner
            notice={priorityNotice}
            onDismiss={() => setBannerDismissed(true)}
            onDelete={handleDeleteAnnouncement}
          />
        )}
        {/* Ambient page wash — a large, very soft bloom in the current   */}
        {/* department's colour sitting behind the content, fixed to the */}
        {/* viewport so it reads as one continuous atmosphere with the   */}
        {/* sidebar/top bar glow rather than a flat cream page pasted    */}
        {/* underneath a coloured frame. */}
        <div
          className="wb-page-ambient"
          style={{
            background: `radial-gradient(60% 50% at 30% 0%, rgba(${shellAccent.rgb},0.10) 0%, rgba(${shellAccent.rgb},0) 70%)`,
            transition: 'background 0.6s ease',
          }}
        />
        <div key={page} className="wb-page-rise">
        {page === 'dashboard' && (
          <DashboardPage
            user={user}
            documents={documents}
            notices={notices}
            hse={hse}
            inventory={inventory}
            setPage={setPage}
            setSelectedDoc={openDoc}
          />
        )}
        {page === 'documents' && (
          <DocumentsPage
            user={user}
            documents={documents}
            setSelected={openDoc}
            onDelete={handleDeleteDocument}
          />
        )}
        {page === 'new' && (
          <NewDocumentPage
            user={user}
            onCreate={handleCreate}
            setPage={setPage}
          />
        )}
        {page === 'inventory' && (
          <InventoryPage
            user={user}
            inventory={inventory}
            onAdd={handleAddInventory}
            onEdit={handleEditInventory}
            onDelete={handleDeleteInventory}
            onOpenRegister={(itemId) => {
              setRegisterJumpItemId(itemId);
              setPage('warehouse-reports');
            }}
          />
        )}
        {page === 'warehouse-reports' && (
          <WarehouseReportsPage
            user={user}
            inventory={inventory}
            onEditInventory={handleEditInventory}
            initialItemId={registerJumpItemId}
            onConsumeInitialItem={() => setRegisterJumpItemId(null)}
          />
        )}
        {page === 'production' && <ProductionInventoryPage user={user} />}
        {page === 'hse' && (
          <HSEPage
            user={user}
            hse={hse}
            onAdd={handleAddHse}
            onEdit={handleEditHse}
            onDelete={handleDeleteHse}
          />
        )}
        {page === 'announcements' && (
          <AnnouncementsPage
            user={user}
            notices={notices}
            onPost={handlePostAnnouncement}
            onDelete={handleDeleteAnnouncement}
          />
        )}
        {page === 'directory' && <DirectoryPage />}
        </div>
      </div>
      <DocDrawer
        doc={selectedDoc}
        user={user}
        onClose={() => setSelectedDoc(null)}
        onForward={handleForward}
        onComplete={handleComplete}
        onReturn={handleReturn}
        onWarehouseDemand={handleWarehouseDemand}
        onAcceptPacking={handleAcceptPacking}
        onRejectPacking={handleRejectPacking}
        onSetIPQ={handleSetIPQ}
        onResumeIPQ={handleResumeIPQ}
      />

      {/* Pop-up inbox arrival toasts — mounted at the root so they show up */}
      {/* no matter which page is open underneath.                          */}
      {toasts.length > 0 && (
        <div className="wb-toast-stack">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`wb-toast${t.leaving ? ' wb-toast-leaving' : ''}${t.urgent ? ' wb-toast-urgent' : ''}`}
              onClick={() => {
                dismissToast(t.id);
                setPage('documents');
                if (t.doc) openDoc(t.doc);
              }}
            >
              <div className={`wb-toast-icon${t.urgent ? ' wb-toast-icon-urgent' : ''}`}>
                <InboxIcon size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="wb-toast-title">{t.title}</p>
                <p className="wb-toast-body">{t.body}</p>
                <p className="wb-toast-cta">Tap to open now →</p>
              </div>
              <button
                className="wb-toast-close"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissToast(t.id);
                }}
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Department-to-department calling — mounted at the root so it   */}
      {/* survives page navigation and keeps ringing/connected no matter */}
      {/* what page is open underneath it. A fixed pool of audio elements */}
      {/* (rather than one created per remote stream) so each one exists */}
      {/* and gets its first .play() attempt as early as possible — see  */}
      {/* the mobile-autoplay handling above.                            */}
      {/* Always mounted (not gated behind callState !== 'idle'). It used */}
      {/* to only render once a call started, which meant on "Start Call" */}
      {/* there was nothing in the DOM yet to prime from that very click, */}
      {/* and the actual first real .play() only happened later inside a  */}
      {/* useEffect once a remote track arrived — several async hops      */}
      {/* (mic permission, SDP/ICE exchange) away from the original tap.  */}
      {/* Browsers stop treating .play() as user-initiated by then, so it */}
      {/* was silently blocked on both ends: the call showed "Connected"  */}
      {/* (that's purely ICE/DTLS state) with no audio either way.        */}
      {Array.from({ length: 6 }).map((_, slot) => (
        <audio
          key={`call-audio-slot-${slot}`}
          autoPlay
          playsInline
          ref={(el) => {
            callAudioElsRef.current[slot] = el;
          }}
        />
      ))}
      <CallPanel
        open={callLauncherOpen}
        onMinimize={() => setCallLauncherOpen(false)}
        user={user}
        callState={calling.callState}
        callInfo={calling.callInfo}
        participants={calling.participants}
        muted={calling.muted}
        callSeconds={calling.callSeconds}
        onStartCall={(depts) => { primeCallAudio(); calling.startCall(depts); }}
        onAccept={() => { primeCallAudio(); calling.acceptCall(); }}
        onDecline={calling.declineCall}
        onEnd={calling.endCall}
        onToggleMute={calling.toggleMute}
        onInviteMore={calling.inviteMore}
      />
      {!callLauncherOpen && calling.callState !== 'idle' && (
        <CallMiniBar
          callState={calling.callState}
          callInfo={calling.callInfo}
          participants={calling.participants}
          callSeconds={calling.callSeconds}
          onOpen={() => setCallLauncherOpen(true)}
        />
      )}
    </div>
  );
}