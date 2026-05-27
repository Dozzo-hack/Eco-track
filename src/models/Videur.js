// src/models/Videur.js
import mongoose from "mongoose";

const VideurSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    nom: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true,
    },
    prenom: {
      type: String,
      required: [true, "Le prénom est obligatoire"],
      trim: true,
    },
    idChauffeur: {
      type: String,
      required: [true, "L'ID chauffeur est obligatoire"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    codePin: {
      type: String,
      required: [true, "Le code PIN est obligatoire"],
    },
    // S'il a ["TOUS"], il voit tout (Chauffeur de départ). 
    // S'il a ["Akwa"], il ne voit que Akwa (Futurs chauffeurs).
    quartiers: {
      type: [String],
      required: [true, "Au moins un quartier ou la mention 'TOUS' est obligatoire"],
      default: ["TOUS"],
    },
    role: {
      type: String,
      default: "videur",
    },
    statutActivite: {
      type: String,
      enum: ["Actif", "Inactif"],
      default: "Inactif",
    },
    actif: {
      type: Boolean,
      default: true,
    },
    derniereConnexion: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Videur = mongoose.models.Videur || mongoose.model("Videur", VideurSchema);
export default Videur;