"use client";
import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // IMPRESSIONNANT : Import des styles

// Fix pour les icônes Leaflet par défaut
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon.src,
    shadowUrl: iconShadow.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Icônes personnalisées pour EcoTrack
const truckIcon = L.divIcon({
  html: `<div class="w-8 h-8 bg-white border-2 border-green-500 rounded-lg shadow-lg flex items-center justify-center animate-bounce">🚚</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const clientIcon = (status) => L.divIcon({
  html: `<div class="w-4 h-4 rounded-full border-2 border-black ${status === 'Vidé' ? 'bg-green-500' : 'bg-red-500'} shadow-lg"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Composant interne pour recadrer la carte sur le chauffeur
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 16); // Zoom sur le GPS
    }
  }, [position, map]);
  return null;
}

export default function LiveTourMap({ driverPos, clients }) {
  // Coordonnées du Roadpath (Exemple Douala)
  const roadpath = [
    [4.0510, 9.7015], // Point A
    [4.0530, 9.7030], // Point B
    [4.0550, 9.7050], // Chauffeur actuel
  ];

  if (typeof window === "undefined") return <p>Chargement de la carte...</p>;

  return (
    <MapContainer 
      center={driverPos} 
      zoom={16} 
      scrollWheelZoom={true} 
      className="h-full w-full grayscale contrast-125 opacity-70"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* 1. Tracé de la tournée (Roadpath) */}
      <Polyline positions={roadpath} color="#22c55e" weight={4} dashArray="5, 10" />

      {/* 2. Position du Chauffeur (GPS) */}
      <Marker position={driverPos} icon={truckIcon}>
        <Popup>
          <p className="font-bold text-black text-xs">Patrice N. - En Route</p>
          <p className="text-[10px] text-black/60">Vitesse : 24 km/h</p>
        </Popup>
      </Marker>
      
      {/* 3. Position des Clients */}
      {clients.map(client => (
         <Marker key={client.id} position={client.pos} icon={clientIcon(client.status)}>
            <Popup>
                <p className="font-bold text-black text-xs">{client.nom}</p>
                <p className={`text-[10px] font-black ${client.status === 'Vidé' ? 'text-green-500' : 'text-red-500'}`}>{client.status.toUpperCase()}</p>
            </Popup>
         </Marker>
      ))}

      <RecenterMap position={driverPos} />
    </MapContainer>
  );
}