import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import contractAddress from '../../config/contractAddress.json';
import contractABI from '../../config/abi.json';

const Sidebar = () => {
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInstitution, setIsInstitution] = useState(false);
  const [account, setAccount] = useState('');
  const location = useLocation();

  // Check roles for the account
  const checkRoles = async (address) => {
    if (!window.ethereum || !address) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        contractAddress.SoulboundCertificateNFT,
        contractABI.SoulboundCertificateNFT,
        provider
      );

      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      const INSTITUTION_ROLE = ethers.keccak256(ethers.toUtf8Bytes('INSTITUTION_ROLE'));

      const [hasAdminRole, hasInstitutionRole] = await Promise.all([
        contract.hasRole(DEFAULT_ADMIN_ROLE, address),
        contract.hasRole(INSTITUTION_ROLE, address)
      ]);

      setIsAdmin(hasAdminRole);
      setIsInstitution(hasInstitutionRole);
    } catch (error) {
      console.error('Error checking roles:', error);
    }
  };

  // Check if wallet is connected and listen for account changes
  useEffect(() => {
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await checkRoles(accounts[0]);
      } else {
        setAccount('');
        setIsAdmin(false);
        setIsInstitution(false);
      }
    };

    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            await checkRoles(accounts[0]);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkWalletConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobileView(mobile);

      // Auto-collapse on mobile
      if (mobile && !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobileView) {
      setIsCollapsed(true);
    }
  }, [location, isMobileView]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobileView && (
        <button
          className={`fixed top-4 left-4 z-50 p-2 rounded-md bg-violet-700 text-white shadow-lg transition-all duration-300 ${isCollapsed ? '' : 'left-64'} hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-gray-900`}
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            )}
          </svg>
        </button>
      )}

      {/* Sidebar Overlay for Mobile */}
      {isMobileView && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-30 backdrop-blur-sm"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={` overflow-hidden mt-16 fixed top-0 left-0 h-full z-40 bg-gray-950 text-white transition-all duration-300 ease-in-out 
                   ${isMobileView ? (isCollapsed ? '-translate-x-full' : 'translate-x-0') : 'translate-x-0'}
                   ${isMobileView ? 'w-64' : isCollapsed ? 'w-20' : 'w-64'} shadow-2xl shadow-black/50`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800/30 ">
      

          {/* Desktop Toggle Button */}
          {!isMobileView && (
            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white focus:outline-none"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className=" py-4 overflow-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4f46e5 #1f2937' }}>
          <ul className="space-y-1 px-2">
            {/* Dashboard */}
            <li>
              <NavLink
                to="/dashboard/in"
                end
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg ${isActive
                    ? 'bg-violet-700 text-white shadow-lg shadow-violet-700/50'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'} 
                  transition-all duration-200 group relative`
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {(!isCollapsed || isMobileView) ? (
                  <span className="ml-3 font-medium">Dashboard</span>
                ) : (
                  <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium rounded bg-gray-900 text-white opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-lg z-50">
                    Dashboard
                  </span>
                )}
              </NavLink>
            </li>

            {/* My Certificates */}
            <li>
              <NavLink
                to="/dashboard/certificates"
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg ${isActive
                    ? 'bg-violet-700 text-white shadow-lg shadow-violet-700/50'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'} 
                  transition-all duration-200 group relative`
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                {(!isCollapsed || isMobileView) ? (
                  <span className="ml-3 font-medium">My Certificates</span>
                ) : (
                  <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium rounded bg-gray-900 text-white opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-lg z-50">
                    My Certificates
                  </span>
                )}
              </NavLink>
            </li>

            {/* Institution-only Menu Items */}
            {isInstitution && (
              <>
                {/* Section Divider */}
                <li className="pt-4 pb-2">
                  {(!isCollapsed || isMobileView) && (
                    <div className="px-4">
                      <div className="h-px bg-gradient-to-r from-gray-800 via-violet-800 to-gray-800"></div>
                      <p className="text-xs text-gray-500 mt-2 font-medium">INSTITUTION ACTIONS</p>
                    </div>
                  )}
                </li>

                {/* Issue Certificate */}
                <li>
                  <NavLink
                    to="/dashboard/issue"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 rounded-lg ${isActive
                        ? 'bg-violet-700 text-white shadow-lg shadow-violet-700/50'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'} 
                      transition-all duration-200 group relative`
                    }
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {(!isCollapsed || isMobileView) ? (
                      <span className="ml-3 font-medium">Issue Certificate</span>
                    ) : (
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium rounded bg-gray-900 text-white opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-lg z-50">
                        Issue Certificate
                      </span>
                    )}
                  </NavLink>
                </li>

                {/* Update Certificate */}
                <li>
                  <NavLink
                    to="/dashboard/update"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 rounded-lg ${isActive
                        ? 'bg-violet-700 text-white shadow-lg shadow-violet-700/50'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'} 
                      transition-all duration-200 group relative`
                    }
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {(!isCollapsed || isMobileView) ? (
                      <span className="ml-3 font-medium">Update Certificate</span>
                    ) : (
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium rounded bg-gray-900 text-white opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-lg z-50">
                        Update Certificate
                      </span>
                    )}
                  </NavLink>
                </li>

                {/* Manage Courses */}
                <li>
                  <NavLink
                    to="/dashboard/courses"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 rounded-lg ${isActive
                        ? 'bg-violet-700 text-white shadow-lg shadow-violet-700/50'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'} 
                      transition-all duration-200 group relative`
                    }
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {(!isCollapsed || isMobileView) ? (
                      <span className="ml-3 font-medium">Manage Courses</span>
                    ) : (
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium rounded bg-gray-900 text-white opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-lg z-50">
                        Manage Courses
                      </span>
                    )}
                  </NavLink>
                </li>

                {/* Verify Certificates */}
                <li>
                  <NavLink
                    to="/dashboard/verify"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 rounded-lg ${isActive
                        ? 'bg-violet-700 text-white shadow-lg shadow-violet-700/50'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'} 
                      transition-all duration-200 group relative`
                    }
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {(!isCollapsed || isMobileView) ? (
                      <span className="ml-3 font-medium">Verify Certificates</span>
                    ) : (
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium rounded bg-gray-900 text-white opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-lg z-50">
                        Verify Certificates
                      </span>
                    )}
                  </NavLink>
                </li>
              </>
            )}

            {/* Admin-only Menu Items */}
            {isAdmin && (
              <>
                {/* Section Divider for Admin */}
                <li className="pt-4 pb-2">
                  {(!isCollapsed || isMobileView) && (
                    <div className="px-4">
                      <div className="h-px bg-gradient-to-r from-gray-800 via-blue-500 to-gray-800"></div>
                      <p className="text-xs text-gray-500 mt-2 font-medium">ADMIN CONTROLS</p>
                    </div>
                  )}
                </li>
                <li>
                  <NavLink
                    to="/dashboard/institutions"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 rounded-lg ${isActive
                        ? 'bg-violet-700 text-white shadow-lg shadow-violet-700/50'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'} 
                      transition-all duration-200 group relative`
                    }
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {(!isCollapsed || isMobileView) ? (
                      <span className="ml-3 font-medium">Manage Institutions</span>
                    ) : (
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium rounded bg-gray-900 text-white opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-lg z-50">
                        Manage Institutions
                      </span>
                    )}
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Account Status */}
        {account && (!isCollapsed || isMobileView) && (
          <div className="px-4 py-3 mt-2 mx-2 bg-gray-900 rounded-lg">
            <div className="flex items-center">
              <div className="p-1.5 bg-green-500 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-2 truncate">
                <p className="text-xs text-gray-400">Connected</p>
                <p className="text-xs font-medium text-gray-300 truncate">{`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Footer */}
        <div className={`absolute bottom-0 w-full p-4 border-t border-gray-800 text-xs text-gray-400 
                        ${(!isCollapsed || isMobileView) ? 'text-left' : 'text-center'} bg-gray-900/50`}>
          {(!isCollapsed || isMobileView) ? (
            <p>Certificate NFT v1.0.0</p>
          ) : (
            <p>v1.0.0</p>
          )}
        </div>
      </aside>

      {/* Main Content Spacing - Add to your layout */}
      <div className={`transition-all duration-300 ${isMobileView ? 'ml-0' : (isCollapsed ? 'ml-20' : 'ml-64')}`}>
        {/* Your page content goes here */}
      </div>
    </>
  );
};

export default Sidebar;