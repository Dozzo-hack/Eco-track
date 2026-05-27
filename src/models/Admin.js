// src/models/Admin.js
// Modèle pour les administrateurs
// PAS de création via formulaire — insérés directement en base de données
// Ils se connectent avec un Identifiant Agent (ex: ADM-2026) + mot de passe

import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    // L'identifiant affiché en placeholder sur la page : "ADM-2026"
    identifiant: {
      type: String,
      required: [true, "L'identifiant est obligatoire"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Le mot de passe est obligatoire"],
    },
    // Nom complet pour l'affichage dans le dashboard
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

const Admin =
  mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

export default Admin;