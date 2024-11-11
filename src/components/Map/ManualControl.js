// components/Map/ManualControl.js

import React, { useState, useEffect, useCallback, useContext } from "react";
import { Joystick } from "react-joystick-component";
import "./ManualControl.css";
import { useSocket } from "../../contexts/SocketContext";
import { BoatContext } from "../../contexts/BoatContext";
import { throttle } from "lodash";

function ManualControl() {
  const { socket, isConnected, setCommandMode } = useSocket();
  const { boats } = useContext(BoatContext);

  const [selectedBoatId, setSelectedBoatId] = useState("");
  const [rudderAngle, setRudderAngle] = useState(0);
  const [throttleValue, setThrottleValue] = useState(0);
  const commandMode = "manual";

  // Automatically select the first boat if no boat is selected
  useEffect(() => {
    if (!selectedBoatId && boats.length > 0) {
      setSelectedBoatId(boats[0].boat_id);
    }
  }, [boats, selectedBoatId]);

  // Set command mode to 'manual' when this component mounts
  useEffect(() => {
    if (setCommandMode) {
      setCommandMode("manual");
    }
  }, [setCommandMode]);

  const sendData = useCallback(
    throttle(() => {
      if (isConnected && socket) {
        const data = {
          boat_id: selectedBoatId,
          r: rudderAngle,
          th: throttleValue,
          command_mode: commandMode,
        };

        socket.emit("gui_data", data);
        console.log("Sent data:", data);
      } else {
        console.warn("Socket is not connected.");
      }
    }, 100),
    [
      isConnected,
      socket,
      rudderAngle,
      throttleValue,
      commandMode,
      selectedBoatId,
    ]
  );

  useEffect(() => {
    sendData();
  }, [rudderAngle, throttleValue, sendData]);

  const handleJoystickMove = (event) => {
    const newRudderAngle = Math.round(event.x * 90); // Horizontal for rudder angle
    const newThrottleValue = Math.round(event.y * 100); // Vertical for throttle (ESC)
    setRudderAngle(newRudderAngle);
    setThrottleValue(newThrottleValue);
  };

  const handleJoystickStop = () => {
    setRudderAngle(0);
    setThrottleValue(0);
  };

  const handleBoatSelect = (boat) => {
    setSelectedBoatId(boat.boat_id);
  };

  return (
    <div className="manual-control-container">
      <h2>Manual Control</h2>

      {!isConnected && <p className="warning-text">Not connected to server.</p>}

      {/* Boat Selection */}
      <div className="boat-selection">
        <label>Select Boat: </label>
        <select
          value={selectedBoatId}
          onChange={(e) => setSelectedBoatId(e.target.value)}
        >
          {boats.length > 0 ? (
            boats.map((boat) => (
              <option key={boat.boat_id} value={boat.boat_id}>
                {boat.boat_id}
              </option>
            ))
          ) : (
            <option>No boats available</option>
          )}
        </select>
      </div>

      <div className="controls-section">
        <div className="joystick-container">
          <Joystick
            size={150}
            baseColor="#ccc"
            stickColor="#555"
            move={handleJoystickMove}
            stop={handleJoystickStop}
            disabled={!isConnected}
          />
          <div className="joystick-values">
            <p>Rudder Angle: {rudderAngle}°</p>
            <p>Throttle: {throttleValue}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManualControl;
