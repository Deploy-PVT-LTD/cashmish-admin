import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import { Send, User as UserIcon, Loader2, MessageSquare, CheckCircle2, Trash2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL, chatApi } from '@/lib/api';

// Derive SOCKET_URL from API_BASE_URL by removing the trailing '/api'
const SOCKET_URL = API_BASE_URL ? API_BASE_URL.replace(/\/api\/?$/, '') : 'http://192.168.1.184:5000';

export default function SupportChats() {
    const [socket, setSocket] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, sessionId: null });
    const messagesEndRef = useRef(null);

    // Initialize Socket.io connection
    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        setSocket(newSocket);

        // Fetch initial active sessions
        const fetchSessions = async () => {
            try {
                const data = await chatApi.getSessions();
                setSessions(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching chat sessions:', error);
                toast.error('Failed to load chat history');
                setLoading(false);
            }
        };

        fetchSessions();

        newSocket.on('connect', () => {
            newSocket.emit('join_admin_dashboard');
        });

        newSocket.on('receive_message_admin', ({ sessionId, message, session }) => {
            // Update session list
            setSessions((prev) => {
                const existing = prev.find((s) => s.sessionId === sessionId);
                if (existing) {
                    return prev.map((s) => (s.sessionId === sessionId ? session : s)).sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
                } else {
                    return [session, ...prev];
                }
            });

            // Update active chat window if matching
            setActiveSession((currActive) => {
                if (currActive?.sessionId === sessionId) {
                    setMessages((prevMsgs) => [...prevMsgs, message]);
                }
                return currActive;
            });

            // Notify Admin
            toast.info(`New message from ${sessionId.substring(0, 6)}...`);
        });

        return () => newSocket.disconnect();
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSelectSession = (session) => {
        setActiveSession(session);
        setMessages(session.messages || []);
        // Join that specific room if we want to get granular, but dashboard room handles it
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputValue.trim() || !activeSession || !socket) return;

        const newReply = { sender: 'admin', text: inputValue, timestamp: new Date().toISOString() };

        // Emit reply
        socket.emit('admin_reply', { sessionId: activeSession.sessionId, text: inputValue });

        // Optimistically UI update
        setMessages((prev) => [...prev, newReply]);

        // Update session list active time
        setSessions(prev => prev.map(s => {
            if (s.sessionId === activeSession.sessionId) {
                return { ...s, messages: [...s.messages, newReply], lastActive: new Date().toISOString() };
            }
            return s;
        }).sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive)));

        setInputValue('');
    };

    const handleDeleteSession = (sessionId) => {
        setConfirmDialog({ isOpen: true, type: 'delete', sessionId });
    };

    const handleResolveSession = (sessionId) => {
        setConfirmDialog({ isOpen: true, type: 'resolve', sessionId });
    };

    const handleConfirmAction = async () => {
        const { type, sessionId } = confirmDialog;
        if (!sessionId) return;

        setConfirmDialog({ isOpen: false, type: null, sessionId: null });

        if (type === 'delete') {
            try {
                await chatApi.deleteSession(sessionId);
                socket?.emit('admin_action', { sessionId, action: 'deleted' });
                setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
                if (activeSession?.sessionId === sessionId) {
                    setActiveSession(null);
                    setMessages([]);
                }
                toast.success('Chat deleted successfully');
            } catch (error) {
                toast.error('Failed to delete chat');
                console.error(error);
            }
        } else if (type === 'resolve') {
            try {
                await chatApi.resolveSession(sessionId);
                socket?.emit('admin_action', { sessionId, action: 'resolved' });
                setSessions(prev => prev.map(s => s.sessionId === sessionId ? { ...s, status: 'closed' } : s));
                if (activeSession?.sessionId === sessionId) {
                    setActiveSession({ ...activeSession, status: 'closed' });
                }
                toast.success('Chat marked as resolved');
            } catch (error) {
                toast.error('Failed to resolve chat');
                console.error(error);
            }
        }
    };

    return (
        <AdminLayout title="Support Chats" subtitle="Real-time live customer support">
            <div className="flex h-[calc(100vh-140px)] w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

                {/* Left Sidebar: Sessions List */}
                <div className="w-1/3 min-w-[300px] max-w-[400px] border-r border-gray-100 flex flex-col bg-gray-50/50">
                    <div className="p-4 border-b border-gray-100 bg-white">
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Active Conversations
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-sm">Loading chats...</p>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                                <MessageSquare className="w-12 h-12 mb-4 text-gray-300" />
                                <p>No active conversations found.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {sessions.map((session) => {
                                    const lastMessage = session.messages[session.messages.length - 1];
                                    const isActive = activeSession?.sessionId === session.sessionId;

                                    return (
                                        <button
                                            key={session.sessionId}
                                            onClick={() => handleSelectSession(session)}
                                            className={`flex items-start gap-4 p-4 pr-6 w-full text-left transition-all border-l-4 ${isActive
                                                ? 'bg-primary/5 border-primary shadow-inner shadow-primary/5'
                                                : 'bg-transparent border-transparent hover:bg-white cursor-pointer'
                                                } border-b border-gray-50`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                                                <UserIcon className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-medium text-sm text-gray-900 truncate">
                                                        {session.userName ? session.userName : `Guest-${session.sessionId.substring(0, 5)}`}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                        {format(new Date(session.lastActive), 'pp')}
                                                    </span>
                                                </div>
                                                <p className={`text-xs truncate ${lastMessage?.sender === 'user' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                                    {lastMessage?.sender === 'admin' ? 'You: ' : ''}{lastMessage?.text || 'No messages'}
                                                </p>
                                                {session.status === 'closed' && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200 mt-1 inline-block">Resolved</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Area: Chat Window */}
                <div className="flex-1 flex flex-col bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/30">
                    {activeSession ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 px-6 border-b border-gray-100 bg-white/80 backdrop-blur-md flex items-center justify-between shadow-sm z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm">
                                        <UserIcon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 leading-tight">
                                            {activeSession.userName ? activeSession.userName : `Guest-${activeSession.sessionId.substring(0, 5)}`}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            Online now
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {activeSession.status !== 'closed' && (
                                        <button
                                            onClick={() => handleResolveSession(activeSession.sessionId)}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                                            title="Mark as Resolved"
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteSession(activeSession.sessionId)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        title="Delete Chat"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {activeSession.status === 'closed' && (
                                <div className="bg-gray-50 border-b border-gray-100 py-2 px-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                                    <AlertCircle className="w-4 h-4" />
                                    This conversation has been resolved and closed.
                                </div>
                            )}

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
                                {messages.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center text-gray-400">No messages yet.</div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isAdmin = msg.sender === 'admin';
                                        return (
                                            <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                                <div className="flex flex-col max-w-[70%]">
                                                    <div
                                                        className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${isAdmin
                                                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                                                            }`}
                                                    >
                                                        {msg.text}
                                                    </div>
                                                    <div className={`text-[10px] mt-1.5 text-gray-400 flex items-center gap-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                        {format(new Date(msg.timestamp || Date.now()), 'p')}
                                                        {isAdmin && <CheckCircle2 className="w-3 h-3 text-primary/70" />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 bg-white border-t border-gray-100 z-10">
                                <form onSubmit={handleSendMessage} className="flex gap-3 relative max-w-4xl mx-auto">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Type your reply to the customer..."
                                        className="flex-1 pl-5 pr-14 py-3.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputValue.trim() || activeSession.status === 'closed'}
                                        className="absolute right-2 top-1.5 bottom-1.5 aspect-square bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
                                    >
                                        <Send className="w-4 h-4 ml-0.5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <MessageSquare className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">Support Dashboard</h3>
                            <p className="max-w-xs text-center">Select a conversation from the sidebar to start chatting with customers.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal overlay */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 m-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-full ${confirmDialog.type === 'delete' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {confirmDialog.type === 'delete' ? <Trash2 className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 border-none m-0 p-0">
                                {confirmDialog.type === 'delete' ? 'Delete Conversation?' : 'Resolve Conversation?'}
                            </h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            {confirmDialog.type === 'delete'
                                ? 'Are you sure you want to permanently delete this chat? The user will be disconnected and all history will be lost.'
                                : 'Are you sure you want to mark this conversation as resolved? The chat will be closed for the user.'}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmDialog({ isOpen: false, type: null, sessionId: null })}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer shadow-sm ${confirmDialog.type === 'delete' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                                    }`}
                            >
                                {confirmDialog.type === 'delete' ? 'Delete' : 'Resolve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e5e7eb;
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
        }
      `}} />
        </AdminLayout >
    );
}
