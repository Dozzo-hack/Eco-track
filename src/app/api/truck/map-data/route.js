import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);

export async function GET(req) {
  try {
    // 1. Récupération de la session utilisateur connectée
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id || session.user._id;
    if (!userId) {
      return NextResponse.json({ success: false, error: "ID utilisateur introuvable dans la session" }, { status: 400 });
    }

    await client.connect();
    const db = client.db("EcoTrackDB");

    // 2. Trouver les vraies infos du videur
    const videur = await db.collection("videurs").findOne({ _id: new ObjectId(userId) });
    if (!videur) {
      return NextResponse.json({ success: false, error: "Profil videur introuvable" }, { status: 404 });
    }

    const nomComplet = `${videur.prenom || ""} ${videur.nom || ""}`.trim() || "Videur Anonyme";
    const mesQuartiersIds = videur.quartiers || [];
    const estSuperVideur = mesQuartiersIds.includes("TOUS");

    // TRADUCTION DES IDs DE QUARTIERS EN NOMS TEXTUELS
    const tousLesQuartiers = await db.collection("quartiers").find({}).toArray();
    const quartierMap = {};
    tousLesQuartiers.forEach(q => {
      quartierMap[q._id.toString()] = q.nom;
    });

    const nomsQuartiersFormates = estSuperVideur 
      ? ["TOUS"] 
      : mesQuartiersIds
          .map(id => quartierMap[id?.toString()] || null)
          .filter(nom => nom !== null);

    // 3. Récupérer les utilisateurs ayant un emplacement validé
    const queryUsers = {
      "localisationCollecte.statutEmplacement": "Validé",
      "localisationCollecte.coordinates": { $exists: true }
    };

    if (!estSuperVideur) {
      const objectIdQuartiers = mesQuartiersIds
        .map(id => {
          try { return new ObjectId(id); } catch { return null; }
        })
        .filter(id => id !== null);

      queryUsers.quartier = { $in: objectIdQuartiers };
    }

    const usersMatch = await db.collection("users").find(queryUsers).toArray();

    // 🔄 MODIF : Formatage propre des clients avec leur VRAI statut
    const clientsFormates = usersMatch.map(u => ({
      id: u._id.toString(),
      name: `${u.prenom || ""} ${u.nom || ""}`.trim() || "Client Sans Nom",
      quartier: u.quartier ? (quartierMap[u.quartier.toString()] || "Non spécifié") : "Non spécifié",
      pos: [u.localisationCollecte.coordinates[1], u.localisationCollecte.coordinates[0]],
      type: u.points && u.points > 500 ? 'PRO' : 'BASIC',
      
      // ⚠️ ICI : On lit le statut en DB au lieu de forcer 'En attente'. 
      // Assure-toi que le champ correspond à celui que tu utilises dans MongoDB quand le chauffeur scanne (ex: 'statutCollecte')
      status: u.statutCollecte || 'En attente' 
    }));

    // 🔔 MODIF : Récupération des notifications/messages envoyés par l'admin au chauffeur
    // Je suppose ici que tu as une collection "notifications" ou "messages"
    const notificationsBrutes = await db.collection("notifications")
      .find({ chauffeurId: new ObjectId(userId) }) // Cherche les messages pour CE chauffeur
      .sort({ dateCreation: -1 }) // Les plus récents en premier
      .limit(5) // On prend les 5 derniers pour ne pas surcharger
      .toArray();

    const notificationsFormatees = notificationsBrutes.map(n => ({
      id: n._id.toString(),
      title: n.titre || "Nouveau message",
      text: n.contenu || "",
      // Formate la date pour afficher juste l'heure (ex: "14:30")
      time: n.dateCreation ? new Date(n.dateCreation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : "Récemment",
      type: n.type || "info"
    }));

    return NextResponse.json({
      success: true,
      videur: {
        nom: nomComplet,
        quartiers: nomsQuartiersFormates,
        isSuperVideur: estSuperVideur
      },
      clients: clientsFormates,
      notifications: notificationsFormatees // 🔔 Ajout des notifications dans la réponse API
    });

  } catch (error) {
    console.error("Erreur API map-data:", error);
    return NextResponse.json({ success: false, error: "Erreur interne du serveur" }, { status: 500 });
  } finally {
    await client.close();
  }
}