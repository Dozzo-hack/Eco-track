// src/app/api/truck/history/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Incident from "@/models/Incident";
import Videur from "@/models/Videur";
import CollecteAchevee from "@/models/CollecteAchevee";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
    }

    const chauffeurUserId = session.user.id || session.user._id;
    
    // 1. Trouver le profil du chauffeur/videur connecté
    const videur = await Videur.findOne({
      $or: [{ _id: chauffeurUserId }, { userId: chauffeurUserId }]
    });

    if (!videur) {
      return NextResponse.json({ success: false, message: "Profil introuvable" }, { status: 404 });
    }

    // 🗓️ CONFIGURATION DE LA SEMAINE (7 derniers jours)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    // 2. Si c'est le Super Videur (assigné à tout), il voit tout. Sinon, filtre strict par son ID.
    // Adapte 'super_videur' ou 'admin' selon la propriété réelle de ton rôle.
    const estSuperVideur = videur.role === "super_videur" || session.user.role === "admin";

    const filtreCollecte = { dateValidation: { $gte: oneWeekAgo } };
    const filtreIncident = { createdAt: { $gte: oneWeekAgo } };

    if (!estSuperVideur) {
      // 🔐 Sécurité absolue : un videur standard ne voit QUE ses actions via son videurId direct
      filtreCollecte.videurId = videur._id;
      filtreIncident.videurId = videur._id;
    }

    // 3. Récupérer les Incidents en parallèle
    const [incidents, scans] = await Promise.all([
      Incident.find(filtreIncident).lean(),
      CollecteAchevee.find(filtreCollecte)
        .populate({ path: "clientId", model: User, select: "name nom entreprise quartier zone role" })
        .lean()
    ]);

    // Fonction d'aide pour formater la date et l'heure
    const formatDateTime = (dateString) => {
      if (!dateString) return { date: "Date inconnue", heure: "--:--" };
      const d = new Date(dateString);
      const dateFormatee = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
      const heureFormatee = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      return { date: dateFormatee, heure: heureFormatee };
    };

    // 4. Formater les collectes achevées (Scans)
    const historiqueScans = scans.map(s => {
      const { date, heure } = formatDateTime(s.dateValidation);
      const nomClient = s.clientId?.name || s.clientId?.nom || s.clientId?.entreprise || "Client Éco-Track";
      const quartierClient = s.clientId?.quartier || s.clientId?.zone || "Zone Urbaine";
      const estPointTri = s.clientId?.role === "point_de_tri" || s.typeCollecte === "tri";

      return {
        id: s._id,
        type: "collecte",
        titre: nomClient,
        heure: `${date} à ${heure}`, 
        quartier: quartierClient,
        valeur: estPointTri ? "+100 PTX" : "+25 PTX",
        timestamp: s.dateValidation || new Date()
      };
    });

    // 5. Formater les incidents
    const typesIncidentLabels = { road: 'Route Barrée', bin: 'Bac Inaccessible', work: 'Travaux', other: 'Autre' };
    const historiqueIncidents = incidents.map(i => {
      const { date, heure } = formatDateTime(i.createdAt);
      return {
        id: i._id,
        type: "incident",
        titre: typesIncidentLabels[i.type] || "Incident",
        heure: `${date} à ${heure}`,
        quartier: i.details || "Aucun détail fourni",
        valeur: i.statut || "En attente",
        timestamp: i.createdAt || new Date()
      };
    });

    // 6. Fusionner et trier
    const historiqueGlobal = [...historiqueScans, ...historiqueIncidents].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    return NextResponse.json({
      success: true,
      activites: historiqueGlobal
    });

  } catch (error) {
    console.error("Erreur historique:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}