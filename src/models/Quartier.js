// src/models/Quartier.js
import mongoose from "mongoose";

const QuartierSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom du quartier est obligatoire"],
      unique: true, // Évite les doublons (ex: deux fois "Akwa")
      trim: true,
    },
    estActif: {
      type: Boolean,
      default: true, // Permet à l'admin de désactiver temporairement un quartier sans le supprimer
    },
    ajoutePar: {
      type: String,
      default: "Admin",
    }
  },
  {
    timestamps: true, // Pour savoir quand la zone a été ouverte
  }
);

// Nettoyage automatique du cache de modèles pour Next.js (Hot-Reload)
if (mongoose.models.Quartier) {
  delete mongoose.models.Quartier;
}

const Quartier = mongoose.model("Quartier", QuartierSchema);
export default Quartier;