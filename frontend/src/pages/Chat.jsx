import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Chat = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Simple formatter to clean up AI markdown bullets like "* point" or "- point"
  const formatMessage = (text) => {
    if (!text) return '';
    return text
      .split('\n')
      .map((line) => line.replace(/^\s*[\*\-]\s+/, '').trimEnd())
      .join('\n')
      .trim();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load previous chat history for this user when page opens
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/api/chat/history');
        setMessages(res.data.messages || []);
      } catch (e) {
        // Do not block UI if history fails
        console.error('Failed to load chat history', e);
      }
    };
    loadHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setError('');

    const userMessage = { role: 'user', content: message, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/api/chat', {
        message,
        locale: i18n.language
      });
      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const fallback =
        err.response?.data?.response ||
        'Sorry, I encountered an error. Please try again.';
      setError(err.response?.data?.message || '');
      const errorMessage = {
        role: 'assistant',
        content: fallback,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('chat.title')}</h1>
      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length === 0 && !loading && (
            <div className="text-center text-gray-500 mt-8">
              <p>Start a conversation with the AI assistant</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                }`}
              >
                {formatMessage(msg.content)}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 px-4 py-2 rounded-2xl border border-gray-200 text-sm">
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="border-t bg-white p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('chat.placeholder')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 text-white px-6 py-2 rounded-full hover:bg-primary-700 disabled:opacity-50"
            >
              {t('chat.send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;

