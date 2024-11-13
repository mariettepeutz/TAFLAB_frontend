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
  };

  useEffect(() => {
    if (socket && selectedBoat) {
      const handleBoatData = (data) => {
        if (data.boat_id === selectedBoat.boat_id) {
          const time_now = new Date().toISOString();

          setSelectedBoat((prevBoat) => ({
            ...prevBoat,
            data: {
              ...prevBoat.data,
              ...data.data,
              time_now,
            },
          }));

          if (isRecording) {
            setRecordedData((prevData) => [...prevData, { ...data, time_now }]);
          }
        }
      };

      socket.on("boat_data", handleBoatData);

      return () => {
        socket.off("boat_data", handleBoatData);
      };
    }
  }, [socket, selectedBoat, isRecording]);

  useEffect(() => {
    if (!isRecording && recordedData.length > 0) {
      saveDataToFile();
      setRecordedData([]);
    }
  }, [isRecording]);

  const saveDataToFile = () => {
    const fileType = "json";

    // Use the last known boat ID if `selectedBoat` is null
    const boatId = selectedBoat
      ? selectedBoat.boat_id
      : recordedData[0]?.boat_id;

    if (fileType === "json") {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(recordedData, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `boat_data_${boatId}_${timestamp}.json`;

      link.click();
    } else if (fileType === "csv") {
      const csvString = convertToCSV(recordedData);
      const csvData = `data:text/csv;charset=utf-8,${encodeURIComponent(
        csvString
      )}`;
      const link = document.createElement("a");
      link.href = csvData;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `boat_data_${boatId}_${timestamp}.csv`;

      link.click();
    }
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return "";

    const flattenData = data.map((entry) => {
      const flatData = { boat_id: entry.boat_id, ...entry.data };
      if (flatData.magnetic_field) {
        flatData.magnetic_field_x = flatData.magnetic_field.x;
        flatData.magnetic_field_y = flatData.magnetic_field.y;
        flatData.magnetic_field_z = flatData.magnetic_field.z;
        delete flatData.magnetic_field;
      }
      return flatData;
    });

    const keys = Object.keys(flattenData[0]);
    const header = keys.join(",");
    const rows = flattenData.map((entry) =>
      keys.map((key) => entry[key]).join(",")
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
              <p>
                Latitude:{" "}
                {boat.data && boat.data.latitude ? boat.data.latitude : "N/A"}
              </p>
              <p>
                Longitude:{" "}
                {boat.data && boat.data.longitude ? boat.data.longitude : "N/A"}
              </p>
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
      {isRecording && (
        <button
          className="record-button"
          onClick={handleRecordButtonClick}
          style={{
            backgroundColor: "red",
            color: "white",
            marginTop: "20px",
          }}
        >
          Stop Recording
        </button>
      )}
    </div>
  );
}

export default DataTransfer;
