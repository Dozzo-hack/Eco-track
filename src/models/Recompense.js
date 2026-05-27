// src/models/Recompense.js
import mongoose from "mongoose";

const RecompenseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  desc: { type: String, required: true },
  price: { type: Number, required: true },
  icon: { type: String, default: "fa-gift" }, // Exemple: "fa-tag", "fa-box"
  color: { type: String, default: "bg-purple-100 text-purple-600" },
  actif: { type: Boolean, default: true } // Permet de masquer une récompense sans la supprimer
}, { timestamps: true });

export default mongoose.models.Recompense || mongoose.model("Recompense", RecompenseSchema);