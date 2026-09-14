import { Routes, Route, Navigate } from 'react-router-dom';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConflictBanner } from './components/ConflictBanner';
import { HomeHub } from './screens/HomeHub';
import { TillScreen } from './screens/till/TillScreen';
import { KitchenScreen } from './screens/kitchen-display/KitchenScreen';
import { StatusBoard } from './screens/status-board/StatusBoard';

export default function App() {
  useRealtimeSync();

  return (
    <>
      <ConflictBanner />
      <Routes>
        <Route path="/" element={<HomeHub />} />
        <Route
          path="/till"
          element={
            <ErrorBoundary screen="Till">
              <TillScreen />
            </ErrorBoundary>
          }
        />
        <Route
          path="/kitchen"
          element={
            <ErrorBoundary screen="Kitchen Display">
              <KitchenScreen />
            </ErrorBoundary>
          }
        />
        <Route
          path="/board"
          element={
            <ErrorBoundary screen="Status Board">
              <StatusBoard />
            </ErrorBoundary>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
