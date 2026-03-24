"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SetStateAction, useEffect, useRef, useState } from "react";

import ColorPicker from "./ColorPicker";
import { ToastContainer, toast } from "react-toastify";

import { RiDraggable, RiAlignItemRightFill } from "react-icons/ri";
import { SlOptionsVertical } from "react-icons/sl";
import { FaLock, FaUnlock, FaEdit, FaRegClipboard } from "react-icons/fa";
import { FaFilePen } from "react-icons/fa6";
import {
  MdDelete, MdNumbers, MdOutlineTitle,
  MdOutlineColorLens, MdMenu, MdAdd,
} from "react-icons/md";
import { IoSearchOutline } from "react-icons/io5";
import { Plus, Save, X, Layers } from "lucide-react";

type Item = { id: string; label1: string };

type Column = {
  id: string;
  title: string;
  column: number;
  column_color: string;
  items: Item[];
  locked: boolean;
};

const notify = (text: string) =>
  toast.success(`Copied ` + text, {
    position: "top-center", autoClose: 500, hideProgressBar: false,
    closeOnClick: false, pauseOnHover: false, draggable: false,
    theme: "dark",
  });

const notify_added_column = () =>
  toast.success("New column added!", {
    position: "top-center", autoClose: 500, hideProgressBar: false,
    closeOnClick: false, pauseOnHover: false, draggable: false,
    theme: "dark",
  });

const notify_deleted_column = () =>
  toast.error("Deleted column!", {
    position: "top-center", autoClose: 500, hideProgressBar: false,
    closeOnClick: false, pauseOnHover: false, draggable: false,
    theme: "dark",
  });

// ── Nexus Logo Mark ───────────────────────────────────────────────────────────
function NexusLogoMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#6366f1" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3.5" fill="#818cf8" />
      <circle cx="12" cy="12" r="1.5" fill="#0d0d1a" />
    </svg>
  );
}

// ── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
      {children}
    </p>
  );
}

// ── Nexus Input ───────────────────────────────────────────────────────────────
function NexusInput({ label, icon: Icon, ...props }: any) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 flex items-center gap-2.5">
      {Icon && <Icon className="text-lg text-white/30 shrink-0" />}
      <div className="flex-1 min-w-0">
        {label && <p className="text-[10px] text-white/30 mb-0.5">{label}</p>}
        <input
          {...props}
          className="w-full bg-transparent text-sm text-white placeholder-white/20
            focus:outline-none border-none"
        />
      </div>
    </div>
  );
}

