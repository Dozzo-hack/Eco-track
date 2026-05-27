// src/models/Commande.js
import mongoose from "mongoose";

const CommandeSchema = new mongoose.Schema({
  typeDechet: { type: String, required: true },
  volume: { type: String, required: true },
  dateSouhaitee: { type: Date, required: true },
  instructions: { type: String },
  statut: { type: String, default: "En attente" }, // En attente, Confirmé, Terminé
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Commande || mongoose.model("Commande", CommandeSchema);