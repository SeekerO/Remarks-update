// src/components/InventoryManager.tsx
// Property Inventory — reads/writes Google Sheets via /api/inventory
// Barcode scanning via @zxing/browser (camera) for Serial Number & Property Number
// Features: Sheet ID input screen, dynamic custom columns
//
// Install: npm install @zxing/browser @zxing/library

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException, DecodeHintType, BarcodeFormat } from "@zxing/library";

// ── Types ──────────────────────────────────────────────────────────────────────

/** Fixed core fields always present */
interface CoreEntry {
  rowIndex?: number;
  serialNumber: string;
  propertyNumber: string;
  article: string;
  description: string;
  unitPrice: string;
  datePurchased: string;
  location: string;
  usingBy: string;
  department: string;
}

/** Extra custom columns: { columnKey: value } */
type ExtraFields = Record<string, string>;

type InventoryEntry = CoreEntry & { extra: ExtraFields };

/** A user-defined column definition (persisted in localStorage) */
interface CustomColumn {
  key: string;   // camelCase identifier, e.g. "condition"
  label: string; // Display label, e.g. "Condition"
  type: "text" | "number" | "date";
}

const CORE_EMPTY: CoreEntry = {
  serialNumber: "",
  propertyNumber: "",
  article: "",
  description: "",
  unitPrice: "",
  datePurchased: "",
  location: "",
  usingBy: "",
  department: "",
};

function emptyEntry(cols: CustomColumn[]): InventoryEntry {
  const extra: ExtraFields = {};
  cols.forEach((c) => (extra[c.key] = ""));
  return { ...CORE_EMPTY, extra };
}

// ── LocalStorage helpers ───────────────────────────────────────────────────────

const LS_SHEET_ID = "inventory_sheet_id";
const LS_CUSTOM_COLS = "inventory_custom_cols";

function loadSheetId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LS_SHEET_ID) ?? "";
}

function saveSheetId(id: string) {
  localStorage.setItem(LS_SHEET_ID, id);
}

function loadCustomCols(): CustomColumn[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_CUSTOM_COLS) ?? "[]");
  } catch {
    return [];
  }
}

