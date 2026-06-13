// src/models/Transaction.js
import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    typeAbonnement: {
      type: String,
      required: true,
      enum: ["Aucun",
        "FOYER ÉCO", "Foyer Éco", "Foyer Eco", "foyer éco", "foyer eco",
        "FOYER PREMIUM", "Foyer Premium", "foyer premium",
        "IMMEUBLE", "Immeuble", "immeuble",
        "PRO STANDARD", "Pro Standard", "pro standard",
        "PRO BUSINESS", "Pro Business", "pro business"
      ],
    },
    nombreAppartements: {
      type: Number,
      default: 1,
    },
    montant: {
      type: Number,
      required: true,
    },
    operateur: {
      type: String,
      required: true,
      enum: ["Orange Money", "MTN MoMo", "Wave", "Cash / Manuel", "Campay", "campay", "ORANGE", "MTN"],
    },
    statut: {
      type: String,
      required: true,
      enum: ["En attente", "Réussi","Inactif", "Échoué"],
      default: "Inactif",
      index: true,
    },
    metadata: {
      telephonePaiement: { type: String },
      idTransactionOperateur: { type: String },
      raisonEchec: { type: String },
    },
    // On initialise directement le premier état ici pour éviter d'avoir besoin d'un middleware pre-save
    historiqueStatuts: {
      type: [
        {
          ancienStatut: { type: String },
          nouveauStatut: { type: String },
          dateModification: { type: Date, default: Date.now },
          modifiePar: { type: String },
        },
      ],
      default: () => [
        {
          ancienStatut: "Aucun",
          nouveauStatut: "En attente",
          dateModification: new Date(),
          modifiePar: "Système / Initialisation",
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Forcer la suppression du modèle en cache s'il existe pour écraser le bug du Hot-Reload
if (mongoose.models.Transaction) {
  delete mongoose.models.Transaction;
}

const Transaction = mongoose.model("Transaction", TransactionSchema);
export default Transaction;