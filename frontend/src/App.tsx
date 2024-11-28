import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  Routes,
  Route,
  BrowserRouter,
} from 'react-router-dom';

// components
import { AuthProvider } from './components/hooks/useAuth.tsx';
import RequireAuth from './components/RequireAuth.tsx';
import StudioPage from './pages/StudioPage.tsx';
import UploadPage from './pages/UploadPage.tsx';
import HomePage from './pages/HomePage.tsx';

// styles
import '../css/App.css';

/**
 * Main application component. Handles routing.
 *
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/studio/:transcriptionId"
        element={<RequireAuth><StudioPage /></RequireAuth>}
      />
      <Route
        path="/upload"
        element={<RequireAuth><UploadPage /></RequireAuth>}
      />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
