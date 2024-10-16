import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import { Joystick } from "react-joystick-component";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles.css";
import { useSocket } from "../Context/socketContext";

const boatIcon = new L.Icon({
  iconUrl: "boat.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const robots = [
  // Your existing robot data
];

function ManualControl() {
  const { socket, isConnected, setCommandMode } = useSocket();

  const [selectedRobot, setSelectedRobot] = useState("all");
  const [rudderAngle, setRudderAngle] = useState(90);
  const [sailAngle, setSailAngle] = useState(45);
  const [throttle, setThrottle] = useState(50);
  const commandMode = "manual"; // Set command mode to 'manual'
  const [mapCenter, setMapCenter] = useState({ lat: 37.8682, lng: -122.3177 });

  // Set the global command mode to 'manual' when this component is mounted
  useEffect(() => {
    if (setCommandMode) {
      setCommandMode("manual");
    }
  }, [setCommandMode]);

  const sendData = useCallback(() => {
    if (isConnected && socket) {
      const data = {
        rudder_angle: rudderAngle,
        sail_angle: sailAngle,
        throttle,
        command_mode: commandMode,
      };

      socket.emit("gui_data", data);
      console.log("Sent data:", data);
    } else {
      console.warn("Socket is not connected.");
    }
  }, [isConnected, socket, rudderAngle, sailAngle, throttle, commandMode]);

  useEffect(() => {
    sendData();
  }, [rudderAngle, sailAngle, throttle, sendData]);

  const handleRudderMove = (event) => {
    const angle = Math.round(((event.x + 1) / 2) * 180);
    setRudderAngle(angle);
  };

  const handleThrottleMove = (event) => {
    const throttleValue = Math.round(((event.y + 1) / 2) * 100);
    setThrottle(throttleValue);
  };

  const handleRudderStop = () => {
    setRudderAngle(90);
  };

  const handleThrottleStop = () => {
    setThrottle(50);
  };

  const handleSailAngleChange = (e) => {
    setSailAngle(parseInt(e.target.value));
  };

  const handleRobotChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedRobot(selectedValue);

    const robot = robots.find((r) => r.id === parseInt(selectedValue));
    setMapCenter(
      robot
        ? { lat: robot.lat, lng: robot.lng }
        : { lat: 37.8682, lng: -122.3177 }
    );
  };

  const renderMarkers = () => {
    // Your existing marker rendering logic
  };

  return (
    <div className="manual-control-container">
      <h2>Manual Control</h2>

      {!isConnected && <p className="warning-text">Not connected to server.</p>}

      <div className="robot-selection">
        <label>Select Robot: </label>
        <select value={selectedRobot} onChange={handleRobotChange}>
          <option value="all">All Boats</option>
          {robots.map((robot) => (
            <option key={robot.id} value={robot.id}>
              {robot.name}
            </option>
          ))}
        </select>
      </div>

      <MapContainer center={mapCenter} zoom={15} style={{ height: "300px" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {renderMarkers()}
      </MapContainer>

      <div className="controls-section">
        <div>
          <Joystick
            size={100}
            move={handleRudderMove}
            stop={handleRudderStop}
            disabled={!isConnected}
          />
          <p>Rudder: {rudderAngle}°</p>
        </div>

        <div>
          <Joystick
            size={100}
            move={handleThrottleMove}
            stop={handleThrottleStop}
            disabled={!isConnected}
          />
          <p>Throttle: {throttle}%</p>
        </div>

        <div>
          <label>Sail Angle: {sailAngle}°</label>
          <input
            type="range"
            min="0"
            max="90"
            value={sailAngle}
            onChange={handleSailAngleChange}
            disabled={!isConnected}
          />
        </div>
      </div>
    </div>
  );
}

export default ManualControl;
