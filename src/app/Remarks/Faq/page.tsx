"use client"

import React, { useState, useEffect, useCallback } from 'react';
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

// Main App component
const App = () => {
  // State for the FAQ data, initialized from localStorage or the default data
  const [faqs, setFaqs] = useState<FaqItem[]>(faqData as FaqItem[]);
  // State for the search query
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  // State to force re-render for timer updates
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // New state to manage if copying is allowed for each card (index -> boolean)
  const [canCopy, setCanCopy] = useState<Record<number, boolean>>({});

  // Effect to load data and global timer from local storage on component mount
  useEffect(() => {
    try {
      const savedFaqs = localStorage.getItem('faqData');
      if (savedFaqs) {
        const loadedFaqs: FaqItem[] = JSON.parse(savedFaqs);
        setFaqs(loadedFaqs);
        // Initialize canCopy state for loaded FAQs
        const initialCanCopy: Record<number, boolean> = {};
        loadedFaqs.forEach((_, index) => {
          initialCanCopy[index] = true; // Assume can copy initially
        });
        setCanCopy(initialCanCopy);
      }
      const savedTimerDuration = localStorage.getItem('globalTimerDuration');
      if (savedTimerDuration) {
        const duration = parseInt(savedTimerDuration, 10);
        setGlobalTimerDuration(duration);
        setGlobalTimerInput(formatTime(duration));
      }
    } catch (e) {
      console.error("Failed to load data from local storage", e);
    }
  }, []);

  // Effect to update current time every second for timers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      // Also check timers and update canCopy state
      setFaqs(prevFaqs => {
        let changed = false;
        const updatedFaqs = prevFaqs.map((faq, index) => {
          // Ensure timerStartTime is a valid number before using it in calculations
          if (typeof faq.timerStartTime === 'number') {
            const elapsedTime = (Date.now() - faq.timerStartTime) / 1000;
            const remainingTime = globalTimerDuration - elapsedTime;
            // If timer was active and now expired, allow copying and reset timer
            if (remainingTime <= 0) { // Check if timer expired
              if (canCopy[index] === false) { // Only change state if it was previously false
                setCanCopy(prev => ({ ...prev, [index]: true }));
                changed = true;
              }
              // Reset the timer for this card
              if (faq.timerStartTime !== null) { // Ensure it's not already null to avoid unnecessary updates
                // Create a new faq object to trigger state update
                const newFaq = { ...faq, timerStartTime: null };
                changed = true;
                return newFaq;
              }
            }
          }
          return faq; // Return original faq if no changes for this item
        });
        return changed ? updatedFaqs : prevFaqs;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, [globalTimerDuration, canCopy]); // Depend on globalTimerDuration and canCopy

  // Function to save data to local storage
  const saveToLocalStorage = (data: FaqItem[]): void => {
    try {
      localStorage.setItem('faqData', JSON.stringify(data));
      setMessage('Changes saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      console.error("Failed to save FAQs to local storage", e);
      setMessage('Failed to save changes.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Function to save global timer duration to local storage
  const saveGlobalTimerDurationToLocalStorage = (duration: number): void => {
    try {
      localStorage.setItem('globalTimerDuration', duration.toString());
      setMessage('Global timer duration saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      console.error("Failed to save global timer duration to local storage", e);
      setMessage('Failed to save global timer duration.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Function to copy text to clipboard
  const copyToClipboard = useCallback((text: string, index: number): void => {
    if (!canCopy[index]) {
      setMessage('Copying is disabled while the timer is active for this topic.');
      setTimeout(() => setMessage(''), 3000);
      return; // Prevent copy action
    }

    const copyText = (t: string): void => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t)
          .then(() => {
            setMessage('Details copied to clipboard!');
            setTimeout(() => setMessage(''), 3000);
          })
          .catch(err => {
            console.error('Failed to copy using clipboard API:', err);
            fallbackCopyText(t);
          });
      } else {
        fallbackCopyText(t);
      }
    };

    const fallbackCopyText = (t: string): void => {
      const textarea = document.createElement('textarea');
      textarea.value = t;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        const success = document.execCommand('copy');
        if (success) {
          setMessage('Details copied to clipboard!');
        } else {
          setMessage('Failed to copy to clipboard.');
        }
      } catch (err) {
        console.error('Failed to copy using fallback:', err);
        setMessage('Failed to copy to clipboard.');
      }
      document.body.removeChild(textarea);
      setTimeout(() => setMessage(''), 3000);
    };

    copyText(text);
  }, [canCopy]); // Depend on canCopy state

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  // Handle global timer input change
  const handleGlobalTimerInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setGlobalTimerInput(e.target.value);
  };

  // Apply global timer duration
  const applyGlobalTimer = (): void => {
    const newDuration = parseTimeToSeconds(globalTimerInput);
    if (!isNaN(newDuration) && newDuration >= 0) {
      setGlobalTimerDuration(newDuration);
      saveGlobalTimerDurationToLocalStorage(newDuration);
      setMessage(`Timer set to ${formatTime(newDuration)} for all cards.`);
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Invalid time format. Please use HH:MM:SS or MM:SS or SSS.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Handle expand/collapse logic ONLY
  const handleToggleDetails = (index: number): void => {
    setExpandedCard(prevExpanded => (prevExpanded === index ? null : index));
  };

  // Handle click on the FAQ topic to start timer and copy
  console.log("Version 1.0.2")
  const handleTopicClick = (faq: FaqItem, index: number): void => {

    copyToClipboard(faq.details, index); // Attempt to copy first

    if (!faq.timerStartTime && canCopy[index]) {
      setFaqs(prevFaqs => {
        const newFaqs = [...prevFaqs];
        newFaqs[index] = { ...newFaqs[index], timerStartTime: Date.now() };
        return newFaqs;
      });
      setCanCopy(prev => ({ ...prev, [index]: false })); // Disable copying when timer start
      setMessage('Timer started. Copying disabled for this topic until timer expires.');
      setTimeout(() => setMessage(''), 3000);
    } else if (faq.timerStartTime) {
      setMessage('Timer is already active for this topic. Copying disabled.');
      setTimeout(() => setMessage(''), 3000);
    }
  };


  // Handle edit button click
  const handleEditClick = (faq: FaqItem, index: number): void => {
    setEditingCard(index);
    setEditFormData({ topic: faq.topic, details: faq.details });
  };

  // Handle form data change during editing
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save button click
  const handleSaveClick = (index: number): void => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index].topic = editFormData.topic;
    updatedFaqs[index].details = editFormData.details;
    setFaqs(updatedFaqs);
    setEditingCard(null);
    setEditFormData({ topic: '', details: '' });
    saveToLocalStorage(updatedFaqs);
  };

  // Handle reset timer click for a specific card
  const handleResetTimer = (index: number): void => {
    setFaqs(prevFaqs => {
      const newFaqs = [...prevFaqs];
      newFaqs[index] = { ...newFaqs[index], timerStartTime: null }; // Reset timer for this card
      return newFaqs;
    });
    setCanCopy(prev => ({ ...prev, [index]: true })); // Re-enable copying on reset
    setMessage(`Timer for "${faqs[index].topic}" reset. Copying re-enabled.`);
    setTimeout(() => setMessage(''), 3000);
  };

  // Filter the FAQs based on the search query
  const filteredFaqs = faqs.filter((faq) =>
    faq.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 flex flex-col items-center font-sans">
      <div className="max-w-4xl w-full">
        {/* Title and Breadcrumb */}
        <div>
          <BreadCrumb />
        </div>

        <div className='flex items-center justify-between mb-6'>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center">FAQ KKK</h1>
          {/* Global Timer Display - You can keep this as a general clock or remove if not needed */}
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

        {/* Search Bar */}
        <div className="mb-8 w-full">
          <input
            type="text"
            placeholder="Search for a topic..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
          />
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
              const currentCanCopy = canCopy[index] === undefined ? true : canCopy[index]; // Default to true if not set

              return (
                <div
                  key={index}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl overflow-hidden
                  ${faq.timerStartTime === null || faq?.timerStartTime === undefined ? "border-green-500 border-2" : "border-red-500 border-2"}
                  `}
                >
                  {/* Topic/Header Section */}
                  <div
                    className="flex justify-between items-center p-6 cursor-pointer select-none border-b border-gray-200 dark:border-gray-700"
                    onClick={() => handleToggleDetails(index)} // This now ONLY toggles expansion
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
                        className={`text-xl font-bold flex flex-col truncate overflow-hidden ${currentCanCopy ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent parent div's click from firing
                          handleTopicClick(faq, index); // This now starts timer and attempts to copy
                        }}
                        title={currentCanCopy ? "Click to copy details and start timer" : "Copying disabled while timer is active"}
                      >
                        {faq.topic}
                        <span className={`text-md font-medium italic ${remainingTime <= 10 ? 'text-red-500' : 'text-blue-500'} dark:text-blue-400`}>
                          Timer: {displayTime}
                        </span>
                      </h2>
                    )}

                    <div className="flex items-center space-x-2">
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
                          {faq.timerStartTime && (
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(faq, index);
                            }}
                            className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-600 transition-colors duration-200"
                          >
                            Edit
                          </button>
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
    </div>
  );
};

export default App;