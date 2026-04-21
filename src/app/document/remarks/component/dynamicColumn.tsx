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

import { RiDraggable } from "react-icons/ri";
import { SlOptionsVertical } from "react-icons/sl";
import { FaLock, FaUnlock, FaEdit } from "react-icons/fa";
import { FaFilePen } from "react-icons/fa6";
import {
  MdDelete, MdNumbers, MdOutlineTitle,
  MdOutlineColorLens, MdMenu,
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
    position: "top-center", autoClose: 500, theme: "dark",
  });

const notify_added_column = () =>
  toast.success("New column added!", {
    position: "top-center", autoClose: 500, theme: "dark",
  });

const notify_deleted_column = () =>
  toast.error("Deleted column!", {
    position: "top-center", autoClose: 500, theme: "dark",
  });

// ── Shared UI Components ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-white/30 mb-2">
      {children}
    </p>
  );
}

function NexusInput({ label, icon: Icon, ...props }: any) {
  return (
    <div className="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl p-3 flex items-center gap-2.5 shadow-sm dark:shadow-none transition-colors">
      {Icon && <Icon className="text-lg text-slate-400 dark:text-white/30 shrink-0" />}
      <div className="flex-1 min-w-0">
        {label && <p className="text-[10px] text-slate-500 dark:text-white/30 mb-0.5">{label}</p>}
        <input
          {...props}
          className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none border-none"
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
    <div className="w-full h-full flex flex-col overflow-hidden select-none transition-colors duration-300">
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar theme="dark" />

      <div className="w-full h-full flex gap-4">

        {/* ── Sidebar ── */}
        <div className={`
          bg-slate-50 dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/[0.06] rounded-2xl flex-shrink-0
          ${sideMenu ? "w-full md:w-[380px]" : "w-[64px]"}
          duration-300 h-full flex flex-col overflow-hidden relative shadow-lg dark:shadow-none
        `}>
          {sideMenu ? (
            <div className="relative z-10 flex flex-col h-full overflow-auto">
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-200 dark:border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                    <FaFilePen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {editColumn.length === 0 ? "Column Manager" : "Editing Column"}
                  </h1>
                </div>
                <button onClick={() => setSideMenu(false)} className="p-1.5 rounded-lg bg-slate-200 dark:bg-white/[0.04] text-slate-600 dark:text-white/30">
                  <MdMenu className="text-base" />
                </button>
              </div>

              {editColumn.length === 0 ? (
                <form onSubmit={handleAddColumn} className="flex flex-col gap-4 px-5 py-4 flex-1 overflow-auto">
                  <SectionLabel>Column Details</SectionLabel>
                  <NexusInput label="Title" icon={MdOutlineTitle} value={title} onChange={(e: any) => setTitle(e.target.value)} required />
                  <NexusInput label="Index" icon={MdNumbers} disabled value={columns.length + 1} />

                  <div className="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl p-3">
                    <div className="flex items-center gap-2.5 mb-2">
                      <MdOutlineColorLens className="text-lg text-slate-400 dark:text-white/30" />
                      <p className="text-[10px] text-slate-500 dark:text-white/30">Accent Color</p>
                    </div>
                    {/* Fixed Color Picker Container */}
                    <ColorPicker onChange={() => { }} setColumnColor={setColumnColor} columnColor={columnColor} />
                  </div>

                  <div>
                    <SectionLabel>Items ({items.length})</SectionLabel>
                    <div className="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl p-3 space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <textarea
                            required
                            value={item.label1}
                            onChange={(e) => handleItemChange(item.id, e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/40 min-h-[40px] resize-none"
                          />
                          {items.length >= 2 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="w-full py-2.5 bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-white/40 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all border border-dashed border-slate-300 dark:border-white/10"
                      >
                        <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Item
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="py-3 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                    Add Column
                  </button>
                </form>
              ) : (
                <EditLayout col={editColumn} clearEditColumn={clearEditColumn} />
              )}
            </div>
          ) : (
            <SideMenuClose setSideMenu={setSideMenu} sideMenu={sideMenu} />
          )}
        </div>

        {/* ── Main Grid ── */}
        <div className="w-full overflow-hidden h-full flex flex-col flex-grow bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/[0.06] rounded-2xl shadow-inner transition-colors">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-white/[0.06]">
            <Layers className="w-4 h-4 text-slate-400 dark:text-white/30" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              Columns <span className="ml-1 text-slate-400 dark:text-white/30">({columns.length})</span>
            </h2>
            <div className="relative ml-auto w-full max-w-xs">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" />
              <input
                type="search"
                placeholder="Search..."
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/40"
              />
            </div>
          </div>

          <div className="w-full overflow-x-auto h-full p-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredData1.map((col) => col.id)} strategy={rectSortingStrategy}>
                <div className="flex flex-wrap gap-4 items-start">
                  {filteredData1.map((col) => (
                    <SortableColumn key={col.id} col={col} toggleLock={() => toggleLock(col.id)} deleteCol={() => deleteColumn(col.id)} setEditColumn={setEditColumn} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sortable Column Card Component ─────────────────────────────────────────────
function SortableColumn({ col, toggleLock, deleteCol, setEditColumn }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: col.id });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    minWidth: "280px",
    borderColor: `${col.column_color}40`,
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notify(`in ${col.title}`);
  };

  return (
    <div ref={setNodeRef} style={style} className="group bg-slate-50 dark:bg-[#0d0d1a] border rounded-2xl shadow-md flex flex-col transition-all overflow-hidden">
      <div className="h-1.5 opacity-80" style={{ background: col.column_color }} />

      {!col.locked && (
        <div {...attributes} {...listeners} className="mx-3 mt-2 py-1 flex justify-center bg-slate-200/50 dark:bg-white/[0.04] rounded-lg cursor-grab active:cursor-grabbing hover:bg-slate-300/50 dark:hover:bg-white/[0.08] transition-colors">
          <RiDraggable className="text-slate-400 dark:text-white/20 rotate-90" />
        </div>
      )}

      <div className="flex items-center justify-between px-4 pt-3 pb-1 gap-2">
        <button onClick={() => copyToClipboard(col.title)} className="text-base font-extrabold truncate text-left flex-1" style={{ color: col.column_color }}>
          {col.title}
        </button>
        <div className="relative" ref={ref}>
          <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-white/30 dark:hover:text-white/60 hover:bg-slate-200 dark:hover:bg-white/[0.04]">
            <SlOptionsVertical className="text-xs" />
          </button>
          {open && (
            <div className="absolute right-0 top-9 z-20 w-40 bg-white dark:bg-[#161625] border border-slate-200 dark:border-white/[0.1] rounded-xl shadow-2xl p-1.5 flex flex-col">
              <button onClick={() => { toggleLock(); setOpen(false); }} className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${col.locked ? "text-emerald-500 hover:bg-emerald-500/10" : "text-amber-500 hover:bg-amber-500/10"}`}>
                {col.locked ? <FaUnlock /> : <FaLock />} {col.locked ? "Unlock" : "Lock"}
              </button>
              <button onClick={() => { setEditColumn([col]); setOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors">
                <FaEdit /> Edit
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-white/[0.05]" />
              <button onClick={() => { deleteCol(); setOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                <MdDelete className="text-sm" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] font-bold text-slate-400 dark:text-white/20 px-4 pb-3">#{col.column + 1} • {col.items.length} ITEMS</p>

      <div className="flex flex-col gap-2 px-3 pb-4 overflow-y-auto max-h-[400px]">
        {col.items.map((item: any) => (
          <div
            key={item.id}
            onClick={() => copyToClipboard(item.label1)}
            className="p-3 rounded-xl border border-slate-200 dark:border-white/[0.04] bg-white dark:bg-white/[0.02] hover:border-indigo-400/40 dark:hover:border-white/[0.1] cursor-pointer transition-all group/item shadow-sm dark:shadow-none"
          >
            <p className="text-sm font-medium text-slate-700 dark:text-white/80 group-hover/item:text-indigo-600 dark:group-hover/item:text-white">
              {item.label1}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Edit Layout Component ─────────────────────────────────────────────────────
function EditLayout({ col, clearEditColumn }: { col: Column[]; clearEditColumn: () => void }) {
  const [title, setTitle] = useState(col[0]?.title || "");
  const [columnColor, setColumnColor] = useState(col[0]?.column_color || "");
  const [items, setItems] = useState<Item[]>(col[0]?.items || []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = JSON.parse(localStorage.getItem("customColumns") || "[]");
    const updated = saved.map((c: Column) => c.id === col[0].id ? { ...c, title, column_color: columnColor, items } : c);
    localStorage.setItem("customColumns", JSON.stringify(updated));
    clearEditColumn();
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 px-5 py-4 flex-1 overflow-auto">
      <SectionLabel>Edit Mode</SectionLabel>
      <NexusInput label="Title" icon={MdOutlineTitle} value={title} onChange={(e: any) => setTitle(e.target.value)} />

      <div className="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl p-3">
        <div className="flex items-center gap-2.5 mb-2">
          <MdOutlineColorLens className="text-lg text-slate-400 dark:text-white/30" />
          <p className="text-[10px] text-slate-500 dark:text-white/30">Change Color</p>
        </div>
        <ColorPicker onChange={() => { }} setColumnColor={setColumnColor} columnColor={columnColor} />
      </div>

      <div className="space-y-3">
        <SectionLabel>Items</SectionLabel>
        {items.map((item) => (
          <div key={item.id} className="flex gap-2 items-center">
            <textarea
              value={item.label1}
              onChange={(e) => setItems(items.map(it => it.id === item.id ? { ...it, label1: e.target.value } : it))}
              className="flex-1 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-lg p-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/40 min-h-[40px] resize-none"
            />
            <button
              type="button"
              onClick={() => setItems(items.filter(it => it.id !== item.id))}
              className="p-2 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems([...items, { id: crypto.randomUUID(), label1: "" }])}
          className="w-full py-2 bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-white/40 text-xs font-bold rounded-lg border border-dashed border-slate-300 dark:border-white/10"
        >
          + Add Item
        </button>
      </div>

      <div className="flex gap-2 mt-4 pb-4">
        <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
          <Save size={18} /> Save
        </button>
        <button type="button" onClick={clearEditColumn} className="flex-1 py-3 bg-slate-200 dark:bg-white/[0.06] text-slate-600 dark:text-white/50 rounded-xl font-bold transition-all hover:bg-slate-300 dark:hover:bg-white/[0.1]">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Collapsed Sidebar Component ───────────────────────────────────────────────
function SideMenuClose({ setSideMenu }: any) {
  return (
    <div className="flex flex-col gap-6 py-6 items-center bg-slate-100 dark:bg-transparent h-full border-r border-slate-200 dark:border-none">
      <button onClick={() => setSideMenu(true)} className="p-2.5 bg-white dark:bg-white/[0.08] rounded-xl shadow-md text-slate-600 dark:text-white/40 hover:text-indigo-600 dark:hover:text-white transition-colors">
        <MdMenu size={22} />
      </button>
      <div className="w-8 h-px bg-slate-300 dark:bg-white/[0.06]" />
      <Plus className="text-slate-400 dark:text-white/20 cursor-pointer hover:text-indigo-500 transition-colors" onClick={() => setSideMenu(true)} />
      <IoSearchOutline className="text-slate-400 dark:text-white/20 cursor-pointer hover:text-indigo-500 transition-colors" onClick={() => setSideMenu(true)} />
    </div>
  );
}