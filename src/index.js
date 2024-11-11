// index.js

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { BoatProvider } from "./contexts/BoatContext";
import { SocketProvider } from "./contexts/SocketContext";
import { ThemeProvider } from "./contexts/ThemeContext";

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider>
      <SocketProvider>
        <BoatProvider>
          <App />
        </BoatProvider>
      </SocketProvider>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
