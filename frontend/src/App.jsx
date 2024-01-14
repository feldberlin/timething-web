import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import "../index.css";

import StudioPage from './pages/StudioPage';
import UploadPage from './pages/UploadPage';
import HomePage from './pages/HomePage';

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

ReactDOM.createRoot(
  document.getElementById("root")
).render(<App />);
