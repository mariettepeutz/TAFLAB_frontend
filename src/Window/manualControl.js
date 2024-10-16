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
  { id: 1, name: "BoatPi 1", lat: 37.864, lng: -122.32 },
  { id: 2, name: "BoatPi 2", lat: 37.869, lng: -122.323 },
  { id: 3, name: "BoatPi 3", lat: 37.8675, lng: -122.319 },
  { id: 4, name: "BoatPi 4", lat: 37.8681, lng: -122.32 },
  { id: 5, name: "BoatPi 5", lat: 37.87, lng: -122.325 },
];

function ManualControl() {
  const { socket, isConnected } = useSocket();

  const [selectedRobot, setSelectedRobot] = useState("all");
  const [rudderAngle, setRudderAngle] = useState(90);
  const [throttle, setThrottle] = useState(50);
  const [mapCenter, setMapCenter] = useState({ lat: 37.8682, lng: -122.3177 });

  const sendData = useCallback(() => {
    if (isConnected && socket) {
      const data = { rudder_angle: rudderAngle, throttle };
      socket.emit("gui_data", data);
      console.log("Sent data:", data);
    } else {
      console.warn("Socket is not connected.");
    }
  }, [isConnected, socket, rudderAngle, throttle]);

  const handleRudderMove = (event) => {
    const angle = Math.round(((event.y + 1) / 2) * 180);
    setRudderAngle(angle);
    sendData();
  };

  const handleThrottleMove = (event) => {
    const throttleValue = Math.round(((event.y + 1) / 2) * 100);
    setThrottle(throttleValue);
    sendData();
  };

  const handleRudderStop = () => {
    setRudderAngle(90);
    sendData();
  };

  const handleThrottleStop = () => {
    setThrottle(50);
    sendData();
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
    if (selectedRobot === "all") {
      return robots.map((robot) => (
        <Marker
          key={robot.id}
          position={[robot.lat, robot.lng]}
          icon={boatIcon}
        >
          <Tooltip direction="bottom" offset={[0, 0]} permanent>
            {robot.name}
          </Tooltip>
          <Popup>{robot.name}'s Current Location</Popup>
        </Marker>
      ));
    } else {
      const robot = robots.find((r) => r.id === parseInt(selectedRobot));
      return (
        robot && (
          <Marker position={[robot.lat, robot.lng]} icon={boatIcon}>
            <Tooltip direction="bottom" offset={[0, 10]} permanent>
              {robot.name}
            </Tooltip>
            <Popup>{robot.name}'s Current Location</Popup>
          </Marker>
        )
      );
    }
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
      </div>
    </div>
  );
}

export default ManualControl;
