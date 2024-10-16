import React from "react";
import { useSocket } from "../Context/socketContext"; // Import the useSocket hook
import "../styles.css"; // Import the styles if necessary

function Sidebar({ isSidebarOpen }) {
  const { commandMode } = useSocket(); // Get commandMode from context

  return (
    <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
      <h2>Boats</h2>
      <p>
        Current Command Mode:{" "}
        <span
          style={{
            color: commandMode === "manual" ? "green" : "white",
            fontWeight: "bold",
          }}
        >
          {commandMode.charAt(0).toUpperCase() + commandMode.slice(1)}
        </span>
      </p>
      <button>Action 1</button>
      <button>Action 2</button>
    </aside>
  );
}

export default Sidebar;
