import React, { useState, useEffect } from "react";
import ManualControl from "./Window/manualControl";
import AutonomousControl from "./Window/autonomousControl";
import DataTransfer from "./Window/dataTransfer";
import Heatmap from "./Window/heatmap"; // Import Heatmap
import { useSocket } from "./Context/socketContext";
import Header from "./Window/header";
import Sidebar from "./Window/sideBar";
import "./styles.css";

function App() {
  const [activeTab, setActiveTab] = useState("heatmap");
  const [selectedServer, setSelectedServer] = useState("");
  const [servers, setServers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { socket, isConnected, connect, disconnect } = useSocket();

  useEffect(() => {
    fetch("/Initialization/servers.json")
      .then((response) => response.json())
      .then((data) => {
        setServers(data);
        setSelectedServer(data[0]?.value || "");
      })
      .catch((error) => console.error("Error fetching server list:", error));
  }, []);

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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderTab = () => {
    switch (activeTab) {
      case "manual":
        return <ManualControl />;
      case "autonomous":
        return <AutonomousControl />;
      case "data":
        return <DataTransfer />;
      case "heatmap": // Add Heatmap option here
        return <Heatmap />;
      default:
        return <ManualControl />;
    }
  };

  return (
    <div className="app-container">
      <Header
        selectedServer={selectedServer}
        servers={servers}
        handleServerChange={handleServerChange}
        handleConnection={handleConnection}
        isConnected={isConnected}
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
            <button
              className={activeTab === "heatmap" ? "active" : ""}
              onClick={() => setActiveTab("heatmap")}
            >
              Heatmap
            </button>
          </nav>
          <section className="tab-content">{renderTab()}</section>
        </main>
      </div>
    </div>
  );
}

export default App;
