// components/Map/HeatmapWindow.js
import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import boatsData from "/Users/dustinteng/Desktop/berkeley/Capstone/boatpi/frontend/src/components/Map/large data set.json"; // local JSON file
import "./HeatmapWindow.css";

const HeatmapWindow = () => {
  // Choose which measurement to show: either "temperature" or "chaos" (which in this example
  // represents wind velocity).
  const [dataType, setDataType] = useState("temperature");
  // This state will hold our heatmap data in the form of an array of [lat, lng, value].
  const [heatmapData, setHeatmapData] = useState([]);
  // This state holds the filtered snapshots (one per boat) based on the selected time.
  const [filteredBoats, setFilteredBoats] = useState([]);

  // For the time slider, we store the currently selected time and the overall range.
  const [selectedTime, setSelectedTime] = useState(null);
  const [timeRange, setTimeRange] = useState({ min: null, max: null });

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

  // Determine the overall time range from the local JSON file.
  useEffect(() => {
    if (boatsData && boatsData.length > 0) {
      const times = boatsData.map((b) => new Date(b.time_now).getTime());
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      setTimeRange({ min: minTime, max: maxTime });
      // Default the slider to the latest timestamp.
      if (!selectedTime) {
        setSelectedTime(maxTime);
      }
    }
  }, [selectedTime]);

  // Filter the snapshots to display only the latest snapshot for each boat
  // at or before the selected time.
  useEffect(() => {
    if (boatsData && selectedTime !== null) {
      const latestSnapshots = {};
      boatsData.forEach((b) => {
        const snapshotTime = new Date(b.time_now).getTime();
        if (snapshotTime <= selectedTime) {
          // For each boat, keep the most recent snapshot (if any).
          if (
            !latestSnapshots[b.boat_id] ||
            new Date(latestSnapshots[b.boat_id].time_now).getTime() <
              snapshotTime
          ) {
            latestSnapshots[b.boat_id] = b;
          }
        }
      });
      const filteredArray = Object.values(latestSnapshots);
      setFilteredBoats(filteredArray);

      // Build heatmap data: [latitude, longitude, value].
      const heatData = filteredArray.map((b) => {
        const lat = b.data.latitude ?? 0;
        const lng = b.data.longitude ?? 0;
        const value =
          dataType === "temperature"
            ? b.data.temperature ?? 0
            : b.data.wind_velocity ?? 0;
        return [lat, lng, value];
      });
      setHeatmapData(heatData);
    }
  }, [selectedTime, dataType]);

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
        // Cleanup when the data changes or component unmounts.
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
          const lat = b.data.latitude ?? 0;
          const lng = b.data.longitude ?? 0;
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
                  ? `Temperature: ${b.data.temperature}`
                  : `Wind Velocity: ${b.data.wind_velocity}`}
              </Popup>
            </Marker>
          );
        })}
      </>
    );
  };

  // Fix Leaflet's default icon paths (this is helpful when bundling with Webpack).
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });

  // ColorScaleLegend shows a draggable legend for the heatmap.
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

  // Handle changes to the data type drop-down.
  const handleDataTypeChange = (e) => {
    setDataType(e.target.value);
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
        {/* Time Slider */}
        {timeRange.min && timeRange.max && (
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
        <BoatMarkers />
      </MapContainer>
      <ColorScaleLegend />
    </div>
  );
};

export default HeatmapWindow;
