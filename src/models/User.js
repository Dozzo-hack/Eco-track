// src/models/User.js
// Modèle pour les utilisateurs normaux (domiciles)
// Ils peuvent créer leur compte via /auth/user/register

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true,
    },
    prenom: {
      type: String,
      required: [true, "Le prénom est obligatoire"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    telephone: {
      type: String,
      required: [true, "Le numéro de téléphone est obligatoire"],
      trim: true,
    },
    quartier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quartier",
      required: [true, "Le quartier est obligatoire"],
    },
    
    // 📍 GÉOLOCALISATION & ANCRAGE AUTOMATIQUE
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
        default: "En attente"
      },
      adresseTextuelle: {
        type: String,
        default: ""
      }
    },

    password: {
      type: String,
      required: [true, "Le mot de passe est obligatoire"],
      minlength: [6, "Minimum 6 caractères"],
    },
    role: {
      type: String,
      default: "user",
    },

    // --- SYSTÈME DE RÉCOMPENSES & POINTS CORRIGÉ ---
    points: {
      type: Number,
      default: 0,
    },
    ecoPoints: { // Ajouté pour compatibilité ascendante complète avec l'API truck
      type: Number,
      default: 0,
    },
    poidsTotalNum: { // Requis pour le stockage numérique et les totaux de collectes
      type: Number,
      default: 0,
    },
    recompensesEchangees: [
      {
        recompenseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Recompense",
          required: true
        },
        name: { 
          type: String, 
          required: true 
        },
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
    
    // --- SYSTÈME D'ABONNEMENT ---
    abonnement: {
      statut: {
        type: String,
        enum: ["Actif", "Inactif", "Expiré", "actif", "inactif", "expiré"],
        default: "Inactif"
      },
      type: {
        type: String,
        enum: [
          "Aucun", "aucun",
          "FOYER ÉCO", "Foyer Éco", "Foyer Eco", "foyer éco", "foyer eco",
          "FOYER PREMIUM", "Foyer Premium", "foyer premium",
          "IMMEUBLE", "Immeuble", "immeuble",
          "PRO STANDARD", "Pro Standard", "pro standard",
          "PRO BUSINESS", "Pro Business", "pro business"
        ],
        default: "Aucun"
      },
      dateDebut: { type: Date },
      dateFin: { type: Date },
      derniereTransactionRef: { type: String }
    },

    // --- SYSTÈME DE QUIZ & IMPACT ÉCO DÉTAILLÉ ---
    quizCompletes: [
      {
        quizId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Quiz",
          required: true
        },
        scoreObtenu: { type: Number, required: true },
        pointsGagnes: { type: Number, required: true },
        dateCompletion: { type: Date, default: Date.now }
      }
    ],
    impact: {
      co2Evite: { type: Number, default: 0 },       // Stocké en kg
      eauEconomisee: { type: Number, default: 0 },  // Stocké en Litres
      arbresSauves: { type: Number, default: 0 },    // Stocké en nombre
      poidsMensuel: { // Initialisé proprement pour éviter les erreurs de requêtes $inc
        Jan: { type: Number, default: 0 },
        Fev: { type: Number, default: 0 },
        Mar: { type: Number, default: 0 },
        Avr: { type: Number, default: 0 },
        Mai: { type: Number, default: 0 },
        Jui: { type: Number, default: 0 },
        Jul: { type: Number, default: 0 },
        Aou: { type: Number, default: 0 },
        Sep: { type: Number, default: 0 },
        Oct: { type: Number, default: 0 },
        Nov: { type: Number, default: 0 },
        Dec: { type: Number, default: 0 }
      }
    }
  },
  {
    timestamps: true,
  }
);

// Index 2dsphere pour permettre à MongoDB de faire des calculs géographiques avancés
UserSchema.index({ "localisationCollecte.coordinates": "2dsphere" });

// Évite de recréer le modèle à chaque hot-reload de Next.js
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;