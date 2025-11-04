import React, { useState } from "react";
import { MapContainer, TileLayer, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FaCloud, FaCloudRain, FaWind, FaTemperatureHigh, FaBolt, FaSnowflake } from "react-icons/fa";






const WeatherMap: React.FC = () => {
  const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;

  const puneCoords: [number, number] = [18.5204, 73.8567];
  const [activeLayer, setActiveLayer] = useState<string>("temp_new");

  // All weather map types from OpenWeather
  const layers = [
    { id: "temp_new", icon: <FaTemperatureHigh />, name: "Temperature" },
    { id: "clouds_new", icon: <FaCloud />, name: "Clouds" },
    { id: "precipitation_new", icon: <FaCloudRain />, name: "Precipitation" },
    { id: "wind_new", icon: <FaWind />, name: "Wind" },
    { id: "pressure_new", icon: <FaBolt />, name: "Pressure" },
    { id: "snow_new", icon: <FaSnowflake />, name: "Snow" },
  ];

  return (
    <div style={{ position: "relative" }}>
      {/* Toolbar */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          borderRadius: "12px",
          padding: "8px 12px",
          zIndex: 1000,
          display: "flex",
          gap: "12px",
          backdropFilter: "blur(6px)",
        }}
      >
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            title={layer.name}
            style={{
              color: activeLayer === layer.id ? "#00e0a8" : "white",
              fontSize: "20px",
              background: activeLayer === layer.id ? "rgba(0, 255, 150, 0.15)" : "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: "8px",
            }}
          >
            {layer.icon}
          </button>
        ))}
      </div>

      {/* Map */}
      <MapContainer
        center={puneCoords}
        zoom={6}
        style={{ height: "500px", width: "100%", borderRadius: "10px", overflow: "hidden" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <TileLayer
          url={`https://tile.openweathermap.org/map/${activeLayer}/{z}/{x}/{y}.png?appid=${API_KEY}`}
          opacity={0.7}
        />
      </MapContainer>
    </div>
  );
};

export default WeatherMap;
