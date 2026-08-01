import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "./DashBoard.css";
import { useNavigate } from "react-router-dom";

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Fly map to user's location
function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 17);
  }, [position, map]);
  return null;
}

function DashBoard() {
  const [position, setPosition] = useState(null);
  const mapRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    // Getting location
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      (err) => {
        console.error("Geolocation error:", err);
        alert(
          err.code === 1
            ? "Please allow location access"
            : "Unable to get your location"
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Resize map when container changes
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) mapRef.current.invalidateSize();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // logout
      const handleLogOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        navigate("/login");
      };

  return (
    <>
      <div className="map-title">
        <h1>Map User Location</h1>
      </div>

      <div className="dashboard-container">
        <MapContainer
          center={[14.7699169, 121.0784688]}
          zoom={16}
          className="map-container"
          whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
        >
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {position && (
            <>
              <Marker position={position} />
              <Circle center={position} radius={450} />
              <FlyToLocation position={position} />
            </>
          )}
        </MapContainer>

        <div className="map-info-box">
          <p><strong>User:</strong> Angelo Maluya</p>
          <p><strong>Device ID:</strong> T02</p>
          <p><strong>Status:</strong> Active</p>
          <p><strong>Battery:</strong> 99%</p>
          
          <button
  className="alert-btn"
  onClick={() => {
    // Check vibration support first (Android)
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500]);
    } else {
      // iOS fallback: Play alert sound
      const audio = new Audio("/alert-sound.mp3");
      audio.volume = 1.0;

      audio
        .play()
        .then(() => {
          console.log("Audio played on iOS");
        })
        .catch((err) => {
          console.error("Audio failed to play:", err);
          alert("⚠️ Sound could not be played on this device.");
        });
    }
  }}>
  ALERT
  </button>
    <button className="alert-btn"
            onClick={handleLogOut}>
              Log Out
            </button>
            </div>
          </div>
        </>
  );
}

export default DashBoard;
