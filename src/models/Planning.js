// src/models/Planning.js
import mongoose from "mongoose";

const PlanningSchema = new mongoose.Schema({
  quartiers: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quartier",
    required: [true, "Le quartier est obligatoire"],
  }, 
  datePrevue: { 
    type: Date, 
    required: [true, "La date prévue est obligatoire"] 
  },
  typeDechet: { 
    type: String, 
    required: [true, "Le type de déchet est obligatoire"] 
  },
  chauffeur: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Videur", // Référence dynamique vers la collection des chauffeurs/videurs
    required: [true, "Le chauffeur assigné est obligatoire"] 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.models.Planning || mongoose.model("Planning", PlanningSchema);