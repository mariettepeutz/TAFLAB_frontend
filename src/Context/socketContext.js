// Context/socketContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";

// Create a context
const SocketContext = createContext();

// Create a provider component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedServer, setSelectedServer] = useState("");
  const [commandMode, setCommandMode] = useState("manual"); // Added commandMode state

  const connect = (serverUrl) => {
    if (socket) {
      socket.disconnect();
    }

    console.log(`Connecting to ${serverUrl}...`);
    const newSocket = io(serverUrl, {
      transports: ["websocket"],
      reconnection: false,
      forceNew: true,
    });

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server.");
      setIsConnected(true);
      setSocket(newSocket); // Ensure socket is set after connection
      setSelectedServer(serverUrl);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server.");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setIsConnected(false);
    });

    setSocket(newSocket);
    setSelectedServer(serverUrl);
  };

  const disconnect = () => {
    if (socket) {
      console.log("Disconnecting...");
      socket.disconnect();
      setIsConnected(false);
      setSocket(null);
      setSelectedServer("");
    }
  };

  // Clean up the socket when the component is unmounted
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  // Provide socket, isConnected, connect, disconnect, selectedServer, commandMode via context
  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        connect,
        disconnect,
        selectedServer,
        setSelectedServer,
        commandMode,
        setCommandMode, // Added setCommandMode to context
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = () => useContext(SocketContext);
