// src/app/api/admin/quartiers/[id]/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Quartier from "@/models/Quartier";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// TOGGLE STATUT (Activer/Désactiver)
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Interdit." }, { status: 403 });
    }

    // FIX NEXT.JS 15 : params est une Promise, on ajoute "await"
    const { id } = await params;
    const { estActif } = await req.json();

    // FIX MONGOOSE : remplacement de { new: true } par { returnDocument: 'after' }
    const quartierModifie = await Quartier.findByIdAndUpdate(
      id, 
      { estActif }, 
      { returnDocument: 'after' }
    );
    
    return NextResponse.json({ success: true, data: quartierModifie });
  } catch (error) {
    console.error("Erreur PUT quartier :", error);
    return NextResponse.json({ success: false, message: "Erreur lors de la modification." }, { status: 500 });
  }
}

// SUPPRESSION DÉFINITIVE
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Interdit." }, { status: 403 });
    }

    // FIX NEXT.JS 15 : params est une Promise, on ajoute "await"
    const { id } = await params;

    // Sécurité CRUCIALE : Vérifier si des utilisateurs sont déjà liés à ce quartier
    const userLie = await User.findOne({ quartier: id });
    if (userLie) {
      return NextResponse.json({ 
        success: false, 
        message: "Impossible de supprimer ce quartier car des utilisateurs y sont déjà inscrits. Désactivez-le plutôt." 
      }, { status: 400 });
    }

    await Quartier.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Quartier supprimé avec succès." });
  } catch (error) {
    console.error("Erreur DELETE quartier :", error);
    return NextResponse.json({ success: false, message: "Erreur lors de la suppression." }, { status: 500 });
  }
}