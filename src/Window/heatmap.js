// src/Window/HeatmapWindow.js

import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";

const HeatmapWindow = () => {
  const [boatsData, setBoatsData] = useState([]);
  const [chaosData, setChaosData] = useState([]);

  const legendRef = useRef(null); // Reference to the legend element
  const [legendPosition, setLegendPosition] = useState({ x: null, y: null }); // Position of the legend

  // For dragging
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const legendStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Fetch the boat data from boats.json
    fetch("/boats.json")
      .then((response) => response.json())
      .then((data) => {
        setBoatsData(data);

        // Convert data to chaos data format for heatmap using the chaos property
        const chaos = data.map(({ lat, lng, chaos }) => [lat, lng, chaos]); // Use chaos for intensity
        setChaosData(chaos);
      })
      .catch((error) => console.error("Error fetching boat data:", error));
  }, []);

  // Heatmap Layer Component
  const HeatmapLayer = () => {
    const map = useMap();

    useEffect(() => {
      if (chaosData.length > 0) {
        const heatLayer = L.heatLayer(chaosData, {
          radius: 40,
          blur: 50,
          maxZoom: 5,
        }).addTo(map);

        // Cleanup on unmount
        return () => {
          map.removeLayer(heatLayer);
        };
      }
    }, [map, chaosData]);

    return null;
  };

  // Wind Layer Component with Interpolation
  const WindLayer = () => {
    const map = useMap();

    useEffect(() => {
      if (boatsData.length > 0) {
        const windMarkers = [];

        // Define a set of interpolation points (grid)
        const gridSize = 0.002; // Adjust grid size for desired density
        const latMin = Math.min(...boatsData.map((b) => b.lat));
        const latMax = Math.max(...boatsData.map((b) => b.lat));
        const lngMin = Math.min(...boatsData.map((b) => b.lng));
        const lngMax = Math.max(...boatsData.map((b) => b.lng));

        const interpolationPoints = [];

        for (let lat = latMin; lat <= latMax; lat += gridSize) {
          for (let lng = lngMin; lng <= lngMax; lng += gridSize) {
            interpolationPoints.push({ lat, lng });
          }
        }

        // Interpolate wind at each point using Inverse Distance Weighting (IDW)
        interpolationPoints.forEach((point) => {
          let sumU = 0;
          let sumV = 0;
          let weightSum = 0;

          boatsData.forEach((boat) => {
            const distance = Math.sqrt(
              (boat.lat - point.lat) ** 2 + (boat.lng - point.lng) ** 2
            );
            const weight = 1 / (distance + 0.0001); // Avoid division by zero

            sumU += boat.u * weight;
            sumV += boat.v * weight;
            weightSum += weight;
          });

          const avgU = sumU / weightSum;
          const avgV = sumV / weightSum;

          const magnitude = Math.sqrt(avgU * avgU + avgV * avgV);
          const angle = (Math.atan2(avgV, avgU) * 180) / Math.PI;

          const arrowIcon = L.divIcon({
            html: `<div style="transform: rotate(${angle}deg); font-size: ${
              6 + magnitude * 15
            }px; color: green;">&#8593;</div>`,
            className: "",
          });

          const marker = L.marker([point.lat, point.lng], {
            icon: arrowIcon,
          }).addTo(map);
          windMarkers.push(marker);
        });

        // Cleanup on unmount
        return () => {
          windMarkers.forEach((marker) => map.removeLayer(marker));
        };
      }
    }, [map, boatsData]);

    return null;
  };

  // Fix leaflet's icon issue with webpack
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });

  // Color Scale Legend Component with drag functionality
  const ColorScaleLegend = () => {
    useEffect(() => {
      if (
        legendRef.current &&
        legendPosition.x === null &&
        legendPosition.y === null
      ) {
        const mapContainer = document.querySelector(".leaflet-container");
        const mapRect = mapContainer.getBoundingClientRect();
        const legendRect = legendRef.current.getBoundingClientRect();

        const x = mapRect.right - legendRect.width - 20; // 20px from right edge
        const y = mapRect.bottom - legendRect.height - 20; // 20px from bottom edge

        setLegendPosition({ x, y });
      }
    }, [legendPosition.x, legendPosition.y]);

    const handleMouseDown = (e) => {
      isDragging.current = true;
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      legendStartPos.current = { x: legendPosition.x, y: legendPosition.y };

      // Add event listeners to document
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      e.preventDefault(); // Prevent text selection
    };

    const handleMouseMove = (e) => {
      if (isDragging.current) {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;

        let newX = legendStartPos.current.x + dx;
        let newY = legendStartPos.current.y + dy;

        // Get map container dimensions
        const mapContainer = document.querySelector(".leaflet-container");
        const mapRect = mapContainer.getBoundingClientRect();
        const legendRect = legendRef.current.getBoundingClientRect();

        // Constrain newX and newY within map bounds
        const minX = mapRect.left;
        const maxX = mapRect.right - legendRect.width;
        const minY = mapRect.top;
        const maxY = mapRect.bottom - legendRect.height;

        // Ensure the legend stays within the map boundaries
        newX = Math.max(minX, Math.min(newX, maxX));
        newY = Math.max(minY, Math.min(newY, maxY));

        setLegendPosition({
          x: newX,
          y: newY,
        });
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;

      // Remove event listeners
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    return (
      <div
        ref={legendRef}
        style={{
          position: "absolute",
          top: `${legendPosition.y}px`,
          left: `${legendPosition.x}px`,
          zIndex: 1000,
          background: "white",
          padding: "10px",
          borderRadius: "4px",
          boxShadow: "0 0 15px rgba(0,0,0,0.2)",
          cursor: "grab",
          userSelect: "none",
        }}
        onMouseDown={handleMouseDown}
      >
        <strong>Chaos Intensity</strong>
        <div
          style={{
            width: "200px",
            height: "20px",
            background:
              "linear-gradient(to right, blue, cyan, green, yellow, orange, red)", // Horizontal gradient
            border: "1px solid black",
            marginTop: "10px",
          }}
        ></div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            marginTop: "5px",
          }}
        >
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <MapContainer
        center={[37.8682, -122.3177]} // Center the map around Berkeley, CA
        zoom={14} // Adjust zoom level for closer view
        style={{ height: "600px", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer />
        <WindLayer />
      </MapContainer>
      <ColorScaleLegend /> {/* Add the draggable color scale legend here */}
    </div>
  );
};

export default HeatmapWindow;
