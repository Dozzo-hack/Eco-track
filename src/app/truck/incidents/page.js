"use client";
import React, { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import { Camera, Send, X, AlertTriangle, Loader2 } from 'lucide-react';

export default function IncidentReport() {
  const [incidentType, setIncidentType] = useState(null);
  const [details, setDetails] = useState(""); // 🔥 Stocke le texte saisi
  const [photo, setPhoto] = useState(null); // Stocke la photo au format Base64 pour l'envoi
  const [isSending, setIsSending] = useState(false); // 🔥 État de chargement
  const fileInputRef = useRef(null);

  const types = [
    { id: 'road', label: 'ROUTE BARRÉE', icon: '🚧' },
    { id: 'bin', label: 'BAC INACCESSIBLE', icon: '🗑️' },
    { id: 'work', label: 'TRAVAUX', icon: '👷' },
    { id: 'other', label: 'AUTRE', icon: '⚠️' },
  ];

  const handleCameraClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // 🔄 Conversion en Base64 pour l'envoyer facilement via l'API JSON
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!incidentType) {
      return Swal.fire({ 
        title: 'Erreur', 
        text: 'Choisis un type d\'incident', 
        icon: 'error', 
        background: '#111', 
        color: '#fff' 
      });
    }
    
    if (!photo) {
      Swal.fire({
        title: 'Sans Photo ?',
        text: "Il est préférable d'ajouter une photo pour justifier le signalement.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Envoyer quand même',
        cancelButtonText: 'Prendre une photo',
        confirmButtonColor: '#f97316',
        background: '#111',
        color: '#fff'
      }).then((result) => {
        if (result.isConfirmed) {
          getGPSAndSend();
        } else {
          handleCameraClick();
        }
      });
    } else {
      getGPSAndSend();
    }
  };

  // 🔥 Récupération des coordonnées GPS réelles avant envoi
  const getGPSAndSend = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          sendFinalReport(coords);
        },
        (error) => {
          console.warn("Erreur GPS, envoi sans coordonnées :", error.message);
          sendFinalReport(null); // Envoi quand même si le GPS est désactivé
        }
      );
    } else {
      sendFinalReport(null);
    }
  };

  // 🔥 Envoi réel à ton API Next.js
  const sendFinalReport = async (coords) => {
    setIsSending(true);
    try {
      const response = await fetch("/api/truck/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: incidentType,
          details: details,
          photo: photo,
          localisation: coords
        })
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          title: 'SIGNALEMENT ENVOYÉ',
          text: "L'administration a été alertée en temps réel.",
          icon: 'success',
          background: '#111',
          color: '#fff',
          confirmButtonColor: '#f97316'
        });
        // Réinitialisation complète
        setIncidentType(null);
        setDetails("");
        setPhoto(null);
      } else {
        throw new Error(data.message || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Erreur incident:", error);
      Swal.fire({
        title: 'Échec',
        text: "Impossible d'envoyer l'alerte. Réessaie.",
        icon: 'error',
        background: '#111',
        color: '#fff'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-6 pb-24 bg-zinc-100 min-h-screen animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-3">
         <AlertTriangle className="text-orange-500" size={24} />
         <h2 className="text-xl font-black text-zinc-900">Signaler un Incident</h2>
      </div>
      <p className="text-zinc-500 text-xs mb-8 italic">L'administration sera notifiée en temps réel avec ta position GPS.</p>

      {/* SÉLECTION DU TYPE */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {types.map((t) => (
          <button 
            key={t.id}
            disabled={isSending}
            onClick={() => setIncidentType(t.id)}
            className={`p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all ${
              incidentType === t.id ? 'ring-4 ring-orange-500 bg-white shadow-2xl scale-95' : 'bg-white shadow-sm hover:shadow-lg'
            }`}
          >
            <span className="text-3xl">{t.icon}</span>
            <span className="text-[10px] font-black text-center leading-tight text-zinc-900">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm mb-6">
        
        {/* AFFICHAGE DE LA PHOTO PRISE */}
        {photo && (
            <div className="relative mb-4 rounded-xl overflow-hidden border-2 border-orange-100 animate-in zoom-in-95">
                <img src={photo} alt="Incident Justification" className="w-full h-48 object-cover" />
                <button 
                    type="button"
                    disabled={isSending}
                    onClick={() => setPhoto(null)}
                    className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white hover:bg-red-500"
                >
                    <X size={16} />
                </button>
            </div>
        )}

        {/* 🔥 Textarea connecté au state */}
        <textarea 
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          disabled={isSending}
          placeholder="Dites nous en plus (numéro de rue, détails)..."
          className="w-full bg-zinc-100 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-orange-500 mb-4 h-32 text-zinc-900"
        />
        
        <input 
          type="file" 
          accept="image/*"
          capture="camera"
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />

        <div className="flex gap-4">
           <button 
             type="button"
             disabled={isSending}
             onClick={handleCameraClick}
             className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs uppercase transition-colors ${photo ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
           >
             <Camera size={18} /> {photo ? 'Photo prise' : 'Photo'}
           </button>
           
           <button 
             type="button"
             disabled={isSending}
             onClick={handleSubmit}
             className="flex-[2] bg-orange-500 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase shadow-lg shadow-orange-200 active:scale-95 transition-all disabled:opacity-50"
           >
             {isSending ? (
               <>
                 <Loader2 size={18} className="animate-spin" /> Envoi...
               </>
             ) : (
               <>
                 <Send size={18} /> Envoyer Alerte
               </>
             )}
           </button>
        </div>
      </div>
    </div>
  );
}