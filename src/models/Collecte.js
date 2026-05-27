// src/models/Collecte.js

import mongoose from "mongoose";

// Schema d'une collecte programmée par l'admin
const CollecteSchema = new mongoose.Schema(
  {
    // La date et heure prévue pour la collecte
    date: {
      type: Date,
      required: [true, "La date est obligatoire"],
    },
    // La zone concernée par cette collecte
    zone: {
      type: String,
      required: [true, "La zone est obligatoire"],
    },
    // Le videur assigné à cette collecte
    // "ref: Videur" crée un lien vers le modèle Videur
    videur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Videur",
      required: true,
    },
    // Statut de la collecte
    statut: {
      type: String,
      enum: ["programmée", "en cours", "terminée", "annulée"], // valeurs autorisées uniquement
      default: "programmée",
    },
    // Notes optionnelles laissées par le videur après la collecte
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Collecte =
  mongoose.models.Collecte || mongoose.model("Collecte", CollecteSchema);

export default Collecte;