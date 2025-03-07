// components/Map/HeatmapWindow.js
import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import Papa from "papaparse";
import "./HeatmapWindow.css";
import axios from "axios"; 
import config from "../../config.json"; 



const HeatmapWindow = () => {
  // Measurement type selector: "temperature" or "chaos" (used here for wind velocity).
  const [dataType, setDataType] = useState("temperature");
  // Store CSV data (each row is an object with keys matching the CSV headers).
  const [boatsData, setBoatsData] = useState([]);
  const [tables, setTables] = useState([]); // Store available tables
  const [selectedTable, setSelectedTable] = useState(""); // Currently selected table

  // Heatmap data: array of [lat, lng, value].
  const [heatmapData, setHeatmapData] = useState([]);
  // Filtered snapshots (one per boat) based on the selected time.
  const [filteredBoats, setFilteredBoats] = useState([]);
  // Time slider: current selected time and overall range.
  const [selectedTime, setSelectedTime] = useState(null);
  const [timeRange, setTimeRange] = useState({ min: null, max: null });
 
  // New state: show or hide boat markers (boat logo).
  const [showBoatMarkers, setShowBoatMarkers] = useState(true);

  // For dragging the legend.
  const legendRef = useRef(null);
  const [legendPosition, setLegendPosition] = useState({ x: null, y: null });
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const legendStartPos = useRef({ x: 0, y: 0 });

  // Custom boat icon.
  const boatIcon = new L.Icon({
    iconUrl: "boat.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

// Fetch available tables when the component loads
useEffect(() => {
  const fetchTables = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/get_boat_data/"${selectedTable}"`);
      console.log("Available tables:", response.data);
      
      if (response.data.length > 0) {
        setTables(response.data);
        setSelectedTable(response.data[response.data.length - 1]); // Select latest table by default
      }
    } catch (error) {
      console.error("Error fetching table list:", error);
    }
  };

  fetchTables();
}, []); // Runs once when the component mounts

// Fetch boat data when a table is selected
useEffect(() => {
  if (!selectedTable) return; // Don't run if no table is selected

  const fetchBoatData = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/table/"${selectedTable}"`);
      console.log(`Fetched data for ${selectedTable}:`, response.data);
      setBoatsData(response.data);
    } catch (error) {
      console.error(`Error fetching boat data for table ${selectedTable}:`, error);
    }
  };

  fetchBoatData();
}, [selectedTable]); // Runs whenever selectedTable changes

  // New: use latest table data for heatmap
  useEffect(() => {
    if (!boatsData || boatsData.length === 0) return;
  
    const heatData = boatsData.map((b) => [
      parseFloat(b.latitude) || 0,
      parseFloat(b.longitude) || 0,
      dataType === "temperature" ? parseFloat(b.temperature) || 0 : parseFloat(b.wind_velocity) || 0
    ]);
  
    console.log("Heatmap Data:", heatData);
    setHeatmapData(heatData);
  }, [boatsData, dataType]);
  
  // HeatmapLayer attaches a Leaflet heatmap layer to the map.
  const HeatmapLayer = () => {
    const map = useMap();
    useEffect(() => {
      if (heatmapData.length > 0) {
        const heatLayer = L.heatLayer(heatmapData, {
          radius: 50,
          blur: 50,
          maxZoom: 10,
        }).addTo(map);
        return () => {
          map.removeLayer(heatLayer);
        };
      }
    }, [map, heatmapData]);
    return null;
  };

  // BoatMarkers displays a marker (with a popup) for each filtered boat snapshot.
  const BoatMarkers = () => {
    return (
      <>
        {filteredBoats.map((b) => {
          const lat = parseFloat(b.latitude) || 0;
          const lng = parseFloat(b.longitude) || 0;
          return (
            <Marker
              key={`${b.boat_id}-${b.time_now}`}
              position={[lat, lng]}
              icon={boatIcon}
            >
              <Popup>
                <strong>{b.boat_id}</strong>
                <br />
                Latitude: {lat.toFixed(6)}
                <br />
                Longitude: {lng.toFixed(6)}
                <br />
                Time: {new Date(b.time_now).toLocaleString()}
                <br />
                {dataType === "temperature"
                  ? `Temperature: ${b.temperature}`
                  : `Wind Velocity: ${b.wind_velocity}`}
              </Popup>
            </Marker>
          );
        })}
      </>
    );
  };

  // Fix Leaflet's default icon paths.
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });

  // ColorScaleLegend provides a draggable legend for the heatmap.
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
        className="color-scale-legend"
        onMouseDown={handleMouseDown}
        style={{
          top: `${legendPosition.y}px`,
          left: `${legendPosition.x}px`,
        }}
      >
        <strong>
          {dataType === "temperature" ? "Temperature" : "Wind Velocity"}
        </strong>
        <div
          className={`legend-scale ${
            dataType === "temperature" ? "temperature-scale" : "chaos-scale"
          }`}
        ></div>
        <div className="legend-labels">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    );
  };

  // Handler for measurement type changes.
  const handleDataTypeChange = (e) => {
    setDataType(e.target.value);
  };


  // Handler for toggling the boat markers (boat logo) on or off.
  const toggleBoatMarkers = () => {
    setShowBoatMarkers(!showBoatMarkers);
  };

  return (
    <div className="heatmap-container">
      <div className="controls">
        {/* Data Type Selector */}
        <div className="data-type-selector">
          <label>Select Data Type: </label>
          <select value={dataType} onChange={handleDataTypeChange}>
            <option value="temperature">Temperature</option>
            <option value="chaos">Wind Velocity</option>
          </select>
        </div>
        {/* Table (Timestamp) Selector */}
        <div className="table-selector">
          <label>Select Time: </label>
          <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)}>
            {tables.map((table) => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
            </select>
          </div>

        {/* Time Slider */}
        {timeRange.min !== null && timeRange.max !== null && (
          <div className="time-slider-container">
            <label>
              Time:{" "}
              {selectedTime
                ? new Date(selectedTime).toLocaleString()
                : "Loading..."}
            </label>
            <input
              type="range"
              min={timeRange.min}
              max={timeRange.max}
              step={1000}
              value={selectedTime || timeRange.max}
              onChange={(e) => setSelectedTime(Number(e.target.value))}
            />
          </div>
        )}
        {/* Toggle Boat Markers Button */}
        <div className="boat-toggle">
          <button onClick={toggleBoatMarkers}>
            {showBoatMarkers ? "Hide Boat Logo" : "Show Boat Logo"}
          </button>
        </div>
      </div>

      <MapContainer
        center={[37.866942, -122.315452]}
        zoom={14}
        style={{ height: "600px", width: "100%" }}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        dragging={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer />
        {/* Conditionally render BoatMarkers based on showBoatMarkers */}
        {showBoatMarkers && <BoatMarkers />}
      </MapContainer>
      <ColorScaleLegend />
    </div>
  );
};

export default HeatmapWindow;
