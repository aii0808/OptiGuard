import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import DashboardPimpinan from './pages/DashboardPimpinan.jsx';
import DashboardTeknisi from './pages/DashboardTeknisi.jsx';
import WebGISPage from './pages/WebGISPage.jsx';
import TugasPimpinan from './pages/TugasPimpinan.jsx';
import TugasTeknisi from './pages/TugasTeknisi.jsx';
import Laporan from './pages/Laporan.jsx';
import ApprovalTeknisi from './pages/ApprovalTeknisi.jsx';
import KelolaAkun from './pages/KelolaAkun.jsx';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Layout>{children}</Layout>;
}

function RoleDashboard() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'pimpinan' ? <DashboardPimpinan /> : <DashboardTeknisi />;
}

function RootRedirect() {
  const lastPath = localStorage.getItem('og_current_path');
  const target = lastPath && lastPath !== '/' && lastPath !== '/login' && lastPath !== '/register'
    ? lastPath
    : '/dashboard';
  return <Navigate to={target} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/webgis"
        element={
          <ProtectedRoute>
            <WebGISPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tiket"
        element={
          <ProtectedRoute allowedRoles={['pimpinan']}>
            <TugasPimpinan />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tugas"
        element={
          <ProtectedRoute allowedRoles={['teknisi']}>
            <TugasTeknisi />
          </ProtectedRoute>
        }
      />
      <Route
        path="/laporan"
        element={
          <ProtectedRoute>
            <Laporan />
          </ProtectedRoute>
        }
      />
      <Route
        path="/approval"
        element={
          <ProtectedRoute allowedRoles={['pimpinan']}>
            <ApprovalTeknisi />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profil"
        element={
          <ProtectedRoute>
            <KelolaAkun />
          </ProtectedRoute>
        }
      />

      {/* Legacy Fallbacks */}
      <Route path="/pimpinan" element={<Navigate to="/dashboard" replace />} />
      <Route path="/teknisi" element={<Navigate to="/dashboard" replace />} />

      {/* Default redirect to last active route or dashboard */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
