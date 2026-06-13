import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Videur from "@/models/Videur";
import User from "@/models/User";
import Planning from "@/models/Planning";
import CollecteAchevee from "@/models/CollecteAchevee";
import mongoose from "mongoose";
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
      $or: [{ _id: videurUserId }, { userId: videurUserId }]
    });

    if (!videur) {
      return NextResponse.json({ success: false, message: "Profil Chauffeur/Videur introuvable." }, { status: 404 });
    }

    let mesQuartiersIds = Array.isArray(videur.quartiers) 
      ? videur.quartiers 
      : (Array.isArray(videur.quartier) ? videur.quartier : []);
    
    const aAccesATout = 
      videur.role === "super_videur" || 
      videur.idChauffeur === "VID-001" || 
      mesQuartiersIds.some(q => String(q).toUpperCase() === "TOUS");

    const quartiersCollection = mongoose.connection.db.collection("quartiers");
    const usersCollection = mongoose.connection.db.collection("users");
    const planningsCollection = mongoose.connection.db.collection("plannings");
    const commandesCollection = mongoose.connection.db.collection("commandes"); // 👈 Ajout pour le Premium

    // =================================================================
    // SOUS-ÉTAPE 1 : LISTE DES QUARTIERS POUR L'UI
    // =================================================================
    if (!quartierParam) {
      const tousLesQuartiersDocs = await quartiersCollection.find({}).toArray();
      let listeAFiltrer = tousLesQuartiersDocs;

      if (!aAccesATout) {
        const mesQuartiersStrings = mesQuartiersIds.map(id => id.toString());
        listeAFiltrer = tousLesQuartiersDocs.filter(doc => 
          mesQuartiersStrings.includes(doc._id.toString())
        );
      }

      const nomsFormates = listeAFiltrer.map(q => 
        q.nom.charAt(0).toUpperCase() + q.nom.slice(1).toLowerCase()
      );

      return NextResponse.json({
        success: true,
        masterVideur: aAccesATout,
        quartiersAssignes: [...new Set(nomsFormates)],
        statutActivite: videur.statutActivite || "Actif"
      });
    }

    // =================================================================
    // SOUS-ÉTAPE 2 : RÉCUPÉRATION DES CLIENTS
    // =================================================================
    const nomQuartierRecherche = quartierParam.trim();
    
    const targetQuartierDoc = await quartiersCollection.findOne({
      nom: { $regex: `^${nomQuartierRecherche}$`, $options: "i" }
    });

    if (!targetQuartierDoc) {
      return NextResponse.json({ success: true, quartier: quartierParam, clients: [] });
    }

    const maintenant = new Date();
    const debutJournee = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate(), 0, 0, 0);
    
    // 1. Chercher les plannings normaux
    const planningsDuJour = await planningsCollection.find({
      datePrevue: { $gte: debutJournee },
      $or: [
        { quartier: targetQuartierDoc._id },
        { quartiers: targetQuartierDoc._id },
        { quartier: targetQuartierDoc._id.toString() },
        { quartiers: targetQuartierDoc._id.toString() },
        { quartier: { $regex: `^${nomQuartierRecherche}$`, $options: "i" } },
        { videurId: videur._id }, 
        { chauffeurId: videur._id }
      ]
    }).toArray();

    // 2. 🚀 Chercher les Commandes Premium assignées aujourd'hui à ce chauffeur
    const commandesDuJour = await commandesCollection.find({
      statut: "Assignée",
      $or: [
        { videurId: videur._id },
        { videurId: videur._id.toString() },
        { videurId: new mongoose.Types.ObjectId(videur._id) }
      ]
    }).toArray();

    const planningGeneral = planningsDuJour.find(p => !p.clientId && !p.targetClientId);
    const fallbackPlanningId = planningGeneral ? planningGeneral._id : targetQuartierDoc._id;

    const tousLesIdsReferences = planningsDuJour.map(p => p._id.toString());
    if (!tousLesIdsReferences.includes(fallbackPlanningId.toString())) {
      tousLesIdsReferences.push(fallbackPlanningId.toString());
    }
    // Ajouter les IDs des commandes pour vérifier si le chauffeur a DÉJÀ scanné le bac Premium
    commandesDuJour.forEach(c => tousLesIdsReferences.push(c._id.toString()));

    const collectesBacsFaites = await CollecteAchevee.find({ 
      planningId: { $in: tousLesIdsReferences },
      typeCollecte: "bac" 
    }).select("clientId planningId").lean();

    const clients = await usersCollection.find({
      "abonnement.statut": "Actif",
      $or: [
        { quartier: targetQuartierDoc._id },
        { quartier: targetQuartierDoc._id.toString() },
        { quartier: { $regex: `^${nomQuartierRecherche}$`, $options: "i" } }
      ]
    }).project({ nom: 1, prenom: 1, quartier: 1, abonnement: 1, points: 1, ecoPoints: 1 }).toArray();

    const clientsFormates = clients.map(client => {
      // 🔄 EXIGENCE : Vérifier si ce client précis a une Commande Premium ou un planning spécial
      const commandeSpeciale = commandesDuJour.find(c => c.userId?.toString() === client._id.toString());
      const planningSpecial = planningsDuJour.find(p => 
        (p.clientId?.toString() === client._id.toString() || p.targetClientId?.toString() === client._id.toString())
      );

      // On donne la priorité à la Commande Premium pour l'ID
      const idReferenceApplicable = commandeSpeciale ? commandeSpeciale._id : (planningSpecial ? planningSpecial._id : fallbackPlanningId);

      const dejaScanneBac = collectesBacsFaites.some(c => 
        c.clientId.toString() === client._id.toString() && 
        c.planningId.toString() === idReferenceApplicable.toString()
      );

      return {
        _id: client._id.toString(),
        nom: client.nom ? client.nom.toUpperCase() : "CLIENT",
        prenom: client.prenom ? client.prenom.charAt(0).toUpperCase() + client.prenom.slice(1).toLowerCase() : "",
        ecoPoints: client.ecoPoints || client.points || 0,
        abonnement: {
          formule: client.abonnement?.type || client.abonnement?.formule || "Standard",
          statut: "Actif"
        },
        statutCollecte: dejaScanneBac ? "Validé" : "En attente",
        planningId: idReferenceApplicable.toString() 
      };
    });

    clientsFormates.sort((a, b) => (a.statutCollecte === "En attente" ? -1 : 1));

    return NextResponse.json({
      success: true,
      quartier: quartierParam,
      clients: clientsFormates
    });

  } catch (error) {
    console.error("Erreur Missions API:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur lors de la synchronisation." }, { status: 500 });
  }
}