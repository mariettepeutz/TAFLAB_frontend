// Window/manualControl.js

import React, { useState, useEffect, useCallback, useContext } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import { Joystick } from "react-joystick-component";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles.css";
import { useSocket } from "../Context/socketContext";
import { BoatContext } from "../Context/boatContext"; // Import BoatContext

const boatIcon = new L.Icon({
  iconUrl: "boat.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function ManualControl() {
  const { socket, isConnected, setCommandMode } = useSocket();
  const { boats } = useContext(BoatContext); // Use useContext to get boats

  const [selectedBoatId, setSelectedBoatId] = useState("all");
  const [rudderAngle, setRudderAngle] = useState(90);
  const [sailAngle, setSailAngle] = useState(45);
  const [throttle, setThrottle] = useState(0);
  const commandMode = "manual"; // Set command mode to 'manual'
  const [mapCenter, setMapCenter] = useState({
    lat: 37.86706,
    lng: -122.36341,
  });

  // Set the global command mode to 'manual' when this component is mounted
  useEffect(() => {
    if (setCommandMode) {
      setCommandMode("manual");
    }
  }, [setCommandMode]);

  const sendData = useCallback(() => {
    if (isConnected && socket) {
      const data = {
        boat_name: selectedBoatId,
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
  }, [
    isConnected,
    socket,
    rudderAngle,
    sailAngle,
    throttle,
    commandMode,
    selectedBoatId,
  ]);

  useEffect(() => {
    sendData();
  }, [rudderAngle, sailAngle, throttle, sendData]);

  const handleRudderMove = (event) => {
    const angle = Math.round(((event.x + 1) / 2) * 180);
    setRudderAngle(angle);
  };

  const handleThrottleMove = (event) => {
    const throttleValue = Math.round((event.y + 1) * 100 - 100);
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

  const handleBoatChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedBoatId(selectedValue);

    const boat = boats.find((b) => b.boat_id === selectedValue);
    setMapCenter(
      boat
        ? { lat: boat.lat, lng: boat.lng } // Update to use boat.lat and boat.lng
        : { lat: 37.8682, lng: -122.3177 }
    );
  };

  const renderMarkers = () => {
    return boats.map((boat) => {
      if (
        boat &&
        typeof boat.lat === "number" &&
        typeof boat.lng === "number"
      ) {
        return (
          <Marker
            key={boat.boat_id}
            position={[boat.lat, boat.lng]} // Use boat.lat and boat.lng
            icon={boatIcon}
          >
            <Popup>
              <b>{boat.boat_id}</b>
              <br />
              Latitude: {boat.lat.toFixed(6)}
              <br />
              Longitude: {boat.lng.toFixed(6)}
            </Popup>
          </Marker>
        );
      } else {
        console.warn(`Boat ${boat.boat_id} has no valid location data.`);
        return null; // Don't render a marker if location is invalid
      }
    });
  };

  return (
    <div className="manual-control-container">
      <h2>Manual Control</h2>

      {!isConnected && <p className="warning-text">Not connected to server.</p>}

      <div className="boat-selection">
        <label>Select Boat: </label>
        <select value={selectedBoatId} onChange={handleBoatChange}>
          <option value="all">All Boats</option>
          {boats.map((boat) => (
            <option key={boat.boat_id} value={boat.boat_id}>
              {boat.boat_id}
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
