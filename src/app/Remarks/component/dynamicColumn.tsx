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
    <div className="w-full h-full flex flex-col overflow-hidden justify-center select-none">
      <div className="w-full h-full flex gap-5">
        <ToastContainer />
        <div
          className={`bg-slate-100 dark:bg-slate-700 ${
            sideMenu ? "w-[400px]" : "w-[70px]"
          } duration-300 h-full flex flex-col items-center overflow-hidden shadow-md rounded-xl ${
            editColumn.length === 1 && "border-1 border-blue-500 border"
          }`}
        >
          {sideMenu ? (
            <>
              <h1
                className={`text-slate-700 dark:text-slate-100  shrink-0 text-nowrap text-xl font-bold mb-4 mt-4 uppercase tracking-wide flex gap-2 items-center ${
                  editColumn.length === 1 && "text-blue-500"
                }`}
              >
                {editColumn.length === 0 ? "Column Manager" : "Editing Column"}
                <MdMenu
                  onClick={() => setSideMenu(!sideMenu)}
                  className="text-[1.9rem] cursor-pointer"
                />
              </h1>
              {editColumn.length === 0 ? (
                <form
                  onSubmit={handleAddColumn}
                  className="space-y-3 w-full shrink-0 flex flex-col gap-4 items-center px-3 "
                >
                  <div className="flex flex-col gap-2 items-center w-full">
                    <div className="flex flex-col gap-y-2 w-full">
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-600 p-1 rounded-md text-slate-700 dark:text-slate-100">
                        <MdOutlineTitle className="text-[2rem]  " />
                        <input
                          type="text"
                          placeholder="Title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full outline-1 p-2 rounded outline-slate-300 bg-white dark:bg-slate-500 "
                          required
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-600 p-1 rounded-md text-slate-700 dark:text-slate-100">
                        <MdNumbers className="text-[2rem]" />
                        <input
                          type="number"
                          placeholder="Column Number"
                          disabled
                          value={columns.length + 1}
                          className="w-full outline-1 p-2 rounded outline-slate-300 bg-white dark:bg-slate-500"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-600 p-1 rounded-md text-slate-700 dark:text-slate-100">
                        <MdOutlineColorLens className="text-[1.9rem] " />

                        <div className="flex-1 ">
                          <ColorPicker
                            onChange={handleColorChange}
                            setColumnColor={setColumnColor}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="h-[2px] w-[250px] bg-gray-300 mb-2 mt-2" />

                    <div className="w-full flex flex-col gap-2 border-1 border-slate-300 bg-white dark:bg-slate-600 p-2 rounded-md w-full">
                      <label className="italic text-slate-700 dark:text-slate-100 font-semibold">
                        Column Items
                      </label>
                      <div className="flex flex-col gap-2 min-h-[200px] max-h-[300px] overflow-auto p-1 w-full">
                        {items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 w-full"
                          >
                            <input
                              required
                              key={index}
                              type="text"
                              placeholder={`Item ${index + 1}`}
                              value={item.label1}
                              onChange={(e) =>
                                handleItemChange(index, e.target.value)
                              }
                              className="outline-slate-300 focus:outline-1 focus:outline-slate-400 outline-1 h-fit p-2 rounded w-full bg-slate-100 dark:bg-slate-500"
                            />
                            {items.length >= 2 && (
                              <label
                                onClick={() => handleDeleteItem(index)}
                                className="border-1 border-red-500 p-2 rounded-md fill-red-500 hover:fill-red-300 hover:border-red-300 duration-300 w-fit cursor-pointer"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  x="0px"
                                  y="0px"
                                  width="15"
                                  height="15"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M 10 2 L 9 3 L 4 3 L 4 5 L 7 5 L 17 5 L 20 5 L 20 3 L 15 3 L 14 2 L 10 2 z M 5 7 L 5 22 L 19 22 L 19 7 L 5 7 z"></path>
                                </svg>
                              </label>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="sticky bottom-0 px-3 py-1 rounded bg-blue-500 text-white hover:bg-opacity-70 duration-300 cursor-pointer hover:scale-95"
                        >
                          Add Item
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="flex items-center border-2 border-gray-400 text-black dark:text-slate-100 font-semibold px-7 py-2 rounded cursor-pointer hover:bg-blue-500 hover:border-blue-500 hover:text-white font-semibold duration-300"
                  >
                    <MdAdd className="text-[1.5rem]" />
                    Add Column
                  </button>
                </form>
              ) : (
                <EditLayout
                  col={editColumn}
                  handleColorChange={handleColorChange}
                  clearEditColumn={clearEditColumn}
                />
              )}{" "}
            </>
          ) : (
            <SideMenuClose setSideMenu={setSideMenu} sideMenu={sideMenu} />
          )}
        </div>

        <div className="w-full h-[90vh] flex flex-col">
          {/* <h2 className="text-xl font-semibold pb-5">Reorder Columns</h2> */}

          <div className="w-full overflow-x-auto h-full">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columns.map((col) => col.id)}
                strategy={rectSortingStrategy}
              >
                <div className="flex flex-wrap gap-2 max-w-full">
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
      className="group p-2 border rounded shadow bg-white dark:bg-slate-700 dark:text-white min-h-[200px] relative "
    >
      {!col.locked && (
        <div
          {...attributes}
          {...listeners}
          className="group-hover:opacity-100 opacity-0 transition-opacity duration-200 cursor-grab active:cursor-grabbing text-md rounded mb-3 flex justify-center text-black bg-slate-100 dark:bg-slate-500 w-full py-1"
        >
          <RiDraggable className="rotate-90" />
        </div>
      )}

      <div className="flex justify-between items-center mb-2 relative">
        <h1
          onClick={() => copyToClipboard(col.title)}
          className="font-bold uppercase text-[2rem] truncate  cursor-pointer hover:opacity-80 transition"
          style={{ color: col.column_color }}
        >
          {col.title}
        </h1>

        <button
          onClick={() => setOpen(!open)}
          className={`relative cursor-pointer py-1 ${open && "text-blue-400"}`}
        >
          <SlOptionsVertical />
        </button>
      </div>

      {open && (
        <div
          ref={ref}
          className="space-x-1 shadow-md backdrop-blur-md bg-slate-100/30 p-2 w-[200px] h-[200px] absolute right-5 top-15 flex flex-col gap-2 rounded-md"
        >
          <>
            <button
              onClick={toggleLock}
              className={`w-full justify-center flex gap-2 items-center text-md py-1 rounded cursor-pointer ${
                col.locked ? "bg-red-500" : "bg-green-500"
              } text-white`}
            >
              {col.locked ? (
                <>
                  <FaUnlock /> Unlock
                </>
              ) : (
                <>
                  {" "}
                  <FaLock /> Lock
                </>
              )}
            </button>
            <button
              onClick={deleteCol}
              className="text-md flex items-center w-full cursor-pointer active:text-white active:bg-red-500 justify-center py-1 bg-gray-400 rounded text-white text-center"
            >
              <MdDelete className="text-[20px]" /> Delete
            </button>
          </>
          <button
            onClick={() => setEditColumn([col])}
            className="bg-blue-500 py-1 rounded-md w-full active:bg-blue-700 cursor-pointer text-white flex items-center justify-center gap-1 text-md"
          >
            <FaEdit className="text-[18px]" />
            Edit
          </button>
        </div>
      )}

      <div className="p-2 rounded">
        <p className="text-md italic tracking-wide font-thin">
          Column #: {col?.column + 1}
        </p>
        <div className="flex flex-col gap-2 text-[1.2rem] mt-2">
          {col.items.map((item, i) => (
            <div
              key={i}
              className="text-white p-2 rounded-md flex items-center gap-5 active:cursor-copy cursor-pointer"
              style={styleItem}
              onClick={() => copyToClipboard(item.label1)}
            >
              <FaRegClipboard className="text-[25px] shrink-0" />
              <label className="active:cursor-copy cursor-pointer">
                {item.label1}
              </label>
            </div>
          ))}
        </div>
      </div>
      {/* <pre>{JSON.stringify(col, null, 2)}</pre> */}
    </div>
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
      className="space-y-3 w-full flex flex-col gap-4 items-center px-3 "
    >
      <div className="flex flex-col gap-2 items-center w-full">
        <div className="flex flex-col gap-y-2 w-full">
          <div className="flex items-center gap-1 bg-white p-1 rounded-md">
            <MdOutlineTitle className="text-[2rem] text-gray-500" />
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full outline-1 p-2 rounded outline-slate-300 bg-white"
              required
            />
          </div>
          <div className="flex items-center gap-1 bg-white p-1 rounded-md">
            <MdNumbers className="text-[2rem] text-gray-500" />
            <input
              type="number"
              placeholder="Column Number"
              disabled
              value={col[0]?.column}
              className="w-full outline-1 p-2 rounded outline-slate-300 bg-white"
            />
          </div>
          <div className="flex items-center gap-1 bg-white p-1 rounded-md">
            <MdOutlineColorLens className="text-[1.9rem] text-gray-500" />

            <div className="flex-1 ">
              <ColorPicker
                onChange={handleColorChange}
                setColumnColor={setColumnColor}
              />
            </div>
          </div>
        </div>

        <div className="h-[2px] w-[250px] bg-gray-300 mb-2 mt-2" />

        <div className="w-full flex flex-col gap-2">
          <div className="w-full flex flex-col gap-2 border-1 border-slate-300 bg-white p-2 rounded-md w-full">
            <label className="italic text-slate-500 font-semibold">
              Column Items
            </label>
            <div className="flex flex-col gap-2 min-h-[200px] max-h-[300px] overflow-auto p-1 w-full">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 w-full">
                  <input
                    required
                    key={index}
                    type="text"
                    placeholder={`Item ${index + 1}`}
                    value={item.label1}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                    className="outline-slate-300 focus:outline-1 focus:outline-slate-400 outline-1 h-fit p-2 rounded w-full bg-slate-100"
                  />
                  {col[0].items.length >= 2 && (
                    <label
                      onClick={() => handleDeleteItem(index)}
                      className="border-1 border-red-500 p-2 rounded-md fill-red-500 hover:fill-red-300 hover:border-red-300 duration-300 w-fit cursor-pointer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        x="0px"
                        y="0px"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                      >
                        <path d="M 10 2 L 9 3 L 4 3 L 4 5 L 7 5 L 17 5 L 20 5 L 20 3 L 15 3 L 14 2 L 10 2 z M 5 7 L 5 22 L 19 22 L 19 7 L 5 7 z"></path>
                      </svg>
                    </label>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddItem}
                className="sticky bottom-0 px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 duration-300 cursor-pointer hover:scale-95"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-evenly w-full h-fit">
        <button
          type="submit"
          className="border-2 border-gray-400 text-black font-semibold px-4 py-2 rounded cursor-pointer hover:bg-green-500 hover:border-green-500 hover:text-white font-semibold duration-300"
        >
          Save Column
        </button>

        <button
          type="button"
          onClick={() => clearEditColumn()}
          className="border-2 border-gray-400 text-black font-semibold px-4 py-2 rounded cursor-pointer hover:bg-red-500 hover:border-red-500 hover:text-white font-semibold duration-300"
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
