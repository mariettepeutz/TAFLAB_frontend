// Window/autonomousControl.js

import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSocket } from "../Context/socketContext";
import { BoatContext } from "../Context/boatContext"; // Import BoatContext

// Custom boat icon
const boatIcon = new L.Icon({
  iconUrl: "boat.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Custom icon for the selected position
const selectedIcon = new L.Icon({
  iconUrl: "target-location.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function AutonomousControl() {
  const { socket, isConnected, setCommandMode } = useSocket();
  const { boats } = React.useContext(BoatContext); // Get boats from context

  const [targetBoatId, setTargetBoatId] = useState("");
  const [boat, setBoat] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);

  // Set command mode to 'autonomous'
  useEffect(() => {
    if (setCommandMode) {
      setCommandMode("autonomous");
    }
  }, [setCommandMode]);

  // Update the selected boat when the targetBoatId changes
  useEffect(() => {
    const targetBoat = boats.find((b) => b.boat_id === targetBoatId);
    setBoat(targetBoat);
  }, [boats, targetBoatId]);

  // Set default boat ID if none is selected
  useEffect(() => {
    if (!targetBoatId && boats.length > 0) {
      setTargetBoatId(boats[0].boat_id);
    }
  }, [boats, targetBoatId]);

  const handleBoatChange = (event) => {
    setTargetBoatId(event.target.value);
  };

  const handleMapClick = (e) => {
    setSelectedPosition(e.latlng);
  };

  const sendTargetCoordinates = () => {
    if (socket && isConnected && selectedPosition) {
      const data = {
        boat_name: targetBoatId,
        command_mode: "autonomous",
        target_gps_latitude: selectedPosition.lat,
        target_gps_longitude: selectedPosition.lng,
      };
      socket.emit("gui_data", data);
      console.log("Sent target coordinates:", data);
    } else {
      console.warn("Socket is not connected or position not selected.");
    }
  };

  function ClickableMap() {
    useMapEvents({
      click: handleMapClick,
    });
    return null;
  }

  return (
    <div className="map-container">
      <h2>Autonomous Control</h2>

      {!isConnected && <p className="warning-text">Not connected to server.</p>}

      <div style={{ marginBottom: "10px" }}>
        <label>Select Boat: </label>
        <select value={targetBoatId} onChange={handleBoatChange}>
          {boats.length > 0 ? (
            boats.map((b) => (
              <option key={b.boat_id} value={b.boat_id}>
                {b.boat_id}
              </option>
            ))
          ) : (
            <option>No boats available</option>
          )}
        </select>
      </div>

      <MapContainer
        center={[37.866942, -122.315452]}
        zoom={14}
        style={{ width: "100%", height: "400px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <ClickableMap />
        {boats.map((b) => {
          const location = b.location;
          if (
            location &&
            typeof location.latitude === "number" &&
            typeof location.longitude === "number"
          ) {
            return (
              <Marker
                key={b.boat_id}
                position={[location.latitude, location.longitude]}
                icon={boatIcon}
              >
                <Popup>
                  <b>{b.boat_id}</b>
                  <br />
                  Latitude: {location.latitude.toFixed(5)}
                  <br />
                  Longitude: {location.longitude.toFixed(5)}
                </Popup>
              </Marker>
            );
          } else {
            console.warn(`Boat ${b.boat_id} has no valid location data.`);
            return null;
          }
        })}

        {selectedPosition && (
          <Marker position={selectedPosition} icon={selectedIcon}>
            <Popup>
              Selected Target
              <br />
              Latitude: {selectedPosition.lat.toFixed(5)}
              <br />
              Longitude: {selectedPosition.lng.toFixed(5)}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div style={{ marginTop: "10px" }}>
        {selectedPosition && (
          <div>
            <p>
              Selected Position:
              <br />
              Latitude: {selectedPosition.lat.toFixed(5)}
              <br />
              Longitude: {selectedPosition.lng.toFixed(5)}
            </p>
            <button onClick={sendTargetCoordinates} disabled={!isConnected}>
              Send Target Coordinates
            </button>
          </div>
        )}
        {!selectedPosition && (
          <p>Click on the map to select a target position.</p>
        )}
      </div>
    </div>
  );
}

export default AutonomousControl;
