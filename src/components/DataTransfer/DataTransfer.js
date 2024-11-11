// components/DataTransfer/DataTransfer.js

import React, { useState, useContext } from "react";
import { BoatContext } from "../../contexts/BoatContext";
import Modal from "react-modal";
import { FaTimes } from "react-icons/fa";
import "./DataTransfer.css";

// Set the app element for accessibility
Modal.setAppElement("#root");

function DataTransfer() {
  const { boats } = useContext(BoatContext);
  const [selectedBoat, setSelectedBoat] = useState(null);

  const openModal = (boat) => {
    setSelectedBoat(boat);
  };

  const closeModal = () => {
    setSelectedBoat(null);
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
              <p>Latitude: {boat.lat}</p>
              <p>Longitude: {boat.lng}</p>
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
            {Object.entries(selectedBoat).map(([key, value]) => (
              <p key={key}>
                <strong>{key}:</strong> {JSON.stringify(value)}
              </p>
            ))}
          </div>
          <div className="button-group">
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
