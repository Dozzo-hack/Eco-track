"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function CarteUserSse({ camionPos, mesCoordonnees, monStatut }) {
  const [L, setL] = useState(null);

  useEffect(() => {
    import("leaflet").then((leafletL) => {
      setL(leafletL);
      delete leafletL.Icon.Default.prototype._getIconUrl;
      leafletL.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
    });
  }, []);

  if (!L) return <div className="h-full w-full flex items-center justify-center font-bold bg-gray-100">Chargement de Leaflet...</div>;

  const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048329.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  const userHomeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1216/1216844.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35]
  });

  // Position par défaut de sécurité (Douala) si le camion n'est pas encore localisé
  const validCamionPos = (Array.isArray(camionPos) && camionPos.length === 2 && !isNaN(camionPos[0])) 
    ? camionPos 
    : [4.0511, 9.7679];

  return (
    <MapContainer 
      center={validCamionPos} 
      zoom={14} 
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
      
      {/* Position en direct du camion (le videur) */}
      <Marker position={validCamionPos} icon={truckIcon}>
        <Popup><b>Camion EcoTrack</b><br/>En déplacement en direct.</Popup>
      </Marker>

      {/* Position du client */}
      {mesCoordonnees && Array.isArray(mesCoordonnees) && mesCoordonnees.length === 2 && (monStatut === "Validé" || monStatut === "À modifier") && (
        <>
          <Marker position={mesCoordonnees} icon={userHomeIcon}>
            <Popup><b>Votre Point de collecte</b></Popup>
          </Marker>
          <Polyline positions={[validCamionPos, mesCoordonnees]} color="#6200ee" weight={5} dashArray="10, 10" />
        </>
      )}
    </MapContainer>
  );
}