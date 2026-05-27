import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Ajuste le chemin selon ton projet
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
    const db = client.db("EcoTrackDB"); // Ton nom de Base de données Atlas

    // 2. Trouver les vraies infos du videur dans sa collection dédiée
    const videur = await db.collection("videurs").findOne({ _id: new ObjectId(userId) });
    if (!videur) {
      return NextResponse.json({ success: false, error: "Profil videur introuvable" }, { status: 404 });
    }

    const nomComplet = `${videur.prenom || ""} ${videur.nom || ""}`.trim() || "Videur Anonyme";
    const mesQuartiers = videur.quartiers || [];
    const estSuperVideur = mesQuartiers.includes("TOUS");

    // 3. Récupérer les utilisateurs ayant un emplacement validé avec coordonnées GPS
    const queryUsers = {
      "localisationCollecte.statutEmplacement": "Validé",
      "localisationCollecte.coordinates": { $exists: true }
    };

    // Si ce n'est pas un Super-Videur, on applique le filtre de quartier directement dans la requête Mongo
    if (!estSuperVideur) {
      // Gestion de la casse (insensible à la majuscule/minuscule pour éviter les bugs "Deido" vs "deido")
      const regexQuartiers = mesQuartiers.map(q => new RegExp(`^${q}$`, "i"));
      queryUsers.quartier = { $in: regexQuartiers };
    }

    const usersMatch = await db.collection("users").find(queryUsers).toArray();

    // 4. Formatage propre des clients pour Leaflet [Lat, Lng]
    const clientsFormates = usersMatch.map(u => ({
      id: u._id.toString(),
      name: `${u.prenom || ""} ${u.nom || ""}`.trim() || "Client Sans Nom",
      quartier: u.quartier || "Non spécifié",
      // MongoDB: [Lng, Lat] -> Leaflet: [Lat, Lng]
      pos: [u.localisationCollecte.coordinates[1], u.localisationCollecte.coordinates[0]],
      type: u.points && u.points > 500 ? 'PRO' : 'BASIC',
      status: 'En attente'
    }));

    return NextResponse.json({
      success: true,
      videur: {
        nom: nomComplet,
        quartiers: mesQuartiers,
        isSuperVideur: estSuperVideur
      },
      clients: clientsFormates
    });

  } catch (error) {
    console.error("Erreur API map-data:", error);
    return NextResponse.json({ success: false, error: "Erreur interne du serveur" }, { status: 500 });
  } finally {
    await client.close();
  }
}