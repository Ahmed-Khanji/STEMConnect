import { useState, useEffect } from 'react';
import NavBar from '../components/home/NavBar';
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';

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
      <div className='flex flex-col gap-6 min-h-screen pt-32
        transition-colors duration-300
        bg-gradient-to-r from-white via-gray-50 to-gray-100
        dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-gray-900
      text-gray-900 dark:text-gray-100'
      > 
          <NavBar scrolled={scrolled} />
          <Hero />
          <Features />

          {/* steps section */}

          {/* about section */}

          {/* footer */}
      </div>
    </div>
    
  )
}

export default Home