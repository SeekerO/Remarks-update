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
// npm install react-color

import { ToastContainer, toast } from "react-toastify";
// npm install --save react-toastify

import { RiDraggable, RiAlignItemRightFill } from "react-icons/ri";
import { SlOptionsVertical } from "react-icons/sl";
import { FaLock, FaUnlock, FaEdit, FaRegClipboard } from "react-icons/fa";
import {
  MdDelete,
  MdNumbers,
  MdOutlineTitle,
  MdOutlineColorLens,
  MdMenu,
  MdAdd,
} from "react-icons/md";

type Item = { label1: string };

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
    position: "top-center",
    autoClose: 500,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: false,
    draggable: false,
    progress: undefined,
    theme: "light",
    // transition: Bounce,
  });

const notify_added_column = () =>
  toast.success("New column added!", {
    position: "top-center",
    autoClose: 500,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: false,
    draggable: false,
    progress: undefined,
    theme: "light",
    // transition: Bounce,
  });

const notify_deleted_column = () =>
  toast.error("Deleted column!", {
    position: "top-center",
    autoClose: 500,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: false,
    draggable: false,
    progress: undefined,
    theme: "light",
    // transition: Bounce,
  });

export default function DynamicColumn() {
  const [title, setTitle] = useState("");
  const [columnColor, setColumnColor] = useState("red");
  const [items, setItems] = useState<Item[]>([{ label1: "" }]);
  const [columns, setColumns] = useState<Column[]>([]);
  const STORAGE_KEY = "customColumns";

  const sensors = useSensors(useSensor(PointerSensor));

  const [editColumn, setEditColumn] = useState<Column[]>([]);

  const [sideMenu, setSideMenu] = useState<boolean>(true);

  useEffect(() => {
    fetchLocalStorage();
  }, []);

  const fetchLocalStorage = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setColumns(JSON.parse(stored));
    }
  };

  const clearEditColumn = () => {
    fetchLocalStorage();
    return setEditColumn([]);
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    notify_added_column();
    const newColumn: Column = {
      id: crypto.randomUUID(),
      title,
      column: columns.length,
      column_color: columnColor,
      items,
      locked: false,
    };
    const updated = [...columns, newColumn];
    setColumns(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setTitle("");

    setColumnColor("red");
    setItems([{ label1: "" }]);
  };

  const handleAddItem = () => {
    setItems([...items, { label1: "" }]);
  };

  const handleDeleteItem = (indexToDelete: unknown) => {
    setItems((prevItems) =>
      prevItems.filter((_, index) => index !== indexToDelete)
    );
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].label1 = value;
    setItems(newItems);
  };

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
    const updated = columns.map((col) =>
      col.id === id ? { ...col, locked: !col.locked } : col
    );
    setColumns(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteColumn = (id: string) => {
    const updated = columns.filter((col) => col.id !== id);
    notify_deleted_column();
    setColumns(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleColorChange = (color: string) => {
    console.log("Selected color:", color);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden justify-center select-none p-4 md:p-8 bg-gray-50 dark:bg-gray-900 font-sans">
      <div className="w-full h-full flex flex-col md:flex-row gap-6">
        <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />

        {/* Sidebar / Column Manager */}
        <div
          className={`
          bg-white dark:bg-gray-800
          ${sideMenu ? "w-full md:w-[420px]" : "w-[80px]"}
          flex-shrink-0
          duration-300
          h-[90vh] md:h-full
          flex flex-col items-center
          shadow-xl rounded-2xl
          border overflow-auto
          ${editColumn.length === 1 ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200 dark:border-gray-700"}
        `}
        >
          {sideMenu ? (
            <>
              <h1
                className={`
                text-gray-800 dark:text-gray-100
                shrink-0 text-nowrap text-2xl font-extrabold
                mb-6 mt-6 uppercase tracking-wide
                flex gap-3 items-center
                ${editColumn.length === 1 ? "text-blue-600 dark:text-blue-400" : ""}
              `}
              >
                {editColumn.length === 0 ? "Column Manager" : "Editing Column"}
                <MdMenu
                  onClick={() => setSideMenu(!sideMenu)}
                  className="text-3xl cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                />
              </h1>

              {editColumn.length === 0 ? (
                <form
                  onSubmit={handleAddColumn}
                  className="space-y-5 w-full shrink-0 flex flex-col gap-5 items-center px-5 pb-5"
                >
                  <div className="flex flex-col gap-4 w-full">
                    {/* Title Input */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-xl text-gray-700 dark:text-gray-100 shadow-sm">
                      <MdOutlineTitle className="text-2xl text-gray-500 dark:text-gray-400" />
                      <input
                        type="text"
                        placeholder="Column Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 rounded-lg bg-transparent border-none focus:outline-none focus:ring-0 text-lg placeholder-gray-400 dark:placeholder-gray-500"
                        required
                      />
                    </div>

                    {/* Column Number Input */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-xl text-gray-700 dark:text-gray-100 shadow-sm">
                      <MdNumbers className="text-2xl text-gray-500 dark:text-gray-400" />
                      <input
                        type="number"
                        placeholder="Column Number"
                        disabled
                        value={columns.length + 1}
                        className="w-full p-2 rounded-lg bg-transparent border-none focus:outline-none focus:ring-0 text-lg placeholder-gray-400 dark:placeholder-gray-500 cursor-not-allowed"
                      />
                    </div>

                    {/* Color Picker */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-xl text-gray-700 dark:text-gray-100 shadow-sm">
                      <MdOutlineColorLens className="text-2xl text-gray-500 dark:text-gray-400" />
                      <div className="flex-1">
                        <ColorPicker onChange={handleColorChange} setColumnColor={setColumnColor} />
                      </div>
                    </div>
                  </div>

                  <div className="w-full flex flex-col gap-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 p-4 rounded-xl shadow-inner">
                    <label className="text-lg font-semibold text-gray-700 dark:text-gray-100">
                      Column Items
                    </label>
                    <div className="flex flex-col gap-3 min-h-[150px] max-h-[300px] overflow-y-auto p-1 pr-3 custom-scrollbar">
                      {items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 w-full">
                          <input
                            required
                            type="text"
                            placeholder={`Item ${index + 1}`}
                            value={item.label1}
                            onChange={(e) => handleItemChange(index, e.target.value)}
                            className="flex-grow p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                          />
                          {items.length >= 2 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(index)}
                              className="p-2 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-600 dark:text-red-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                              aria-label="Delete item"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                x="0px"
                                y="0px"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M 10 2 L 9 3 L 4 3 L 4 5 L 7 5 L 17 5 L 20 5 L 20 3 L 15 3 L 14 2 L 10 2 z M 5 7 L 5 22 L 19 22 L 19 7 L 5 7 z"></path>
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-indigo-600 text-white font-bold text-lg shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                  >
                    <MdAdd className="text-2xl" />
                    Add Column
                  </button>
                </form>
              ) : (
                <EditLayout
                  col={editColumn}
                  handleColorChange={handleColorChange}
                  clearEditColumn={clearEditColumn}
                />
              )}
            </>
          ) : (
            <SideMenuClose setSideMenu={setSideMenu} sideMenu={sideMenu} />
          )}
        </div>

        {/* Main Content Area (Sortable Columns) */}
        <div className="w-full h-full flex flex-col flex-grow bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Your Columns</h2>
          <div className="w-full overflow-x-auto h-full pb-4 custom-scrollbar">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columns.map((col) => col.id)}
                strategy={rectSortingStrategy}
              >
                <div className="flex flex-wrap gap-4 min-w-max"> {/* Changed gap and min-w-max */}
                  {columns.map((col) => (
                    <SortableColumn
                      key={col.id}
                      col={col}
                      toggleLock={() => toggleLock(col.id)}
                      deleteCol={() => deleteColumn(col.id)}
                      setEditColumn={setEditColumn}
                    />
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

function SortableColumn({
  col,
  toggleLock,
  deleteCol,
  setEditColumn,
}: {
  col: Column;
  toggleLock: () => void;
  deleteCol: () => void;
  setEditColumn: React.Dispatch<SetStateAction<Column[]>>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: col.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    resize: (col.locked ? "none" : "both") as
      | "none"
      | "both"
      | "horizontal"
      | "vertical",
    overflow: "auto",
    minWidth: "300px",
    maxWidth: "700px", // prevents it from exceeding its parent
    borderColor: col.column_color,
  };

  const styleItem = {
    backgroundColor: col.column_color,
  };

  const [open, setOpen] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("Text copied:", text);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
    notify(`in Column ${col.column + 1}`);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group p-4 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg bg-white dark:bg-gray-800 dark:text-white min-h-[250px] relative flex flex-col transition-all duration-300 ease-in-out hover:shadow-xl"
    >
      {/* Draggable Handle */}
      {
        !col.locked && (
          <div
            {...attributes}
            {...listeners}
            className="group-hover:opacity-100 opacity-0 transition-opacity duration-300 cursor-grab active:cursor-grabbing text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 flex justify-center items-center py-2 shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Drag handle"
          >
            <RiDraggable className="text-2xl rotate-90" />
          </div>
        )
      }

      {/* Column Header */}
      <div className="flex justify-between items-center mb-4 relative">
        <h1
          onClick={() => copyToClipboard(col.title)}
          className="font-extrabold text-4xl truncate cursor-pointer hover:opacity-80 transition-opacity duration-200"
          style={{ color: col.column_color }}
          title="Click to copy title" // Tooltip for copy action
        >
          {col.title}
        </h1>

        <button
          onClick={() => setOpen(!open)}
          className={`relative p-2 rounded-full transition-all duration-200 ${open ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
          aria-label="Column options"
        >
          <SlOptionsVertical className="text-xl" />
        </button>
      </div>

      {/* Options Dropdown */}
      {
        open && (
          <div
            ref={ref}
            className="absolute right-0 top-16 z-10 w-[220px] bg-white dark:bg-gray-700 rounded-lg shadow-xl p-3 flex flex-col gap-2 border border-gray-200 dark:border-gray-600 animate-fade-in"
          >
            <button
              onClick={toggleLock}
              className={`w-full justify-center flex items-center gap-2 py-2 rounded-md font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
            ${col.locked
                  ? "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500"
                  : "bg-green-500 hover:bg-green-600 text-white focus:ring-green-500"
                }`}
            >
              {col.locked ? (
                <>
                  <FaUnlock className="text-lg" /> Unlock
                </>
              ) : (
                <>
                  <FaLock className="text-lg" /> Lock
                </>
              )}
            </button>
            <button
              onClick={deleteCol}
              className="w-full justify-center flex items-center gap-2 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <MdDelete className="text-xl" /> Delete
            </button>
            <button
              onClick={() => {
                setEditColumn([col]);
                setOpen(false); // Close dropdown after clicking edit
              }}
              className="w-full justify-center flex items-center gap-2 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FaEdit className="text-lg" /> Edit
            </button>
          </div>
        )
      }

      {/* Column Details */}
      <div className="flex flex-col flex-grow">
        <p className="text-sm italic tracking-wide font-medium text-gray-600 dark:text-gray-400 mb-3">
          Column #: {col?.column + 1}
        </p>
        <div className="flex flex-col gap-3 flex-grow overflow-y-auto pr-2 custom-scrollbar">
          {col.items.map((item, i) => (
            <div
              key={i}
              className="p-3 rounded-lg flex items-center gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 shadow-sm"
              style={styleItem} // Apply dynamic styling if needed
              onClick={() => copyToClipboard(item.label1)}
              title="Click to copy item" // Tooltip for copy action
            >
              <FaRegClipboard className="text-xl text-gray-500 dark:text-gray-400 shrink-0" />
              <p className="text-lg font-medium text-gray-800 dark:text-gray-100 active:cursor-copy break-words">
                {item.label1}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div >
  );
}

function EditLayout({
  col,
  handleColorChange,
  clearEditColumn,
}: {
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

    const updatedColumn: Column = {
      ...col[0],
      title,
      column_color: columnColor,
      items,
    };

    // Optionally persist to localStorage or pass to parent
    const savedCols = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const newCols = savedCols.map((c: Column) =>
      c.id === updatedColumn.id ? updatedColumn : c
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCols));

    // You could call a parent callback here if needed
    clearEditColumn();
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].label1 = value;
    setItems(newItems);
  };

  const handleDeleteItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { label1: "" }]); // Adjust shape as needed
  };

  return (
    <form
      onSubmit={handleSaveColumn}
      className="space-y-6 w-full flex flex-col items-center px-5 py-6" // Increased padding and spacing
    >
      <div className="flex flex-col gap-4 w-full"> {/* Increased gap for better spacing */}
        {/* Title Input */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-xl shadow-sm text-gray-700 dark:text-gray-100">
          <MdOutlineTitle className="text-2xl text-gray-500 dark:text-gray-400" /> {/* Larger, softer icon */}
          <input
            type="text"
            placeholder="Column Title" // More specific placeholder
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 rounded-lg bg-transparent border-none focus:outline-none focus:ring-0 text-lg placeholder-gray-400 dark:placeholder-gray-500" // Modern input styling
            required
          />
        </div>

        {/* Column Number Input */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-xl shadow-sm text-gray-700 dark:text-gray-100">
          <MdNumbers className="text-2xl text-gray-500 dark:text-gray-400" />
          <input
            type="number"
            placeholder="Column Number"
            disabled
            value={col[0]?.column}
            className="w-full p-2 rounded-lg bg-transparent border-none focus:outline-none focus:ring-0 text-lg placeholder-gray-400 dark:placeholder-gray-500 cursor-not-allowed" // Consistent input styling, cursor-not-allowed for disabled
          />
        </div>

        {/* Color Picker */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-xl shadow-sm text-gray-700 dark:text-gray-100">
          <MdOutlineColorLens className="text-2xl text-gray-500 dark:text-gray-400" />
          <div className="flex-1">
            <ColorPicker
              onChange={handleColorChange}
              setColumnColor={setColumnColor}
            />
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="h-0.5 w-full bg-gray-300 dark:bg-gray-600 my-4 rounded-full" /> {/* Thicker, full-width, rounded separator */}

      {/* Column Items Section */}
      <div className="w-full flex flex-col gap-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 p-4 rounded-xl shadow-inner">
        <label className="text-lg font-semibold text-gray-700 dark:text-gray-100"> {/* Stronger label */}
          Column Items
        </label>
        <div className="flex flex-col gap-3 min-h-[150px] max-h-[300px] overflow-y-auto p-1 pr-3 custom-scrollbar"> {/* Enhanced scrollable area */}
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-3 w-full"> {/* Increased gap for items */}
              <input
                required
                type="text"
                placeholder={`Item ${index + 1}`}
                value={item.label1}
                onChange={(e) => handleItemChange(index, e.target.value)}
                className="flex-grow p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200" // Modern input, focus ring
              />
              {col[0]?.items.length >= 2 && ( // Added optional chaining for safety
                <button
                  type="button" // Important for buttons inside forms
                  onClick={() => handleDeleteItem(index)}
                  className="p-2 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-600 dark:text-red-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500" // Circular button, subtle hover, focus ring
                  aria-label={`Delete item ${index + 1}`} // Accessibility
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="18" // Larger icon
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor" // Use currentColor for text color
                  >
                    <path d="M 10 2 L 9 3 L 4 3 L 4 5 L 7 5 L 17 5 L 20 5 L 20 3 L 15 3 L 14 2 L 10 2 z M 5 7 L 5 22 L 19 22 L 19 7 L 5 7 z"></path>
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddItem}
            className="mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500" // Elevated primary button style
          >
            Add Item
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4 w-full pt-4"> {/* Centered buttons with consistent gap */}
        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-green-600 text-white font-bold text-lg shadow-lg hover:bg-green-700 hover:shadow-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900" // Primary save button
        >
          Save Column
        </button>

        <button
          type="button"
          onClick={() => clearEditColumn()}
          className="flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-gray-300 text-gray-800 font-bold text-lg shadow-md hover:bg-gray-400 hover:shadow-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500" // Secondary cancel button
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const SideMenuClose = ({
  setSideMenu,
  sideMenu,
}: {
  setSideMenu: React.Dispatch<SetStateAction<boolean>>;
  sideMenu: boolean;
}) => {
  return (
    <div className="flex flex-col gap-2 text-[2rem] py-7 text-gray-600">
      <MdMenu
        onClick={() => setSideMenu(!sideMenu)}
        className="cursor-pointer"
      />
      <div className="flex flex-col gap-6 mt-10">
        <MdOutlineTitle
          onClick={() => setSideMenu(!sideMenu)}
          className="cursor-pointer"
        />
        <MdNumbers
          onClick={() => setSideMenu(!sideMenu)}
          className="cursor-pointer"
        />
        <MdOutlineColorLens
          onClick={() => setSideMenu(!sideMenu)}
          className="cursor-pointer"
        />
        <RiAlignItemRightFill
          onClick={() => setSideMenu(!sideMenu)}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
};
