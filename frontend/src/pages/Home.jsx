import { useState, useEffect } from 'react';
import NavBar from '../components/home/NavBar';

function Home() {
  // detect if the page is scrolled down
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll(); // set initial value
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // toggle dark mode
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  useEffect(() => {
    const onThemeChange = () => setIsDark(localStorage.getItem("theme") === "dark");
    window.addEventListener("theme-change", onThemeChange);
    return () => window.removeEventListener("theme-change", onThemeChange);
  }, []);

  return (
    <div className={isDark ? "dark" : ""}>
      <div className='min-h-screen flex flex-col transition-colors duration-200
        bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100'
      >
          {/* navigation bar */}
          <NavBar scrolled={scrolled} />

          {/* hero section */}

          {/* features section */}

          {/* steps section */}

          {/* about section */}

          {/* footer */}
      </div>
    </div>
    
  )
}

export default Home