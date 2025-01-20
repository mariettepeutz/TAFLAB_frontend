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
  const [sailAngle, setSailAngle] = useState(0);
  const [throttleValue, setThrottleValue] = useState(50);

  const rudderAngleRef = useRef(rudderAngle);
  const sailAngleRef = useRef(sailAngle);
  const throttleValueRef = useRef(throttleValue);

  const intervalId = useRef(null);
  const commandMode = "mnl";
  const intervalTime = 500; // 2Hz interval

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
          s: sailAngleRef.current,
        };
        socket.emit("gui_data", data);
        console.log("Sent latest data:", data);
      }, intervalTime);
    }
  };

  const stopSendingData = () => {
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  };

  const handleRudderJoystickMove = (event) => {
    const newRudderAngle = Math.round(event.x * 90 + 90);

    setRudderAngle(newRudderAngle);
    rudderAngleRef.current = newRudderAngle;

    startSendingData();
  };

  const handleSailJoystickMove = (event) => {
    const newSailAngle = Math.round(event.x * 90 + 90);

    setSailAngle(newSailAngle);
    sailAngleRef.current = newSailAngle;

    startSendingData();
  };

  const handleThrottleChange = (event) => {
    const newThrottleValue = parseInt(event.target.value, 10);

    setThrottleValue(newThrottleValue);
    throttleValueRef.current = newThrottleValue;

    startSendingData();
  };

  const handleJoystickStop = () => {
    stopSendingData();

    if (socket && isConnected) {
      const zeroData = {
        id: selectedBoatId,
        md: commandMode,
        r: rudderAngle,
        th: throttleValue,
        s: sailAngle,
      };
      socket.emit("gui_data", zeroData);
      console.log("Sent stop command with current values:", zeroData);
    }
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
        {/* Joystick for rudder */}
        <div className="joystick-container">
          <h3>Rudder</h3>
          <Joystick
            size={150}
            baseColor="#ccc"
            stickColor="#555"
            move={handleRudderJoystickMove}
            stop={handleJoystickStop}
            disabled={!isConnected}
          />
          <div className="joystick-values">
            <p>Rudder Angle: {rudderAngle}°</p>
          </div>
        </div>

        {/* Joystick for sail */}
        <div className="joystick-container">
          <h3>Sail</h3>
          <Joystick
            size={150}
            baseColor="#ccc"
            stickColor="#555"
            move={handleSailJoystickMove}
            stop={handleJoystickStop}
            disabled={!isConnected}
          />
          <div className="joystick-values">
            <p>Sail Angle: {sailAngle}°</p>
          </div>
        </div>

        {/* Vertical throttle slider */}
        <div className="slider-container">
          <h3>Throttle</h3>
          <input
            type="range"
            min="0"
            max="100"
            value={throttleValue}
            onChange={handleThrottleChange}
            className="vertical-slider"
            style={{ writingMode: "bt-lr" }}
          />
          <div className="slider-values">
            <p>Throttle: {throttleValue}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManualControl;
