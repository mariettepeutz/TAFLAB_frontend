// Window/manualControl.js

import React, { useState, useEffect, useCallback, useContext } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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
  const [rudderAngle, setRudderAngle] = useState(0);
  const [sailAngle, setSailAngle] = useState(0);
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
        boat_id: selectedBoatId,
        r: rudderAngle, // Abbreviated keys
        s: sailAngle,
        th: throttle,
        command_mode: commandMode,
        target_gps_latitude: 0, // Include default values
        target_gps_longitude: 0,
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
    const angle = Math.round(event.x * 90);
    setRudderAngle(angle);
  };

  const handleThrottleMove = (event) => {
    const throttleValue = Math.round(event.y * 100);
    setThrottle(throttleValue);
  };

  const handleRudderStop = () => {
    setRudderAngle(0);
  };

  const handleThrottleStop = () => {
    setThrottle(0);
  };

  const handleSailAngleChange = (e) => {
    setSailAngle(parseInt(e.target.value));
  };

  const handleBoatChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedBoatId(selectedValue);

    const boat = boats.find((b) => b.boat_id === selectedValue);
    setMapCenter(
      boat && boat.location
        ? {
            lat: boat.location.latitude || 37.8682,
            lng: boat.location.longitude || -122.3177,
          }
        : { lat: 37.8682, lng: -122.3177 }
    );
  };

  const renderMarkers = () => {
    return boats.map((boat) => {
      if (
        boat &&
        boat.location &&
        typeof boat.location.latitude === "number" &&
        typeof boat.location.longitude === "number"
      ) {
        return (
          <Marker
            key={boat.boat_id}
            position={[boat.location.latitude, boat.location.longitude]}
            icon={boatIcon}
          >
            <Popup>
              <b>{boat.boat_id}</b>
              <br />
              Latitude: {boat.location.latitude.toFixed(6)}
              <br />
              Longitude: {boat.location.longitude.toFixed(6)}
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
            min="-180"
            max="180"
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
