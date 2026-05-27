"use client";
import { useState, useEffect } from "react";

export default function ImpactPage() {
  // --- ÉTATS POUR LES DONNÉES DYNAMIQUES BDD ---
  const [stats, setStats] = useState({ co2Sav: "0kg", eauEco: "0L", arbresSauves: "0" });
  const [quizData, setQuizData] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [dejaFait, setDejaFait] = useState(false);

  // --- ÉTATS DU JEU DE QUIZ ---
  const [quizzStep, setQuizzStep] = useState("start"); // start, play, result, error
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [reponsesChoisies, setReponsesChoisies] = useState([]);
  const [score, setScore] = useState(0);
  const [pointsGagnes, setPointsGagnes] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // --- NOUVEAUX ÉTATS POUR L'UI FEEDBACK (VERT / ROUGE) ---
  const [selectedAnswer, setSelectedAnswer] = useState(null); 
  const [isShowingFeedback, setIsShowingFeedback] = useState(false);

  const saviezVous = "Recycler une seule tonne de papier permet de sauver 17 arbres et d'économiser 26 000 litres d'eau.";

  // --- CHARGEMENT INITIAL ET RE-VERIFICATION STRICTE ---
useEffect(() => {
  async function fetchData() {
    try {
      // 1. Récupération du profil utilisateur (pour ses stats d'impact réelles)
      const userRes = await fetch("/api/user/profile"); 
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.success && userData.user?.impact) {
          setStats({
            co2Sav: `${userData.user.impact.co2Evite || 0}kg`,
            eauEco: `${userData.user.impact.eauEconomisee || 0}L`,
            arbresSauves: `${userData.user.impact.arbresSauves || 0}`
          });
        }
      }

      // 2. Récupération du quiz actif de la semaine
      // AJOUT d'un timestamp à l'URL pour forcer le navigateur à contourner son propre cache local
      const quizRes = await fetch(`/api/user/quizz?t=${new Date().getTime()}`);
      if (quizRes.ok) {
        const qData = await quizRes.json();
        if (qData.success) {
          setQuizData(qData);
          setDejaFait(qData.dejaFait);
          
          // FORCE l'interface à se bloquer immédiatement si le serveur dit que c'est fait
          if (qData.dejaFait) {
            setQuizzStep("start"); // Reste sur l'affichage du blocage
          }
        }
      }
    } catch (err) {
      console.error("Erreur lors de la synchronisation des données:", err);
    } finally {
      setLoadingQuiz(false);
    }
  }
  
  // On réinitialise les états de progression pour éviter les restes d'une ancienne session de navigation
  setCurrentQuestionIndex(0);
  setReponsesChoisies([]);
  
  fetchData();
}, []); // S'exécute à chaque fois que l'utilisateur revient sur la page

  // --- GESTION DU CLIC DE RÉPONSE AVEC TIMEOUT ET COULEURS ---
  const handleSelectOption = (optionIndex) => {
    if (isShowingFeedback) return; // Bloque le double clic pendant l'animation

    setSelectedAnswer(optionIndex);
    setIsShowingFeedback(true);

    const nouvellesReponses = [...reponsesChoisies, optionIndex];
    setReponsesChoisies(nouvellesReponses);

    // Attendre 1.5 seconde pour laisser l'utilisateur voir le retour Vert/Rouge
    setTimeout(() => {
      setIsShowingFeedback(false);
      setSelectedAnswer(null);

      if (currentQuestionIndex < quizData.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        soumettreQuiz(nouvellesReponses);
      }
    }, 1500);
  };

  const soumettreQuiz = async (reponsesFinales) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/user/quizz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quizData.quizId,
          reponsesUtilisateur: reponsesFinales
        })
      });

      const data = await res.json();
      if (data.success) {
        setScore(data.scoreObtenu);
        setPointsGagnes(data.pointsGagnes);
        setDejaFait(true); // Bloqué définitivement en local instantanément
        setQuizzStep("result");
        
        if (data.scoreObtenu > 0) {
          setStats(prev => ({
            co2Sav: `${parseInt(prev.co2Sav) + (data.scoreObtenu * 2)}kg`,
            eauEco: `${parseInt(prev.eauEco) + (data.scoreObtenu * 15)}L`,
            arbresSauves: prev.arbresSauves
          }));
        }
      } else {
        setQuizzStep("error");
      }
    } catch (err) {
      setQuizzStep("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-24 lg:pt-0 pb-24 space-y-10 animate-in fade-in duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Impact Écologique</h1>
        <p className="text-gray-500 font-bold italic">Chaque geste compte. Voici le vôtre.</p>
      </div>

      {/* Cartes de Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "CO2 Évité", val: stats.co2Sav, icon: "fa-cloud", color: "bg-blue-50 text-blue-600" },
          { label: "Eau Économisée", val: stats.eauEco, icon: "fa-droplet", color: "bg-cyan-50 text-cyan-600" },
          { label: "Arbres Sauvés", val: stats.arbresSauves, icon: "fa-tree", color: "bg-green-50 text-green-600" },
        ].map((s, i) => (
          <div key={i} className={`${s.color} p-8 rounded-[40px] shadow-sm flex flex-col items-center text-center`}>
            <i className={`fa-solid ${s.icon} text-3xl mb-4`}></i>
            <span className="text-3xl font-black tracking-tighter">{s.val}</span>
            <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section Quizz Dynamique */}
        <div className="bg-[#6200ee] rounded-[45px] p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[320px]">
          <div className="relative z-10 w-full">
            <h2 className="text-2xl font-black mb-2 italic">
              {quizData?.title || "Le Quizz du Vendredi 🧠"}
            </h2>
            <p className="text-sm font-bold opacity-80 mb-8 text-purple-200">
              {quizData?.description || "Répondez à 5 questions et gagnez jusqu'à 50 points !"}
            </p>

            {loadingQuiz ? (
              <p className="text-xs font-mono tracking-widest animate-pulse uppercase text-yellow-300">
                Synchronisation du satellite EcoTrack...
              </p>
            ) : dejaFait && quizzStep !== "result" ? (
              <div className="bg-white/10 p-6 rounded-3xl border border-white/5">
                <p className="text-sm font-black uppercase tracking-tight text-yellow-400 mb-1">Session Clôturée</p>
                <p className="text-xs opacity-80 leading-relaxed">
                  Vous avez déjà validé votre participation pour ce quiz. Revenez vendredi prochain pour un nouveau défi !
                </p>
              </div>
            ) : (
              <>
                {quizzStep === "start" && (
                  <button 
                    onClick={() => setQuizzStep("play")}
                    className="bg-[#ffcc00] text-black px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    Commencer (5 questions)
                  </button>
                )}

                {quizzStep === "play" && quizData?.questions && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest opacity-60">
                      <span>Progression</span>
                      <span>{currentQuestionIndex + 1} / {quizData.questions.length}</span>
                    </div>
                    <p className="font-bold bg-white/10 p-5 rounded-2xl text-sm leading-relaxed">
                      {quizData.questions[currentQuestionIndex].questionText}
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      {quizData.questions[currentQuestionIndex].options.map((opt, i) => {
                        const isCorrect = i === quizData.questions[currentQuestionIndex].correctAnswerIndex;
                        const isSelected = i === selectedAnswer;
                        
                        // Détermination dynamique des styles Tailwind pour le feedback de couleur
                        let btnStyle = "bg-white/10 border-white/5 text-white hover:bg-white/20";
                        if (isShowingFeedback) {
                          if (isCorrect) {
                            btnStyle = "bg-green-500 border-green-600 text-white font-bold shadow-[0_0_15px_rgba(34,197,94,0.5)]";
                          } else if (isSelected) {
                            btnStyle = "bg-red-500 border-red-600 text-white font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)]";
                          } else {
                            btnStyle = "bg-white/5 border-white/5 text-white/40 opacity-40";
                          }
                        }

                        return (
                          <button 
                            key={i} 
                            onClick={() => handleSelectOption(i)} 
                            disabled={submitting || isShowingFeedback}
                            className={`w-full py-4 rounded-2xl text-left px-6 font-bold text-xs transition-all border active:scale-[0.99] cursor-pointer ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {quizzStep === "result" && (
                  <div className="text-center py-4 animate-in zoom-in-95 duration-300">
                    <p className="text-6xl font-black text-[#ffcc00] mb-2">{score}/5</p>
                    <p className="font-black uppercase tracking-wide text-sm">ANALYSE TERMINÉE !</p>
                    <p className="text-xs opacity-80 mt-1 mb-4">
                      {pointsGagnes > 0 
                        ? `Félicitations, +${pointsGagnes} PTS ont été crédités sur votre compte.` 
                        : "Dommage ! Il faut au moins 3 bonnes réponses pour débloquer les points."}
                    </p>
                    <div className="inline-block bg-white/10 px-6 py-2 rounded-full border border-white/5 text-[10px] font-mono uppercase tracking-widest text-purple-200">
                      Rendez-vous vendredi prochain !
                    </div>
                  </div>
                )}

                {quizzStep === "error" && (
                  <p className="text-xs text-red-300 font-bold">
                    Une erreur est survenue lors de la validation. Veuillez actualiser la page.
                  </p>
                )}
              </>
            )}
          </div>
          <i className="fa-solid fa-bolt absolute right-[-20px] top-[-20px] text-white/5 text-[150px] pointer-events-none"></i>
        </div>

        {/* Section Le Saviez-vous */}
        <div className="bg-white rounded-[45px] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-xl">
              <i className="fa-solid fa-lightbulb"></i>
            </div>
            <h2 className="text-xl font-black text-gray-800">Le Saviez-vous ?</h2>
          </div>
          <p className="text-gray-600 font-bold leading-relaxed italic border-l-4 border-amber-200 pl-6 my-auto text-sm">
            "{saviezVous}"
          </p>
          <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mise à jour : Hebdomadaire</span>
            <div className="flex gap-2">
              <button className="h-8 w-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-all"><i className="fa-solid fa-share-nodes"></i></button>
            </div>
          </div>
        </div>

      </div>

      {/* Barème de rappel des points du Quiz */}
      <div className="bg-gray-50 rounded-[35px] p-6 flex flex-wrap justify-center gap-8 border border-dashed border-gray-200">
        <div className="text-center"><p className="font-black text-gray-400 text-[10px] tracking-wider">3 RÉPONSES</p><p className="font-black text-[#6200ee] text-sm">10 PTS</p></div>
        <div className="text-center"><p className="font-black text-gray-400 text-[10px] tracking-wider">4 RÉPONSES</p><p className="font-black text-[#6200ee] text-sm">25 PTS</p></div>
        <div className="text-center"><p className="font-black text-gray-400 text-[10px] tracking-wider">5 RÉPONSES</p><p className="font-black text-[#6200ee] text-sm">50 PTS</p></div>
      </div>
    </div>
  );
}