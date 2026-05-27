import mongoose from "mongoose";

// Permet d'éviter les conflits de modèles au redémarrage en développement
if (mongoose.models && mongoose.models.CollecteAchevee) {
  delete mongoose.models.CollecteAchevee;
}

const CollecteAcheveeSchema = new mongoose.Schema({
  planningId: { type: mongoose.Schema.Types.ObjectId, ref: "Planning", required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  videurId: { type: mongoose.Schema.Types.ObjectId, ref: "Videur", required: true }, 
  typeCollecte: { type: String, required: true, enum: ["bac", "tri"] }, // 👈 "required" pour forcer la présence en BD
  dateValidation: { type: Date, default: Date.now }
});

// 🔄 On reconstruit l'index unique composé des 3 critères essentiels
CollecteAcheveeSchema.index({ planningId: 1, clientId: 1, typeCollecte: 1 }, { unique: true });

export default mongoose.model("CollecteAchevee", CollecteAcheveeSchema);