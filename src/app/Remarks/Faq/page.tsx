"use client"

import React, { useState, useEffect, useCallback } from 'react';
import faqData from '@/lib/json/faq.json';
import BreadCrumb from '@/app/component/breadcrumb';

// Define the type for a single FAQ item
interface FaqItem {
  topic: string;
  details: string;
}

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

  // Effect to load data from local storage on component mount
  useEffect(() => {
    try {
      const savedFaqs = localStorage.getItem('faqData');
      if (savedFaqs) {
        setFaqs(JSON.parse(savedFaqs) as FaqItem[]);
      }
    } catch (e) {
      console.error("Failed to load FAQs from local storage", e);
    }
  }, []);

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

  // Function to copy text to clipboard
  const copyToClipboard = useCallback((text: string): void => {
    // A robust copy function that handles various environments
    const copyText = (t: string): void => {
      // Use modern clipboard API if available
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
        // Fallback for older browsers or restricted environments
        fallbackCopyText(t);
      }
    };

    const fallbackCopyText = (t: string): void => {
      const textarea = document.createElement('textarea');
      textarea.value = t;
      textarea.style.position = 'fixed'; // Avoid scrolling to bottom
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
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  // Handle expand/collapse logic
  const handleToggleDetails = (index: number): void => {
    if (expandedCard === index) {
      setExpandedCard(null);
    } else {
      setExpandedCard(index);
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
    updatedFaqs[index] = editFormData;
    setFaqs(updatedFaqs);
    setEditingCard(null);
    setEditFormData({ topic: '', details: '' });
    saveToLocalStorage(updatedFaqs);
  };

  // Filter the FAQs based on the search query
  const filteredFaqs = faqs.filter((faq) =>
    faq.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 flex flex-col items-center font-sans">
      <div className="max-w-4xl w-full">
        {/* Title */}
        <div>
          <BreadCrumb />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6 text-center">FAQ KKK</h1>

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
            filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl overflow-hidden"
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
                      className="text-xl font-bold text-gray-900 dark:text-white w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <h2
                      className="text-xl font-bold text-gray-900 dark:text-white"
                      onClick={(e) => {
                        // Prevent the dropdown from toggling when copying
                        e.stopPropagation();
                        copyToClipboard(faq.details);
                      }}
                    >
                      {faq.topic}
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(faq, index);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-600 transition-colors duration-200"
                      >
                        Edit
                      </button>
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
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No results found for "{searchQuery}".</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
