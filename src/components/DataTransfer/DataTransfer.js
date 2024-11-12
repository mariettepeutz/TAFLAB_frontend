// components/DataTransfer/DataTransfer.js

import React, { useState, useEffect, useContext } from "react";
import { BoatContext } from "../../contexts/BoatContext";
import { useSocket } from "../../contexts/SocketContext";
import Modal from "react-modal";
import { FaTimes } from "react-icons/fa";
import "./DataTransfer.css";

// Set the app element for accessibility
Modal.setAppElement("#root");

function DataTransfer() {
  const { boats } = useContext(BoatContext);
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedData] = useState([]);
  const { socket } = useSocket();

  const openModal = (boat) => {
    setSelectedBoat(boat);
  };

  const closeModal = () => {
    setSelectedBoat(null);
    setIsRecording(false);
    setRecordedData([]);
  };

  useEffect(() => {
    if (socket && selectedBoat) {
      const handleBoatData = (data) => {
        // Check if the data is for the selected boat
        if (data.boat_id === selectedBoat.boat_id) {
          // Update the selected boat's data
          setSelectedBoat((prevBoat) => ({
            ...prevBoat,
            data: {
              ...prevBoat.data,
              ...data.data,
            },
          }));

          // If recording is active, collect the data
          if (isRecording) {
            setRecordedData((prevData) => [...prevData, data]);
          }
        }
      };

      socket.on("boat_data", handleBoatData);

      return () => {
        socket.off("boat_data", handleBoatData);
      };
    }
  }, [socket, selectedBoat, isRecording]);

  // Detect when recording stops or boat disconnects
  useEffect(() => {
    if (!isRecording && recordedData.length > 0) {
      // Save data to file
      saveDataToFile();
      // Clear recorded data
      setRecordedData([]);
    }
  }, [isRecording]);

  const saveDataToFile = () => {
    const fileType = "json"; // Change to 'csv' if you prefer CSV

    if (fileType === "json") {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(recordedData, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `boat_data_${selectedBoat.boat_id}_${timestamp}.json`;

      link.click();
    } else if (fileType === "csv") {
      const csvString = convertToCSV(recordedData);
      const csvData = `data:text/csv;charset=utf-8,${encodeURIComponent(
        csvString
      )}`;
      const link = document.createElement("a");
      link.href = csvData;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `boat_data_${selectedBoat.boat_id}_${timestamp}.csv`;

      link.click();
    }
  };

  // Helper function to convert JSON to CSV
  const convertToCSV = (data) => {
    if (data.length === 0) return "";

    const keys = Object.keys(data[0].data);
    const header = keys.join(",");
    const rows = data.map((entry) =>
      keys.map((key) => entry.data[key]).join(",")
    );

    return [header, ...rows].join("\n");
  };

  const handleRecordButtonClick = () => {
    setIsRecording((prev) => !prev);
  };

  return (
    <div>
      <h2>Data Transfer</h2>
      <div className="boat-cards-container">
        {boats.map((boat) => (
          <div
            key={boat.boat_id}
            className="boat-card"
            onClick={() => openModal(boat)}
          >
            <div className="boat-card-header">
              <h3>{boat.boat_id}</h3>
            </div>
            <div className="boat-card-body">
              <p>Latitude: {boat.location.latitude}</p>
              <p>Longitude: {boat.location.longitude}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedBoat && (
        <Modal
          isOpen={!!selectedBoat}
          onRequestClose={closeModal}
          contentLabel="Boat Details"
          className="boat-modal"
          overlayClassName="boat-modal-overlay"
        >
          <button className="modal-close-button" onClick={closeModal}>
            <FaTimes />
          </button>
          <h2>{selectedBoat.boat_id} Details</h2>
          <div className="boat-details">
            <h3>Boat Info:</h3>
            {Object.entries(selectedBoat)
              .filter(([key]) => key !== "data")
              .map(([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong> {JSON.stringify(value)}
                </p>
              ))}
            {selectedBoat.data && (
              <>
                <h3>Data:</h3>
                {Object.entries(selectedBoat.data).map(([key, value]) => (
                  <p key={key}>
                    <strong>{key}:</strong> {JSON.stringify(value)}
                  </p>
                ))}
              </>
            )}
          </div>
          <div className="button-group">
            <button
              className="record-button"
              onClick={handleRecordButtonClick}
              style={{
                backgroundColor: isRecording ? "red" : "green",
                color: "white",
              }}
            >
              {isRecording ? "Stop Recording" : "Start Recording"}
            </button>
            <button
              className="send-to-cloud-button"
              onClick={() => {
                /* Placeholder for send to cloud */
              }}
            >
              Send to Cloud
            </button>
            <button
              className="get-from-cloud-button"
              onClick={() => {
                /* Placeholder for get from cloud */
              }}
            >
              Get from Cloud
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DataTransfer;
