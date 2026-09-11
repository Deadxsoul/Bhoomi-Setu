import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* /app/* routes (dashboard, map, compensation, etc.) land here in the next batch */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
