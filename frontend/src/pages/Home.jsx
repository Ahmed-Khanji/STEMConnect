import { useState, useEffect } from 'react';
import NavBar from '../components/home/NavBar';

function Home() {
  const [scrolled, setScrolled] = useState(false);

  // detect if the page is scrolled down
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll(); // set initial value
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div>
        {/* navigation bar */}
        <NavBar scrolled={scrolled} />

        {/* hero section */}

        {/* features section */}

        {/* steps section */}

        {/* about section */}

        {/* footer */}
    </div>
  )
}

export default Home