import React, { useState } from "react";
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

  const puneCoords: [number, number] = [18.5204, 73.8567];
  const [activeLayer, setActiveLayer] = useState<string>("temp_new");

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
      {/* Toolbar (This is fine, no changes needed) */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(2, 31, 2, 0.7)",
          borderRadius: "12px",
          padding: "8px 12px",
          zIndex: 1000,
          display: "flex",
          gap: "12px",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            title={layer.name}
            style={{
              color: activeLayer === layer.id ? "#34d399" : "white",
              fontSize: "20px",
              background:
                activeLayer === layer.id
                  ? "rgba(16, 185, 129, 0.2)"
                  : "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: "8px",
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
        {/* *** THIS IS THE FIX *** */}
        {/* We are changing the base map to a dark, simple one */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* This layer will now 'pop' on top of the dark map */}
        <TileLayer
          key={activeLayer} 
          url={`https://tile.openweathermap.org/map/${activeLayer}/{z}/{x}/{y}.png?appid=${API_KEY}`}
          // We keep the opacity at 1.0 for full color
          opacity={1.0}
        />
      </MapContainer>
    </div>
  );
};

export default WeatherMap;