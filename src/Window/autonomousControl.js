// Window/autonomousControl.js
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSocket } from "../Context/socketContext";

const boatIcon = new L.Icon({
  iconUrl: "boat.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function AutonomousControl() {
  const { socket, isConnected } = useSocket(); // Access socket and connection status
  const [boats, setBoats] = useState([]);
  const [targetBoatId, setTargetBoatId] = useState("");
  const [boat, setBoat] = useState(null);

  // Listen for `boat_locations` event from the backend
  useEffect(() => {
    if (socket && isConnected) {
      console.log("Socket is connected, setting up event listeners.");

      const handleBoatLocations = (data) => {
        console.log("Received boat locations:", data);
        setBoats(data);

        if (!targetBoatId && data.length > 0) {
          setTargetBoatId(data[0].boat_id);
        }
      };

      try {
        socket.on("boat_locations", handleBoatLocations);
      } catch (error) {
        console.error("Error setting up boat_locations listener:", error);
      }
      return () => {
        socket.off("boat_locations", handleBoatLocations);
      };
    } else {
      console.log("Socket is not connected.");
    }
  }, [socket, isConnected]);

  // Update the selected boat when the targetBoatId changes
  useEffect(() => {
    const targetBoat = boats.find((b) => b.boat_id === targetBoatId);
    setBoat(targetBoat);
  }, [boats, targetBoatId]);

  const handleBoatChange = (event) => {
    setTargetBoatId(event.target.value);
  };

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
        {boat && (
          <Marker
            position={[boat.location.latitude, boat.location.longitude]}
            icon={boatIcon}
          >
            <Popup>
              <b>{boat.boat_id}</b>
              <br />
              Latitude: {boat.location.latitude.toFixed(5)}
              <br />
              Longitude: {boat.location.longitude.toFixed(5)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default AutonomousControl;
