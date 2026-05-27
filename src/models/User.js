// src/models/User.js
// Modèle pour les utilisateurs normaux (domiciles)
// Ils peuvent créer leur compte via /auth/user/register

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true, // supprime les espaces inutiles avant/après
    },
    prenom: {
      type: String,
      required: [true, "Le prénom est obligatoire"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true, // pas deux comptes avec le même email
      lowercase: true, // stocke toujours en minuscule
      trim: true,
    },
    telephone: {
      type: String,
      required: [true, "Le numéro de téléphone est obligatoire"],
      trim: true,
    },
    quartier: {
      // "Quartier de résidence" visible sur le formulaire
      type: String,
      required: [true, "Le quartier est obligatoire"],
      trim: true,
    },
    
    // 📍 ==========================================
    // AJOUT COMPATIBLE : GÉOLOCALISATION & ANCRAGE AUTOMATIQUE
    // ==========================================
    localisationCollecte: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // Format standard MongoDB : [longitude, latitude]
        default: null
      },
      statutEmplacement: {
        type: String,
        enum: ["En attente", "Validé", "À modifier"],
        default: "En attente" // Par défaut, nécessite le 1er scan du chauffeur
      },
      adresseTextuelle: {
        type: String,
        default: ""
      }
    },
    // ============================================

    password: {
      type: String,
      required: [true, "Le mot de passe est obligatoire"],
      minlength: [6, "Minimum 6 caractères"],
    },
    role: {
      type: String,
      default: "user", // rôle fixe pour tous les utilisateurs
    },
    // --- AJOUTS POUR LE SYSTÈME DE RÉCOMPENSES ---
    points: {
      type: Number,
      default: 0, // Nouveau compte = 0 point
    },
    recompensesEchangees: [
      {
        recompenseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Recompense", // Liaison directe avec ton nouveau modèle Recompense
          required: true
        },
        name: { 
          type: String, 
          required: true 
        }, // Sauvegarde textuelle en cas de modif du catalogue par l'admin
        price: { 
          type: Number, 
          required: true 
        },
        dateEchange: { 
          type: Date, 
          default: Date.now 
        },
        statut: { 
          type: String, 
          enum: ["En attente", "Livré"], 
          default: "En attente" 
        }
      }
    ],
    
    // --- SYSTÈME D'ABONNEMENT AVEC ENUM SÉCURISÉ ---
    abonnement: {
      statut: {
        type: String,
        enum: ["Actif", "Inactif", "Expiré", "actif", "inactif", "expiré"],
        default: "Inactif"
      },
      type: {
        type: String,
        enum: ["Aucun", "Standard", "Immeuble", "Premium", "standard", "immeuble", "premium"], // 🔥 "Standard" ajouté ici pour stopper l'erreur de validation
        default: "Aucun"
      },
      dateDebut: { type: Date },
      dateFin: { type: Date },
      derniereTransactionRef: { type: String } // Lien direct vers la référence immuable de la table Transaction
    },

    // --- AJOUTS POUR LE SYSTÈME DE QUIZ & IMPACT ÉCO ---
    quizCompletes: [
      {
        quizId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Quiz",
          required: true
        },
        scoreObtenu: { type: Number, required: true }, // Nombre de bonnes réponses (0 à 5)
        pointsGagnes: { type: Number, required: true }, // Points attribués selon ton barème
        dateCompletion: { type: Date, default: Date.now }
      }
    ],
    impact: {
      co2Evite: { type: Number, default: 0 },       // Stocké en kg (ex: 124)
      eauEconomisee: { type: Number, default: 0 },  // Stocké en Litres (ex: 450)
      arbresSauves: { type: Number, default: 0 }    // Stocké en nombre (ex: 2.4)
    }
  },
  {
    timestamps: true, // crée automatiquement createdAt + updatedAt
  }
);

// Index 2dsphere pour permettre à MongoDB de faire des calculs géographiques avancés (Ex: l'admin cherche les camions à proximité)
UserSchema.index({ "localisationCollecte.coordinates": "2dsphere" });

// Évite de recréer le modèle à chaque hot-reload de Next.js
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;