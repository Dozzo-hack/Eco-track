import mongoose from "mongoose";

const TipSchema = new mongoose.Schema(
  {
    texte: { type: String, required: true },
    publieLe: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.models.Tip || mongoose.model("Tip", TipSchema);