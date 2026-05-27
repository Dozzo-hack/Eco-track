import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }], // Tableau de 4 propositions (A, B, C, D)
  correctAnswerIndex: { type: Number, required: true } // Index de la bonne réponse (0, 1, 2 ou 3)
});

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true, default: "Le Quizz du Vendredi 🧠" },
  description: { type: String, default: "Répondez à 5 questions et gagnez jusqu'à 50 points !" },
  questions: [QuestionSchema], // Tableau contenant exactement 5 questions
  isActive: { type: Boolean, default: true }, // Permet de savoir si c'est le quiz de la semaine
  createdAt: { type: Date, default: Date.now }
});

// Empêche Mongoose de recréer le modèle s'il existe déjà
export default mongoose.models.Quiz || mongoose.model("Quiz", QuizSchema);