// Window/sideBar.js

import React from "react";
import { useSocket } from "../Context/socketContext";
import { BoatContext } from "../Context/boatContext"; // Import BoatContext
import "../styles.css";

function Sidebar({ isSidebarOpen }) {
  const { commandMode } = useSocket();
  const { boats } = React.useContext(BoatContext); // Get boats from context

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
      <h3>Online Boats:</h3>
      {boats.length > 0 ? (
        <ul>
          {boats.map((boat) => (
            <li key={boat.boat_id}>{boat.boat_id}</li>
          ))}
        </ul>
      ) : (
        <p>No boats online.</p>
      )}
    </aside>
  );
}

export default Sidebar;
