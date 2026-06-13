import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Commande from "@/models/Commande";
import User from "@/models/User";
import Videur from "@/models/Videur"; 
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Non autorisé. Veuillez vous connecter." }, { status: 401 });
    }

    const userId = session.user.id || session.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: "Utilisateur introuvable." }, { status: 404 });
    }

    const currentPlan = (user.abonnement?.type || "FOYER ÉCO").toUpperCase().trim();

    if (currentPlan === "FOYER ÉCO" || currentPlan === "ECO" || currentPlan === "IMMEUBLE" || currentPlan === "AUCUN") {
      return NextResponse.json({ 
        success: false, 
        message: `Votre formule (${currentPlan}) ne permet pas de planifier de vidange personnalisée à la demande.` 
      }, { status: 403 });
    }

    const body = await req.json();
    const { typeDechet, volume, dateSouhaitee, instructions } = body;

    if (!typeDechet || !volume || !dateSouhaitee) {
      return NextResponse.json({ success: false, message: "Champs obligatoires manquants." }, { status: 400 });
    }

    const nouvelleCommande = await Commande.create({
      userId,
      typeDechet,
      volume,
      dateSouhaitee: new Date(dateSouhaitee),
      instructions,
      statut: "En attente"
    });
    
    return NextResponse.json({ success: true, data: nouvelleCommande }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST Vidange:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur lors de la commande." }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Non autorisé." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    let commandes;

    if (role === "admin" || session.user.role === "admin") {
      // 🌟 Peuplement multiniveau pour récupérer l'utilisateur ET son quartier
      commandes = await Commande.find({ statut: "En attente" })
        .populate({
          path: "userId",
          select: "nom prenom quartier",
          populate: {
            path: "quartier",
            select: "nom"
          }
        })
        .sort({ dateSouhaitee: 1 });
    } else {
      const userId = session.user.id || session.user._id;
      commandes = await Commande.find({ userId }).sort({ createdAt: -1 });
    }

    return NextResponse.json({ success: true, data: commandes }, { status: 200 });
  } catch (error) {
    console.error("Erreur GET Vidange:", error);
    return NextResponse.json({ success: false, message: "Impossible de charger les demandes." }, { status: 500 });
  }
}

// 🚀 Action d'assignation Admin d'un chauffeur à la commande Premium
export async function PUT(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "admin" && !req.url.includes("role=admin"))) {
      return NextResponse.json({ success: false, message: "Action réservée aux administrateurs." }, { status: 403 });
    }

    const body = await req.json();
    const { commandeId, videurId } = body;

    if (!commandeId || !videurId) {
      return NextResponse.json({ success: false, message: "Identifiants manquants." }, { status: 400 });
    }

    const cmdMiseAJour = await Commande.findByIdAndUpdate(
      commandeId,
      { videurId: videurId, statut: "Assignée" },
      { new: true }
    );

    await Videur.findByIdAndUpdate(videurId, { statut: "ASSIGNÉ" }); 

    return NextResponse.json({ success: true, message: "Chauffeur assigné avec succès.", data: cmdMiseAJour }, { status: 200 });
  } catch (error) {
    console.error("Erreur PUT Assignation Vidange:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur lors de l'assignation." }, { status: 500 });
  }
}