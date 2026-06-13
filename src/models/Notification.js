// src/models/Notification.js
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    chauffeurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Videur",
      required: [true, "L'ID du chauffeur (Videur) est obligatoire"],
    },
    titre: {
      type: String,
      required: [true, "Le titre est obligatoire"],
      trim: true,
    },
    contenu: {
      type: String,
      required: [true, "Le contenu est obligatoire"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["info", "alerte", "assignation"], // Permet de différencier le type de message
      default: "info",
    },
    lue: {
      type: Boolean,
      default: false, // Pour éventuellement masquer les notifications déjà lues plus tard
    }
  },
  {
    timestamps: true, // Crée automatiquement 'createdAt' et 'updatedAt'
  }
);

const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
export default Notification;