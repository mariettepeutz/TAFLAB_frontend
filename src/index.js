// index.js
import React from "react";
import ReactDOM from "react-dom";
import { SocketProvider } from "./Context/socketContext"; // Import SocketProvider
import { BoatProvider } from "./Context/boatContext"; // Import BoatProvider
import App from "./App";

ReactDOM.render(
  <SocketProvider>
    <BoatProvider>
      <App />
    </BoatProvider>
  </SocketProvider>,
  document.getElementById("root")
);
