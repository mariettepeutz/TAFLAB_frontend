// NotificationBanner.js

import React from "react";
import "./NotificationBanner.css";

function NotificationBanner({ message, onClose }) {
  return (
    <div className="notification-banner">
      <p>{message}</p>
      <button className="close-button" onClick={onClose}>
        &times;
      </button>
    </div>
  );
}

export default NotificationBanner;
