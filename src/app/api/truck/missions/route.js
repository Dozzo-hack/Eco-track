import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Videur from "@/models/Videur";
import User from "@/models/User";
import Planning from "@/models/Planning";
import CollecteAchevee from "@/models/CollecteAchevee";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const videurUserId = session.user.id || session.user._id;
    const { searchParams } = new URL(req.url);
    const quartierParam = searchParams.get("quartier");

    const videur = await Videur.findOne({
      $or: [
        { _id: videurUserId },
        { userId: videurUserId }
      ]
    });

    if (!videur) {
      return NextResponse.json({ success: false, message: "Profil Chauffeur/Videur introuvable." }, { status: 404 });
    }

    let mesQuartiers = Array.isArray(videur.quartiers) ? videur.quartiers : (videur.zone ? [videur.zone] : []);
    const aAccesATout = mesQuartiers.map(q => q.toUpperCase()).includes("TOUS");

    // ==========================================
    // SOUS-ÉTAPE 1 : LISTE DES QUARTIERS DU JOUR
    // ==========================================
    if (!quartierParam) {
      let listeQuartiersAfficher = [];
      if (aAccesATout) {
        const quartiersDepuisAdresse = await User.distinct("adresse.quartier", { "abonnement.statut": "Actif" });
        const quartiersRacine = await User.distinct("quartier", { "abonnement.statut": "Actif" });
        
        // Fusionner les tableaux et tout passer en MAJUSCULES pour éliminer mathématiquement les doublons de casse
        const tousLesQuartiersBruts = [...quartiersDepuisAdresse, ...quartiersRacine]
          .filter(Boolean)
          .map(q => q.trim().toUpperCase());

        listeQuartiersAfficher = [...new Set(tousLesQuartiersBruts)];
      } else {
        listeQuartiersAfficher = mesQuartiers;
      }

      // Formatage propre pour le rendu (Première lettre en majuscule, le reste en minuscule)
      listeQuartiersAfficher = listeQuartiersAfficher.map(q => q.charAt(0).toUpperCase() + q.slice(1).toLowerCase());

      return NextResponse.json({
        success: true,
        masterVideur: aAccesATout,
        quartiersAssignes: listeQuartiersAfficher,
        statutActivite: videur.statutActivite || "Inactif"
      });
    }

   // ==========================================
    // SOUS-ÉTAPE 2 : FEUILLE DE ROUTE CLIENTS
    // ==========================================
    const quartierRecherche = quartierParam.toLowerCase();
    
    if (!aAccesATout && !mesQuartiers.some(q => q.toLowerCase() === quartierRecherche)) {
      return NextResponse.json({ success: false, message: "Zone non attribuée à votre secteur." }, { status: 403 });
    }

    const maintenant = new Date();
    const debutJournee = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate(), 0, 0, 0, 0);
    const finJournee = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate(), 23, 59, 59, 999);

    const planningDuJour = await Planning.findOne({
      datePrevue: { $gte: debutJournee, $lte: finJournee },
      $or: [
        { quartier: { $regex: new RegExp(`^${quartierRecherche}$`, "i") } },
        { quartiers: { $regex: new RegExp(`^${quartierRecherche}$`, "i") } }
      ]
    });

    if (!planningDuJour) {
      return NextResponse.json({ 
        success: false, 
        message: "Aucune collecte n'est programmée par l'administration pour ce quartier aujourd'hui." 
      }, { status: 404 });
    }

    const clients = await User.find({
      "abonnement.statut": "Actif",
      $or: [
        { "adresse.quartier": { $regex: new RegExp(`^${quartierRecherche}$`, "i") } },
        { "quartier": { $regex: new RegExp(`^${quartierRecherche}$`, "i") } }
      ]
    }).select("nom prenom quartier abonnement points ecoPoints").lean();

    const collectesFaites = await CollecteAchevee.find({ planningId: planningDuJour._id }).select("clientId").lean();
    const clientIdsValides = collectesFaites.map(c => c.clientId.toString());

    // Formatage et croisement des données
    const clientsFormates = clients.map(client => {
      const dejaValide = clientIdsValides.includes(client._id.toString());
      
      // Dans /api/truck/missions/route.js, remplace l'extraction de la formule par :
const formuleAbonnement = client.abonnement?.type || client.abonnement?.formule || "Standard";

      // Uniformisation du nom pour l'affichage (Première lettre en Majuscule)
      const nomFormate = client.nom ? client.nom.charAt(0).toUpperCase() + client.nom.slice(1).toLowerCase() : "Client";
      const prenomFormate = client.prenom ? client.prenom.charAt(0).toUpperCase() + client.prenom.slice(1).toLowerCase() : "";

      return {
        _id: client._id,
        nom: nomFormate,
        prenom: prenomFormate,
        ecoPoints: client.ecoPoints || client.points || 0,
        abonnement: {
          formule: formuleAbonnement,
          statut: client.abonnement?.statut || "Actif"
        },
        statutCollecte: dejaValide ? "Validé" : "En attente",
        planningId: planningDuJour._id
      };
    });

    clientsFormates.sort((a, b) => {
      if (a.statutCollecte === "En attente" && b.statutCollecte === "Validé") return -1;
      if (a.statutCollecte === "Validé" && b.statutCollecte === "En attente") return 1;
      return 0;
    });

    return NextResponse.json({
      success: true,
      quartier: quartierParam,
      planningId: planningDuJour._id,
      clients: clientsFormates
    });
  

  } catch (error) {
    console.error("Erreur Missions API:", error);
    return NextResponse.json({ success: false, message: "Erreur interne du serveur" }, { status: 500 });
  }
}