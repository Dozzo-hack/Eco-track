// src/models/Incident.js
import mongoose from "mongoose";

const IncidentSchema = new mongoose.Schema(
  {
    videurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Videur",
      required: true,
    },
    type: {
      type: String,
      enum: ["road", "bin", "work", "other"],
      required: true,
    },
    details: {
      type: String,
      trim: true,
    },
    photo: {
      type: String, // Stockera l'image en Base64 ou une URL Cloudinary/S3
    },
    localisation: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    statut: {
      type: String,
      enum: ["En attente", "Pris en compte", "Résolu"],
      default: "En attente",
    },
  },
  { timestamps: true }
);

const Incident = mongoose.models.Incident || mongoose.model("Incident", IncidentSchema);
export default Incident;