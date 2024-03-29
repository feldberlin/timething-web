import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter as Router,
  Switch,
  Route,
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
    <Router>
      <Switch>
        <Route path="/studio/:transcriptionId">
          <StudioPage />
        </Route>
        <Route path="/upload">
          <UploadPage />
        </Route>
        <Route path="/">
          <HomePage />
        </Route>
      </Switch>
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
