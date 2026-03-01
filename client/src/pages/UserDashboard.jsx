import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Clock, CheckCircle, Package, Send, MessageSquare } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const UserDashboard = () => {
    const { user, logout } = useAuth();
    const socket = useSocket();
    const [complaints, setComplaints] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newComplaint, setNewComplaint] = useState({ title: '', description: '' });
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [chatLog, setChatLog] = useState([{ type: 'bot', text: 'Hello! I am your AI assistant. How can I help you today?' }]);

    useEffect(() => {
        fetchComplaints();

        if (socket) {
            socket.on('statusChanged', (data) => {
                fetchComplaints();
                alert(`Your complaint status has changed to: ${data.status}`);
            });
        }

        return () => socket?.off('statusChanged');
    }, [socket]);

    const fetchComplaints = async () => {
        try {
            const res = await api.get('/api/complaints');
            setComplaints(res.data.complaints);
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', newComplaint.title);
            formData.append('description', newComplaint.description);
            formData.append('image', image);

            await api.post('/api/complaints', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setShowModal(false);
            setNewComplaint({ title: '', description: '' });
            setImage(null);
            fetchComplaints();
        } catch (err) { alert(err.response?.data?.message || 'Submission failed'); }
        finally { setLoading(false); }
    };

    const handleChat = async (e) => {
        e.preventDefault();
        if (!chatMessage.trim()) return;

        const userMsg = { type: 'user', text: chatMessage };
        setChatLog([...chatLog, userMsg]);
        setChatMessage('');

        try {
            const res = await api.post('/api/ai/chat', { message: chatMessage });
            setChatLog(prev => [...prev, { type: 'bot', text: res.data.response }]);
        } catch (err) { console.error(err); }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1>Welcome, {user?.name}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Track and manage your service requests</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary"><Plus size={20} /> New Complaint</button>
                    <button onClick={logout} className="btn" style={{ background: '#eee' }}>Logout</button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                {/* Complaints Section */}
                <section>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {complaints.map(c => (
                            <div key={c._id} className="card animate-fade-in">
                                <div style={{ position: 'relative', height: '180px', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '1rem' }}>
                                    <img src={c.image} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div className={`badge badge-${c.priority.toLowerCase()}`} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                                        {c.priority}
                                    </div>
                                </div>
                                <h3 style={{ marginBottom: '0.5rem' }}>{c.title}</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{c.description.substring(0, 100)}...</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: c.resolutionNote ? '1rem' : '0' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.875rem' }}>{c.status}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                                {c.resolutionNote && (
                                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bcf0da' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', marginBottom: '0.25rem' }}>Resolution Note:</p>
                                        <p style={{ fontSize: '0.8rem', color: '#166534' }}>{c.resolutionNote}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                        {complaints.length === 0 && <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>No complaints found. Tap "New Complaint" to begin.</div>}
                    </div>
                </section>

                {/* AI Chat Section */}
                <aside>
                    <div className="card" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageSquare size={20} color="var(--primary)" />
                            <h3 style={{ fontSize: '1rem' }}>AI Assistant</h3>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {chatLog.map((m, i) => (
                                <div key={i} style={{
                                    alignSelf: m.type === 'bot' ? 'flex-start' : 'flex-end',
                                    background: m.type === 'bot' ? '#f1f5f9' : 'var(--primary)',
                                    color: m.type === 'bot' ? 'var(--text-main)' : 'white',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius)',
                                    fontSize: '0.875rem',
                                    maxWidth: '85%'
                                }}>
                                    {m.text}
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleChat} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                className="input-control"
                                placeholder="Ask me something..."
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                            />
                            <button className="btn btn-primary" style={{ padding: '0.5rem' }}><Send size={18} /></button>
                        </form>
                    </div>
                </aside>
            </div>

            {/* New Complaint Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>New Service Request</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label>Summary of Issue</label>
                                <input required className="input-control" value={newComplaint.title} onChange={e => setNewComplaint({ ...newComplaint, title: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Detailed Description</label>
                                <textarea required className="input-control" rows="4" value={newComplaint.description} onChange={e => setNewComplaint({ ...newComplaint, description: e.target.value })}></textarea>
                            </div>
                            <div className="input-group">
                                <label>Issue Image (Cloudinary Upload)</label>
                                <input type="file" required onChange={e => setImage(e.target.files[0])} style={{ fontSize: '0.875rem' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Uploading...' : 'Submit Request'}</button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ flex: 1, background: '#eee' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
