import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import AadhaarRegister from './pages/AadhaarRegister.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';

// Lazy-loaded: these pull in heavier dependencies (leaflet, recharts, etc.).
// If any of those fail to load for any reason, only that one page breaks —
// Login, Home, and the rest of the app keep working.
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Projects = lazy(() => import('./pages/Projects.jsx'));
const MapView = lazy(() => import('./pages/MapView.jsx'));
const Compensation = lazy(() => import('./pages/Compensation.jsx'));
const Possession = lazy(() => import('./pages/Possession.jsx'));
const Rehabilitation = lazy(() => import('./pages/Rehabilitation.jsx'));
const Documents = lazy(() => import('./pages/Documents.jsx'));
const Satellite = lazy(() => import('./pages/Satellite.jsx'));
const StateRanking = lazy(() => import('./pages/StateRanking.jsx'));
const Chatbot = lazy(() => import('./pages/Chatbot.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));

function PageFallback() {
  return <div className="p-10 text-center text-ink-soft text-sm">Loading…</div>;
}

function AppLayout() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream">
        <Navbar />
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="aadhaar" element={<AadhaarRegister />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="map" element={<MapView />} />
        <Route path="compensation" element={<Compensation />} />
        <Route path="possession" element={<Possession />} />
        <Route path="rehabilitation" element={<Rehabilitation />} />
        <Route path="documents" element={<Documents />} />
        <Route path="satellite" element={<Satellite />} />
        <Route path="ranking" element={<StateRanking />} />
        <Route path="chatbot" element={<Chatbot />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
