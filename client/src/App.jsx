import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import StaffDashboard from './pages/StaffDashboard';
import DeptAdminDashboard from './pages/DeptAdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
    return children;
};

const AppContent = () => {
    const { user } = useAuth();
    return (
        <SocketProvider user={user}>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={
                    <ProtectedRoute roles={['user']}><UserDashboard /></ProtectedRoute>
                } />
                {/* Placeholder for other roles */}
                <Route path="/staff" element={
                    <ProtectedRoute roles={['staff']}><StaffDashboard /></ProtectedRoute>
                } />
                <Route path="/dept-admin" element={
                    <ProtectedRoute roles={['deptadmin']}><DeptAdminDashboard /></ProtectedRoute>
                } />
                <Route path="/analytics" element={
                    <ProtectedRoute roles={['superadmin']}><SuperAdminDashboard /></ProtectedRoute>
                } />
            </Routes>
        </SocketProvider>
    );
};

const App = () => (
    <AuthProvider>
        <Router>
            <AppContent />
        </Router>
    </AuthProvider>
);

export default App;
