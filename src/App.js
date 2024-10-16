// App.js
import React, { useState, useEffect } from "react";
import ManualControl from "./Window/manualControl";
import AutonomousControl from "./Window/autonomousControl";
import DataTransfer from "./Window/dataTransfer";
import { SocketProvider } from "./Context/socketContext";
import Header from "./Window/header"; // Import the Header component
import Sidebar from "./Window/sideBar"; // Import the Sidebar component
import "./styles.css";

function App() {
  const [activeTab, setActiveTab] = useState("manual");
  const [selectedServer, setSelectedServer] = useState("");
  const [servers, setServers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Removed socket-related imports and usage from App component
  // as they should be handled within the SocketProvider or individual components

  useEffect(() => {
    fetch("/Initialization/servers.json")
      .then((response) => response.json())
      .then((data) => {
        setServers(data);
        setSelectedServer(data[0]?.value || "");
      })
      .catch((error) => console.error("Error fetching server list:", error));
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderTab = () => {
    switch (activeTab) {
      case "manual":
        return <ManualControl />;
      case "autonomous":
        return <AutonomousControl />;
      case "data":
        return <DataTransfer />;
      default:
        return <ManualControl />;
    }
  };

  return (
    <SocketProvider>
      <div className="app-container">
        <Header
          selectedServer={selectedServer}
          servers={servers}
          setSelectedServer={setSelectedServer}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        <div className="main-content">
          <Sidebar isSidebarOpen={isSidebarOpen} />
          <main className="control-panel">
            <nav className="tabs">
              <button
                className={activeTab === "manual" ? "active" : ""}
                onClick={() => setActiveTab("manual")}
              >
                Manual Control
              </button>
              <button
                className={activeTab === "autonomous" ? "active" : ""}
                onClick={() => setActiveTab("autonomous")}
              >
                Autonomous Control
              </button>
              <button
                className={activeTab === "data" ? "active" : ""}
                onClick={() => setActiveTab("data")}
              >
                Data Transfer
              </button>
            </nav>
            <section className="tab-content">{renderTab()}</section>
          </main>
        </div>
      </div>
    </SocketProvider>
  );
}

export default App;