function saveCustomCols(cols: CustomColumn[]) {
  localStorage.setItem(LS_CUSTOM_COLS, JSON.stringify(cols));
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPrice(val: string) {
  const n = parseFloat(val);
  if (isNaN(n)) return "—";
  return (
    "₱" +
    n.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(val: string) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function labelToKey(label: string): string {
  return label
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .map((w, i) =>
      i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join("");
}

// ── BarcodeScanner modal ───────────────────────────────────────────────────────

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
  targetField: "serialNumber" | "propertyNumber";
}

function BarcodeScanner({ onScan, onClose, targetField }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>("");
  const [scanStatus, setScanStatus] = useState<"scanning" | "found" | "error">("scanning");
  const [errorMsg, setErrorMsg] = useState("");
  const [scannedValue, setScannedValue] = useState("");
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const label = targetField === "serialNumber" ? "Serial Number" : "Property Number";

  const startScan = useCallback(async (cameraId: string) => {
    if (!videoRef.current) return;
    setScanStatus("scanning");
    setErrorMsg("");

    // Stop any existing stream before starting a new one
    controlsRef.current?.stop();
    controlsRef.current = null;

    try {
      // Hint the decoder to prioritise QR + common 1D formats, try harder at angles
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.DATA_MATRIX,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints);
      readerRef.current = reader;

      // @zxing/browser@0.2.x: decodeFromVideoDevice(deviceId, videoEl, callback)
      // Callback does NOT receive a ctrl arg - use controlsRef instead.
      // Use a flag to guard against the callback firing after we already stopped.
      let didCapture = false;
      const deviceId = cameraId || undefined;

      const controls = await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result && !didCapture) {
            didCapture = true;
            const val = result.getText();
            setScannedValue(val);
            setScanStatus("found");
            controlsRef.current?.stop();
            controlsRef.current = null;
          }
          if (err && !(err instanceof NotFoundException)) {
            console.warn("[BarcodeScanner]", err);
          }
        },
      );

      // Only store controls if capture hasn't happened yet (fast scan edge case)
      if (!didCapture) {
        controlsRef.current = controls;
      } else {
        controls.stop();
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message?.includes("ermission")
          ? "Camera permission denied. Please allow camera access and try again."
          : (err?.message ?? "Could not access camera."),
      );
      setScanStatus("error");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        if (!mounted) return;
        setCameras(videoDevices);
        const rear = videoDevices.find((d) => /back|rear|environment/i.test(d.label));
        const chosen = rear?.deviceId ?? videoDevices[0]?.deviceId ?? "";
        setActiveCameraId(chosen);
        startScan(chosen);
      } catch {
        if (!mounted) return;
        setErrorMsg("Camera permission denied. Please allow camera access and try again.");
        setScanStatus("error");
      }
    })();
    return () => {
      mounted = false;
      controlsRef.current?.stop();
    };
  }, [startScan]);

  function handleCameraChange(id: string) {
    setActiveCameraId(id);
    startScan(id);
  }

  function handleConfirm() {
    onScan(scannedValue);
    onClose();
  }

  function handleRescan() {
    setScanStatus("scanning");
    setScannedValue("");
    startScan(activeCameraId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Scanning for</p>
            <p className="text-sm font-semibold text-gray-800">{label}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition" aria-label="Close scanner">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative bg-black aspect-video w-full overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {scanStatus === "scanning" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-52 h-36">
                <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-sm" />
                <span className="absolute left-2 right-2 top-1/2 h-0.5 bg-emerald-400/80 animate-pulse" />
              </div>
              <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/80">Point camera at barcode</p>
            </div>
          )}
          {scanStatus === "found" && (
            <div className="absolute inset-0 bg-emerald-900/70 flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-medium text-sm">Barcode detected!</p>
            </div>
          )}
          {scanStatus === "error" && (
            <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center gap-2 p-4">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-white text-sm text-center">{errorMsg}</p>
            </div>
          )}
        </div>

        <div className="px-4 py-4 flex flex-col gap-3">
          {cameras.length > 1 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Camera</label>
              <select value={activeCameraId} onChange={(e) => handleCameraChange(e.target.value)} className="text-sm px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {cameras.map((cam) => (
                  <option key={cam.deviceId} value={cam.deviceId}>
                    {cam.label || `Camera ${cam.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          {scanStatus === "found" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <p className="text-xs text-emerald-600 font-medium mb-0.5">Scanned value</p>
              <p className="text-sm font-mono text-emerald-800 break-all">{scannedValue}</p>
            </div>
          )}
          <div className="flex gap-2">
            {scanStatus === "found" ? (
              <>
                <button onClick={handleRescan} className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition">Rescan</button>
                <button onClick={handleConfirm} className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">Use this value</button>
              </>
            ) : scanStatus === "error" ? (
              <button onClick={() => startScan(activeCameraId)} className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">Retry</button>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-2 text-sm text-gray-400 py-1">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Scanning…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── BarcodeInput ───────────────────────────────────────────────────────────────

interface BarcodeInputProps {
  label: string;
  id: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: boolean;
  fieldKey: "serialNumber" | "propertyNumber";
  onOpenScanner: (field: "serialNumber" | "propertyNumber") => void;
}

function BarcodeInput({ label, id, placeholder, value, onChange, required, error, fieldKey, onOpenScanner }: BarcodeInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-gray-500">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="flex gap-1.5">
        <input id={id} type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
          className={`flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${error ? "border-red-400 bg-red-50" : "border-gray-300"}`} />
        <button type="button" onClick={() => onOpenScanner(fieldKey)} title={`Scan barcode for ${label}`}
          className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 bg-white text-gray-500 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3m11-4v3a1 1 0 01-1 1h-3m4-13h-3a1 1 0 00-1 1v3" />
            <path strokeLinecap="round" strokeWidth={1.8} d="M7 8v8M10 8v8M14 8v8M17 8v8" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── FieldInput ─────────────────────────────────────────────────────────────────

interface FieldInputProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: boolean;
}

function FieldInput({ label, id, type = "text", placeholder, value, onChange, required, error }: FieldInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-gray-500">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input id={id} type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        className={`px-3 py-2 text-sm rounded-lg border bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${error ? "border-red-400 bg-red-50" : "border-gray-300"}`} />
    </div>
  );
}

// ── StatCard ───────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-1 border border-gray-200">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-semibold text-gray-800">{value}</span>
    </div>
  );
}

// ── SheetIdScreen — initial setup screen ──────────────────────────────────────

interface SheetIdScreenProps {
  onConfirm: (id: string) => void;
}

function SheetIdScreen({ onConfirm }: SheetIdScreenProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  function extractId(raw: string): string {
    // Accept full URL or bare ID
    const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : raw.trim();
  }

  function handleSubmit() {
    const id = extractId(input);
    if (!id) {
      setError("Please enter a valid Spreadsheet ID or URL.");
      return;
    }
    saveSheetId(id);
    onConfirm(id);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">📦</span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Property Inventory</h1>
            <p className="text-xs text-gray-400 mt-0.5">Connect to your Google Sheet to get started</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <label className="text-xs font-medium text-gray-600">Google Spreadsheet ID or URL</label>
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="https://docs.google.com/spreadsheets/d/…  or  1BxiM…"
            className={`px-3 py-2.5 text-sm rounded-lg border bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${error ? "border-red-400 bg-red-50" : "border-gray-300"}`}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <p className="text-xs text-gray-400 leading-relaxed">
            You can paste the full Google Sheets URL — the ID will be extracted automatically. The sheet ID is saved locally in your browser.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-2.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
        >
          Connect Sheet
        </button>

        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-medium mb-2">How to find your Spreadsheet ID</p>
          <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
            <li>Open your Google Sheet in the browser</li>
            <li>Copy the full URL from the address bar</li>
            <li>Paste it above — the ID is between <code className="bg-gray-100 px-1 rounded">/d/</code> and the next <code className="bg-gray-100 px-1 rounded">/</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// ── AddColumnModal ─────────────────────────────────────────────────────────────

interface AddColumnModalProps {
  existing: CustomColumn[];
  onAdd: (col: CustomColumn) => void;
  onRemove: (key: string) => void;
  onClose: () => void;
}

function AddColumnModal({ existing, onAdd, onRemove, onClose }: AddColumnModalProps) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<CustomColumn["type"]>("text");
  const [error, setError] = useState("");

  function handleAdd() {
    const trimmed = label.trim();
    if (!trimmed) { setError("Column name is required."); return; }
    const key = labelToKey(trimmed);
    if (!key) { setError("Column name must contain letters or numbers."); return; }
    if (existing.find((c) => c.key === key)) { setError("A column with that name already exists."); return; }
    // Block reserved core keys
    const reserved = ["serialNumber","propertyNumber","article","description","unitPrice","datePurchased","location","usingBy","department","rowIndex","extra"];
    if (reserved.includes(key)) { setError("That name conflicts with a built-in field."); return; }
    onAdd({ key, label: trimmed, type });
    setLabel("");
    setType("text");
    setError("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Manage Columns</h2>
            <p className="text-xs text-gray-400 mt-0.5">Add extra columns appended after the default 9</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Existing custom columns */}
          {existing.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Current custom columns</p>
              <ul className="space-y-1.5">
                {existing.map((col) => (
                  <li key={col.key} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{col.label}</span>
                      <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">{col.type}</span>
                    </div>
                    <button
                      onClick={() => onRemove(col.key)}
                      className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add new */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Add new column</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Column Name</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => { setLabel(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="e.g. Condition, Warranty, Remarks"
                  className={`px-3 py-2 text-sm rounded-lg border bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${error ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Field Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CustomColumn["type"])}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAdd}
                  className="w-full py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  + Add Column
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Custom columns are saved in your browser and appended to each Google Sheets row after the 9 default columns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function InventoryManager() {
  // Sheet ID — from localStorage, starts empty
  const [spreadsheetId, setSpreadsheetId] = useState<string>("");
  const [sheetReady, setSheetReady] = useState(false);

  // Custom columns
  const [customCols, setCustomCols] = useState<CustomColumn[]>([]);
  const [showColModal, setShowColModal] = useState(false);

  // Inventory state
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const [form, setForm] = useState<InventoryEntry>({ ...CORE_EMPTY, extra: {} });
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [deletingRow, setDeletingRow] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [scanTarget, setScanTarget] = useState<"serialNumber" | "propertyNumber">("serialNumber");

  // Load persisted data on mount
  useEffect(() => {
    const id = loadSheetId();
    const cols = loadCustomCols();
    setCustomCols(cols);
    if (id) {
      setSpreadsheetId(id);
      setSheetReady(true);
    }
  }, []);

  // ── Toast ──────────────────────────────────────────────────────────────────
  function showToast(msg: string, type: "ok" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchEntries = useCallback(async () => {
    if (!spreadsheetId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/inventory?sheetId=${spreadsheetId}&customCols=${encodeURIComponent(JSON.stringify(customCols.map((c) => c.label)))}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load.");
      setEntries(data.entries ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [spreadsheetId, customCols]);

  useEffect(() => {
    if (sheetReady) fetchEntries();
  }, [sheetReady, fetchEntries]);

  // ── Column management ──────────────────────────────────────────────────────
  function handleAddColumn(col: CustomColumn) {
    const updated = [...customCols, col];
    setCustomCols(updated);
    saveCustomCols(updated);
    // Add the new field to the current form
    setForm((prev) => ({ ...prev, extra: { ...prev.extra, [col.key]: "" } }));
  }

  function handleRemoveColumn(key: string) {
    const updated = customCols.filter((c) => c.key !== key);
    setCustomCols(updated);
    saveCustomCols(updated);
    setForm((prev) => {
      const extra = { ...prev.extra };
      delete extra[key];
      return { ...prev, extra };
    });
  }

  // ── Field helpers ──────────────────────────────────────────────────────────
  function setField(key: keyof CoreEntry, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors.has(key as string)) {
      setFieldErrors((prev) => { const s = new Set(prev); s.delete(key as string); return s; });
    }
  }

  function setExtraField(key: string, value: string) {
    setForm((prev) => ({ ...prev, extra: { ...prev.extra, [key]: value } }));
  }

  // ── Scanner ────────────────────────────────────────────────────────────────
  function openScanner(field: "serialNumber" | "propertyNumber") {
    // Close first (unmount old modal + release camera), then reopen with a new key.
    // The 120ms delay gives the browser time to release the camera device before
    // the next decodeFromVideoDevice call tries to acquire it again.
    setScannerOpen(false);
    setScanTarget(field);
    setTimeout(() => {
      setScannerKey((k) => k + 1);
      setScannerOpen(true);
    }, 120);
  }

  function handleScanResult(value: string) {
    setField(scanTarget, value);
    setScannerOpen(false);
    showToast(`Barcode scanned → ${scanTarget === "serialNumber" ? "Serial Number" : "Property Number"}`, "ok");
  }

  // ── Validate ───────────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs = new Set<string>();
    if (!form.serialNumber.trim()) errs.add("serialNumber");
    if (!form.propertyNumber.trim()) errs.add("propertyNumber");
    if (!form.article.trim()) errs.add("article");
    setFieldErrors(errs);
    return errs.size === 0;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const isEditing = editingRow !== null;
      // Build extra columns payload: { label: value }[]
      const extraPayload = customCols.map((c) => ({
        label: c.label,
        value: form.extra[c.key] ?? "",
      }));
      const res = await fetch("/api/inventory", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditing
            ? { spreadsheetId, rowIndex: editingRow, entry: form, extraColumns: extraPayload }
            : { spreadsheetId, entry: form, extraColumns: extraPayload }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save.");
      showToast(isEditing ? "Entry updated in Google Sheets." : "Entry saved to Google Sheets.");
      resetForm();
      await fetchEntries();
    } catch (err: any) {
      showToast(err.message, "err");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete(rowIndex: number) {
    setDeletingRow(rowIndex);
    try {
      const res = await fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetId, rowIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete.");
      showToast("Entry deleted.");
      await fetchEntries();
    } catch (err: any) {
      showToast(err.message, "err");
    } finally {
      setDeletingRow(null);
    }
  }

  // ── Edit ───────────────────────────────────────────────────────────────────
  function startEdit(entry: InventoryEntry) {
    setForm({ ...entry });
    setEditingRow(entry.rowIndex!);
    setFieldErrors(new Set());
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(emptyEntry(customCols));
    setEditingRow(null);
    setFieldErrors(new Set());
    setShowForm(false);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalValue = entries.reduce((sum, e) => sum + (parseFloat(e.unitPrice) || 0), 0);
  const departments = new Set(entries.map((e) => e.department).filter(Boolean)).size;
  const locations = new Set(entries.map((e) => e.location).filter(Boolean)).size;

  // ── Sheet ID screen ────────────────────────────────────────────────────────
  if (!sheetReady) {
    return (
      <SheetIdScreen
        onConfirm={(id) => {
          setSpreadsheetId(id);
          setSheetReady(true);
        }}
      />
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-screen overflow-auto bg-gray-50">
      {scannerOpen && (
        <BarcodeScanner key={scannerKey} targetField={scanTarget} onScan={handleScanResult} onClose={() => setScannerOpen(false)} />
      )}

      {showColModal && (
        <AddColumnModal
          existing={customCols}
          onAdd={handleAddColumn}
          onRemove={handleRemoveColumn}
          onClose={() => setShowColModal(false)}
        />
      )}

      {toast && (
        <div className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg transition-all ${toast.type === "ok" ? "bg-emerald-600" : "bg-red-500"}`}>
          {toast.type === "ok" ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">📦</span> Property Inventory
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
              Synced with Google Sheets · {entries.length} item{entries.length !== 1 ? "s" : ""}
              <span className="text-gray-300">·</span>
              <button
                onClick={() => {
                  if (confirm("Change Google Sheet? You will be taken back to the setup screen.")) {
                    saveSheetId("");
                    setSpreadsheetId("");
                    setSheetReady(false);
                    setEntries([]);
                  }
                }}
                className="text-xs text-emerald-600 hover:underline"
              >
                Change sheet
              </button>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowColModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
              </svg>
              Columns {customCols.length > 0 && <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full font-medium">+{customCols.length}</span>}
            </button>
            <button
              onClick={fetchEntries}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total Items" value={entries.length} />
          <StatCard label="Total Value" value={"₱" + totalValue.toLocaleString("en-PH", { minimumFractionDigits: 0 })} />
          <StatCard label="Departments" value={departments} />
          <StatCard label="Locations" value={locations} />
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  {editingRow ? "✏️ Edit Item" : "➕ Add New Item"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Click the scan icon next to Serial / Property Number to use your camera
                </p>
              </div>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 transition" aria-label="Close form">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <BarcodeInput label="Serial Number" id="serialNumber" placeholder="e.g. SN-2024-001 or scan" value={form.serialNumber} onChange={(v) => setField("serialNumber", v)} required error={fieldErrors.has("serialNumber")} fieldKey="serialNumber" onOpenScanner={openScanner} />
              <BarcodeInput label="Property Number" id="propertyNumber" placeholder="e.g. PROP-001 or scan" value={form.propertyNumber} onChange={(v) => setField("propertyNumber", v)} required error={fieldErrors.has("propertyNumber")} fieldKey="propertyNumber" onOpenScanner={openScanner} />
              <FieldInput label="Article" id="article" placeholder="e.g. Laptop" value={form.article} onChange={(v) => setField("article", v)} required error={fieldErrors.has("article")} />
              <FieldInput label="Description" id="description" placeholder="e.g. Dell Latitude 14-inch" value={form.description} onChange={(v) => setField("description", v)} />
              <FieldInput label="Unit Price (₱)" id="unitPrice" type="number" placeholder="0.00" value={form.unitPrice} onChange={(v) => setField("unitPrice", v)} />
              <FieldInput label="Date Purchased" id="datePurchased" type="date" value={form.datePurchased} onChange={(v) => setField("datePurchased", v)} />
              <FieldInput label="Location" id="location" placeholder="e.g. Room 201, Main Building" value={form.location} onChange={(v) => setField("location", v)} />
              <FieldInput label="Using By" id="usingBy" placeholder="e.g. Juan dela Cruz" value={form.usingBy} onChange={(v) => setField("usingBy", v)} />
              <FieldInput label="Committee / Department" id="department" placeholder="e.g. Finance Dept." value={form.department} onChange={(v) => setField("department", v)} />

              {/* Custom columns */}
              {customCols.map((col) => (
                <FieldInput
                  key={col.key}
                  label={col.label}
                  id={col.key}
                  type={col.type}
                  placeholder={col.type === "number" ? "0" : col.type === "date" ? "" : `Enter ${col.label.toLowerCase()}…`}
                  value={form.extra[col.key] ?? ""}
                  onChange={(v) => setExtraField(col.key, v)}
                />
              ))}

              {/* Add column shortcut inside form */}
              <button
                type="button"
                onClick={() => setShowColModal(true)}
                className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-200 rounded-lg py-4 text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add column
              </button>
            </div>

            {fieldErrors.size > 0 && (
              <p className="text-xs text-red-500 mt-3">Please fill in the required fields marked with *.</p>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={resetForm} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {submitting && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                {submitting ? "Saving…" : editingRow ? "Update Entry" : "Save to Sheets"}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading from Google Sheets…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-red-500 font-medium mb-2">Failed to load inventory</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button onClick={fetchEntries} className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">Try again</button>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400">
            <span className="text-5xl mb-4">📭</span>
            <p className="font-medium">No inventory items yet.</p>
            <p className="text-sm mt-1">Click "Add Item" to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {[
                      "Serial No.", "Property No.", "Article", "Description",
                      "Unit Price", "Date Purchased", "Location", "Using By", "Dept.",
                      ...customCols.map((c) => c.label),
                      "",
                    ].map((h, i) => (
                      <th key={`${h}-${i}`} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map((entry) => (
                    <tr key={entry.rowIndex} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{entry.serialNumber || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{entry.propertyNumber || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {entry.article || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{entry.description || "—"}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{formatPrice(entry.unitPrice)}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(entry.datePurchased)}</td>
                      <td className="px-4 py-3 text-gray-500">{entry.location || "—"}</td>
                      <td className="px-4 py-3 text-gray-700">{entry.usingBy || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{entry.department || "—"}</td>
                      {/* Custom column cells */}
                      {customCols.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-gray-500 max-w-[140px] truncate">
                          {col.type === "number" && entry.extra?.[col.key]
                            ? Number(entry.extra[col.key]).toLocaleString()
                            : col.type === "date" && entry.extra?.[col.key]
                            ? formatDate(entry.extra[col.key])
                            : entry.extra?.[col.key] || "—"}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(entry)} className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => { if (confirm("Delete this item?")) handleDelete(entry.rowIndex!); }}
                            disabled={deletingRow === entry.rowIndex}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition"
                            title="Delete"
                          >
                            {deletingRow === entry.rowIndex ? (
                              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}