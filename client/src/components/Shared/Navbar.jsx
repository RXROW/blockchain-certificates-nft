import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import contractAddress from '../../config/contractAddress.json';
import contractABI from '../../config/abi.json';

function Navbar() {
  const [account, setAccount] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInstitution, setIsInstitution] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownContentRef = useRef(null);

  // Format the account address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

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

  // Connect wallet - Vite-friendly implementation
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      // Detect Edge and use alternative approach
      if (navigator.userAgent.includes('Edg')) {
        console.log('Edge browser detected, using alternative method');
        
        // First check existing accounts
        const existingAccounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (existingAccounts && existingAccounts.length > 0) {
          console.log('Using existing connection:', existingAccounts[0]);
          setAccount(existingAccounts[0]);
          await checkRoles(existingAccounts[0]);
          return;
        }
        
        // For Edge, only use eth_requestAccounts with no extra parameters
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
          params: [] // Empty params to avoid permission issues
        });
        
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          await checkRoles(accounts[0]);
        }
        return;
      }
      
      // Standard approach for other browsers
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await checkRoles(accounts[0]);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      // Show specific messages for common errors
      if (error.code === 4001) {
        alert('Please connect your wallet to continue.');
      } else if (error.code === -32002) {
        alert('Connection request already pending. Please open MetaMask.');
      }
    }
  };

  // Disconnect wallet
  const handleDisconnect = () => {
    setAccount('');
    setIsAdmin(false);
    setIsInstitution(false);
    setDropdownOpen(false);
  };

  // Switch account - Vite-friendly implementation
  const handleSwitchAccount = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      // For Edge browser, avoid wallet_requestPermissions
      if (navigator.userAgent.includes('Edg')) {
        console.log('Edge browser detected, using alternative switch method');
        setAccount('');
        setIsAdmin(false);
        setIsInstitution(false);
        
        // Just use eth_requestAccounts directly for Edge
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
          params: [] // Empty params to avoid permission issues
        });
        
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          await checkRoles(accounts[0]);
        }
        
        setDropdownOpen(false);
        return;
      }
      
      // Standard approach for other browsers
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });
      
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        await checkRoles(accounts[0]);
      }
      
      setDropdownOpen(false);
    } catch (error) {
      console.error('Error switching account:', error);
      if (error.code === 4001) {
        alert('Account selection was cancelled.');
      }
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking inside the dropdown content
      if (dropdownContentRef.current && dropdownContentRef.current.contains(event.target)) {
        return;
      }

      // Don't close if clicking on the account address toggle
      if (event.target.closest('.account-address')) {
        return;
      }

      // Close if clicking outside the dropdown and not on account address
      if (dropdownOpen && !dropdownRef.current?.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/20 backdrop-blur-md shadow-md py-4 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2  text-violet-100 font-bold text-xl">
            <i className="fas fa-certificate"></i>
            <span>Certificate NFT</span>
          </Link>
        </div>

        <div className="lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-600 hover:text-violet-600 focus:outline-none"
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>

        <div className={`lg:flex items-center ${isMobileMenuOpen ? 'absolute top-16 left-0 right-0 bg-white/90 backdrop-blur-md shadow-md p-4' : 'hidden lg:block'}`}>
          {account ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
              >
                <i className="fas fa-wallet text-gray-600"></i>
                <span className="text-gray-800">{formatAddress(account)}</span>
                {isAdmin && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">Admin</span>}
                {isInstitution && !isAdmin && <span className="bg-blue-100 text-violet-700 text-xs px-2 py-1 rounded-full">Institution</span>}
                {!isAdmin && !isInstitution && <span className="bg-green-100 text-violet-700 text-xs px-2 py-1 rounded-full">User</span>}
                <i className={`fas fa-chevron-down text-gray-600 transition-transform duration-200 ${dropdownOpen ? 'transform rotate-180' : ''}`}></i>
              </button>

              {dropdownOpen && (
                <div
                  ref={dropdownContentRef}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg overflow-hidden z-10"
                >
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm text-gray-500">Connected Address:</p>
                    <p className="text-xs font-mono text-gray-700 truncate">{account}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleSwitchAccount}
                      className="w-full text-left px-4 py-2 flex items-center space-x-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
                    >
                      <i className="fas fa-exchange-alt text-gray-600"></i>
                      <span className="text-gray-700">Switch Account</span>
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="w-full text-left px-4 py-2 flex items-center space-x-2 hover:bg-red-50 text-red-600 rounded-md transition-colors duration-200"
                    >
                      <i className="fas fa-sign-out-alt"></i>
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={connectWallet}
                className=" Nav-btn "
            >
              <i className="fas fa-wallet"></i>
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;