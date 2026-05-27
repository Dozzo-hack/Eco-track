// src/models/Planning.js
import mongoose from "mongoose";

const PlanningSchema = new mongoose.Schema({
  quartiers: { type: String, required: true },
  datePrevue: { type: Date, required: true },
  typeDechet: { type: String, required: true },
  chauffeur: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Cette ligne évite de recréer le modèle si Next.js redémarre à chaud
export default mongoose.models.Planning || mongoose.model("Planning", PlanningSchema);