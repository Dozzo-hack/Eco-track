// FORCE NEXT.JS À LIRE LA BDD À CHAQUE APPEL (TUE LE CACHE DE NAVIGATION)
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Quiz from "@/models/Quiz";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 1. Récupérer le quiz de la semaine et le statut de l'utilisateur
export async function GET(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id || session.user._id;
    if (!userId) {
      return NextResponse.json({ success: false, message: "ID Utilisateur introuvable" }, { status: 400 });
    }

    // Trouver le quiz actif
    const activeQuiz = await Quiz.findOne({ isActive: true });
    if (!activeQuiz) {
      return NextResponse.json({ success: false, message: "Aucun quiz actif cette semaine." }, { status: 404 });
    }

    // Récupérer l'utilisateur directement depuis la BDD sans cache Mongoose
    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ success: false, message: "Profil utilisateur introuvable" }, { status: 404 });
    }

    // Vérification du doublon (conversion propre en String pour éviter les conflits d'Objets)
    const dejaFait = user.quizCompletes && user.quizCompletes.some((q) => {
      if (!q.quizId) return false;
      return q.quizId.toString() === activeQuiz._id.toString();
    }) || false;

    // Préparation des questions pour le client (avec correctAnswerIndex pour l'UI Vert/Rouge)
    const clientQuestions = activeQuiz.questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex
    }));

    return NextResponse.json({
      success: true,
      quizId: activeQuiz._id,
      title: activeQuiz.title,
      description: activeQuiz.description,
      questions: clientQuestions,
      dejaFait: !!dejaFait // Renvoie un vrai booléen
    });

  } catch (error) {
    console.error("CRITICAL ERROR IN QUIZ GET:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// 2. Soumettre les réponses et ajuster les points automatiquement
export async function POST(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Non authentifié" }, { status: 401 });
    }

    const { quizId, reponsesUtilisateur } = await req.json();
    const userId = session.user.id || session.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: "Utilisateur introuvable" }, { status: 404 });
    }

    if (!user.quizCompletes) {
      user.quizCompletes = [];
    }

    // Double sécurité stricte côté serveur
    const dejaFait = user.quizCompletes.some(
      (q) => q.quizId && q.quizId.toString() === quizId.toString()
    );
    
    if (dejaFait) {
      return NextResponse.json({ success: false, message: "Vous avez déjà soumis ce quiz !" }, { status: 400 });
    }

    const vraiQuiz = await Quiz.findById(quizId);
    if (!vraiQuiz) {
      return NextResponse.json({ success: false, message: "Quiz introuvable" }, { status: 404 });
    }

    let scoreObtenu = 0;
    vraiQuiz.questions.forEach((question, index) => {
      if (reponsesUtilisateur[index] === question.correctAnswerIndex) {
        scoreObtenu++;
      }
    });

    let pointsGagnes = 0;
    if (scoreObtenu === 3) pointsGagnes = 10;
    else if (scoreObtenu === 4) pointsGagnes = 25;
    else if (scoreObtenu === 5) pointsGagnes = 50;

    user.points = (user.points || 0) + pointsGagnes;
    
    user.quizCompletes.push({
      quizId: vraiQuiz._id,
      scoreObtenu,
      pointsGagnes
    });

    if (user.impact) {
      user.impact.co2Evite = (user.impact.co2Evite || 0) + (scoreObtenu * 2);
      user.impact.eauEconomisee = (user.impact.eauEconomisee || 0) + (scoreObtenu * 15);
    }

    // Enregistrement forcé et synchrone
    await user.save();

    return NextResponse.json({
      success: true,
      scoreObtenu,
      pointsGagnes,
      nouveauSoldePoints: user.points,
      message: "Quiz validé avec succès !"
    });

  } catch (error) {
    console.error("====== ERREUR SOUMISSION QUIZ ======", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}