// components/Map/ManualControl.js

import React, { useState, useEffect, useContext, useRef } from "react";
import { Joystick } from "react-joystick-component";
import "./ManualControl.css";
import { useSocket } from "../../contexts/SocketContext";
import { BoatContext } from "../../contexts/BoatContext";

function ManualControl() {
  const { socket, isConnected, setCommandMode } = useSocket();
  const { boats } = useContext(BoatContext);

  const [selectedBoatId, setSelectedBoatId] = useState("");
  const [rudderAngle, setRudderAngle] = useState(0);
  const [throttleValue, setThrottleValue] = useState(0);

  const rudderAngleRef = useRef(rudderAngle);
  const throttleValueRef = useRef(throttleValue);
  const intervalId = useRef(null);
  const commandMode = "mnl";

  const intervalTime = "500"; //2hz interval

  useEffect(() => {
    if (!selectedBoatId && boats.length > 0) {
      setSelectedBoatId(boats[0].boat_id);
    }
  }, [boats, selectedBoatId]);

  useEffect(() => {
    if (setCommandMode) {
      setCommandMode("mnl");
    }
  }, [setCommandMode]);

  const startSendingData = () => {
    if (!intervalId.current && isConnected && socket) {
      intervalId.current = setInterval(() => {
        const data = {
          id: selectedBoatId,
          md: commandMode,
          r: rudderAngleRef.current,
          th: throttleValueRef.current,
        };
        socket.emit("gui_data", data);
        console.log("Sent latest data:", data);
      }, intervalTime); // Send data every 1 second
    }
  };

  const stopSendingData = () => {
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  };

  const handleJoystickMove = (event) => {
    const newRudderAngle = Math.round(event.x * 90);
    const newThrottleValue = Math.round(event.y * 100);

    setRudderAngle(newRudderAngle);
    setThrottleValue(newThrottleValue);

    // Update refs to ensure interval sends latest values
    rudderAngleRef.current = newRudderAngle;
    throttleValueRef.current = newThrottleValue;

    startSendingData();
  };

  const handleJoystickStop = () => {
    setRudderAngle(0);
    setThrottleValue(0);
    rudderAngleRef.current = 0;
    throttleValueRef.current = 0;
    stopSendingData();
  };

  useEffect(() => {
    return () => stopSendingData(); // Cleanup interval on unmount
  }, []);

  return (
    <div className="manual-control-container">
      <header className="control-header">
        <h2>Manual Control</h2>
        <div className="boat-selection">
          <label>Select Boat:</label>
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
      </header>

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
