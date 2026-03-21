"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/app/Chat/AuthContext";
import Link from "next/link";
import BreadCrumb from "@/app/component/breadcrumb";
import TimerSettingsModal from "./component/TimeSetter";
import { IoIosTimer } from "react-icons/io";
import { MdFormatListBulletedAdd } from "react-icons/md";

// ── Firestore service ─────────────────────────────────────────────────────────
import {
  type FaqItem,
  subscribeToFaqs,
  addFaq,
  updateFaq,
  deleteFaq,
  setFaqTimer,
  seedFaqs,
} from "@/lib/firebase/firebase.actions.firestore/faqFirestore";

// NOTE: Import your faq.json only for the one-time seed button:
import faqData from "@/lib/json/faq.json";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatTime = (totalSeconds: number): string => {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ── Component ─────────────────────────────────────────────────────────────────

const FAQ = () => {
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Pick<FaqItem, "topic" | "details">>({ topic: "", details: "" });

  const [globalTimerDuration, setGlobalTimerDuration] = useState(300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [message, setMessage] = useState("");

  const [newFaqFormData, setNewFaqFormData] = useState<Pick<FaqItem, "topic" | "details">>({ topic: "", details: "" });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null);
  const [openMenuIndex, setOpenMenuIndex] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showMessage = (msg: string, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), duration);
  };

  // ── Firestore real-time subscription ──────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToFaqs((liveFaqs) => {
      setFaqs(liveFaqs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Load global timer duration from localStorage ───────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("globalTimerDuration");
    if (saved) setGlobalTimerDuration(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    localStorage.setItem("globalTimerDuration", globalTimerDuration.toString());
  }, [globalTimerDuration]);

  // ── Clock + expired timer cleanup ─────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());

      // Reset expired timers in Firestore
      faqs.forEach((faq) => {
        if (faq.timerStartTime !== null && faq.timerStartTime !== undefined && faq.id) {
          const elapsed = (Date.now() - faq.timerStartTime) / 1000;
          if (globalTimerDuration - elapsed <= 0) {
            setFaqTimer(faq.id, null).catch(console.error);
          }
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [faqs, globalTimerDuration]);

  // ── Outside click for menu ─────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Copy + start timer ─────────────────────────────────────────────────────
  const copyToClipboard = useCallback(
    async (faq: FaqItem) => {
      if (!faq.id) return;

      const elapsed = faq.timerStartTime ? (currentTime - faq.timerStartTime) / 1000 : 0;
      const remaining = globalTimerDuration - elapsed;

      if (faq.timerStartTime !== null && remaining > 0) {
        showMessage(`Copying disabled. Timer active for "${faq.topic}". Remaining: ${Math.ceil(remaining)}s`);
        return;
      }

      try {
        await navigator.clipboard.writeText(faq.details);
        showMessage("Details copied to clipboard!");
      } catch {
        showMessage("Failed to copy to clipboard.");
        return;
      }

      // Start timer
      if (!faq.timerStartTime) {
        await setFaqTimer(faq.id, Date.now());
        showMessage(`Timer started for "${faq.topic}".`);
      }
    },
    [currentTime, globalTimerDuration]
  );

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEditClick = useCallback((faq: FaqItem) => {
    if (!faq.id) return;
    setEditingCard(faq.id);
    setEditFormData({ topic: faq.topic, details: faq.details });
    setOpenMenuIndex(null);
  }, []);

  const handleSaveClick = useCallback(
    async (id: string) => {
      try {
        await updateFaq(id, {
          topic: editFormData.topic.trim(),
          details: editFormData.details.trim(),
        });
        setEditingCard(null);
        showMessage("Changes saved successfully!");
      } catch (e) {
        console.error(e);
        showMessage("Failed to save changes.");
      }
    },
    [editFormData]
  );

  // ── Reset timer ────────────────────────────────────────────────────────────
  const handleResetTimer = useCallback(async (faq: FaqItem) => {
    if (!faq.id) return;
    try {
      await setFaqTimer(faq.id, null);
      showMessage(`Timer reset for "${faq.topic}".`);
    } catch (e) {
      console.error(e);
      showMessage("Failed to reset timer.");
    }
  }, []);

  // ── Add ────────────────────────────────────────────────────────────────────
  const handleAddFaq = useCallback(async () => {
    if (!newFaqFormData.topic.trim() || !newFaqFormData.details.trim()) {
      showMessage("Topic and Details cannot be empty.");
      return;
    }
    try {
      await addFaq({ ...newFaqFormData, timerStartTime: null });
      setNewFaqFormData({ topic: "", details: "" });
      setIsAddModalOpen(false);
      showMessage("New FAQ added successfully!");
    } catch (e) {
      console.error(e);
      showMessage("Failed to add FAQ.");
    }
  }, [newFaqFormData]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = useCallback(async () => {
    if (!faqToDelete) return;
    try {
      await deleteFaq(faqToDelete);
      showMessage("FAQ deleted successfully!");
      setIsDeleteModalOpen(false);
      setFaqToDelete(null);
    } catch (e) {
      console.error(e);
      showMessage("Failed to delete FAQ.");
    }
  }, [faqToDelete]);

  // ── Seed (one-time migration) ──────────────────────────────────────────────
  // const handleSeedFaqs = useCallback(async () => {
  //   if (!confirm("Seed Firestore with faq.json? This adds all entries without checking duplicates.")) return;
  //   try {
  //     await seedFaqs(faqData as any);
  //     showMessage("Firestore seeded successfully!");
  //   } catch (e) {
  //     console.error(e);
  //     showMessage("Seed failed. Check console.");
  //   }
  // }, []);

  // ── Timer modal ────────────────────────────────────────────────────────────
  const handleApplyTimer = useCallback(() => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    if (h < 0 || m < 0 || s < 0 || m > 59 || s > 59) {
      showMessage("Invalid time values.");
      return;
    }
    setGlobalTimerDuration(h * 3600 + m * 60 + s);
    setIsModalOpen(false);
    showMessage(`Timer set to ${h}h ${m}m ${s}s.`);
  }, [hours, minutes, seconds]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filteredFaqs = useMemo(() => {
    if (!debouncedSearchQuery) return faqs;
    return faqs.filter((f) =>
      f.topic.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [faqs, debouncedSearchQuery]);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (!user || (user as any)?.canChat === false) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Link
          href="/"
          className="text-gray-600 dark:text-gray-400 text-center px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-md"
        >
          Please log in to access the FAQ.
        </Link>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-full p-8 flex flex-col items-center font-sans">
      <div className="max-w-4xl w-full h-full flex flex-col">
        <div><BreadCrumb /></div>

        <div className="flex items-center justify-between mb-6 mt-6">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">FAQ KKK</h1>
          <label className="text-2xl text-gray-700 dark:text-gray-300">
            {new Date(currentTime).toLocaleTimeString()}
          </label>
        </div>

        {/* Search Bar & Actions */}
        <div className="mb-8 w-full flex space-x-4">
          <input
            type="text"
            placeholder="Search for a topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
          />
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-green-700"
          >
            <MdFormatListBulletedAdd size={25} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-purple-700"
          >
            <IoIosTimer size={25} />
          </button>

          {/* One-time seed button — remove after first use */}
          {/* <button
            onClick={handleSeedFaqs}
            title="Seed Firestore from faq.json (one-time)"
            className="bg-yellow-500 text-white px-4 py-3 rounded-xl shadow-md hover:bg-yellow-600 text-xs font-bold"
          >
            SEED
          </button> */}
        </div>

        <TimerSettingsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          hours={hours}
          setHours={setHours}
          minutes={minutes}
          setMinutes={setMinutes}
          seconds={seconds}
          setSeconds={setSeconds}
          onApply={handleApplyTimer}
        />

        {/* Message Toast */}
        {message && (
          <div className="fixed top-5 right-5 z-50 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse">
            {message}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400 text-lg animate-pulse">Loading FAQs from Firestore…</p>
          </div>
        )}

        {/* FAQ Cards */}
        {!loading && (
          <div className="space-y-4 h-full overflow-y-auto pr-2">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => {
                const id = faq.id!;
                const elapsed = faq.timerStartTime ? (currentTime - faq.timerStartTime) / 1000 : 0;
                const remaining = globalTimerDuration - elapsed;
                const displayTime = formatTime(remaining);
                const canCopy = !faq.timerStartTime || remaining <= 0;
                const isEditing = editingCard === id;
                const isExpanded = expandedCard === id;

                return (
                  <div
                    key={id}
                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl overflow-hidden relative
                      ${canCopy ? "border-green-500 border-2" : "border-red-500 border-2"}`}
                  >
                    {/* Card Header */}
                    <div
                      className="flex justify-between items-center p-6 cursor-pointer select-none border-b border-gray-200 dark:border-gray-700"
                      onClick={() => setExpandedCard(isExpanded ? null : id)}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFormData.topic}
                          onChange={(e) => setEditFormData((p) => ({ ...p, topic: e.target.value }))}
                          className="text-xl font-bold text-gray-900 dark:text-white w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <h2
                          className={`text-xl font-bold flex flex-col truncate w-full
                            ${canCopy ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 cursor-not-allowed"}`}
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(faq); }}
                          title={canCopy ? "Click to copy & start timer" : `Timer active — ${Math.ceil(remaining)}s left`}
                        >
                          {faq.topic}
                          <span className={`text-md font-medium italic ${remaining <= 10 && !canCopy ? "text-red-500" : "text-blue-500"}`}>
                            Timer: {displayTime}
                          </span>
                        </h2>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2 relative" ref={menuRef}>
                        {isEditing ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveClick(id); }}
                            className="bg-green-500 text-white px-3 py-1 rounded-full text-sm hover:bg-green-600"
                          >
                            Save
                          </button>
                        ) : (
                          <>
                            {!canCopy && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleResetTimer(faq); }}
                                className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm hover:bg-yellow-600"
                              >
                                Reset Time
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenMenuIndex(openMenuIndex === id ? null : id); }}
                              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                              </svg>
                            </button>
                            {openMenuIndex === id && (
                              <div className="absolute right-20 z-20 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5">
                                <div className="py-1">
                                  <button
                                    onClick={() => handleEditClick(faq)}
                                    className="text-gray-700 dark:text-gray-300 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => { setFaqToDelete(id); setIsDeleteModalOpen(true); setOpenMenuIndex(null); }}
                                    className="text-gray-700 dark:text-gray-300 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        <svg
                          className={`w-6 h-6 text-gray-500 transform transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Details Dropdown */}
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? "max-h-96 opacity-100 p-6 pt-4" : "max-h-0 opacity-0"}`}>
                      {isEditing ? (
                        <textarea
                          value={editFormData.details}
                          onChange={(e) => setEditFormData((p) => ({ ...p, details: e.target.value }))}
                          rows={10}
                          className="w-full text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <pre className="select-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {faq.details}
                        </pre>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
                {`No results found for "${searchQuery}".`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Add FAQ Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add New FAQ</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Topic"
                value={newFaqFormData.topic}
                onChange={(e) => setNewFaqFormData((p) => ({ ...p, topic: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Details"
                value={newFaqFormData.details}
                onChange={(e) => setNewFaqFormData((p) => ({ ...p, details: e.target.value }))}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
              <div className="flex justify-end space-x-2">
                <button onClick={() => { setIsAddModalOpen(false); setNewFaqFormData({ topic: "", details: "" }); }}
                  className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600">
                  Cancel
                </button>
                <button onClick={handleAddFaq}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700">
                  Add FAQ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && faqToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-sm mx-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Delete FAQ</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>{faqs.find((f) => f.id === faqToDelete)?.topic}</strong>?
            </p>
            <div className="flex justify-center space-x-4">
              <button onClick={() => { setIsDeleteModalOpen(false); setFaqToDelete(null); }}
                className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQ;