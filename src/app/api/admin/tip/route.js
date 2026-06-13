import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Tip from "@/models/Tip";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/models/User";

// GET : Récupérer le dernier message publié (Accessible par les utilisateurs)
export async function GET() {
  try {
    await connectDB();
    const dernierTip = await Tip.findOne().sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      texte: dernierTip ? dernierTip.texte : "Recycler une seule tonne de papier permet de sauver 17 arbres et d'économiser 26 000 litres d'eau."
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur lors de la récupération de l'anecdote." }, { status: 500 });
  }
}

// POST : Publier un nouveau message (Sécurisé Admin)
export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Non autorisé." }, { status: 401 });
    }

    // Vérification du rôle admin
    if (!session || session.user?.role !== "admin") {
          return NextResponse.json(
            { success: false, message: "Accès refusé. Réservé aux administrateurs." },
            { status: 403 }
          );
        }
        
    const { texte } = await req.json();
    if (!texte || texte.trim() === "") {
      return NextResponse.json({ success: false, message: "Le contenu ne peut pas être vide." }, { status: 400 });
    }

    const nouveauTip = await Tip.create({ texte: texte.trim() });
    return NextResponse.json({ success: true, data: nouveauTip }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur serveur." }, { status: 500 });
  }
}