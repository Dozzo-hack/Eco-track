import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Quiz from "@/models/Quiz";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Importation de ta vraie configuration Auth

export async function POST(req) {
  try {
    await connectDB();

    // 1. Protection de l'API : Vérification si c'est bien l'admin
    const session = await getServerSession(authOptions);
    
    // Vérification stricte du rôle admin
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Accès refusé. Réservé aux administrateurs." },
        { status: 403 }
      );
    }

    const { title, description, questions } = await req.json();

    // 2. Validation basique
    if (!title || !questions || questions.length !== 5) {
      return NextResponse.json(
        { success: false, message: "Le quiz doit comporter un titre et exactement 5 questions." },
        { status: 400 }
      );
    }

    // 3. Désactiver tous les anciens quiz pour que le nouveau devienne l'unique actif
    await Quiz.updateMany({ isActive: true }, { isActive: false });

    // 4. Créer le nouveau quiz de la semaine
    const nouveauQuiz = await Quiz.create({
      title,
      description,
      questions,
      isActive: true
    });

    return NextResponse.json({
      success: true,
      message: "Le nouveau quiz de la semaine a été publié avec succès !",
      quizId: nouveauQuiz._id
    });

  } catch (error) {
    console.error("====== ERREUR PUBLICATION QUIZ ======", error);
    return NextResponse.json(
      { success: false, message: `Erreur serveur : ${error.message}` },
      { status: 500 }
    );
  }
}