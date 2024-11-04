// Window/autonomousControl.js

import React, { useState, useEffect, useContext } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSocket } from "../Context/socketContext";
import { BoatContext } from "../Context/boatContext";
import { v4 as uuidv4 } from "uuid";

// Custom boat icon for unselected boats
const boatIcon = new L.Icon({
  iconUrl: "boat.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Custom boat icon for selected boat (double size)
const selectedBoatIcon = new L.Icon({
  iconUrl: "boat.png",
  iconSize: [64, 64], // Double size
  iconAnchor: [32, 64],
  popupAnchor: [0, -64],
});

// Custom icon for the selected position
const selectedIcon = new L.Icon({
  iconUrl: "target-location.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Assign different colors to boats
const boatColors = {};
const getBoatColor = (boatId) => {
  if (!boatColors[boatId]) {
    boatColors[boatId] =
      "#" + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0");
  }
  return boatColors[boatId];
};

function AutonomousControl() {
  const { socket, isConnected, setCommandMode } = useSocket();
  const { boats } = useContext(BoatContext);

  const [targetBoatId, setTargetBoatId] = useState("");
  const [boat, setBoat] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [copiedPosition, setCopiedPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([37.866942, -122.315452]);
  const [boatTargets, setBoatTargets] = useState({});
  const [boatTrails, setBoatTrails] = useState({});
  const [boatStatuses, setBoatStatuses] = useState({});
  const [notification, setNotification] = useState(null);

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

    if (
      targetBoat &&
      typeof targetBoat.lat === "number" &&
      typeof targetBoat.lng === "number"
    ) {
      setMapCenter([
        parseFloat(targetBoat.lat.toFixed(6)),
        parseFloat(targetBoat.lng.toFixed(6)),
      ]);
    }
  }, [boats, targetBoatId]);

  // Set default boat ID if none is selected
  useEffect(() => {
    if (!targetBoatId && boats.length > 0) {
      setTargetBoatId(boats[0].boat_id);
    }
  }, [boats, targetBoatId]);

  // Update boat trails and statuses
  useEffect(() => {
    const newBoatTrails = { ...boatTrails };
    const newBoatStatuses = { ...boatStatuses };

    boats.forEach((b) => {
      if (b && typeof b.lat === "number" && typeof b.lng === "number") {
        // Update trails
        if (!newBoatTrails[b.boat_id]) {
          newBoatTrails[b.boat_id] = [];
        }
        newBoatTrails[b.boat_id].push([b.lat, b.lng]);
        if (newBoatTrails[b.boat_id].length > 50) {
          newBoatTrails[b.boat_id].shift(); // Limit trail length
        }

        // Update statuses
        if (b.status) {
          newBoatStatuses[b.boat_id] = b.status;
        }
      }
    });

    setBoatTrails(newBoatTrails);
    setBoatStatuses(newBoatStatuses);
  }, [boats]);

  // Handle notifications when boat reaches target
  useEffect(() => {
    boats.forEach((b) => {
      if (
        b.notification &&
        b.notification.id &&
        b.notification.type === "reached"
      ) {
        setNotification({
          id: b.notification.id,
          boat_id: b.boat_id,
          message: `${b.boat_id} has reached its destination.`,
        });
      }
    });
  }, [boats]);

  // Auto-hide notification after 2 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000); // 2 seconds

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleBoatChange = (event) => {
    setTargetBoatId(event.target.value);
  };

  const handleMapClick = (e) => {
    const lat = parseFloat(e.latlng.lat.toFixed(6));
    const lng = parseFloat(e.latlng.lng.toFixed(6));
    setSelectedPosition({ lat, lng });
  };

  const copySelectedPosition = () => {
    const textToCopy = `${selectedPosition.lat.toFixed(
      6
    )},${selectedPosition.lng.toFixed(6)}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          console.log("Copied to clipboard:", textToCopy);
          setCopiedPosition({ ...selectedPosition });
        })
        .catch((err) => {
          console.error("Could not copy text: ", err);
        });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
      setCopiedPosition({ ...selectedPosition });
      console.log("Copied to clipboard:", textToCopy);
    }
  };

  const sendTargetCoordinatesForBoat = (boatId) => {
    const target = boatTargets[boatId];
    if (socket && isConnected && target && target.lat && target.lng) {
      const data = {
        boat_name: boatId,
        command_mode: "autonomous",
        target_gps_latitude: parseFloat(target.lat.toFixed(6)),
        target_gps_longitude: parseFloat(target.lng.toFixed(6)),
      };
      socket.emit("gui_data", data);
      console.log("Sent target coordinates for boat:", data);
    } else {
      console.warn("Socket is not connected or target position not specified.");
    }
  };

  const sendRouteToCurrentBoat = () => {
    if (socket && isConnected && targetBoatId && selectedPosition) {
      const data = {
        boat_name: targetBoatId,
        command_mode: "autonomous",
        target_gps_latitude: selectedPosition.lat,
        target_gps_longitude: selectedPosition.lng,
      };
      socket.emit("gui_data", data);
      console.log("Sent route to current boat:", data);
    } else {
      console.warn(
        "Socket is not connected, no boat selected, or no position set."
      );
    }
  };

  const pasteCopiedPosition = (boatId) => {
    if (copiedPosition) {
      setBoatTargets((prev) => ({
        ...prev,
        [boatId]: {
          ...prev[boatId],
          lat: parseFloat(copiedPosition.lat.toFixed(6)),
          lng: parseFloat(copiedPosition.lng.toFixed(6)),
        },
      }));
    }
  };

  function ClickableMap() {
    useMapEvents({
      click: handleMapClick,
    });
    return null;
  }

  const handleBoatMarkerClick = (boatId) => {
    setTargetBoatId(boatId);
  };

  return (
    <div className="map-container">
      <h2>Autonomous Control</h2>

      {notification && (
        <div className="notification-popup">
          <p>{notification.message}</p>
        </div>
      )}

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
        center={mapCenter}
        zoom={14}
        style={{ width: "100%", height: "500px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <ClickableMap />
        {boats.map((b) => {
          if (b && typeof b.lat === "number" && typeof b.lng === "number") {
            const isSelected = b.boat_id === targetBoatId;
            const icon = isSelected ? selectedBoatIcon : boatIcon;
            const boatColor = getBoatColor(b.boat_id);

            return (
              <Marker
                key={b.boat_id}
                position={[
                  parseFloat(b.lat.toFixed(6)),
                  parseFloat(b.lng.toFixed(6)),
                ]}
                icon={icon}
                eventHandlers={{
                  click: () => handleBoatMarkerClick(b.boat_id),
                }}
              >
                <Popup>
                  <div>
                    <b>{b.boat_id}</b>
                    <br />
                    Latitude: {b.lat.toFixed(6)}
                    <br />
                    Longitude: {b.lng.toFixed(6)}
                    <hr />
                    <div>
                      <label>Target Latitude:</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={boatTargets[b.boat_id]?.lat || ""}
                        onChange={(e) => {
                          const value = parseFloat(
                            parseFloat(e.target.value).toFixed(6)
                          );
                          setBoatTargets((prev) => ({
                            ...prev,
                            [b.boat_id]: {
                              ...prev[b.boat_id],
                              lat: value,
                            },
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label>Target Longitude:</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={boatTargets[b.boat_id]?.lng || ""}
                        onChange={(e) => {
                          const value = parseFloat(
                            parseFloat(e.target.value).toFixed(6)
                          );
                          setBoatTargets((prev) => ({
                            ...prev,
                            [b.boat_id]: {
                              ...prev[b.boat_id],
                              lng: value,
                            },
                          }));
                        }}
                      />
                    </div>
                    <button
                      onClick={() => pasteCopiedPosition(b.boat_id)}
                      disabled={!copiedPosition}
                    >
                      Paste
                    </button>
                    <button
                      onClick={() => sendTargetCoordinatesForBoat(b.boat_id)}
                      disabled={!isConnected}
                    >
                      Send Target Coordinates
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          } else {
            console.warn(`Boat ${b.boat_id} has no valid location data.`);
            return null;
          }
        })}

        {/* Render boat trails */}
        {Object.keys(boatTrails).map((boatId) => (
          <Polyline
            key={boatId}
            positions={boatTrails[boatId]}
            pathOptions={{ color: getBoatColor(boatId) }}
          />
        ))}

        {selectedPosition && (
          <Marker position={selectedPosition} icon={selectedIcon}>
            <Popup>
              Navigation:
              <br />
              Boat: {targetBoatId || "No Available Boats"}
              <br />
              Latitude: {selectedPosition.lat.toFixed(6)}
              <br />
              Longitude: {selectedPosition.lng.toFixed(6)}
              <br />
              <button onClick={copySelectedPosition}>Copy</button>
              <button
                onClick={sendRouteToCurrentBoat}
                disabled={!isConnected || !targetBoatId}
              >
                Send Route
              </button>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default AutonomousControl;
