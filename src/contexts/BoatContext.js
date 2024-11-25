// contexts/BoatContext.js

import React, { createContext, useState, useEffect, useCallback } from "react";
import { useSocket } from "./SocketContext";

export const BoatContext = createContext();

export const BoatProvider = ({ children }) => {
  const [boats, setBoats] = useState([]);
  const { socket } = useSocket();

  const handleBoatData = useCallback(
    (data) => {
      const time_now = new Date().toISOString();

      setBoats((prevBoats) => {
        const existingBoatIndex = prevBoats.findIndex(
          (boat) => boat.boat_id === data.boat_id
        );

        if (existingBoatIndex !== -1) {
          // Update existing boat
          const updatedBoats = [...prevBoats];
          updatedBoats[existingBoatIndex] = {
            ...updatedBoats[existingBoatIndex],
            data: {
              ...updatedBoats[existingBoatIndex].data,
              ...data.data,
              time_now,
            },
          };
          return updatedBoats;
        } else {
          // Add new boat
          return [
            ...prevBoats,
            {
              boat_id: data.boat_id,
              data: {
                ...data.data,
                time_now,
              },
            },
          ];
        }
      });
    },
    [setBoats]
  );

  useEffect(() => {
    if (socket) {
      socket.on("boat_data", handleBoatData);

      return () => {
        socket.off("boat_data", handleBoatData);
      };
    }
  }, [socket, handleBoatData]);

  return (
    <BoatContext.Provider value={{ boats, setBoats }}>
      {children}
    </BoatContext.Provider>
  );
};
