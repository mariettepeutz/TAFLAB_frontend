import React, { useState, useEffect } from "react";
import "./styles.css"; // Importing the separate CSS file
import io from "socket.io-client";

// Replace '<raspberry-pi-ip>' with your Raspberry Pi's IP address or 'localhost' if testing locally
const socket = io("http://localhost:3333", { transports: ["websocket"] });

function App() {
  const [angle, setAngle] = useState(90); // Start at 90 degrees as a middle point

  useEffect(() => {
    // Connect to the WebSocket server when the component mounts
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    // Clean up the connection when the component unmounts
    return () => {
      socket.disconnect();
      console.log("Disconnected from WebSocket server");
    };
  }, []);

  const sendAngle = () => {
    // Send the angle to the backend via WebSocket
    socket.emit("joystick_input", angle);
    console.log(`Sent angle: ${angle}`);
  };

  return (
    <div className="app-container">
      <h1>Servo Angle Controller</h1>
      <div className="slider-container">
        <label htmlFor="angleSlider">Set Angle: {angle}°</label>
        <input
          id="angleSlider"
          type="range"
          min="0"
          max="180"
          value={angle}
          onChange={(e) => setAngle(e.target.value)}
          className="slider"
        />
      </div>
      <button onClick={sendAngle} className="send-button">
        Send Angle
      </button>
    </div>
  );
}

export default App;
