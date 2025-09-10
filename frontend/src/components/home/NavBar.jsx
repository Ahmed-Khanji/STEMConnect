import { useState, useRef, useEffect } from 'react';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { MdOutlineNightlight, MdNightlight, MdOutlineLightMode, MdLightMode } from "react-icons/md";
import { GrLanguage } from "react-icons/gr";

function NavBar({ scrolled = false}) {
  const { t } = useTranslation();
  
  // Close the dropdown when clicking outside
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function hanbdleClickOutside(e) {
      // we attached ref to the div wrapping the button and dropdown
      // if the clicked target is not inside that div, close the dropdown
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", hanbdleClickOutside);
    return () => {
      document.removeEventListener("mousedown", hanbdleClickOutside);
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
    <header className={`fixed top-0 inset-x-0 z-50
      backdrop-blur transition-shadow duration-300 ${scrolled ? "shadow-sm" : ""}`}
    >
      <div className='flex justify-between items-center p-6 mx-20'>
          <Link to='/' className="flex items-center gap-2 cursor-pointer">
              <img src={logo} alt='logo' className='w-10 h-10' />
              <span className='text-2xl font-semibold'>STEMConnect</span>
          </Link>

          <div className='flex items-center gap-6'>
              <div ref={ref} className="relative inline-block">
                <button
                  onClick={() => setOpen(!open)}
                  className="p-2 rounded hover:shadow-md"
                >
                  <GrLanguage className="text-xl" />
                </button>
                {open && (
                  <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-28 rounded-md border shadow 
                    bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  >
                    <button className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => {
                      setOpen(false)
                      i18n.changeLanguage('en');
                    }}>
                      English
                    </button>
                    <button className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => {
                      setOpen(false);
                      i18n.changeLanguage('fr');
                    }}>
                      Français
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => setIsDark(v => !v)} className="group">
                {isDark ? (
                  <>
                    {/* Sun icons for light mode */}
                    <MdOutlineLightMode className="text-2xl block group-hover:hidden" />
                    <MdLightMode className="text-2xl hidden group-hover:block" />
                  </>
                ) : (
                  <>
                    {/* Moon icons for dark mode */}
                    <MdOutlineNightlight className="text-2xl block group-hover:hidden" />
                    <MdNightlight className="text-2xl hidden group-hover:block" />
                  </>
                )}
            </button>

              <Link to='/login' className='cursor-pointer hover:text-gray-500'>{t("login")}</Link>
              <Link to='/register' className='cursor-pointer hover:text-gray-500'>{t("register")}</Link>
          </div>
      </div>
    </header>
  )
}

export default NavBar