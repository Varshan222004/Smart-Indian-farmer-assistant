import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CropRecommendation from './pages/CropRecommendation';
import FertilizerRecommendation from './pages/FertilizerRecommendation';
import DiseaseDetection from './pages/DiseaseDetection';
import Weather from './pages/Weather';
import Chat from './pages/Chat';
import Market from './pages/Market';
import Profile from './pages/Profile';
import GovernmentSchemes from './pages/GovernmentSchemes';
import ProfitLossCalculator from './pages/ProfitLossCalculator';
import CropCalendar from './pages/CropCalendar';
import Notifications from './pages/Notifications';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import PWAInstallPrompt from './components/PWAInstallPrompt';

function App() {

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <PWAInstallPrompt />
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/crop"
          element={
            <ProtectedRoute>
              <CropRecommendation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/fertilizer"
          element={
            <ProtectedRoute>
              <FertilizerRecommendation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/disease"
          element={
            <ProtectedRoute>
              <DiseaseDetection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/weather"
          element={
            <ProtectedRoute>
              <Weather />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/market"
          element={
            <ProtectedRoute>
              <Market />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/government-schemes"
          element={
            <ProtectedRoute>
              <GovernmentSchemes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profit-loss"
          element={
            <ProtectedRoute>
              <ProfitLossCalculator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/crop-calendar"
          element={
            <ProtectedRoute>
              <CropCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;

