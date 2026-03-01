import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, ClipboardList, UserCheck, ShieldCheck, Filter, AlertTriangle } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const DeptAdminDashboard = () => {
    const { user, logout } = useAuth();
    const socket = useSocket();
    const [complaints, setComplaints] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });

    useEffect(() => {
        fetchData();

        if (socket) {
            socket.on('complaintCreated', () => {
                alert('🔔 New complaint submitted in your department!');
                fetchData();
            });
            socket.on('statusChanged', fetchData);
        }

        return () => {
            socket?.off('complaintCreated');
            socket?.off('statusChanged');
        };
    }, [socket]);

    const fetchData = async () => {
        try {
            const [compRes, staffRes] = await Promise.all([
                api.get('/api/complaints'),
                api.get('/api/auth/staff') // Assuming this endpoint returns staff in the same dept
            ]);

            const tickets = compRes.data.complaints;
            setComplaints(tickets);
            setStaffList(staffRes.data.users || []);

            // Calculate local stats
            setStats({
                total: tickets.length,
                pending: tickets.filter(t => t.status === 'Open' || t.status === 'Assigned').length,
                resolved: tickets.filter(t => t.status === 'Resolved').length
            });
        } catch (err) { console.error('Fetch error:', err); }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!selectedStaff) return;

        setLoading(true);
        try {
            await api.put(`/api/complaints/${selectedTicket._id}/assign`, { staffId: selectedStaff });
            setSelectedTicket(null);
            setSelectedStaff('');
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Assignment failed'); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ShieldCheck size={32} color="var(--primary)" /> Department Admin Control
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Overview and management of departmental tickets</p>
                </div>
                <button onClick={logout} className="btn" style={{ background: '#eee' }}>Logout</button>
            </header>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Tickets</h4>
                    <h2 style={{ fontSize: '2.5rem' }}>{stats.total}</h2>
                </div>
                <div className="card" style={{ textAlign: 'center', borderLeft: '5px solid var(--warning)' }}>
                    <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Awaiting Action</h4>
                    <h2 style={{ fontSize: '2.5rem', color: 'var(--warning)' }}>{stats.pending}</h2>
                </div>
                <div className="card" style={{ textAlign: 'center', borderLeft: '5px solid var(--success)' }}>
                    <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Resolved</h4>
                    <h2 style={{ fontSize: '2.5rem', color: 'var(--success)' }}>{stats.resolved}</h2>
                </div>
            </div>

            {/* Ticket List Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ClipboardList size={20} /> Departmental Tickets</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {/* Filter mock */}
                        <button className="btn" style={{ fontSize: '0.8rem', background: '#f8fafc' }}><Filter size={14} /> Filter</button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            <tr>
                                <th style={{ padding: '1rem 1.5rem' }}>Issue</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Priority</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Staff Assigned</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complaints.map(t => (
                                <tr key={t._id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ fontWeight: 600 }}>{t.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By: {t.user?.name}</div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span className={`badge`} style={{ background: t.status === 'Open' ? '#fee2e2' : '#e0e7ff', color: t.status === 'Open' ? '#991b1b' : '#3730a3' }}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <AlertTriangle size={14} color={t.priority === 'High' ? 'var(--danger)' : 'var(--warning)'} />
                                            {t.priority}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        {t.staffMember ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifySelf: 'center', fontSize: '0.6rem', justifyContent: 'center' }}>
                                                    {t.staffMember.name.charAt(0)}
                                                </div>
                                                {t.staffMember.name}
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        {(t.status === 'Open' || !t.staffMember) && (
                                            <button
                                                onClick={() => setSelectedTicket(t)}
                                                className="btn btn-primary"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                            >
                                                <UserCheck size={14} /> Assign Staff
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assignment Modal */}
            {selectedTicket && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '450px' }}>
                        <h2 style={{ marginBottom: '0.5rem' }}>Assign Task</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Select a staff member from your department to handle: <strong>"{selectedTicket.title}"</strong>
                        </p>

                        <form onSubmit={handleAssign}>
                            <div className="input-group">
                                <label>Available Staff Members</label>
                                <select
                                    className="input-control"
                                    required
                                    value={selectedStaff}
                                    onChange={(e) => setSelectedStaff(e.target.value)}
                                >
                                    <option value="">Select Staff...</option>
                                    {staffList.map(s => (
                                        <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                    {loading ? 'Assigning...' : 'Confirm Assignment'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedTicket(null); setSelectedStaff(''); }}
                                    className="btn"
                                    style={{ flex: 1, background: '#eee' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeptAdminDashboard;
