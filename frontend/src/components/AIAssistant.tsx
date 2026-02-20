"use client";

import { useState, useRef, useEffect } from 'react';
import { authHeaders } from '../utils/api';

interface AIAssistantProps {
  formType: 'case' | 'maintenance' | 'appeal' | 'other';
  onSuggestionReceived?: (suggestion: string) => void;
}

export default function AIAssistant({ formType, onSuggestionReceived }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          messages: newMessages.map(msg => ({ role: msg.role as 'user' | 'model', content: msg.content })),
          formType
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.response;

      setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);
      
      if (onSuggestionReceived) {
        onSuggestionReceived(aiResponse);
      }
    } catch (error) {
      console.error('Error communicating with AI:', error);
      const errorMessage = "Sorry, I'm having trouble connecting to the AI service. Please try again later.";
      setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-96 h-[500px] flex flex-col border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-kmuGreen text-white p-4 rounded-t-xl flex justify-between items-center">
            <h3 className="font-semibold">AI Assistant</h3>
            <button 
              onClick={toggleAssistant}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              ✕
            </button>
          </div>

          {/* Disclaimer */}
          {showDisclaimer && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-3 text-xs border-b border-yellow-200 dark:border-yellow-800">
              <p className="font-semibold mb-1">Privacy Notice:</p>
              <p>Do not share sensitive personal information. This assistant helps with form completion only.</p>
              <button 
                onClick={() => setShowDisclaimer(false)}
                className="mt-1 text-xs underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[350px]">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <p className="mb-2">Ask me anything about filling out this form!</p>
                <p className="text-sm">I can help with understanding fields, requirements, and best practices.</p>
              </div>
            )}
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg max-w-[85%] ${
                  msg.role === 'user' 
                    ? 'bg-blue-100 dark:bg-blue-900/50 ml-auto' 
                    : 'bg-gray-100 dark:bg-gray-700 mr-auto'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            ))}
            {isLoading && (
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg max-w-[85%] mr-auto">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about form completion..."
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-l-lg p-2 text-sm resize-none h-12 focus:outline-none focus:ring-2 focus:ring-kmuGreen dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-kmuGreen text-white px-4 rounded-r-lg hover:bg-kmuOrange disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={toggleAssistant}
          className="bg-kmuGreen text-white p-4 rounded-full shadow-lg hover:bg-kmuOrange transition-transform transform hover:scale-105 flex items-center justify-center"
          aria-label="Open AI Assistant"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
    </div>
  );
}