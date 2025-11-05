import React, { useState } from "react";
// Removed 'LayersControl' as it was not used
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  FaCloud,
  FaCloudRain,
  FaWind,
  FaTemperatureHigh,
  FaBolt,
  FaSnowflake,
} from "react-icons/fa";

const WeatherMap: React.FC = () => {
  const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;

  // Note: Ensure REACT_APP_WEATHER_API_KEY is set in your .env file
  // or the weather layer will not load.

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
          // Matched color to project's dark green theme (#021f02)
          backgroundColor: "rgba(2, 31, 2, 0.7)",
          borderRadius: "12px",
          padding: "8px 12px",
          zIndex: 1000,
          display: "flex",
          gap: "12px",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255, 255, 255, 0.1)", // Subtle border
        }}
      >
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            title={layer.name}
            style={{
              // Matched active color to emerald-400 (#34d399)
              color: activeLayer === layer.id ? "#34d399" : "white",
              fontSize: "20px",
              // Matched active bg to bg-emerald-500/20
              background:
                activeLayer === layer.id
                  ? "rgba(16, 185, 129, 0.2)"
                  : "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: "8px",
              // Added transition for smooth animation
              transition: "all 0.2s ease-in-out",
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
        style={{
          height: "500px",
          width: "100%",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          // Using a dark theme for the base map to better match the site
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <TileLayer
          key={activeLayer} // Adding key ensures layer re-renders on change
          url={`https://tile.openweathermap.org/map/${activeLayer}/{z}/{x}/{y}.png?appid=${API_KEY}`}
          opacity={0.7}
        />
      </MapContainer>
    </div>
  );
};

export default WeatherMap;