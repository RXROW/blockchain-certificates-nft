import React, { useEffect, useState } from 'react';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  const [showScrollButton, setShowScrollButton] = useState(false);

  const handleScroll = () => {
    const hero = document.getElementById('hero');
    if (hero) {
      const heroBottom = hero.getBoundingClientRect().bottom; 
      setShowScrollButton(heroBottom < 0);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gradient-to-br from-slate-950 to-violet-950/50 text-white relative shadow-lg">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 pb-10 pt-14">
        <div className="flex flex-col items-center md:items-start">
          <span className="text-3xl font-extrabold tracking-tight mb-4 text-center md:text-left">
            Certificate<br />NFT<span className="text-blue-400">.</span>
          </span>
          <p className="text-gray-400 text-sm text-center md:text-left">
            Empowering digital certificates with blockchain technology.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-blue-300">Our Team Members</h4>
          <ul className="space-y-3 text-gray-300 text-sm">
            <li>Mario Atef</li>
            <li>Eslam Ahmed</li>
            <li>Moaaz Atef</li>
            <li>Hamdy Emad</li>
            <li>Mohamed Mahmoud</li>
            <li>Husien Mohsen</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-blue-300">About</h4>
          <ul className="space-y-3 text-gray-300 text-sm">
            <li><a href="#" className="hover:text-blue-400 transition">How It Works</a></li>
            <li><a href="#" className="hover:text-blue-400 transition">Our Features</a></li>
            <li><a href="#" className="hover:text-blue-400 transition">Certificates</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-blue-300">Support</h4>
          <ul className="space-y-3 text-gray-300 text-sm mb-6">
            <li><a href="#" className="hover:text-blue-400 transition">Support Request</a></li>
            <li><a href="#" className="hover:text-blue-400 transition">Contact</a></li>
          </ul>
          <h4 className="font-semibold mb-3 text-blue-300">Follow Us</h4>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-300 hover:text-blue-400 transition text-lg"><FaFacebookF /></a>
            <a href="#" className="text-gray-300 hover:text-blue-400 transition text-lg"><FaTwitter /></a>
            <a href="#" className="text-gray-300 hover:text-blue-400 transition text-lg"><FaLinkedinIn /></a>
            <a href="#" className="text-gray-300 hover:text-blue-400 transition text-lg"><FaInstagram /></a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white border-opacity-10 py-5 px-6 flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto text-xs text-gray-400">
        <span>©2025 Certificate NFT. All rights reserved.</span>
        <a href="#" className="hover:text-red-400 transition mt-3 md:mt-0">Privacy Policy</a>
      </div>

      {/* Floating Scroll to Top Icon */}
      {showScrollButton && (
        <div className="fixed bottom-8 right-8 z-50">
          <button onClick={handleScrollToTop} className="bg-violet-500 hover:bg-violet-600 text-white rounded-full p-3 shadow-lg focus:outline-none transition">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 19V5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      )}
    </footer>
  );
};

export default Footer;
