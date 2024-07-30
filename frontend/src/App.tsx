import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  Routes,
  Route,
  BrowserRouter,
} from 'react-router-dom';

// components
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
      <Route path="/studio/:transcriptionId" element={<StudioPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
