import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { MdOutlineNightlight, MdNightlight } from "react-icons/md";
import { GrLanguage } from "react-icons/gr";

function NavBar({ scrolled = false}) {
  const [open, setOpen] = useState(false);
  
  // Close the dropdown when clicking outside
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

  return (
    <header className={`fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur transition-shadow duration-300 ${scrolled ? "shadow-sm" : ""}`}>
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
                  <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-28 rounded-md border bg-white shadow">
                    <button className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => setOpen(false)}>
                      English
                    </button>
                    <button className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => setOpen(false)}>
                      Français
                    </button>
                  </div>
                )}
              </div>

              <button className="p-2 cursor-pointer group">
                {/* default (outline) */}
                <MdOutlineNightlight className="text-2xl block group-hover:hidden" />
                {/* on hover (filled) */}
                <MdNightlight className="text-2xl hidden group-hover:block" />
              </button>

              <Link to='/login' className='cursor-pointer hover:text-gray-500'>Login</Link>
              <Link to='/register' className='cursor-pointer hover:text-gray-500'>Register</Link>
          </div>
      </div>
    </header>
  )
}

export default NavBar