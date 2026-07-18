import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Clock, AlertCircle, CheckSquare, Clipboard, Send } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const StaffDashboard = () => {
    const { user, logout } = useAuth();
    const socket = useSocket();
    const [complaints, setComplaints] = useState([]);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [resolutionNote, setResolutionNote] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAssignedComplaints();

        if (socket) {
            socket.on('complaintAssigned', (data) => {
                alert('🔔 New Task Assigned! Check your dashboard.');
                fetchAssignedComplaints();
            });
        }

        return () => socket?.off('complaintAssigned');
    }, [socket]);

    const fetchAssignedComplaints = async () => {
        try {
            const res = await api.get('/api/complaints');
            setComplaints(res.data.complaints);
        } catch (err) { console.error(err); }
    };

    const handleAccept = async (id) => {
        try {
            await api.put(`/api/complaints/${id}/accept`);
            fetchAssignedComplaints();
        } catch (err) { alert(err.response?.data?.message || 'Accept failed'); }
    };

    const handleUpdateStatus = async (id, status) => {
        if (status === 'Resolved' && !resolutionNote.trim()) {
            alert('Please provide a resolution note before closing.');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/api/complaints/${id}/status`, { status, resolutionNote });
            setSelectedComplaint(null);
            setResolutionNote('');
            fetchAssignedComplaints();
        } catch (err) { alert(err.response?.data?.message || 'Update failed'); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1>Welcome, {user?.name} 👋</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Work efficiently on assigned maintenance tasks</p>
                </div>
                <button onClick={logout} className="btn" style={{ background: '#eee' }}>Logout</button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                {complaints.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem' }}>
                        <Clipboard size={48} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
                        <h3>No tasks assigned currently.</h3>
                        <p>You will receive a notification when a new task is assigned to you.</p>
                    </div>
                ) : (
                    complaints.map(c => (
                        <div key={c._id} className="card animate-fade-in" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            borderLeft: `5px solid ${c.status === 'Resolved' ? 'var(--success)' : c.status === 'Assigned' ? 'var(--warning)' : 'var(--primary)'}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span className={`badge badge-${c.priority.toLowerCase()}`}>{c.priority} Priority</span>
                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.status}</span>
                            </div>

                            <h3 style={{ marginBottom: '0.5rem' }}>{c.title}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flex: 1, marginBottom: '1.5rem' }}>{c.description}</p>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}><strong>Reporter:</strong> {c.user?.name}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}><strong>Reported:</strong> {new Date(c.createdAt).toLocaleString()}</p>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                {c.status === 'Assigned' && (
                                    <button onClick={() => handleAccept(c._id)} className="btn btn-primary" style={{ flex: 1 }}>
                                        <CheckSquare size={18} /> Accept Task
                                    </button>
                                )}

                                {c.status === 'Accepted' && (
                                    <button onClick={() => handleUpdateStatus(c._id, 'In Progress')} className="btn" style={{ flex: 1, background: '#e0e7ff', color: '#4338ca' }}>
                                        Start Work
                                    </button>
                                )}

                                {c.status === 'In Progress' && (
                                    <button onClick={() => setSelectedComplaint(c)} className="btn btn-primary" style={{ flex: 1, background: 'var(--success)' }}>
                                        <CheckCircle size={18} /> Resolve
                                    </button>
                                )}

                                {c.status === 'Resolved' && (
                                    <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                                        <CheckCircle size={20} /> Task Completed
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Resolution Modal */}
            {selectedComplaint && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
                        <h2>Resolve Complaint</h2>
                        <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Add clear notes about how the issue was resolved.</p>

                        <div className="input-group">
                            <label>Resolution Notes</label>
                            <textarea
                                className="input-control"
                                rows="5"
                                placeholder="Fixed the leak by replacing the main valve..."
                                value={resolutionNote}
                                onChange={e => setResolutionNote(e.target.value)}
                            ></textarea>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button onClick={() => handleUpdateStatus(selectedComplaint._id, 'Resolved')} className="btn btn-primary" style={{ flex: 1, background: 'var(--success)' }} disabled={loading}>
                                {loading ? 'Submitting...' : 'Mark as Resolved'}
                            </button>
                            <button onClick={() => { setSelectedComplaint(null); setResolutionNote(''); }} className="btn" style={{ flex: 1, background: '#eee' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffDashboard;
