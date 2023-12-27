import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import PlayerPage from './pages/player';
import UploadPage from './pages/upload';
import HomePage from './pages/home';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/player">
          <PlayerPage />
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
