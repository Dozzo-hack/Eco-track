// src/app/api/user/chat/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";

export async function GET(req) {
  try {
    await connectDB();
    const session = await getServerSession();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, message: "Non autorisé. Veuillez vous connecter." }, { status: 401 });
    }

    // Sécurité absolue : Récupérer le vrai ID MongoDB de l'utilisateur via son email de session
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ success: false, message: "Profil introuvable" }, { status: 404 });
    }

    const userIdConnecte = dbUser._id.toString();

    // Extraire tous ses messages
    const messages = await Message.find({ userId: userIdConnecte }).sort({ createdAt: 1 });

    // Renvoyer au même format attendu par les composants
    return NextResponse.json({ success: true, messages: messages || [] });
  } catch (error) {
    console.error("Erreur GET Chat Client:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, message: "Non autorisé." }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ success: false, message: "Le message ne peut pas être vide." }, { status: 400 });
    }

    // Récupérer le vrai ID MongoDB de l'utilisateur via son email
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ success: false, message: "Profil introuvable" }, { status: 404 });
    }

    const userIdConnecte = dbUser._id.toString();

    const nouveauMessage = await Message.create({
      userId: userIdConnecte,
      text: text.trim(),
      sender: "user",
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, data: nouveauMessage });
  } catch (error) {
    console.error("Erreur POST Chat Client:", error);
    return NextResponse.json({ success: false, message: "Erreur d'envoi" }, { status: 500 });
  }
}