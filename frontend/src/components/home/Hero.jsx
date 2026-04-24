import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, FolderOpen, Trophy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Hero() {
  const { t } = useTranslation();
  const th = (key) => t(`Home.hero.${key}`);
  const tf = (key) => t(`Home.features.${key}`);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showFeaturePopup, setShowFeaturePopup] = useState(false);
  const dialogRef = useRef(null);

  // Close on Escape and trap focus inside the modal
  useEffect(() => {
    if (!showFeaturePopup) return;
    function onKeyDown(e) {
      if (e.key === "Escape") { setShowFeaturePopup(false); return; }
      if (e.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])') || [];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first)?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    // move focus into dialog on open
    dialogRef.current?.querySelector('a[href],button')?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showFeaturePopup]);

  function handleGetStarted() {
    if (!user) {
      navigate("/auth");
      return;
    }
    setShowFeaturePopup(true);
  }

  const featureCards = [
    {
      key: "courses",
      title: tf("learn"),
      desc: tf("learn_desc"),
      href: "/courses",
      cta: tf("learnMore"),
      icon: GraduationCap,
      hoverColor: "amber", // yellow
    },
    {
      key: "projects",
      title: tf("projects"),
      desc: tf("projects_desc"),
      href: "/projects",
      cta: tf("viewProjects"),
      icon: FolderOpen,
      hoverColor: "blue",
    },
    {
      key: "tournaments",
      title: tf("tournaments"),
      desc: tf("tournaments_desc"),
      href: "/tournaments",
      cta: tf("joinNow"),
      icon: Trophy,
      hoverColor: "purple",
    },
  ];

  const hoverColorClasses = {
    amber: "from-amber-500/35 to-amber-400/5 group-hover:translate-y-0",
    blue: "from-blue-500/35 to-blue-400/5 group-hover:translate-y-0",
    purple: "from-purple-500/35 to-purple-400/5 group-hover:translate-y-0",
  };
  const iconBoxClasses = {
    amber: "bg-amber-500/15",
    blue: "bg-blue-500/15",
    purple: "bg-purple-500/15",
  };
  const iconTextClasses = {
    amber: "text-amber-600 dark:text-amber-400",
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
  };
  const ctaClasses = {
    amber: "text-amber-600 dark:text-amber-400 group-hover:underline",
    blue: "text-blue-600 dark:text-blue-400 group-hover:underline",
    purple: "text-purple-600 dark:text-purple-400 group-hover:underline",
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center gap-8">
        {/* Title */}
        <h1 className="text-5xl lg:text-7xl text-center font-extrabold tracking-tight text-foreground">
          {th("title")}
        </h1>

        {/* Paragraph */}
        <p className="text-lg lg:text-xl text-center max-w-3xl mx-auto px-4 leading-relaxed text-muted-foreground">
          {th("paragraph")}
        </p>

        {/* Get Started button */}
        <button
          type="button"
          onClick={handleGetStarted}
          className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-2 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        >
          {th("GetStarted")}
        </button>
      </div>

      {/* Modal popup (authenticated only) */}
      {showFeaturePopup && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Choose a feature"
        >
          {/* Click outside to close: gray, shadowy backdrop */}
          <div
            className="absolute inset-0 bg-gray-900/55 backdrop-blur-[2px]"
            onClick={() => setShowFeaturePopup(false)}
            aria-hidden
          />

          {/* Feature cards */}
          <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-10">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.key}
                  to={card.href}
                  onClick={() => setShowFeaturePopup(false)}
                  className="group relative flex flex-col rounded-2xl overflow-hidden
                    bg-card dark:bg-zinc-800 border border-border
                    shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                >
                  {/* Hover animation: colored gradient slides up from bottom */}
                  <div
                    className={`absolute inset-x-0 bottom-0 h-full bg-gradient-to-t transition-transform duration-300 translate-y-full ${hoverColorClasses[card.hoverColor]}`}
                    aria-hidden
                  />

                  <div className="relative z-10 flex flex-col h-full p-8 text-left min-h-[340px]">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${iconBoxClasses[card.hoverColor]}`}>
                      <Icon className={`w-7 h-7 ${iconTextClasses[card.hoverColor]}`} />
                    </div>
                    {/* Title */}
                    <h3 className="text-xl font-bold text-foreground mb-3">
                      {card.title}
                    </h3>
                    {/* Description */}
                    <p className="text-sm text-muted-foreground flex-1 line-clamp-4">
                      {card.desc}
                    </p>
                    {/* CTA */}
                    <span className="mt-5 text-sm font-medium text-primary group-hover:underline inline-flex items-center gap-1">
                      {card.cta}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
