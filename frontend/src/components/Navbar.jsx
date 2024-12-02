import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{ padding: "10px", backgroundColor: "#f4f4f4" }}>
      <ul style={{ display: "flex", gap: "15px", listStyle: "none", margin: 0 }}>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/game-modes">Game Modes</Link>
        </li>
        <li>
          <Link to="/system-control">System Control</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
