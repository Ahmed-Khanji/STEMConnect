import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

// Single reusable card
function FeatureCard({ title, desc, img, href }) {
  return (
    <Link
      to={href}
      className={`relative flex-none w-full md:w-[420px] lg:w-[460px] h-48 md:px-0 rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition hover:scale-[1.03] duration-300 ease-in-out cursor-pointer`}
      aria-label={title}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${img})` }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      {/* Text */}
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className="text-lg font-bold drop-shadow">{title}</h3>
        {desc && <p className="text-sm opacity-90">{desc}</p>}
      </div>
    </Link>
  );
}

export default function Features() {
  const { t } = useTranslation();
  const tfeat = (key) => t(`Home.features.${key}`);

  // Content lives here (easy to add/remove)
  const cards = [
    {
      title: tfeat("learn"),
      desc: tfeat("learn_desc"),
      img: "/learn.jpg",
      href: "/courses",
    },
    {
      title: tfeat("projects"),
      desc: tfeat("projects_desc"),
      img: "/projects.avif",
      href: "/projects",
    },
    {
      title: tfeat("tournaments"),
      desc: tfeat("tournaments_desc"),
      img: "/tournaments.jpg",
      href: "/tournaments",
    },
  ];

  return (
    <section className="w-full max-w-8xl mx-auto py-10">
      <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
        {tfeat("title")}
      </h2>

      {/* Layout rules:
          - mobile: 1 per row
          - sm/md: 2 on top, 1 centered bottom
          - lg: 3 side-by-side
      */}
      <div className="flex flex-wrap gap-6 lg:gap-8 justify-center">
        {cards.map((c) => (
          <FeatureCard
            key={c.title}
            {...c}
          />
        ))}
      </div>
    </section>
  );
}