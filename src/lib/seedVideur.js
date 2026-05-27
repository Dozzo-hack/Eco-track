import connectDB from "./mongodb";
import Videur from "@/models/Videur";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function seedVideurs() {
  try {
    await connectDB();

    // ==========================================
    // 1. MISE À JOUR DES USERS DE TEST (ABONNEMENT ACTIF)
    // ==========================================
    
    // Utilisateur 1 : Duhamel (Mbanya)
    await User.findOneAndUpdate(
      { email: "dozzofx@gmail.com" },
      {
        $set: {
          adresse: { quartier: "Mbanya", rue: "Rue de la joie" },
          abonnement: { statut: "Actif", formule: "Standard" }
        }
      }
    );
    console.log("✅ Profil utilisateur Duhamel mis à jour avec abonnement Actif !");

    // Utilisateur 2 : Marie Siyep (Deido)
    await User.findOneAndUpdate(
      { email: "marie@gmail.com" },
      {
        $set: {
          adresse: { quartier: "Deido", rue: "Avenue Manga Bell" },
          abonnement: { statut: "Actif", formule: "Premium" }
        }
      }
    );
    console.log("✅ Profil utilisateur Marie Siyep mis à jour avec abonnement Actif !");


    // ==========================================
    // 2. CRÉATION DES VIDEURS (CHAUFFEURS)
    // ==========================================
    
    // Super-Videur (Duhamel Ange)
    const defaultVideurExists = await Videur.findOne({ idChauffeur: "VID-001" });
    if (!defaultVideurExists) {
      const hashedPin1 = await bcrypt.hash("1234", 10);
      await Videur.create({
        nom: "Duhamel",
        prenom: "Ange",
        idChauffeur: "VID-001",
        codePin: hashedPin1,
        zone: "TOUS",
        role: "videur",
        actif: true,
        statutActivite: "Inactif"
      });
      console.log("✅ Videur par défaut (VID-001) créé avec succès !");
    }

    // Videur de Secteur (Jaelle - Mbanya)
    const mbanyaVideurExists = await Videur.findOne({ idChauffeur: "VID-002" });
    if (!mbanyaVideurExists) {
      const hashedPin2 = await bcrypt.hash("5678", 10);
      await Videur.create({
        nom: "Djedji",
        prenom: "Jaelle",
        idChauffeur: "VID-002",
        codePin: hashedPin2,
        zone: "Mbanya",
        role: "videur",
        actif: true,
        statutActivite: "Inactif"
      });
      console.log("✅ Videur Secteur Mbanya (VID-002) créé avec succès !");
    }

  } catch (error) {
    console.error("❌ Erreur lors du seeding des données:", error);
  }
}