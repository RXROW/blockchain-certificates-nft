import React from 'react';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  // دالة عند الضغط على الزر
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gradient-to-r from-[#0f1123] via-[#1a133b] to-[#18122b] text-white relative shadow-lg">
      {/* Footer Links */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 pt-12">
        {/* Logo */}
        <div className="flex flex-col items-center md:items-start">
          <span className="text-2xl font-bold tracking-tight mb-2">Certificate<br />NFT<span className="text-blue-400">.</span></span>
        </div>
        {/* Partnerships */}
        <div>
          <h4 className="font-semibold mb-3 text-blue-200">Our Team Members</h4>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>Mario Atef</li>
            <li>Eslam Ahmed</li>
            <li>Moaaz Atef</li>
            <li>Hamdy Emad</li>
            <li>Mohamed Mahmoud</li>
            <li>Husien Mohsen</li>
          </ul>
        </div>
        {/* About */}
        <div>
          <h4 className="font-semibold mb-3 text-blue-200">ABOUT</h4>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li><a href="#" className="hover:text-white transition">How It Works</a></li>
            <li><a href="#" className="hover:text-white transition">Our Features</a></li>
            <li><a href="#" className="hover:text-white transition">Certificates</a></li>
          </ul>
        </div>
        {/* Support & Social */}
        <div>
          <h4 className="font-semibold mb-3 text-blue-200">SUPPORT</h4>
          <ul className="space-y-2 text-gray-300 text-sm mb-4">
            <li><a href="#" className="hover:text-white transition">Support Request</a></li>
            <li><a href="#" className="hover:text-white transition">Contact</a></li>
          </ul>
          <h4 className="font-semibold mb-2 text-blue-200">FOLLOW US</h4>
          <div className="flex space-x-3">
            <a href="#" className="text-gray-300 hover:text-white transition"><FaFacebookF /></a>
            <a href="#" className="text-gray-300 hover:text-white transition"><FaTwitter /></a>
            <a href="#" className="text-gray-300 hover:text-white transition"><FaLinkedinIn /></a>
            <a href="#" className="text-gray-300 hover:text-white transition"><FaInstagram /></a>
          </div>
        </div>
      </div>
      {/* Bottom Bar */}
      <div className="border-t border-white border-opacity-10 py-4 px-4 flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto text-xs text-gray-400">
        <span>©2025 Certificate NFT. All rights reserved.</span>
        <a href="#" className="hover:text-white transition mt-2 md:mt-0">Privacy Policy</a>
      </div>
      {/* Floating Scroll to Top Icon */}
      <div className="fixed bottom-8 right-8 z-50">
        <button onClick={handleScrollToTop} className="bg-[#7928ca] hover:bg-[#5f1e99] text-white rounded-full p-3 shadow-lg focus:outline-none">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M12 19V5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
    </footer>
  );
};

export default Footer;