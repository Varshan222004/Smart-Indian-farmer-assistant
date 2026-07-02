import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

// Inline style objects (all CSS inside this file)
const styles = {
  page: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px 16px',
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: '#111827',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 700,
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#4b5563',
    marginBottom: '16px',
  },
  subtitleExample: {
    fontWeight: 600,
    marginLeft: 4,
  },
  errorBox: {
    marginBottom: '12px',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #fecaca',
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    fontSize: '0.85rem',
  },
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '600px',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
  },
  chatWindow: {
    flex: 1,
    padding: '16px',
    backgroundColor: '#f9fafb',
    overflowY: 'auto',
  },
  emptyState: {
    textAlign: 'center',
    marginTop: '32px',
    color: '#6b7280',
  },
  emptyTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '4px',
  },
  emptyText: {
    fontSize: '0.9rem',
    marginBottom: '8px',
  },
  emptyList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: '0.8rem',
    color: '#9ca3af',
  },
  messageRow: {
    display: 'flex',
    marginBottom: '8px',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: '10px 14px',
    borderRadius: '16px',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  userBubble: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderBottomRightRadius: '4px',
  },
  assistantBubble: {
    backgroundColor: '#ffffff',
    color: '#111827',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
    borderBottomLeftRadius: '4px',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '9999px',
    border: '1px solid #d1d5db',
    backgroundColor: '#f9fafb',
    fontSize: '0.9rem',
    outline: 'none',
  },
  inputFocus: {
    boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.4)',
    borderColor: '#2563eb',
  },
  sendButton: {
    padding: '10px 20px',
    borderRadius: '9999px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  sendButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

const Market = () => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]); // {role: 'user' | 'assistant', content: string}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const [inputFocused, setInputFocused] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Just keep the text; Gemini backend should already format per Kg.
  const formatMessage = (text) => {
    if (!text) return '';
    return text.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to access market prices. Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }

    setError('');

    // Add user message
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      // Backend should call Gemini and send whatever Gemini replied as detailedMessage
      const response = await api.post('/api/market/chat', {
        message,
        query: message,
      });

      console.log('Market API response:', response.data);

      const detailedMessage =
        response.data.detailedMessage ||
        response.data.message ||
        'Market price information retrieved successfully.';

      const aiMessage = {
        role: 'assistant',
        content: detailedMessage, // ← show Gemini text as-is
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Market API error:', err);

      let errorMessage = 'Failed to fetch market prices';
      let detailedMessage = 'Sorry, I encountered an error. Please try again.';

      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMessage = 'Network Error';
        detailedMessage =
          'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Service Not Found';
        detailedMessage =
          'The market price service is temporarily unavailable. Please try again later or contact support.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication required';
        detailedMessage = 'Please login to access market prices.';
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (err.response?.status === 500) {
        errorMessage = 'Server Error';
        detailedMessage =
          err.response.data?.detailedMessage ||
          'An error occurred on the server. Please try again.';
      } else if (err.response?.data) {
        errorMessage =
          err.response.data.message || `Server Error: ${err.response.status}`;
        detailedMessage = err.response.data.detailedMessage || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
        detailedMessage = `Error: ${err.message}. Please try rephrasing your query.`;
      }

      setError(errorMessage);
      const errorMessageObj = {
        role: 'assistant',
        content: detailedMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessageObj]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>
        {t('market.title') || 'Market Price Assistant'}
      </h1>
      <p style={styles.subtitle}>
        Ask about real-time market prices{' '}
        <strong>(per Kg)</strong>. The reply will come directly from Gemini.
        <span style={styles.subtitleExample}>
          {' '}
          Example: "What is the price of tomato in Chennai?"
        </span>
      </p>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.chatContainer}>
        <div style={styles.chatWindow}>
          {messages.length === 0 && !loading && (
            <div style={styles.emptyState}>
              <p style={styles.emptyTitle}>💬 Market Price Assistant</p>
              <p style={styles.emptyText}>
                Ask me about market prices per Kg for any commodity and
                location!
              </p>
              <ul style={styles.emptyList}>
                <li>• Tomato price in Chennai</li>
                <li>• Rice price in Madurai</li>
                <li>• Onion price in Delhi</li>
              </ul>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                style={{
                  ...styles.messageRow,
                  ...(isUser
                    ? styles.messageRowUser
                    : styles.messageRowAssistant),
                }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    ...(isUser ? styles.userBubble : styles.assistantBubble),
                  }}
                >
                  {formatMessage(msg.content)}
                </div>
              </div>
            );
          })}

          {loading && (
            <div
              style={{
                ...styles.messageRow,
                ...styles.messageRowAssistant,
              }}
            >
              <div
                style={{
                  ...styles.messageBubble,
                  ...styles.assistantBubble,
                }}
              >
                🔍 Fetching real-time market prices...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} style={styles.inputRow}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about market prices per Kg... (e.g., 'Tomato price in Chennai')"
            style={{
              ...styles.input,
              ...(inputFocused ? styles.inputFocus : {}),
            }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            style={{
              ...styles.sendButton,
              ...((loading || !message.trim()) && styles.sendButtonDisabled),
            }}
          >
            {loading ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Market;
