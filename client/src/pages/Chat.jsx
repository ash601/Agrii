import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, Bot, User as UserIcon, Loader2, PlusCircle, MessageSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Chat() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) loadMessages(activeSessionId);
    else setMessages([]);
  }, [activeSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      const res = await api.get('/chat/sessions');
      setSessions(res.data);
      if (res.data.length > 0 && !activeSessionId) {
        setActiveSessionId(res.data[0].id);
      }
      setLoading(false);
    } catch (err) {
      toast.error('Failed to load chat history');
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId) => {
    try {
      const res = await api.get(`/chat/sessions/${sessionId}/messages`);
      setMessages(res.data.messages || []);
    } catch (err) {
      toast.error('Failed to load messages');
    }
  };

  const createSession = async () => {
    try {
      const res = await api.post('/chat/sessions', { title: 'New Conversation' });
      setSessions([res.data, ...sessions]);
      setActiveSessionId(res.data.id);
      setMessages([]);
    } catch (err) {
      toast.error('Failed to create new chat');
    }
  };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/sessions/${id}`);
      setSessions(sessions.filter(s => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId(sessions[0]?.id !== id ? sessions[0]?.id : (sessions[1]?.id || null));
      }
      toast.success('Chat deleted');
    } catch (err) {
      toast.error('Failed to delete chat');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    let sessionId = activeSessionId;
    if (!sessionId) {
      // Create session first if none exists
      try {
        const res = await api.post('/chat/sessions', { title: input.substring(0, 30) });
        sessionId = res.data.id;
        setSessions([res.data, ...sessions]);
        setActiveSessionId(sessionId);
      } catch (err) {
        toast.error('Failed to start chat');
        return;
      }
    }

    const currentInput = input;
    setInput('');
    setSending(true);

    // Optimistically add user message
    const tempUserMsg = { id: Date.now().toString(), role: 'user', content: currentInput, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.post(`/chat/sessions/${sessionId}/messages`, { content: currentInput });
      // Update with exact response
      setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), res.data.userMessage, res.data.aiMessage]);
      loadSessions(); // refresh titles
    } catch (err) {
      toast.error('Failed to send message');
      // Rollback optimistic update
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      setInput(currentInput); 
    } finally {
      setSending(false);
    }
  };

  const suggestedQuestions = [
    "What's the current price of Wheat in Punjab?",
    `What are the best trading tips for a ${user?.role === 'FARMER' ? 'farmer' : 'buyer'}?`,
    "Which crop has the highest demand right now?",
    "How should I store tomatoes to prevent spoilage?"
  ];

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <div style={{ paddingBottom: '20px' }}>
        <h1 className="page-title">💬 AI Chat Assistant</h1>
        <p className="page-subtitle">Ask me anything about market prices, demand, or crop storage.</p>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '20px', minHeight: 0 }}>
        {/* Sidebar */}
        <div className="glass-card hidden-mobile" style={{ width: '280px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <button onClick={createSession} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <PlusCircle size={16} /> New Chat
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Loader2 className="animate-spin" size={24} color="var(--primary-light)" /></div>
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No past conversations.
              </div>
            ) : (
              sessions.map(session => (
                <div key={session.id} 
                  onClick={() => setActiveSessionId(session.id)}
                  style={{
                    padding: '12px', borderRadius: '10px', marginBottom: '4px', cursor: 'pointer',
                    background: activeSessionId === session.id ? 'rgba(5, 150, 105, 0.15)' : 'transparent',
                    border: activeSessionId === session.id ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid transparent',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  className={activeSessionId !== session.id ? 'hover-bg' : ''}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <MessageSquare size={14} color={activeSessionId === session.id ? 'var(--primary-light)' : 'var(--text-muted)'} />
                    <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: activeSessionId === session.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {session.title || 'New Conversation'}
                    </span>
                  </div>
                  <button onClick={(e) => deleteSession(session.id, e)} className="delete-btn" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.7 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Chat Header (mobile only ideally, but keeping it visible for UX) */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #059669, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>AgriTrade Assistant</div>
              <div style={{ fontSize: '11px', color: 'var(--primary-light)' }}>Online (Context: Live Mandi Data)</div>
            </div>
          </div>

          {/* Messages Container */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '400px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌾</div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', marginBottom: '8px' }}>Ask AgriTrade AI</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                  I have access to the latest price trends, weather data, and agricultural best practices.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {suggestedQuestions.map((q, idx) => (
                    <button key={idx} onClick={() => setInput(q)} 
                      style={{ 
                        padding: '10px 16px', background: 'var(--surface-alt)', border: '1px solid var(--border)', 
                        borderRadius: '12px', color: 'var(--text-primary)', fontSize: '13px', textAlign: 'left',
                        cursor: 'pointer', transition: 'border-color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-light)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isAI = msg.role === 'assistant';
                return (
                  <div key={msg.id || idx} style={{ display: 'flex', gap: '12px', flexDirection: isAI ? 'row' : 'row-reverse' }}>
                     <div style={{ 
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: isAI ? 'linear-gradient(135deg, #059669, #D97706)' : 'var(--surface-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                      }}>
                       {isAI ? <Bot size={18} color="white" /> : <UserIcon size={18} color="var(--text-secondary)" />}
                     </div>
                     <div style={{ 
                        maxWidth: '80%', padding: '14px 18px', borderRadius: '14px',
                        background: isAI ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-light)',
                        border: isAI ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border)',
                        color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.6,
                        borderTopLeftRadius: isAI ? 4 : 14,
                        borderTopRightRadius: isAI ? 14 : 4,
                     }}>
                       {/* Basic markdown parsing for bold and bullet points */}
                       {msg.content.split('\n').map((line, i) => {
                         if (line.startsWith('- ')) {
                           return <li key={i} style={{ marginLeft: '16px', marginBottom: '4px' }}>{renderBoldText(line.substring(2))}</li>;
                         } else if (line.trim() === '') {
                           return <br key={i} />;
                         }
                         return <p key={i} style={{ marginBottom: line.match(/^([#*_>])/)?'8px':'4px' }}>{renderBoldText(line)}</p>;
                       })}
                       <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', textAlign: isAI ? 'left' : 'right' }}>
                         {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </div>
                     </div>
                  </div>
                );
              })
            )}
            
            {sending && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #059669, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Bot size={18} color="white" />
                </div>
                <div style={{ padding: '14px 18px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div className="typing-dot" style={{ animationDelay: '0s' }}></div>
                  <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                  <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
            <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about prices, predictions, or storage..."
                className="input"
                style={{ flex: 1, padding: '14px 20px', borderRadius: '24px' }}
                disabled={sending}
              />
              <button type="submit" className="btn btn-primary" disabled={!input.trim() || sending} style={{ borderRadius: '24px', padding: '0 20px' }}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .hover-bg:hover { background: rgba(255, 255, 255, 0.05) !important; }
        .typing-dot { width: 6px; height: 6px; background: var(--primary-light); border-radius: 50%; animation: float 1s infinite alternate; }
        @media (max-width: 768px) {
          .page-container { padding: 10px; }
        }
      `}</style>
    </div>
  );
}

// Helper for basic markdown bold rendering
function renderBoldText(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--primary-light)' }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
