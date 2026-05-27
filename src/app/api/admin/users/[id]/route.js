// src/app/api/admin/users/[id]/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb"; 
import User from "@/models/User";
import Message from "@/models/Message"; 

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return NextResponse.json({ success: false, message: "Utilisateur introuvable" }, { status: 404 });
    }

    // Récupérer tous les messages liés à cet utilisateur précis
    const messages = await Message.find({ userId: id }).sort({ createdAt: 1 });

    return NextResponse.json({
      success: true,
      user,
      messages: messages || []
    });
  } catch (error) {
    console.error("Erreur GET admin user:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { action, amount, index, text } = body;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: "Utilisateur introuvable" }, { status: 404 });
    }

    // --- ENVOYER UN MESSAGE DE SUPPORT (ADMIN -> USER) ---
    if (action === "SEND_MESSAGE" || (!action && text)) {
      await Message.create({
        userId: id,
        text: text || body.text,
        sender: "admin",
        createdAt: new Date()
      });

      const updatedMessages = await Message.find({ userId: id }).sort({ createdAt: 1 });
      return NextResponse.json({ success: true, messages: updatedMessages });
    }

    // --- AJOUTER DES POINTS ---
    if (action === "ADD") {
      user.points = (user.points || 0) + parseInt(amount || 0);
      await user.save();
      return NextResponse.json({ success: true, user });
    }

    // --- RETIRER DES POINTS ---
    if (action === "REMOVE") {
      user.points = Math.max(0, (user.points || 0) - parseInt(amount || 0));
      await user.save();
      return NextResponse.json({ success: true, user });
    }

    // --- VALIDER LA LIVRAISON D'UNE RÉCOMPENSE ---
    if (action === "VALIDATE_RECOMPENSE") {
      if (user.recompensesEchangees && user.recompensesEchangees[index]) {
        user.recompensesEchangees[index].statut = "Livré";
        user.markModified("recompensesEchangees");
        await user.save();
        return NextResponse.json({ success: true, user });
      }
      return NextResponse.json({ success: false, message: "Récompense introuvable" }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: "Action non valide" }, { status: 400 });
  } catch (error) {
    console.error("Erreur POST admin user:", error);
    return NextResponse.json({ success: false, message: "Erreur interne" }, { status: 500 });
  }
}