export default function DynamicColumn() {
  const [title, setTitle] = useState("");
  const [columnColor, setColumnColor] = useState("#6366f1");
  const [items, setItems] = useState<Item[]>([{ id: crypto.randomUUID(), label1: "" }]);
  const [columns, setColumns] = useState<Column[]>([]);
  const STORAGE_KEY = "customColumns";
  const sensors = useSensors(useSensor(PointerSensor));
  const [editColumn, setEditColumn] = useState<Column[]>([]);
  const [sideMenu, setSideMenu] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => { fetchLocalStorage(); }, []);

  const fetchLocalStorage = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setColumns(JSON.parse(stored));
  };

  const clearEditColumn = () => { fetchLocalStorage(); return setEditColumn([]); };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    notify_added_column();
    const newColumn: Column = {
      id: crypto.randomUUID(), title, column: columns.length,
      column_color: columnColor, items, locked: false,
    };
    const updated = [...columns, newColumn];
    setColumns(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTitle("");
    setColumnColor("#6366f1");
    setItems([{ id: crypto.randomUUID(), label1: "" }]);
  };

  const handleAddItem = () => setItems([...items, { id: crypto.randomUUID(), label1: "" }]);

  const handleDeleteItem = (idToDelete: string) =>
    setItems((prev) => prev.filter((item) => item.id !== idToDelete));

  const handleItemChange = (id: string, value: string) =>
    setItems(items.map(item => item.id === id ? { ...item, label1: value } : item));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeIndex = columns.findIndex((col) => col.id === active.id);
    const overIndex = columns.findIndex((col) => col.id === over.id);
    if (columns[activeIndex].locked || columns[overIndex].locked) return;
    const newOrder = arrayMove(columns, activeIndex, overIndex);
    setColumns(newOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
  };

  const toggleLock = (id: string) => {
    const updated = columns.map((col) => col.id === id ? { ...col, locked: !col.locked } : col);
    setColumns(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteColumn = (id: string) => {
    const updated = columns.filter((col) => col.id !== id);
    notify_deleted_column();
    setColumns(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const filteredData1 = columns.filter((col) =>
    col.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden select-none">
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar newestOnTop
        closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />

      <div className="w-full h-full flex gap-4">

        {/* ── Sidebar / Column Manager ── */}
        <div className={`
          bg-[#0d0d1a] border border-white/[0.06] rounded-2xl flex-shrink-0
          ${sideMenu ? "w-full md:w-[380px]" : "w-[64px]"}
          duration-300 h-full flex flex-col overflow-hidden relative
          ${editColumn.length === 1 ? "border-indigo-500/40 shadow-[0_0_24px_rgba(99,102,241,0.1)]" : ""}
        `}>
          {/* Sidebar glow */}
          <div className="pointer-events-none absolute top-0 right-0 w-40 h-40 rounded-full opacity-30 z-0"
            style={{ background: "radial-gradient(circle at 100% 0%, rgba(99,102,241,0.4) 0%, transparent 60%)" }} />

          {sideMenu ? (
            <div className="relative z-10 flex flex-col h-full overflow-auto">
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                    <FaFilePen className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h1 className={` text-lg font-extrabold tracking-tight  ${editColumn.length === 1 ? "text-indigo-300 dark:text-transparent dark:bg-clip-text" : "text-white  dark:text-transparent dark:bg-clip-text"}`}
                    style={{ backgroundImage: 'linear-gradient(90deg,#f9fafb,#9ca3af)' }}>      {editColumn.length === 0 ? "Column Manager" : "Editing Column"}</h1>

                  {editColumn.length === 1 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </div>
                <button
                  onClick={() => setSideMenu(false)}
                  className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/30
                    hover:text-white/70 hover:bg-white/[0.08] transition-all"
                >
                  <MdMenu className="text-base" />
                </button>
              </div>

              {editColumn.length === 0 ? (
                <form onSubmit={handleAddColumn} className="flex flex-col gap-4 px-5 py-4 flex-1 overflow-auto
                  [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent
                  [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">

                  <SectionLabel>Column Details</SectionLabel>

                  {/* Title */}
                  <NexusInput
                    label="Column Title"
                    icon={MdOutlineTitle}
                    type="text"
                    placeholder="e.g. Greetings"
                    value={title}
                    onChange={(e: any) => setTitle(e.target.value)}
                    required
                  />

                  {/* Column number */}
                  <NexusInput
                    label="Column Number"
                    icon={MdNumbers}
                    type="number"
                    disabled
                    value={columns.length + 1}
                  />

                  {/* Color picker */}
                  <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
                    <div className="flex items-center gap-2.5 mb-2">
                      <MdOutlineColorLens className="text-lg text-white/30" />
                      <p className="text-[10px] text-white/30">Accent Color</p>
                    </div>
                    <ColorPicker onChange={() => { }} setColumnColor={setColumnColor} columnColor={columnColor} />
                  </div>

                  {/* Items */}
                  <div>
                    <SectionLabel>Items ({items.length})</SectionLabel>
                    <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 space-y-2">
                      <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto
                        [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent
                        [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-start gap-2">
                            <textarea
                              required
                              placeholder="Item text..."
                              value={item.label1}
                              onChange={(e) => handleItemChange(item.id, e.target.value)}
                              className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2
                                text-sm text-white placeholder-white/20 resize-y min-h-[44px]
                                focus:outline-none focus:border-indigo-500/40 transition-colors"
                            />
                            {items.length >= 2 && (
                              <button type="button" onClick={() => handleDeleteItem(item.id)}
                                className="mt-1 p-1.5 rounded-lg bg-red-500/10 border border-red-500/20
                                  text-red-400 hover:bg-red-500/20 transition-all shrink-0">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={handleAddItem}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg
                          bg-white/[0.04] border border-white/[0.06] text-white/40 text-xs
                          hover:text-white/70 hover:bg-white/[0.08] transition-all">
                        <Plus className="w-3.5 h-3.5" /> Add Item
                      </button>
                    </div>
                  </div>

                  <button type="submit"
                    className="flex items-center justify-center gap-2 py-3 rounded-xl
                      bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold
                      transition-all shadow-lg shadow-indigo-500/20 mt-1">
                    <MdAdd className="text-lg" /> Add Column
                  </button>
                </form>
              ) : (
                <EditLayout
                  col={editColumn}
                  handleColorChange={() => { }}
                  clearEditColumn={clearEditColumn}
                />
              )}
            </div>
          ) : (
            <SideMenuClose setSideMenu={setSideMenu} sideMenu={sideMenu} />
          )}
        </div>

        {/* ── Main Grid ── */}
        <div className="w-full overflow-hidden h-full flex flex-col flex-grow
          bg-[#0d0d1a] border border-white/[0.06] rounded-2xl">

          {/* Grid header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-white/30" />
              <h2 className="font-bold text-sm text-white">
                Columns
                <span className="ml-2 text-xs font-normal text-white/30">({columns.length})</span>
              </h2>
            </div>

            {/* Search */}
            <div className="relative ml-2 flex-1 max-w-xs">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-base" />
              <input
                type="search"
                placeholder="Search columns..."
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl
                  pl-9 pr-4 py-2 text-sm text-white placeholder-white/20
                  focus:outline-none focus:border-indigo-500/40 transition-colors"
              />
            </div>
          </div>

          {/* Sortable columns */}
          <div className="w-full overflow-x-auto h-full pb-4 px-4 pt-4
            [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredData1.map((col) => col.id)} strategy={rectSortingStrategy}>
                <div className="flex flex-wrap gap-4 min-w-full">
                  {filteredData1.map((col) => (
                    <SortableColumn
                      key={col.id}
                      col={col}
                      toggleLock={() => toggleLock(col.id)}
                      deleteCol={() => deleteColumn(col.id)}
                      setEditColumn={setEditColumn}
                    />
                  ))}
                  {filteredData1.length === 0 && (
                    <div className="w-full flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06]
                        flex items-center justify-center mb-4">
                        <Layers className="w-7 h-7 text-white/20" />
                      </div>
                      <p className="text-sm font-semibold text-white/30">
                        {columns.length === 0 ? "No columns yet" : "No results"}
                      </p>
                      <p className="text-xs text-white/20 mt-1">
                        {columns.length === 0 ? "Add your first column using the panel" : "Try a different search"}
                      </p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sortable Column Card ──────────────────────────────────────────────────────
function SortableColumn({
  col, toggleLock, deleteCol, setEditColumn,
}: {
  col: Column;
  toggleLock: () => void;
  deleteCol: () => void;
  setEditColumn: React.Dispatch<SetStateAction<Column[]>>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: col.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    resize: (col.locked ? "none" : "both") as "none" | "both",
    overflow: "auto",
    minWidth: "280px",
    maxWidth: "680px",
    borderColor: `${col.column_color}30`,
  };

  const [open, setOpen] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
    notify(`in Column ${col.column + 1}`);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-[#0d0d1a] border rounded-2xl shadow-lg min-h-[240px] relative flex flex-col
        transition-all duration-300 hover:shadow-xl"
    >
      {/* Color accent top bar */}
      <div className="absolute top-0 inset-x-0 h-0.5 rounded-t-2xl opacity-60"
        style={{ background: col.column_color }} />

      {/* Drag handle */}
      {!col.locked && (
        <div
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing
            mx-3 mt-3 mb-0 rounded-xl flex justify-center items-center py-2
            bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]"
          aria-label="Drag handle"
        >
          <RiDraggable className="text-xl text-white/30 rotate-90" />
        </div>
      )}

      {/* Column header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 relative">
        <button
          onClick={() => copyToClipboard(col.title)}
          className="text-2xl font-extrabold truncate text-left flex-1 transition-colors hover:opacity-80"
          style={{ color: col.column_color }}
          title="Click to copy title"
        >
          {col.title}
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className={`p-1.5 rounded-lg transition-all ${open
              ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300"
              : "text-white/30 hover:text-white/60 hover:bg-white/[0.06] border border-transparent"
              }`}
          >
            <SlOptionsVertical className="text-base" />
          </button>

          {open && (
            <div className="absolute right-0 top-8 z-20 w-44 bg-[#0d0d1a] border border-white/[0.08]
              rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
              <button onClick={toggleLock}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${col.locked
                    ? "text-red-400 hover:bg-red-500/10"
                    : "text-green-400 hover:bg-green-500/10"
                  }`}>
                {col.locked ? <><FaUnlock className="text-sm" /> Unlock</> : <><FaLock className="text-sm" /> Lock</>}
              </button>
              <button onClick={deleteCol}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
                  text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all">
                <MdDelete className="text-base" /> Delete
              </button>
              <button onClick={() => { setEditColumn([col]); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
                  text-indigo-400 hover:bg-indigo-500/10 transition-all">
                <FaEdit className="text-sm" /> Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
      <p className="text-[10px] text-white/20 px-4 pb-2 font-mono">
        Col #{col.column + 1} · {col.items.length} items{col.locked ? " · 🔒" : ""}
      </p>

      {/* Items */}
      <div className="flex flex-col gap-2 flex-grow overflow-y-auto px-3 pb-3
        [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
        {col.items.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-xl flex items-start gap-3 cursor-pointer group/item
              border border-white/[0.04] hover:border-white/[0.10] transition-all"
            style={{ backgroundColor: `${col.column_color}18` }}
            onClick={() => copyToClipboard(item.label1)}
            title="Click to copy"
          >
            <FaRegClipboard className="text-sm shrink-0 mt-0.5 opacity-30 group-hover/item:opacity-70 transition-opacity"
              style={{ color: col.column_color }} />
            <p className="text-sm font-medium text-white/80 group-hover/item:text-white
              active:cursor-copy break-words whitespace-pre-wrap transition-colors"
              style={{ color: undefined }}>
              {item.label1}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Edit Layout ───────────────────────────────────────────────────────────────
function EditLayout({ col, handleColorChange, clearEditColumn }: {
  col: Column[];
  clearEditColumn: () => void;
  handleColorChange: (color: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [columnColor, setColumnColor] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const STORAGE_KEY = "customColumns";

  useEffect(() => {
    setTitle(col[0]?.title);
    setColumnColor(col[0]?.column_color);
    setItems(col[0]?.items);
  }, [col]);

  const handleSaveColumn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const updatedColumn: Column = { ...col[0], title, column_color: columnColor, items };
    const savedCols = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const newCols = savedCols.map((c: Column) => c.id === updatedColumn.id ? updatedColumn : c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCols));
    clearEditColumn();
  };

  const handleItemChange = (id: string, value: string) =>
    setItems(items.map(item => item.id === id ? { ...item, label1: value } : item));

  const handleDeleteItem = (idToDelete: string) =>
    setItems(items.filter(item => item.id !== idToDelete));

  const handleAddItem = () =>
    setItems([...items, { id: crypto.randomUUID(), label1: "" }]);

  return (
    <form onSubmit={handleSaveColumn}
      className="flex flex-col gap-4 px-5 py-4 flex-1 overflow-auto
        [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">

      <SectionLabel>Edit Column</SectionLabel>

      <NexusInput
        label="Column Title"
        icon={MdOutlineTitle}
        type="text"
        placeholder="Column Title"
        value={title}
        onChange={(e: any) => setTitle(e.target.value)}
        required
      />

      <NexusInput
        label="Column Number"
        icon={MdNumbers}
        type="number"
        disabled
        value={col[0]?.column}
      />

      <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
        <div className="flex items-center gap-2.5 mb-2">
          <MdOutlineColorLens className="text-lg text-white/30" />
          <p className="text-[10px] text-white/30">Accent Color</p>
        </div>
        <ColorPicker onChange={handleColorChange} setColumnColor={setColumnColor} columnColor={columnColor} />
      </div>

      {/* Separator */}
      <div className="h-px bg-white/[0.06]" />

      <div>
        <SectionLabel>Items ({items.length})</SectionLabel>
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 space-y-2">
          <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto
            [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                <textarea
                  required
                  placeholder="Item text..."
                  value={item.label1}
                  onChange={(e) => handleItemChange(item.id, e.target.value)}
                  className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2
                    text-sm text-white placeholder-white/20 resize-y min-h-[44px]
                    focus:outline-none focus:border-indigo-500/40 transition-colors"
                />
                {items.length >= 2 && (
                  <button type="button" onClick={() => handleDeleteItem(item.id)}
                    className="mt-1 p-1.5 rounded-lg bg-red-500/10 border border-red-500/20
                      text-red-400 hover:bg-red-500/20 transition-all shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={handleAddItem}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg
              bg-white/[0.04] border border-white/[0.06] text-white/40 text-xs
              hover:text-white/70 hover:bg-white/[0.08] transition-all">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>
      </div>

      <div className="flex gap-3 mt-1">
        <button type="submit"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
            bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-all">
          <Save className="w-4 h-4" /> Save
        </button>
        <button type="button" onClick={clearEditColumn}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
            bg-white/[0.04] border border-white/[0.06] text-white/50 text-sm hover:bg-white/[0.08] transition-all">
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </form>
  );
}

// ── Collapsed sidebar ─────────────────────────────────────────────────────────
const SideMenuClose = ({
  setSideMenu, sideMenu,
}: {
  setSideMenu: React.Dispatch<SetStateAction<boolean>>;
  sideMenu: boolean;
}) => (
  <div className="flex flex-col gap-3 text-xl py-5 px-4 text-white/30 items-center relative z-10">
    <button onClick={() => setSideMenu(!sideMenu)}
      className="p-2 rounded-lg hover:bg-white/[0.08] hover:text-white/60 transition-all">
      <MdMenu />
    </button>
    <div className="flex flex-col gap-4 mt-6">
      {[MdOutlineTitle, MdNumbers, MdOutlineColorLens, RiAlignItemRightFill].map((Icon, i) => (
        <button key={i} onClick={() => setSideMenu(!sideMenu)}
          className="p-2 rounded-lg hover:bg-white/[0.08] hover:text-white/60 transition-all">
          <Icon />
        </button>
      ))}
    </div>
  </div>
);