import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { getCourseById } from "@/api/courseApi";
import { getLatestQuiz, createQuiz, submitQuizAttempt, getQuizStats } from "@/api/quizApi";
import {
  clearQuizContributionState,
  shouldShowNeedMoreFromOthers,
} from "@/lib/quizContributionStorage";

import StartScreen from "@/components/Quiz/StartScreen";
import QuizScreen from "@/components/Quiz/QuizScreen";
import ResultScreen from "@/components/Quiz/ResultScreen";
import ContributionScreen from "@/components/Quiz/ContributionScreen";

export default function Quiz() {
  const [view, setView] = useState("landing"); // "loading", "quiz", "result", "contribution"
  const [questions, setQuestions] = useState([]);
  const [quizId, setQuizId] = useState(null);
  const [durationSeconds, setDurationSeconds] = useState(300);
  const [finalScore, setFinalScore] = useState(0);
  const [needContribution, setNeedContribution] = useState(false);

  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const userId = user?.userId ?? "";

  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  // Landing banner: no stats API when no quiz (404); zero attempts → "No data yet" in UI
  const [classAverage, setClassAverage] = useState({ status: "loading" });
  const attemptSubmittedRef = useRef(false);

  // Class average on landing: only fetch stats if a quiz exists for the course
  useEffect(() => {
    if (view !== "landing" || !courseId) return;
    let cancelled = false;

    async function loadClassAverage() {
      setClassAverage({ status: "loading" });
      let quiz;
      try {
        quiz = await getLatestQuiz(courseId);
      } catch (err) {
        if (cancelled) return;
        if (err?.response?.status === 404) {
          setClassAverage({ status: "no-quiz" });
          return;
        }
        setClassAverage({ status: "error" });
        return;
      }
      const qid = quiz?._id;
      if (!qid) {
        if (!cancelled) setClassAverage({ status: "no-quiz" });
        return;
      }
      try {
        const data = await getQuizStats(qid);
        if (cancelled) return;
        const attemptCount = data?.stats?.attemptCount ?? 0;
        if (attemptCount === 0) {
          setClassAverage({ status: "no-attempts" });
        } else {
          setClassAverage({
            status: "ready",
            percent: data.stats.avgScorePercent,
            attemptCount,
          });
        }
      } catch {
        if (!cancelled) setClassAverage({ status: "error" });
      }
    }

    loadClassAverage();
    return () => {
      cancelled = true;
    };
  }, [view, courseId]);

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
    if (!courseId) return; // course still loading or missing

    attemptSubmittedRef.current = false;
    setView("loading");
    try {
      // try fetch latest quiz
      const existing = await getLatestQuiz(courseId);
      if (userId) clearQuizContributionState(userId, courseId);
      const qs = Array.isArray(existing?.questions) ? existing.questions : [];
      setQuizId(existing?._id ?? null);
      setDurationSeconds(
        typeof existing?.durationSeconds === "number" ? existing.durationSeconds : 300
      );
      setQuestions(qs);
      setView("quiz");
      return;
    }
    catch (err) {
      const status = err?.response?.status;
      // 404 = no quiz yet → create one (will exit the catch block)
      if (status !== 404) {
        // if not 404, something went wrong
        alert("Could not load quiz. Please try again.");
        setView("landing");
        return;
      }
    }

    // create quiz if none exists
    try {
      // TODO: you can decide these values from UI later
      const questionCount = 5;
      const durationSeconds = 300;
      const created = await createQuiz(courseId, { questionCount, durationSeconds });
      if (userId) clearQuizContributionState(userId, courseId);
      const qs = Array.isArray(created?.questions) ? created.questions : [];
      setQuizId(created?._id ?? null);
      setDurationSeconds(
        typeof created?.durationSeconds === "number" ? created.durationSeconds : durationSeconds
      );
      setQuestions(qs);
      setView("quiz");
    }
    catch (err) {
      const status = err?.response?.status;
      const msg = String(err?.response?.data?.message || "");
      const isHumanPoolShortage = msg.includes("HUMAN");
      if (
        status === 422 &&
        userId &&
        shouldShowNeedMoreFromOthers(userId, courseId) &&
        isHumanPoolShortage
      ) {
        setView("notEnoughFromOthers");
        return;
      }
      if (status === 422) {
        setNeedContribution(true);
        setView("contribution");
        return;
      }
      alert("Could not create quiz. Please try again.");
      setView("landing");
    }
  }


  const handleComplete = useCallback(
    async ({ score, answers, timeTakenSeconds }) => {
      setFinalScore(score);
      if (quizId && questions.length > 0) {
        if (attemptSubmittedRef.current) {
          setView("result");
          return;
        }
        attemptSubmittedRef.current = true;
        try {
          await submitQuizAttempt(quizId, {
            score,
            total: questions.length,
            timeTakenSeconds,
            answers,
          });
        } catch (err) {
          console.error("Failed to save quiz attempt:", err);
          attemptSubmittedRef.current = false;
        }
      }
      setView("result");
    },
    [quizId, questions.length]
  );

  function resetQuiz() {
    attemptSubmittedRef.current = false;
    setView("landing");
    setQuestions([]);
    setQuizId(null);
    setDurationSeconds(300);
    setFinalScore(0);
  }

  return (
    <div className="min-h-screen py-8 px-4 flex flex-col items-center bg-[#f3f4f6] dark:bg-[#111827] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {view === "landing" && (
        <StartScreen
          course={course}
          onStart={startQuiz}
          classAverage={classAverage}
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
          durationSeconds={durationSeconds}
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
          onBackToCourse={() => navigate(`/courses/${courseId}`)}
        />
      )}

      {view === "contribution" && (
        <ContributionScreen
          course={course}
          isDarkMode={isDark}
          toggleDarkMode={toggleTheme}
          onBack={() => {
            setNeedContribution(false);
            setView("landing");
          }}
          needContribution={needContribution}
          onQuizCreated={(quiz) => {
            if (userId) clearQuizContributionState(userId, courseId);
            attemptSubmittedRef.current = false;
            const qs = Array.isArray(quiz?.questions) ? quiz.questions : [];
            setQuizId(quiz?._id ?? null);
            setDurationSeconds(
              typeof quiz?.durationSeconds === "number" ? quiz.durationSeconds : 300
            );
            setQuestions(qs);
            setView("quiz");
          }}
          onNeedMoreFromOthers={() => setView("notEnoughFromOthers")}
        />
      )}

      {view === "notEnoughFromOthers" && (
        <div className="flex flex-col items-center justify-center flex-grow gap-8 px-6 animate-fade-in duration-500">
          <div className="rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 p-8 max-w-md text-center">
            <p className="text-lg font-semibold text-amber-700 dark:text-amber-200">
              This course still needs more human-written questions before a quiz can be created.
            </p>
            <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm">
              You&apos;ve already added three. Ask classmates to contribute, then try starting the quiz again.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/courses")}
            className="px-8 py-4 rounded-full font-bold bg-gradient-to-br from-[#A855F7] to-[#EC4899] text-white hover:shadow-lg hover:shadow-purple-500/60 transition-all"
          >
            Back to courses
          </button>
        </div>
      )}
    </div>
  );
}