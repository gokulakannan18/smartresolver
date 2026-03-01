import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    TrendingUp, Users, CheckCircle, AlertOctagon,
    Map as MapIcon, Calendar, ArrowUpRight, ArrowDownRight,
    TrendingDown, Activity, Clock
} from 'lucide-react';

const SuperAdminDashboard = () => {
    const { logout } = useAuth();
    const [data, setData] = useState(null);
    const [staffPerf, setStaffPerf] = useState([]);
    const [loading, setLoading] = useState(true);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [statsRes, perfRes] = await Promise.all([
                api.get('/api/analytics/dashboard'),
                api.get('/api/analytics/staff-performance')
            ]);
            setData(statsRes.data);
            setStaffPerf(perfRes.data.performance);
        } catch (err) {
            console.error('Analytics Error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading Analytics...</div>;

    const { summary, byCategory, monthlyTrends } = data;

    return (
        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b' }}>Executive Overview</h1>
                    <p style={{ color: '#64748b' }}>Enterprise-wide resolution performance & departmental healthcare</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={fetchStats} className="btn" style={{ background: 'white', border: '1px solid #e2e8f0' }}>Refresh Data</button>
                    <button onClick={logout} className="btn" style={{ background: '#eee' }}>Logout</button>
                </div>
            </header>

            {/* Hero Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard title="Total Volume" value={summary.totalComplaints} icon={<Activity size={20} />} color="#6366f1" trend="+12%" />
                <StatCard title="Efficiency Rate" value={`${Math.round((summary.resolvedComplaints / (summary.totalComplaints || 1)) * 100)}%`} icon={<CheckCircle size={20} />} color="#10b981" trend="+5%" />
                <StatCard title="SLA Breaches" value={summary.delayedCount} icon={<AlertOctagon size={20} />} color="#ef4444" trend="-2%" negative />
                <StatCard title="Avg Resolution" value={`${Math.round(summary.avgResolutionTime || 0)}h`} icon={<Clock size={20} />} color="#f59e0b" trend="-1.5h" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Monthly Trend Area Chart */}
                <div className="card" style={{ height: '450px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Complaint Inflow Trends</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={monthlyTrends}>
                            <defs>
                                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorInflow)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Distribution Pie */}
                <div className="card" style={{ height: '450px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Department Workload</h3>
                    <ResponsiveContainer width="100%" height="70%">
                        <PieChart>
                            <Pie
                                data={byCategory}
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="count"
                                nameKey="_id"
                            >
                                {byCategory.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Top Driver: <strong style={{ color: '#1e293b' }}>{byCategory[0]?._id}</strong></p>
                    </div>
                </div>
            </div>

            {/* Staff Performance Leaderboard */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.125rem' }}>Staff Efficiency Ranking</h3>
                        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Performance based on SLA compliance and resolution volume</p>
                    </div>
                    <button className="btn" style={{ background: '#f1f5f9', fontSize: '0.875rem' }}>Export PDF</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 500, fontSize: '0.875rem' }}>Technician</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 500, fontSize: '0.875rem' }}>Resolutions</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 500, fontSize: '0.875rem' }}>Avg Time</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 500, fontSize: '0.875rem' }}>SLA Success</th>
                                <th style={{ padding: '1rem', color: '#64748b', fontWeight: 500, fontSize: '0.875rem' }}>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffPerf.map((s, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                    <td style={{ padding: '1.25rem 1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '8px', background: i === 0 ? '#fef3c7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: i === 0 ? '#92400e' : '#64748b' }}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{s.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{s.resolvedCount} tickets</td>
                                    <td style={{ padding: '1rem' }}>{Math.round(s.avgTime)} hrs</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ width: '100px', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${s.efficiency}%`, height: '100%', background: s.efficiency > 80 ? '#10b981' : '#f59e0b' }} />
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', background: s.efficiency > 90 ? '#dcfce7' : '#fef3c7', color: s.efficiency > 90 ? '#166534' : '#92400e', fontSize: '0.75rem', fontWeight: 700 }}>
                                            {Math.round(s.efficiency)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color, trend, negative }) => (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: negative ? '#ef4444' : '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
                {negative ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                {trend}
            </div>
        </div>
        <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{title}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{value}</div>
    </div>
);

export default SuperAdminDashboard;
