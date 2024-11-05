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
          className={`command-mode ${
            commandMode === "manual" ? "manual" : "autonomous"
          }`}
        >
          {commandMode.charAt(0).toUpperCase() + commandMode.slice(1)}
        </span>
      </p>
      <h3>Online Boats:</h3>
      {boats && boats.length > 0 ? (
        <ul className="boat-list">
          {boats.map((boat) => (
            <li key={boat.boat_id}>
              <strong>{boat.boat_id}</strong>
              <br />
              Status:{" "}
              <span
                className={`boat-status ${
                  boat.status === "Reached Destination"
                    ? "reached"
                    : boat.status && boat.status.startsWith("In Progress")
                    ? "in-progress"
                    : "station-keeping"
                }`}
              >
                {boat.status || "station-keeping"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No boats online.</p>
      )}
    </aside>
  );
}

export default Sidebar;
