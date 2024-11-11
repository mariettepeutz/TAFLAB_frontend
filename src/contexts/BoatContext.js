import React, { createContext, useState, useEffect } from "react";
import { useSocket } from "./SocketContext";

export const BoatContext = createContext();

export const BoatProvider = ({ children }) => {
  const [boats, setBoats] = useState([]);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (socket && isConnected) {
      console.log("Socket is connected, setting up boat data listeners.");

      const handleBoatLocations = (data) => {
        console.log("Received boat locations:", data);
        setBoats(data);
      };

      // Listen for 'boat_locations' event from the backend
      socket.on("boat_locations", handleBoatLocations);

      // Request the list of active boats from the backend
      socket.emit("request_boat_list");

      return () => {
        socket.off("boat_locations", handleBoatLocations);
      };
    } else {
      console.log("Socket is not connected.");
    }
  }, [socket, isConnected]);

  useEffect(() => {
    if (!isConnected) {
      setBoats([]); // Clear boats when disconnected
    }
  }, [isConnected]);

  return (
    <BoatContext.Provider value={{ boats }}>{children}</BoatContext.Provider>
  );
};
