import React from "react";
import { useTranslation } from "react-i18next";

/* ---------- Main Component ---------- */
export default function Footer() {
  const { t } = useTranslation();

  const explore = {
    title: t("footer.explore.title", "Explore"),
    links: [
      { label: t("footer.explore.courses", "Courses"), href: "/courses" },
      { label: t("footer.explore.projects", "Projects"), href: "/projects" },
      { label: t("footer.explore.quizzes", "Quizzes"), href: "/quizzes" },
      { label: t("footer.explore.exams", "Sample Exams"), href: "/exams" },
      { label: t("footer.explore.notes", "Notes"), href: "/notes" },
      { label: t("footer.explore.tournaments", "Tournaments"), href: "/tournaments" },
    ],
  };

  const support = {
    title: t("footer.support.title", "Support"),
    links: [
      { label: t("footer.support.safety", "Safety & Moderation"), href: "/safety" },
      { label: t("footer.support.privacy", "Privacy Policy"), href: "/privacy" },
      { label: t("footer.support.terms", "Terms of Use"), href: "/terms" },
      { label: t("footer.support.contact", "Contact"), href: "/contact" },
    ],
  };

  const universities = {
    title: t("footer.universities.title", "Universities in Canada"),
    links: [
      { label: t("footer.universities.concordia", "Concordia University"), href: "#" },
      { label: t("footer.universities.mcgill", "McGill University"), href: "#" },
      { label: t("footer.universities.umontreal", "Université de Montréal"), href: "#" },
      { label: t("footer.universities.laval", "Université Laval"), href: "#" },
      { label: t("footer.universities.toronto", "University of Toronto"), href: "#" },
    ],
  };

  return (
    <footer className="bg-footer text-footer-foreground">
      <div className="mx-auto max-w-7xl pl-6 pr-4 md:pl-10 md:pr-6 lg:pl-16 lg:pr-8 py-12">
        <TopBrandRow t={t} />

        <FooterColumns
          explore={explore}
          support={support}
          universities={universities}
        />

        <BottomLine t={t} year={getYear()} />
      </div>
    </footer>
  );
}

/* ---------- Helpers ---------- */
const getYear = () => new Date().getFullYear();


/* ---------- Sections ---------- */
function TopBrandRow({ t }) {
  return (
    <div className="flex items-center justify-between pb-8 border-b border-footer-border">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-footer-foreground" aria-hidden="true" />
        <span className="text-lg font-bold">STEMConnect</span>
      </div>

      <p className="text-xs text-footer-muted">
        {t("footer.tagline", "Connect • Collaborate • Create")}
      </p>
    </div>
  );
}

function FooterColumns({ explore, support, universities }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-12 pt-10">
      <FooterCol title={explore.title} links={explore.links} />
      <FooterCol title={support.title} links={support.links} />
      <FooterCol title={universities.title} links={universities.links} />
    </div>
  );
}

function FooterCol({ title, links = [] }) {
  return (
    <nav aria-label={title}>
      <h3 className="text-xs font-semibold tracking-wider text-footer-muted uppercase">
        {title}
      </h3>

      <ul className="mt-4 space-y-3">
        {links.map((l, i) => (
          <li key={i}>
            <a
              href={l.href || "#"}
              className="text-sm text-footer-foreground hover:text-footer-muted transition-colors"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function BottomLine({ t, year }) {
  return (
    <div className="mt-10 border-t border-footer-border pt-6 text-xs text-footer-muted flex flex-col sm:flex-row items-center justify-between gap-2">
      <p>
        © {year} STEMConnect. {t("footer.rights", "All rights reserved.")}
      </p>

      <SocialLinks />
    </div>
  );
}

function SocialLinks() {
  return (
    <div className="flex gap-4">
      <a
        href="https://www.linkedin.com/in/ahmedkhanji/"
        aria-label="LinkedIn"
        className="hover:text-footer-foreground hover:opacity-70"
        target="_blank"
        rel="noreferrer"
      >
        <LinkedInIcon />
      </a>

      <a
        href="https://github.com/Ahmed-Khanji/STEMConnect"
        aria-label="GitHub"
        className="hover:text-footer-foreground hover:opacity-70"
        target="_blank"
        rel="noreferrer"
      >
        <GitHubIcon />
      </a>

      <a
        href="https://www.instagram.com/ak_softwaredev"
        aria-label="Instagram"
        className="hover:text-footer-foreground hover:opacity-70"
        target="_blank"
        rel="noreferrer"
      >
        <InstagramIcon />
      </a>
    </div>
  );
}


/* ---------- Icons ---------- */
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.5 8.25h4V23h-4V8.25Zm7.5 0h3.84v2.01h.05c.53-.95 1.82-2.01 3.75-2.01 4.01 0 4.75 2.64 4.75 6.06V23h-4v-6.62c0-1.58-.03-3.62-2.2-3.62-2.2 0-2.54 1.72-2.54 3.51V23h-4V8.25Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.36 6.84 9.72.5.1.68-.22.68-.48v-1.87c-2.78.62-3.37-1.37-3.37-1.37-.46-1.2-1.14-1.52-1.14-1.52-.93-.65.07-.64.07-.64 1.03.07 1.57 1.09 1.57 1.09.91 1.59 2.38 1.13 2.96.86.09-.68.36-1.13.65-1.39-2.22-.26-4.56-1.14-4.56-5.09 0-1.13.39-2.06 1.03-2.78-.1-.26-.45-1.31.1-2.73 0 0 .85-.28 2.8 1.06a9.34 9.34 0 0 1 5.1 0c1.96-1.34 2.8-1.06 2.8-1.06.55 1.42.2 2.47.1 2.73.64.72 1.03 1.65 1.03 2.78 0 3.96-2.34 4.83-4.57 5.08.37.33.7.97.7 1.96v2.91c0 .27.18.59.69.48A10.04 10.04 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.25-3a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" />
    </svg>
  );
}
