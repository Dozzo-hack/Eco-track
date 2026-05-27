// src/lib/mongodb.js

// On importe mongoose pour pouvoir parler à MongoDB
import mongoose from "mongoose";

// On récupère l'URL de connexion depuis le fichier .env
// C'est comme l'adresse de ta base de données
const MONGODB_URI = process.env.MONGODB_URI;

// Vérification de sécurité : si l'URL n'existe pas, on arrête tout
if (!MONGODB_URI) {
  throw new Error(
    "❌ MONGODB_URI manquant ! Vérifie ton fichier .env"
  );
}

// On crée une variable pour stocker la connexion
// Comme ça on ne recrée pas une nouvelle connexion à chaque requête
let cached = global.mongoose;

if (!cached) {
  // Si aucune connexion n'existe encore, on initialise le cache
  cached = global.mongoose = { conn: null, promise: null };
}

// Fonction principale qui se connecte à MongoDB
async function connectDB() {
  // Si on est déjà connecté, on retourne la connexion existante
  if (cached.conn) {
    return cached.conn;
  }

  // Si aucune connexion en cours, on en crée une nouvelle
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false, // Désactive la mise en attente des commandes
    });
  }

  // On attend que la connexion soit établie
  cached.conn = await cached.promise;
  
  console.log("✅ Connecté à MongoDB !");
  return cached.conn;
}

// On exporte la fonction pour l'utiliser dans toute l'app
export default connectDB;