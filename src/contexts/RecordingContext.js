// RecordingContext.js

import React, { createContext, useState, useContext } from "react";

const RecordingContext = createContext();

export function RecordingProvider({ children }) {
  const [isRecordingAll, setIsRecordingAll] = useState(false);
  const [recordingBoats, setRecordingBoats] = useState({});
  const [recordedDataAll, setRecordedDataAll] = useState([]);
  const [recordedDataBoats, setRecordedDataBoats] = useState({}); // boatId -> data array

  const startRecordingAll = () => {
    setIsRecordingAll(true);
    setRecordedDataAll([]);
  };

  const stopRecordingAll = () => {
    setIsRecordingAll(false);
    saveDataToFileAll();
    setRecordedDataAll([]);
  };

  const startRecordingBoat = (boatId) => {
    setRecordingBoats((prev) => ({
      ...prev,
      [boatId]: true,
    }));
    setRecordedDataBoats((prev) => ({
      ...prev,
      [boatId]: [],
    }));
  };

  const stopRecordingBoat = (boatId) => {
    setRecordingBoats((prev) => ({
      ...prev,
      [boatId]: false,
    }));
    saveDataToFileBoat(boatId);
    setRecordedDataBoats((prev) => {
      const newData = { ...prev };
      delete newData[boatId];
      return newData;
    });
  };

  const addRecordedData = (data) => {
    const boatId = data.boat_id;
    if (isRecordingAll) {
      setRecordedDataAll((prev) => [...prev, data]);
    }
    if (recordingBoats[boatId]) {
      setRecordedDataBoats((prev) => ({
        ...prev,
        [boatId]: [...(prev[boatId] || []), data],
      }));
    }
  };

  const saveDataToFileAll = () => {
    if (recordedDataAll.length === 0) return;

    const fileType = "json"; // Change to "csv" if needed
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (fileType === "json") {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(recordedDataAll, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `boat_data_all_${timestamp}.json`;
      link.click();
    } else if (fileType === "csv") {
      const csvString = convertToCSV(recordedDataAll);
      const csvData = `data:text/csv;charset=utf-8,${encodeURIComponent(
        csvString
      )}`;
      const link = document.createElement("a");
      link.href = csvData;
      link.download = `boat_data_all_${timestamp}.csv`;
      link.click();
    }
  };

  const saveDataToFileBoat = (boatId) => {
    const data = recordedDataBoats[boatId];
    if (!data || data.length === 0) return;

    const fileType = "json"; // Change to "csv" if needed
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (fileType === "json") {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `boat_data_${boatId}_${timestamp}.json`;
      link.click();
    } else if (fileType === "csv") {
      const csvString = convertToCSV(data);
      const csvData = `data:text/csv;charset=utf-8,${encodeURIComponent(
        csvString
      )}`;
      const link = document.createElement("a");
      link.href = csvData;
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

  return (
    <RecordingContext.Provider
      value={{
        isRecordingAll,
        startRecordingAll,
        stopRecordingAll,
        recordedDataAll,
        recordingBoats,
        startRecordingBoat,
        stopRecordingBoat,
        recordedDataBoats,
        addRecordedData,
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
}

export const useRecording = () => useContext(RecordingContext);
