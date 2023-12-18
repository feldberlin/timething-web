import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import PlayerPage from './pages/player';
import HomePage from './pages/home';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/player">
          <PlayerPage />
        </Route>
        <Route path="/">
          <HomePage />
        </Route>
      </Switch>
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById("react")).render(<App />);
