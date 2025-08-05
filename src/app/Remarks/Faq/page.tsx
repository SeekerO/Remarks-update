"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import faqData from '@/lib/json/faq.json';
import BreadCrumb from '@/app/component/breadcrumb';

// Define the type for a single FAQ item
interface FaqItem {
  topic: string;
  details: string;
  timerStartTime?: number | null; // Timestamp when the timer started (ms)
}

// Helper function to format seconds into HH:MM:SS
const formatTime = (totalSeconds: number): string => {
  if (totalSeconds < 0) totalSeconds = 0; // Ensure no negative time

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (num: number) => String(num).padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

// Helper function to parse HH:MM:SS string into seconds
const parseTimeToSeconds = (timeString: string): number => {
  const parts = timeString.split(':').map(Number);
  let totalSeconds = 0;
  if (parts.length === 3) {
    totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    totalSeconds = parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    totalSeconds = parts[0];
  }
  return isNaN(totalSeconds) ? 0 : totalSeconds;
};

const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState<any>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to clear the timeout if value or delay changes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Re-run effect if value or delay changes

  return debouncedValue;
};
// Main App component
const FAQ = () => {
  // State for the FAQ data, initialized from localStorage or the default data
  const [faqs, setFaqs] = useState<FaqItem[]>(faqData as FaqItem[]);
  // State for the raw search query input
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Debounced search query for efficient filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce by 300ms
  // State to track which card is expanded (index or null)
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  // State to track which card is in edit mode (index or null)
  const [editingCard, setEditingCard] = useState<number | null>(null);
  // State for the form data when a card is being edited
  const [editFormData, setEditFormData] = useState<FaqItem>({ topic: '', details: '' });
  // State for message box
  const [message, setMessage] = useState<string>('');

  // New state for global timer duration (in seconds)
  const [globalTimerDuration, setGlobalTimerDuration] = useState<number>(300); // Default to 5 minutes
  const [globalTimerInput, setGlobalTimerInput] = useState<string>(formatTime(300)); // Input field value

  // State to force re-render for timer updates (only for display)
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // State for new FAQ form
  const [newFaqFormData, setNewFaqFormData] = useState<FaqItem>({ topic: '', details: '' });

  // State to manage the visibility of the Add FAQ modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  // State to manage the visibility of the Delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  // State to store the index of the FAQ to be deleted
  const [faqToDelete, setFaqToDelete] = useState<number | null>(null);

  // New state to manage the open state of the three-dot menu for each card
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  // Reference for the menu container to detect outside clicks
  const menuRef = useRef<HTMLDivElement>(null);


  // Effect to load data and global timer from local storage on component mount
  useEffect(() => {
    try {
      const savedFaqs = localStorage.getItem('faqData');
      if (savedFaqs) {
        setFaqs(JSON.parse(savedFaqs));
      }
      const savedTimerDuration = localStorage.getItem('globalTimerDuration');
      if (savedTimerDuration) {
        const duration = parseInt(savedTimerDuration, 10);
        setGlobalTimerDuration(duration);
        setGlobalTimerInput(formatTime(duration));
      }
    } catch (e) {
      console.error("Failed to load data from local storage", e);
      setMessage('Failed to load saved data.');
      setTimeout(() => setMessage(''), 3000);
    }
  }, []);

  // Effect to save FAQ data to local storage whenever `faqs` state changes
  useEffect(() => {
    try {
      localStorage.setItem('faqData', JSON.stringify(faqs));
    } catch (e) {
      console.error("Failed to save FAQs to local storage", e);
    }
  }, [faqs]);

  // Effect to save global timer duration to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('globalTimerDuration', globalTimerDuration.toString());
    } catch (e) {
      console.error("Failed to save global timer duration to local storage", e);
    }
  }, [globalTimerDuration]);

  // Effect to update current time every second and manage expired timers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());

      setFaqs(prevFaqs => {
        let changed = false;
        const updatedFaqs = prevFaqs.map(faq => {
          if (typeof faq.timerStartTime === 'number' && faq.timerStartTime !== null) {
            const elapsedTime = (Date.now() - faq.timerStartTime) / 1000;
            const remainingTime = globalTimerDuration - elapsedTime;

            // If timer expired, reset timerStartTime to null
            if (remainingTime <= 0 && faq.timerStartTime !== null) {
              changed = true;
              return { ...faq, timerStartTime: null };
            }
          }
          return faq;
        });
        // Only return new array if a change occurred to prevent unnecessary re-renders
        return changed ? updatedFaqs : prevFaqs;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, [globalTimerDuration]);


  // Function to copy text to clipboard
  const copyToClipboard = useCallback((text: string, topicToFind: string): void => {
    // Find the FAQ item in the ORIGINAL array based on the topic
    const faqToUpdateIndex = faqs.findIndex((faq) => faq.topic === topicToFind);

    if (faqToUpdateIndex === -1) {
      // This should ideally not happen if topicToFind comes from an existing FAQ
      console.error('FAQ topic not found:', topicToFind);
      setMessage('Error: Topic not found.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const faqToUpdate = faqs[faqToUpdateIndex];

    const elapsedTime = faqToUpdate.timerStartTime ? (currentTime - faqToUpdate.timerStartTime) / 1000 : 0;
    const remainingTime = globalTimerDuration - elapsedTime;

    if (remainingTime > 0 && faqToUpdate.timerStartTime !== null) {
      setMessage(`Copying is disabled while the timer is active for "${faqToUpdate.topic}". Remaining: ${Math.ceil(remainingTime)}s`);
      setTimeout(() => setMessage(''), 3000);
      return; // Prevent copy action
    }

    const copyText = async (t: string): Promise<void> => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(t);
          setMessage('Details copied to clipboard!');
        } else {
          // Fallback for older browsers
          const textarea = document.createElement('textarea');
          textarea.value = t;
          textarea.style.position = 'fixed';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          setMessage('Details copied to clipboard!');
        }
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        console.error('Failed to copy:', err);
        setMessage('Failed to copy to clipboard.');
        setTimeout(() => setMessage(''), 3000);
      }
    };

    copyText(text);

    // Start timer only if it's not already running for this specific topic
    if (faqToUpdate.timerStartTime === null) {
      setFaqs(prevFaqs => {
        const newFaqs = [...prevFaqs];
        // Update the specific FAQ item using its found index
        newFaqs[faqToUpdateIndex] = { ...newFaqs[faqToUpdateIndex], timerStartTime: Date.now() };
        return newFaqs;
      });
      setMessage(`Timer started for "${faqToUpdate.topic}". Copying disabled until timer expires.`);
      setTimeout(() => setMessage(''), 3000);
    }

  }, [faqs, globalTimerDuration, currentTime]); // Dependencies for useCallback


  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  }, []);

  // Handle global timer input change
  const handleGlobalTimerInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setGlobalTimerInput(e.target.value);
  }, []);

  // Apply global timer duration
  const applyGlobalTimer = useCallback((): void => {
    const newDuration = parseTimeToSeconds(globalTimerInput);
    if (!isNaN(newDuration) && newDuration >= 0) {
      setGlobalTimerDuration(newDuration);
      setMessage(`Timer set to ${formatTime(newDuration)} for all cards.`);
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Invalid time format. Please use HH:MM:SS or MM:SS or SSS.');
      setTimeout(() => setMessage(''), 3000);
    }
  }, [globalTimerInput]);

  // Handle expand/collapse logic ONLY
  const handleToggleDetails = useCallback((index: number): void => {
    setExpandedCard(prevExpanded => (prevExpanded === index ? null : index));
  }, []);

  // Handle edit button click
  const handleEditClick = useCallback((faq: FaqItem, index: number): void => {
    setEditingCard(index);
    setEditFormData({ topic: faq.topic, details: faq.details });
    setOpenMenuIndex(null); // Close menu after clicking
  }, []);

  // Handle form data change during editing
  const handleEditFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Handle save button click
  const handleSaveClick = useCallback((index: number): void => {
    setFaqs(prevFaqs => {
      const updatedFaqs = [...prevFaqs];
      updatedFaqs[index] = { ...updatedFaqs[index], topic: editFormData.topic, details: editFormData.details };
      return updatedFaqs;
    });
    setEditingCard(null);
    setEditFormData({ topic: '', details: '' });
    setMessage('Changes saved successfully!');
    setTimeout(() => setMessage(''), 3000);
  }, [editFormData]);

  // Handle reset timer click for a specific card
  const handleResetTimer = useCallback((index: number): void => {
    setFaqs(prevFaqs => {
      const newFaqs = [...prevFaqs];
      newFaqs[index] = { ...newFaqs[index], timerStartTime: null }; // Reset timer for this card
      return newFaqs;
    });
    setMessage(`Timer for "${faqs[index].topic}" reset. Copying re-enabled.`);
    setTimeout(() => setMessage(''), 3000);
  }, [faqs]);

  // Handle new FAQ form data change
  const handleNewFaqFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setNewFaqFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Handle adding a new FAQ
  const handleAddFaq = useCallback(() => {
    if (newFaqFormData.topic.trim() === '' || newFaqFormData.details.trim() === '') {
      setMessage('Topic and Details cannot be empty.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setFaqs(prevFaqs => [
      ...prevFaqs,
      { ...newFaqFormData, timerStartTime: null } // New FAQs start with no active timer
    ]);
    setNewFaqFormData({ topic: '', details: '' }); // Clear the form
    setMessage('New FAQ added successfully!');
    setTimeout(() => setMessage(''), 3000);
    setIsAddModalOpen(false); // Close the modal after adding
  }, [newFaqFormData]);


  // Handle opening the Add FAQ modal
  const handleOpenAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  // Handle closing the Add FAQ modal
  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setNewFaqFormData({ topic: '', details: '' }); // Reset form when closing
  }, []);

  // Handle opening the Delete confirmation modal
  const handleOpenDeleteModal = useCallback((index: number) => {
    setFaqToDelete(index);
    setIsDeleteModalOpen(true);
    setOpenMenuIndex(null); // Close menu after clicking
  }, []);

  // Handle closing the Delete confirmation modal
  const handleCloseDeleteModal = useCallback(() => {
    setFaqToDelete(null);
    setIsDeleteModalOpen(false);
  }, []);

  // Handle deleting an FAQ after confirmation
  const confirmDelete = useCallback(() => {
    if (faqToDelete !== null) {
      setFaqs(prevFaqs => {
        const newFaqs = prevFaqs.filter((_, i) => i !== faqToDelete);
        return newFaqs;
      });
      setMessage('FAQ deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
      handleCloseDeleteModal(); // Close the modal
    }
  }, [faqToDelete, handleCloseDeleteModal]);

  // Handle opening/closing the three-dot menu
  const handleMenuToggle = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the parent card's onClick from firing
    setOpenMenuIndex(openMenuIndex === index ? null : index);
  }, [openMenuIndex]);

  // Close the menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);


  // Filter the FAQs based on the debounced search query
  const filteredFaqs = useMemo(() => {
    if (!debouncedSearchQuery) {
      return faqs;
    }
    return faqs.filter((faq) =>
      faq.topic.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [faqs, debouncedSearchQuery]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 flex flex-col items-center font-sans">
      <div className="max-w-4xl w-full">
        {/* Title and Breadcrumb */}
        <div>
          <BreadCrumb />
        </div>

        <div className='flex items-center justify-between mb-6 mt-6'>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center">FAQ KKK</h1>
          <label className='text-2xl text-gray-700 dark:text-gray-300'>
            Current Time: {new Date(currentTime).toLocaleTimeString()}
          </label>
        </div>

        {/* Global Timer Setting */}
        <div className="mb-8 w-full flex items-center space-x-4">
          <input
            type="text"
            placeholder="Set timer (HH:MM:SS)"
            value={globalTimerInput}
            onChange={handleGlobalTimerInputChange}
            className="flex-grow px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
          />
          <button
            onClick={applyGlobalTimer}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
          >
            Apply Timer
          </button>
        </div>

        {/* Search Bar & Add FAQ Button */}
        <div className="mb-8 w-full flex space-x-4">
          <input
            type="text"
            placeholder="Search for a topic..."
            value={searchQuery} // Bind to raw searchQuery
            onChange={handleSearchChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
          />
          <button
            onClick={handleOpenAddModal}
            className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
          >
            Add
          </button>
        </div>

        {/* Message Box */}
        {message && (
          <div className="fixed top-5 right-5 z-50 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse">
            {message}
          </div>
        )}

        {/* FAQ Cards */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => {
              const elapsedTime = faq.timerStartTime ? (currentTime - faq.timerStartTime) / 1000 : 0; // in seconds
              const remainingTime = globalTimerDuration - elapsedTime;
              const displayTime = formatTime(remainingTime);

              // Determine if copy button/action should be visually disabled or show tooltip
              const canCopyCurrent = faq.timerStartTime === null || undefined;

              return (
                <div
                  key={index}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl overflow-hidden relative 
                  ${canCopyCurrent ? "border-green-500 border-2" : "border-red-500 border-2"}
                  `}
                >
                  {/* Topic/Header Section */}
                  <div
                    className="flex justify-between items-center p-6 cursor-pointer select-none border-b border-gray-200 dark:border-gray-700"
                    onClick={() => handleToggleDetails(index)}
                  >
                    {editingCard === index ? (
                      <input
                        type="text"
                        name="topic"
                        value={editFormData.topic}
                        onChange={handleEditFormChange}
                        className={`text-xl font-bold text-gray-900 dark:text-white w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 `}
                      />
                    ) : (
                      <h2
                        className={`text-xl font-bold flex flex-col truncate w-full ${canCopyCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent parent div's click from firing
                          copyToClipboard(faq.details, faq.topic); // This now attempts to copy and starts timer if allowed
                        }}
                        title={canCopyCurrent ? "Click to copy details and start timer" : "Copying disabled while timer is active"}
                      >
                        {faq.topic}
                        <span className={`text-md font-medium italic ${remainingTime <= 10 && !canCopyCurrent ? 'text-red-500' : 'text-blue-500'} dark:text-blue-400`}>
                          Timer: {displayTime}
                        </span>
                      </h2>
                    )}

                    <div className="flex items-center space-x-2 relative" ref={menuRef}>
                      {editingCard === index ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveClick(index);
                          }}
                          className="bg-green-500 text-white px-3 py-1 rounded-full text-sm hover:bg-green-600 transition-colors duration-200"
                        >
                          Save
                        </button>
                      ) : (
                        <>
                          {!canCopyCurrent && ( // Show reset button only if timer is active
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResetTimer(index);
                              }}
                              className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm hover:bg-yellow-600 transition-colors duration-200"
                            >
                              Reset Time
                            </button>
                          )}
                          <button
                            onClick={(e) => handleMenuToggle(index, e)}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
                            </svg>
                          </button>
                          {openMenuIndex === index && (
                            <div className="absolute right-20 z-20 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5">
                              <div className="py-1">
                                <button
                                  onClick={() => handleEditClick(faq, index)}
                                  className="text-gray-700 dark:text-gray-300 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => handleOpenDeleteModal(index)}
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
                        className={`w-6 h-6 text-gray-500 dark:text-gray-400 transform transition-transform duration-300 ${expandedCard === index ? 'rotate-180' : 'rotate-0'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>

                  {/* Details Section (Dropdown) */}
                  <div
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${expandedCard === index ? 'max-h-96 opacity-100 p-6 pt-0' : 'max-h-0 opacity-0'}`}
                  >
                    {editingCard === index ? (
                      <textarea
                        name="details"
                        value={editFormData.details}
                        onChange={handleEditFormChange}
                        rows={10}
                        className="w-full text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {faq.details}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-8">{`No results found for "${searchQuery}".`}</p>
          )}
        </div>
      </div>

      {/* Add New FAQ Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add New FAQ</h2>
            <div className="space-y-4">
              <input
                type="text"
                name="topic"
                placeholder="New Topic"
                value={newFaqFormData.topic}
                onChange={handleNewFaqFormChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
              />
              <textarea
                name="details"
                placeholder="New Details"
                value={newFaqFormData.details}
                onChange={handleNewFaqFormChange}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 resize-y"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCloseAddModal}
                  className="bg-gray-500 text-white px-6 py-3 rounded-xl shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFaq}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
                >
                  Add FAQ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && faqToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-sm mx-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Delete FAQ</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">Are you sure you want to delete the topic: **{faqs[faqToDelete]?.topic}**?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleCloseDeleteModal}
                className="bg-gray-500 text-white px-6 py-3 rounded-xl shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
              >
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
