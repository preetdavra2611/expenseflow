import React, { useState, useRef, useEffect } from 'react';
import { telegramApi } from '../services/api';
import { X, Send, Bot, User as UserIcon, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

interface TelegramSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionCreated: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const TelegramSimulatorModal: React.FC<TelegramSimulatorModalProps> = ({
  isOpen,
  onClose,
  onTransactionCreated,
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `👋 *ExpenseTracker Bot is online!*\n\nSend any expense or income in natural language, or try a command like /summary, /today, /categories, /month.\n\n💡 *Example:* \`Spent 250 on dinner\``,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    'Spent 250 on dinner',
    '₹500 petrol',
    'Bought clothes for 1800 yesterday',
    '150 chai',
    'Spent 750 on groceries at Dmart',
    '₹120 Uber to college',
    'Paid 12000 rent',
    'Today I spent 350 on food and 200 on transport',
    'Got salary 35000',
    'Received 5000 from dad',
    '200 kharch kiye food pe',
    'aaj 500 petrol',
    'mom gave me 2000',
    '500',
    '/summary',
    '/today',
    '/categories',
    '/undo',
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || loading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user message
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: time,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await telegramApi.simulate(messageText);

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: res.reply || 'Processed successfully.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      onTransactionCreated();
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'bot',
        text: `❌ Error: ${err?.response?.data?.message || err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (p: string) => {
    handleSend(p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl h-[650px] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Telegram Bot Simulator
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </h3>
              <p className="text-[11px] text-slate-400">@ExpenseTrackerBot • Live AI & Regex NLP</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Sample Prompts Carousel */}
        <div className="p-2 px-4 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-500 shrink-0 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Test:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handlePromptClick(p)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-brand-600/20 hover:text-brand-300 hover:border-brand-500/40 whitespace-nowrap transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950/40">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div key={msg.id} className={`flex items-start gap-2.5 ${isBot ? '' : 'flex-row-reverse'}`}>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isBot ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-brand-600 text-white'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-md ${
                    isBot
                      ? 'bg-slate-800/90 border border-slate-700/60 text-slate-200 rounded-tl-sm'
                      : 'bg-brand-600 text-white rounded-tr-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                  <div
                    className={`mt-1.5 text-[10px] text-right ${
                      isBot ? 'text-slate-500' : 'text-brand-200'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
              <span>Bot is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Type an expense e.g. Spent 350 on dinner..."
            className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/60 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
