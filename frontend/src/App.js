/*import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
*/

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import GameModes from './pages/GameModes';
import SystemControl from './pages/SystemControl';
import { SystemProvider } from './SystemContext';

function App() {
  return (
    <SystemProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game-modes" element={<GameModes />} />
          <Route path="/system-control" element={<SystemControl />} />
        </Routes>
      </Router>
    </SystemProvider>
  );
}

export default App;
