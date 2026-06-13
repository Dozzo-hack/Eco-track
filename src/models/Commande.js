// src/models/Commande.js
import mongoose from "mongoose";

const CommandeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Conservé de ton API
  typeDechet: { type: String, required: true },
  volume: { type: String, required: true },
  dateSouhaitee: { type: Date, required: true },
  instructions: { type: String },
  statut: { type: String, default: "En attente" }, // En attente, Assignée, Terminée
  videurId: { type: mongoose.Schema.Types.ObjectId, ref: "Videur", default: null }, // 👈 Ajout liaison chauffeur
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Commande || mongoose.model("Commande", CommandeSchema);