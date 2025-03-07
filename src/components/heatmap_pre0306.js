// src/Window/HeatmapWindow.js

import React, { useEffect, useState, useRef, useContext } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import { BoatContext } from "../contexts/BoatContext"; // Import BoatContext
import axios from "axios"; // New: Import axios for API requests
import config from "../config.json"; // Import the config file

const HeatmapWindow = () => {
  //const { boats } = useContext(BoatContext); // Get boats data from context
  const [boats, setBoats] = useState([]); // New: State to store fetched boat data
  const [heatmapData, setHeatmapData] = useState([]);
  const [dataType, setDataType] = useState("temperature"); // 'chaos' or 'temperature'

  const legendRef = useRef(null);
  const [legendPosition, setLegendPosition] = useState({ x: null, y: null });

  // For dragging the legend
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const legendStartPos = useRef({ x: 0, y: 0 });

  // Custom boat icon
  const boatIcon = new L.Icon({
    iconUrl: "boat.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
  // New: useEffect from 
  useEffect(() => {
    const fetchBoatsData = async () => {
      try {
        const response = await axios.get(`http://${config.SERVER_IP}:3337/get_boat_data`);
        const filteredData = response.data.filter(
          (boat) => boat.lat !== 0 && boat.lng !== 0 && !isNaN(boat.lat) && !isNaN(boat.lng)
        );
        setBoats(filteredData);
      } catch (error) {
        console.error("Error fetching boat data:", error);
      }
    };
  
    fetchBoatsData();
  }, []);
  

  // Heatmap Layer Component
  const HeatmapLayer = () => {
    const map = useMap();

    useEffect(() => {
      if (heatmapData.length > 0) {
        const heatLayer = L.heatLayer(heatmapData, {
          radius: 50,
          blur: 50,
          maxZoom: 10,
        }).addTo(map);

        // Cleanup on unmount
        return () => {
          map.removeLayer(heatLayer);
        };
      }
    }, [map, heatmapData]);

    return null;
  };

  // Wind Layer Component with Interpolation
  const WindLayer = () => {
    const map = useMap();

    useEffect(() => {
      if (boats.length > 0) {
        const windMarkers = [];

        // Define a set of interpolation points (grid)
        const gridSize = 0.005;
        const latMin = Math.min(...boats.map((b) => b.lat || 0));
        const latMax = Math.max(...boats.map((b) => b.lat || 0));
        const lngMin = Math.min(...boats.map((b) => b.lng || 0));
        const lngMax = Math.max(...boats.map((b) => b.lng || 0));

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

          boats.forEach((boat) => {
            const distance = Math.sqrt(
              (boat.lat - point.lat) ** 2 + (boat.lng - point.lng) ** 2
            );
            const weight = 1 / (distance + 0.0001);

            const u = boat["u-wind"] || 0;
            const v = boat["v-wind"] || 0;

            sumU += u * weight;
            sumV += v * weight;
            weightSum += weight;
          });

          const avgU = sumU / weightSum;
          const avgV = sumV / weightSum;

          const magnitude = Math.sqrt(avgU ** 2 + avgV ** 2);
          const angle = (Math.atan2(avgV, avgU) * 180) / Math.PI;

          const arrowIcon = L.divIcon({
            html: `<div style="transform: rotate(${angle}deg); font-size: ${
              6 + magnitude * 3
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
    }, [map, boats]);

    return null;
  };

  // New: changed Boat Markers Component
  const BoatMarkers = () => {
    return (
      <>
        {boats.map((boat) => {
          if (boat.lat && boat.lng) {
            return (
              <Marker key={boat.boat_id} position={[boat.lat, boat.lng]} icon={boatIcon}>
                <Popup>
                  <b>{boat.boat_id}</b>
                  <br />
                  Latitude: {boat.lat.toFixed(6)}
                  <br />
                  Longitude: {boat.lng.toFixed(6)}
                  <br />
                  Temperature: {boat.temperature} °C
                  <br />
                  Wind Speed: {boat.wind_speed} m/s
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </>
    );
  };
  

  // Fix Leaflet's icon issue with Webpack
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

        const x = mapRect.right - legendRect.width - 20;
        const y = mapRect.bottom - legendRect.height - 20;

        setLegendPosition({ x, y });
      }
    }, [legendPosition.x, legendPosition.y]);

    const handleMouseDown = (e) => {
      isDragging.current = true;
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      legendStartPos.current = { x: legendPosition.x, y: legendPosition.y };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (isDragging.current) {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;

        let newX = legendStartPos.current.x + dx;
        let newY = legendStartPos.current.y + dy;

        const mapContainer = document.querySelector(".leaflet-container");
        const mapRect = mapContainer.getBoundingClientRect();
        const legendRect = legendRef.current.getBoundingClientRect();

        const minX = mapRect.left;
        const maxX = mapRect.right - legendRect.width;
        const minY = mapRect.top;
        const maxY = mapRect.bottom - legendRect.height;

        newX = Math.max(minX, Math.min(newX, maxX));
        newY = Math.max(minY, Math.min(newY, maxY));

        setLegendPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
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
        <strong>
          {dataType === "chaos" ? "xxxx Intensity" : "Temperature"}
        </strong>
        <div
          style={{
            width: "200px",
            height: "20px",
            background:
              dataType === "chaos"
                ? "linear-gradient(to right, blue, cyan, green, yellow, orange, red)"
                : "linear-gradient(to right, blue, green, yellow, orange, red)",
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

  const handleDataTypeChange = (event) => {
    setDataType(event.target.value);
  };

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <label>Select Data Type: </label>
        <select value={dataType} onChange={handleDataTypeChange}>
          <option value="chaos">Chaos Intensity</option>
          <option value="temperature">Temperature</option>
        </select>
      </div>
      <MapContainer
        center={[37.866942, -122.315452]} // Center the map around the base coordinates
        zoom={14} // Adjust zoom level for closer view
        style={{ height: "600px", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer />
        <WindLayer />
        <BoatMarkers /> {/* Add boat markers to the map */}
      </MapContainer>
      <ColorScaleLegend /> {/* Add the draggable color scale legend here */}
    </div>
  );
};

export default HeatmapWindow;
