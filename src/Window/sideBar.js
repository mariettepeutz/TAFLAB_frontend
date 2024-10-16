// Sidebar.js
import React from "react";
import "./styles.css"; // Import the styles if necessary

function Sidebar({ isSidebarOpen }) {
  return (
    <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
      <h2>Boats</h2>
      <button>Action 1</button>
      <button>Action 2</button>
    </aside>
  );
}

export default Sidebar;
