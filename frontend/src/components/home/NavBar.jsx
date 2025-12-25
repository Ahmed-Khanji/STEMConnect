import { useState, useRef, useEffect } from 'react';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { MdOutlineNightlight, MdNightlight, MdOutlineLightMode, MdLightMode } from "react-icons/md";
import { GrLanguage } from "react-icons/gr";
import { useAuth } from "../../context/AuthContext.jsx";

function getInitials(user) {
  const name = user?.name || user?.firstName || "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase() || "U";
}

function NavBar({ scrolled = false}) {
  const { t } = useTranslation();
  
  const { user, loading, logout } = useAuth();

  // Close the dropdown when clicking outside
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function handleClickOutside(e) {
      // we attached ref to the div wrapping the button and dropdown
      // if the clicked target is not inside that div, close the dropdown
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // toggle dark mode
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  useEffect(() => {
    localStorage.setItem("theme", isDark ? 'dark' : 'light');
    window.dispatchEvent(new Event("theme-change"));
  }, [isDark]);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50
      backdrop-blur transition-shadow duration-300 ${scrolled ? "shadow-md" : ""}`}
    >
      <div className="flex justify-between items-center max-w-screen-2xl h-16 mx-auto px-8 lg:px-12">
        <Link to="/" className="flex items-center gap-3 cursor-pointer">
          <img src={logo} alt="logo" className="w-8 h-8 sm:w-10 sm:h-10" />
          <span className="text-lg sm:text-2xl font-semibold">STEMConnect</span>
        </Link>

        <div className="flex flex-row items-center gap-4">
          {/* language translation button */}
          <div ref={ref} className="relative inline-block shrink-0">
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded hover:shadow-md"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <GrLanguage className="text-xl sm:text-2xl" />
            </button>
            {open && (
              <div
                className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 mt-1 w-36 rounded-md border shadow
                          bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                role="menu"
              >
                <button
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    setOpen(false);
                    i18n.changeLanguage("en");
                  }}
                >
                  English
                </button>
                <button
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    setOpen(false);
                    i18n.changeLanguage("fr");
                  }}
                >
                  Français
                </button>
              </div>
            )}
          </div>
          
          {/* dark mode toggle button */}
          <button onClick={() => setIsDark((v) => !v)} className="group p-2">
            {isDark ? (
              <>
                <MdOutlineLightMode className="text-xl sm:text-2xl block group-hover:hidden" />
                <MdLightMode className="text-xl sm:text-2xl hidden group-hover:block" />
              </>
            ) : (
              <>
                <MdOutlineNightlight className="text-xl sm:text-2xl block group-hover:hidden" />
                <MdNightlight className="text-xl sm:text-2xl hidden group-hover:block" />
              </>
            )}
          </button>

          {/* Auth buttons */}
          <div className="flex flex-row items-center">
            {loading ? (
              <div className="h-9 w-9 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="h-9 w-9 rounded-full hover:cursor-pointer
                            bg-emerald-400/30 border border-emerald-300/40
                            flex items-center justify-center font-semibold text-black"
                  title={user?.name || user?.email || "User"}
                >
                  {getInitials(user)}
                </div>

                {/* logout button */}
                <button
                  onClick={logout}
                  className="px-3 py-2 hover:text-gray-500"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/auth" className="inline-block hover:text-gray-500">
                {t("nav.auth")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar