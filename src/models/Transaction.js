import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true, // Indexation pour des recherches ultra-rapides en cas de litige
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true, // Duplication textuelle pour préserver l'historique en cas d'altération du compte
    },
    typeAbonnement: {
      type: String,
      required: true,
      enum: ["Basic", "Immeuble", "Premium"],
    },
    nombreAppartements: {
      type: Number,
      default: 1, // Utile pour le calcul personnalisé de la formule "Immeuble"
    },
    montant: {
      type: Number,
      required: true, // Montant exact payé en FCFA
    },
    operateur: {
      type: String,
      required: true,
      enum: ["Orange Money", "MTN MoMo", "Wave", "Cash / Manuel"],
    },
    statut: {
      type: String,
      required: true,
      enum: ["En attente", "Réussi", "Échoué"],
      default: "En attente",
      index: true,
    },
    metadata: {
      telephonePaiement: { type: String }, // Le numéro qui a initié le transfert
      idTransactionOperateur: { type: String }, // L'ID retourné par l'API Orange/MTN
      raisonEchec: { type: String }, // Description si la transaction passe à "Échoué"
    },
    historiqueStatuts: [
      {
        ancienStatut: { type: String },
        nouveauStatut: { type: String },
        dateModification: { type: Date, default: Date.now },
        modifiePar: { type: String, default: "Système" }, // Peut être "Système" ou l'ID d'un Admin
      },
    ],
  },
  {
    timestamps: true, // Génère automatiquement createdAt (date de l'opération) et updatedAt
  }
);

// Middleware Mongoose : Enregistre automatiquement les changements d'états pour l'audit en cas de litige
TransactionSchema.pre("save", function (next) {
  if (this.isModified("statut")) {
    const historique = this.historiqueStatuts;
    const ancien = historique.length > 0 ? historique[historique.length - 1].nouveauStatut : "Aucun";
    
    this.historiqueStatuts.push({
      ancienStatut: ancien,
      nouveauStatut: this.statut,
      dateModification: new Date(),
      modifiePar: "Système / Webhook API",
    });
  }
  next();
});

export default mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);