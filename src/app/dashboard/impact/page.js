"use client";
import { useState, useEffect } from "react";

export default function ImpactPage() {
  const [stats, setStats] = useState({ co2Sav: "0kg", eauEco: "0L", arbresSauves: "0" });
  const [quizData, setQuizData] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [dejaFait, setDejaFait] = useState(false);

  const [saviezVous, setSaviezVous] = useState("Recycler une seule tonne de papier permet de sauver 17 arbres et d'économiser 26 000 litres d'eau.");

  const [quizzStep, setQuizzStep] = useState("start"); 
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [reponsesChoisies, setReponsesChoisies] = useState([]);
  const [score, setScore] = useState(0);
  const [pointsGagnes, setPointsGagnes] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [selectedAnswer, setSelectedAnswer] = useState(null); 
  const [isShowingFeedback, setIsShowingFeedback] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const userRes = await fetch("/api/user/profile"); 
        if (userRes.ok) {
          const userData = await userRes.json();
          const profile = userData.data || userData; 
          
          if (profile?.impact) {
            const imp = profile.impact;
            setStats({
              co2Sav: `${imp.co2Evite ?? 0}kg`,
              eauEco: `${imp.eauEconomisee ?? 0}L`,
              arbresSauves: `${imp.arbresSauves ?? 0}`
            });
          }
        }

        const tipRes = await fetch("/api/admin/tip");
        if (tipRes.ok) {
          const tipData = await tipRes.json();
          if (tipData.success && tipData.texte) {
            setSaviezVous(tipData.texte);
          }
        }

        const quizRes = await fetch(`/api/user/quizz?t=${new Date().getTime()}`);
        if (quizRes.ok) {
          const qData = await quizRes.json();
          if (qData.success) {
            setQuizData(qData);
            setDejaFait(qData.dejaFait);
            
            if (qData.dejaFait) {
              setQuizzStep("start"); 
            }
          }
        }
      } catch (err) {
        console.error("Erreur lors de la synchronisation des données:", err);
      } finally {
        setLoadingQuiz(false);
      }
    }
    
    setCurrentQuestionIndex(0);
    setReponsesChoisies([]);
    fetchData();
  }, []);

  const handleSelectOption = (optionIndex) => {
    if (isShowingFeedback) return;

    setSelectedAnswer(optionIndex);
    setIsShowingFeedback(true);

    const nouvellesReponses = [...reponsesChoisies, optionIndex];
    setReponsesChoisies(nouvellesReponses);

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
        setDejaFait(true); 
        setQuizzStep("result");
        
        if (data.scoreObtenu > 0) {
          setStats(prev => {
            const co2Actuel = parseFloat(prev.co2Sav.replace("kg", "")) || 0;
            const eauActuelle = parseInt(prev.eauEco.replace("L", "")) || 0;

            return {
              co2Sav: `${co2Actuel + (data.scoreObtenu * 2)}kg`,
              eauEco: `${eauActuelle + (data.scoreObtenu * 15)}L`,
              arbresSauves: prev.arbresSauves
            };
          });
        }
      } else {
        setQuizzStep("error");
      }
    } catch (err) {
      console.error("Erreur soumission quiz:", err);
      setQuizzStep("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-24 px-4 max-w-7xl mx-auto space-y-10 overflow-x-hidden">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">Impact Écologique</h1>
        <p className="text-sm text-gray-500 font-bold italic">Chaque geste compte. Voici le vôtre.</p>
      </div>

      {/* Cartes de Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "CO2 Évité", val: stats.co2Sav, icon: "fa-cloud", color: "bg-blue-50 text-blue-600" },
          { label: "Eau Économisée", val: stats.eauEco, icon: "fa-droplet", color: "bg-cyan-50 text-cyan-600" },
          { label: "Arbres Sauvés", val: stats.arbresSauves, icon: "fa-tree", color: "bg-green-50 text-green-600" },
        ].map((s, i) => (
          <div key={i} className={`${s.color} p-6 sm:p-8 rounded-[30px] shadow-sm flex flex-col items-center text-center min-w-0`}>
            <i className={`fa-solid ${s.icon} text-2xl sm:text-3xl mb-4`}></i>
            <span className="text-2xl sm:text-3xl font-black tracking-tighter truncate w-full">{s.val}</span>
            <span className="text-[10px] font-black uppercase opacity-60 tracking-widest mt-1">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Quizz */}
        <div className="bg-[#6200ee] rounded-[35px] p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[340px]">
          <div className="relative z-10 w-full">
            <h2 className="text-xl sm:text-2xl font-black mb-2 italic break-words">
              {quizData?.title || "Le Quizz du Vendredi 🧠"}
            </h2>
            <p className="text-xs sm:text-sm font-bold opacity-80 mb-6 text-purple-200 break-words">
              {quizData?.description || "Répondez à vos questions et gagnez des points !"}
            </p>

            {loadingQuiz ? (
              <p className="text-xs font-mono tracking-widest animate-pulse uppercase text-yellow-300">
                Synchronisation EcoTrack...
              </p>
            ) : dejaFait && quizzStep !== "result" ? (
              <div className="bg-white/10 p-5 rounded-2xl border border-white/5">
                <p className="text-xs sm:text-sm font-black uppercase tracking-tight text-yellow-400 mb-1">Session Clôturée</p>
                <p className="text-xs opacity-80 leading-relaxed">
                  Vous avez déjà validé votre participation pour ce quiz. Revenez très bientôt pour un nouveau défi !
                </p>
              </div>
            ) : (
              <>
                {quizzStep === "start" && (
                  <button 
                    onClick={() => setQuizzStep("play")}
                    className="bg-[#ffcc00] text-black px-6 py-3.5 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    Commencer le quiz
                  </button>
                )}

                {quizzStep === "play" && quizData?.questions && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest opacity-60">
                      <span>Progression</span>
                      <span>{currentQuestionIndex + 1} / {quizData.questions.length}</span>
                    </div>
                    <p className="font-bold bg-white/10 p-4 rounded-xl text-xs sm:text-sm leading-relaxed break-words">
                      {quizData.questions[currentQuestionIndex].questionText}
                    </p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {quizData.questions[currentQuestionIndex].options.map((opt, i) => {
                        const isCorrect = i === quizData.questions[currentQuestionIndex].correctAnswerIndex;
                        const isSelected = i === selectedAnswer;
                        
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
                            className={`w-full py-3 rounded-xl text-left px-5 font-bold text-xs transition-all border active:scale-[0.99] cursor-pointer break-words ${btnStyle}`}
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
                    <p className="text-5xl font-black text-[#ffcc00] mb-2">{score}/{quizData?.questions?.length || 5}</p>
                    <p className="font-black uppercase tracking-wide text-xs">ANALYSE TERMINÉE !</p>
                    <p className="text-xs opacity-80 mt-1 mb-4 px-2">
                      {pointsGagnes > 0 
                        ? `Félicitations, +${pointsGagnes} PTS ont été crédités sur votre compte.` 
                        : "Dommage ! Entraînez-vous pour le prochain quiz afin de débloquer les points."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          <i className="fa-solid fa-bolt absolute right-[-20px] top-[-20px] text-white/5 text-[120px] pointer-events-none"></i>
        </div>

        {/* Section Le Saviez-vous */}
        <div className="bg-white rounded-[35px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between min-h-[320px]">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-11 w-11 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-lg shrink-0">
              <i className="fa-solid fa-lightbulb"></i>
            </div>
            <h2 className="text-lg font-black text-gray-800">Le Saviez-vous ?</h2>
          </div>
          <p className="text-gray-600 font-bold leading-relaxed italic border-l-4 border-amber-200 pl-4 my-auto text-xs sm:text-sm break-words">
            "{saviezVous}"
          </p>
          <div className="mt-6 pt-5 border-t border-gray-50 flex justify-between items-center shrink-0">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mise à jour : Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}