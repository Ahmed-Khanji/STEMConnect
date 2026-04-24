import { useState, useEffect } from 'react';
import NavBar from '../../components/Home/NavBar';
import Hero from '../../components/Home/Hero';
import Stats from '../../components/Home/Stats';
import Features from '../../components/Home/Features';
import Footer from '../../components/Home/Footer';

function Home() {
  // detect if the page is scrolled down
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll(); // set initial value
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex flex-col gap-6 min-h-screen pt-32 transition-colors duration-300 bg-home text-foreground"
    >
      <NavBar scrolled={scrolled} />
      <Hero />
      <Stats />
      <Features />
      <Footer />
    </div>
  )
}

export default Home