// index.js
import React from "react";
import ReactDOM from "react-dom";
import { SocketProvider } from "./Context/socketContext"; // Import SocketProvider
import App from "./App";

ReactDOM.render(
  <SocketProvider>
    <App />
  </SocketProvider>,
  document.getElementById("root")
);
