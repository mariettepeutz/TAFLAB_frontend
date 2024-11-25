import React, { useState, useEffect, useContext, useCallback } from "react";
import { BoatContext } from "../../contexts/BoatContext";
import { useSocket } from "../../contexts/SocketContext";
import { useRecording } from "../../contexts/RecordingContext";
import Modal from "react-modal";
import { FaTimes } from "react-icons/fa";
import "./DataTransfer.css";

Modal.setAppElement("#root");

function DataTransfer() {
  const { boats, setBoats } = useContext(BoatContext);
  const [selectedBoatId, setSelectedBoatId] = useState(null);
  const { socket } = useSocket();

  // Use the RecordingContext
  const {
    isRecordingAll,
    startRecordingAll,
    stopRecordingAll,
    recordingBoats,
    startRecordingBoat,
    stopRecordingBoat,
    addRecordedData,
  } = useRecording();

  // Memoize handleBoatData to prevent issues with event listeners
  const handleBoatData = useCallback(
    (data) => {
      // Update boats data
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
              },
            },
          ];
        }
      });

      // Add data to recording context
      addRecordedData({ ...data });
    },
    [setBoats, addRecordedData]
  );

  useEffect(() => {
    if (socket) {
      socket.on("boat_data", handleBoatData);

      return () => {
        socket.off("boat_data", handleBoatData);
      };
    }
  }, [socket, handleBoatData]);

  const openModal = (boatId) => {
    setSelectedBoatId(boatId);
  };

  const closeModal = () => {
    setSelectedBoatId(null);
  };

  const handleRecordAllButtonClick = () => {
    if (isRecordingAll) {
      stopRecordingAll();
    } else {
      startRecordingAll();
    }
  };

  const handleRecordBoatButtonClick = (boatId) => {
    if (recordingBoats[boatId]) {
      stopRecordingBoat(boatId);
    } else {
      startRecordingBoat(boatId);
    }
  };

  // Get the selected boat data from the boats array
  const selectedBoat = boats.find((boat) => boat.boat_id === selectedBoatId);

  return (
    <div>
      <h2>Data Transfer</h2>
      <div className="button-group">
        <button
          className="record-button"
          onClick={handleRecordAllButtonClick}
          style={{
            backgroundColor: isRecordingAll ? "red" : "green",
            color: "white",
          }}
        >
          {isRecordingAll ? "Stop Recording All" : "Start Recording All"}
        </button>
      </div>
      <div className="boat-cards-container">
        {boats.map((boat) => (
          <div key={boat.boat_id} className="boat-card">
            <div className="boat-card-header">
              <h3>{boat.boat_id}</h3>
            </div>
            <div className="boat-card-body">
              <p>Latitude: {boat.data?.latitude || "N/A"}</p>
              <p>Longitude: {boat.data?.longitude || "N/A"}</p>
            </div>
            <div className="boat-card-footer">
              <button
                className="record-button"
                onClick={() => handleRecordBoatButtonClick(boat.boat_id)}
                style={{
                  backgroundColor: recordingBoats[boat.boat_id]
                    ? "red"
                    : "green",
                  color: "white",
                }}
              >
                {recordingBoats[boat.boat_id]
                  ? "Stop Recording"
                  : "Start Recording"}
              </button>
              <button
                className="details-button"
                onClick={() => openModal(boat.boat_id)}
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedBoat && (
        <Modal
          isOpen={!!selectedBoatId}
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
            <p>
              <strong>Boat ID:</strong> {selectedBoat.boat_id}
            </p>
            {selectedBoat.status && (
              <p>
                <strong>Status:</strong> {selectedBoat.status}
              </p>
            )}
            {selectedBoat.last_seen && (
              <p>
                <strong>Last Seen:</strong>{" "}
                {new Date(selectedBoat.last_seen * 1000).toLocaleString()}
              </p>
            )}
            {selectedBoat.notification && (
              <p>
                <strong>Notification:</strong> {selectedBoat.notification}
              </p>
            )}
            {selectedBoat.data && (
              <>
                <h3>Data:</h3>
                {Object.entries(selectedBoat.data).map(([key, value]) => (
                  <div key={key}>
                    {typeof value === "object" && value !== null ? (
                      <>
                        <strong>{key}:</strong>
                        <div style={{ marginLeft: "20px" }}>
                          {Object.entries(value).map(([subKey, subValue]) => (
                            <p key={subKey}>
                              <strong>{subKey}:</strong> {subValue}
                            </p>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p>
                        <strong>{key}:</strong> {value}
                      </p>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="button-group">
            <button
              className="record-button"
              onClick={() => handleRecordBoatButtonClick(selectedBoat.boat_id)}
              style={{
                backgroundColor: recordingBoats[selectedBoat.boat_id]
                  ? "red"
                  : "green",
                color: "white",
              }}
            >
              {recordingBoats[selectedBoat.boat_id]
                ? "Stop Recording"
                : "Start Recording"}
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
            <button className="export-csv-button" onClick={() => {}}>
              Export to CSV
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DataTransfer;
