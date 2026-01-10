import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { getCourseById } from "@/api/courseApi";
import { getLatestQuiz, createQuiz } from "@/api/quizApi";

import StartScreen from "@/components/Quiz/StartScreen";
import QuizScreen from "@/components/Quiz/QuizScreen";
import ResultScreen from "@/components/Quiz/ResultScreen";
import ContributionScreen from "@/components/Quiz/ContributionScreen";

export default function Quiz() {
  const [view, setView] = useState("landing"); // "loading", "quiz", "result", "contribution"
  const [questions, setQuestions] = useState([]);
  const [finalScore, setFinalScore] = useState(0);
  const [needContribution, setNeedContribution] = useState(false);

  const { isDark, toggleTheme } = useTheme();

  // get course details
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // load selected course data
  useEffect(() => {
    if (!courseId) return;
    
    async function loadCourse() {
      try {
        setLoading(true);
        const data = await getCourseById(courseId);
        setCourse(data);
      } catch (err) {
        alert("Course not found or you don't have access to it.");
        navigate("/courses", { replace: true });
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [courseId, navigate]);

  // Starts the quiz flow: try get latest quiz, otherwise create, otherwise redirect to contribution
  async function startQuiz() {
    if (!courseId) return;
    if (!course) return; // course still loading or missing

    setView("loading");
    try {
      // try fetch latest quiz
      const existing = await getLatestQuiz(courseId);
      const qs = Array.isArray(existing?.questions) ? existing.questions : [];
      setQuestions(qs);
      setView("quiz");
      return;
    }
    catch (err) {
      const status = err?.response?.status;
      // 404 = no quiz yet → create one
      if (status !== 404) {
        alert("Could not load quiz. Please try again.");
        setView("landing");
        return;
      }
    }

    // create quiz if none exists
    try {
      // TODO: you can decide these values from UI later
      const topic = "General";
      const questionCount = 10;
      const durationSeconds = 300;

      const created = await createQuiz(courseId, { topic, questionCount, durationSeconds });
      const qs = Array.isArray(created?.questions) ? created.questions : [];
      setQuestions(qs);
      setView("quiz");
    } 
    catch (err) {
      const status = err?.response?.status;
      // 422 = not enough questions → send to contribution
      if (status === 422) {
        setNeedContribution(true);
        setView("contribution");
        return;
      }
      alert("Could not create quiz. Please try again.");
      setView("landing");
    }
  }


  function handleComplete(score) {
    setFinalScore(score);
    setView("result");
  }

  function resetQuiz() {
    setView("landing");
    setQuestions([]);
    setFinalScore(0);
  }

  return (
    <div className="min-h-screen py-8 px-4 flex flex-col items-center bg-[#f3f4f6] dark:bg-[#111827] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {view === "landing" && (
        <StartScreen
          course={course}
          onStart={startQuiz}
          isDarkMode={isDark}
          toggleDarkMode={toggleTheme}
        />
      )}

      {view === "loading" && (
        <div className="flex flex-col items-center justify-center flex-grow gap-6 animate-pulse">
          <div className="w-16 h-16 border-4 border-[#a855f7] border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Preparing Your Quiz...
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              We're gathering top-tier questions for {course?.name}.
            </p>
          </div>
        </div>
      )}

      {view === "quiz" && (
        <QuizScreen
          questions={questions}
          onComplete={handleComplete}
          onExit={resetQuiz}
          isDarkMode={isDark}
          toggleDarkMode={toggleTheme}
        />
      )}

      {view === "result" && (
        <ResultScreen
          score={finalScore}
          total={questions.length}
          onRestart={resetQuiz}
        />
      )}

      {view === 'contribution' && (
        <ContributionScreen
          course={course}
          isDarkMode={isDark}
          toggleDarkMode={toggleTheme}
          onBack={() => {
            setNeedContribution(false);
            setView("landing");
          }}
          needContribution={needContribution}
      />
      )}
    </div>
  );
}