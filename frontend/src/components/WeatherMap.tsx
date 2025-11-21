import { useState } from "react";
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

const WeatherMap = () => {
  const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
  const puneCoords = [18.5204, 73.8567];
  const [activeLayer, setActiveLayer] = useState("temp_new");

  const layers = [
    { id: "temp_new", icon: <FaTemperatureHigh />, name: "Temperature" },
    { id: "clouds_new", icon: <FaCloud />, name: "Clouds" },
    { id: "precipitation_new", icon: <FaCloudRain />, name: "Precipitation" },
    { id: "wind_new", icon: <FaWind />, name: "Wind" },
    { id: "pressure_new", icon: <FaBolt />, name: "Pressure" },
    { id: "snow_new", icon: <FaSnowflake />, name: "Snow" },
  ];

  return (
    <div className="relative">
      {/* Floating Layer Selector */}
      <div
        className="flex gap-3 px-4 py-2 rounded-xl shadow-lg border border-white/10"
        style={{
          backgroundColor: "rgba(2,31,2,0.65)",
          backdropFilter: "blur(10px)",
          position: "absolute",
          top: 15,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
        }}
      >
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            title={layer.name}
            className="transition-all text-xl"
            style={{
              color: activeLayer === layer.id ? "#34d399" : "white",
              padding: "6px 10px",
              borderRadius: "10px",
              background:
                activeLayer === layer.id
                  ? "rgba(52,211,153,0.18)"
                  : "transparent",
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
        minZoom={4}
        maxZoom={10}
        scrollWheelZoom={true}
        style={{
          height: "500px",
          width: "100%",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <TileLayer
          key={activeLayer}
          url={`https://tile.openweathermap.org/map/${activeLayer}/{z}/{x}/{y}.png?appid=${API_KEY}`}
          opacity={0.7}
        />
      </MapContainer>
    </div>
  );
};

export default WeatherMap;
