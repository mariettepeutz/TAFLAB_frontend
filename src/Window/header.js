// Header.js
import React from "react";

function Header({
  selectedServer,
  servers,
  handleServerChange,
  handleConnection,
  isConnected,
  toggleSidebar,
}) {
  return (
    <header className="header">
      <div className="logo">
        <h1>TAFLAB</h1>
      </div>
      <div className="connection-info">
        <div className="server-selection">
          <select value={selectedServer} onChange={handleServerChange}>
            {servers.map((server) => (
              <option key={server.value} value={server.value}>
                {server.label}
              </option>
            ))}
          </select>
          <button onClick={handleConnection}>
            {isConnected ? "Disconnect" : "Connect"}
          </button>
        </div>
        <div className="connection-status">
          <span
            className={`connection-light ${isConnected ? "green" : "gray"}`}
          ></span>
          <p>
            {isConnected ? `Connected to ${selectedServer}` : "Not connected"}
          </p>
        </div>
      </div>
      <div className="hamburger" onClick={toggleSidebar}>
        ☰
      </div>
    </header>
  );
}

export default Header;
