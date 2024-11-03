// Header.js
import React, { useState, useEffect } from "react";
import { useSocket } from "../Context/socketContext";
import "../styles.css"; // Import styles if needed

function Header({ toggleSidebar }) {
  const {
    selectedServer,
    setSelectedServer,
    isConnected,
    connect,
    disconnect,
  } = useSocket();

  const [servers, setServers] = useState([]);

  useEffect(() => {
    fetch("/Initialization/servers.json")
      .then((response) => response.json())
      .then((data) => {
        setServers(data);
        if (!selectedServer && data.length > 0) {
          setSelectedServer(data[0].value);
        }
      })
      .catch((error) => console.error("Error fetching server list:", error));
  }, [selectedServer, setSelectedServer]);

  const handleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect(selectedServer);
    }
  };

  const handleServerChange = (event) => {
    setSelectedServer(event.target.value);
    disconnect();
  };

  return (
    <header className="header">
      <div className="logo">
        <h1>Boat Control System</h1>
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
          <div
            className={`connection-light ${isConnected ? "green" : "gray"}`}
          ></div>
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>
      <div className="hamburger" onClick={toggleSidebar}>
        &#9776;
      </div>
    </header>
  );
}

export default Header;
