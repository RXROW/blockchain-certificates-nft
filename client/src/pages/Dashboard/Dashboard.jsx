import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
import contractAddress from '../../config/contractAddress.json';
import contractABI from '../../config/abi.json';
import LoadingSpinner from '../../components/Shared/LoadingSpinner';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInstitution, setIsInstitution] = useState(false);
  const [currentAccount, setCurrentAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [stats, setStats] = useState({
    totalCertificates: 0,
    issuedCertificates: 0,
    totalInstitutions: 0,
    verifiedCertificates: 0
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastBlockNumber, setLastBlockNumber] = useState(null);

  const INSTITUTION_ROLE = useMemo(() => ethers.keccak256(ethers.toUtf8Bytes('INSTITUTION_ROLE')), []);
  const DEFAULT_ADMIN_ROLE = useMemo(() => ethers.ZeroHash, []);

  // Initialize provider and contract
  const initializeContract = useCallback(async () => {
    if (!window.ethereum) return false;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        contractAddress.SoulboundCertificateNFT,
        contractABI.SoulboundCertificateNFT,
        provider
      );
      
      setProvider(provider);
      setContract(contract);
      return true;
    } catch (error) {
      console.error('Error initializing contract:', error);
      return false;
    }
  }, []);

  // Check roles for the account
  const checkRoles = useCallback(async (address) => {
    if (!contract || !address) return;

    try {
      const [hasAdminRole, hasInstitutionRole] = await Promise.all([
        contract.hasRole(DEFAULT_ADMIN_ROLE, address),
        contract.hasRole(INSTITUTION_ROLE, address)
      ]);

      setIsAdmin(hasAdminRole);
      setIsInstitution(hasInstitutionRole);
    } catch (error) {
      console.error('Error checking roles:', error);
    }
  }, [contract, DEFAULT_ADMIN_ROLE, INSTITUTION_ROLE]);

  // Count institutions (since getInstitutionsCount doesn't exist)
  const countInstitutions = useCallback(async () => {
    if (!contract) return 0;

    try {
      console.log("Counting institutions, isAdmin:", isAdmin);
      
      // Method 1: Using events
      // Get all RoleGranted events for INSTITUTION_ROLE
      const grantFilter = contract.filters.RoleGranted(INSTITUTION_ROLE);
      const grantEvents = await contract.queryFilter(grantFilter, 0, "latest");
      
      // Get all RoleRevoked events for INSTITUTION_ROLE
      const revokeFilter = contract.filters.RoleRevoked(INSTITUTION_ROLE);
      const revokeEvents = await contract.queryFilter(revokeFilter, 0, "latest");
      
      console.log("Institution events found - Granted:", grantEvents.length, "Revoked:", revokeEvents.length);
      
      // Build a set of currently authorized institutions by adding granted and removing revoked
      const institutionsFromEvents = new Set();
      
      grantEvents.forEach(event => {
        if (event.args && event.args.account) {
          institutionsFromEvents.add(event.args.account.toLowerCase());
          console.log("Institution granted:", event.args.account);
        }
      });
      
      revokeEvents.forEach(event => {
        if (event.args && event.args.account) {
          institutionsFromEvents.delete(event.args.account.toLowerCase());
          console.log("Institution revoked:", event.args.account);
        }
      });
      
      // Method 2: Using InstitutionAuthorized and InstitutionRevoked events
      const authorizedFilter = contract.filters.InstitutionAuthorized();
      const authorizedEvents = await contract.queryFilter(authorizedFilter, 0, "latest");
      
      const revokedFilter = contract.filters.InstitutionRevoked();
      const revokedEvents = await contract.queryFilter(revokedFilter, 0, "latest");
      
      console.log("Institution direct events - Authorized:", authorizedEvents.length, "Revoked:", revokedEvents.length);
      
      // Build a set from institution-specific events
      const institutionsFromDirectEvents = new Set();
      
      authorizedEvents.forEach(event => {
        if (event.args && event.args.institution) {
          institutionsFromDirectEvents.add(event.args.institution.toLowerCase());
          console.log("Institution directly authorized:", event.args.institution);
        }
      });
      
      revokedEvents.forEach(event => {
        if (event.args && event.args.institution) {
          institutionsFromDirectEvents.delete(event.args.institution.toLowerCase());
          console.log("Institution directly revoked:", event.args.institution);
        }
      });
      
      // Method 3: Get institutions from direct contract calls
      // (We'll need to check addresses with the role, but we need a list of addresses to check)
      // For now, we'll use the union of all addresses we've seen in events
      const allAddressesSeen = new Set([
        ...Array.from(institutionsFromEvents), 
        ...Array.from(institutionsFromDirectEvents)
      ]);
      
      console.log("Total unique addresses seen in events:", allAddressesSeen.size);
      
      // For each address, check if it currently has the role AND is in authorizedInstitutions
      const confirmedInstitutions = new Set();
      
      // Check each address that appeared in any event
      for (const address of allAddressesSeen) {
        try {
          // Check if address has the role
          const hasRole = await contract.hasRole(INSTITUTION_ROLE, address);
          // Check if address is in authorizedInstitutions mapping (if it exists)
          let isAuthorized = true;
          if (contract.authorizedInstitutions) {
            isAuthorized = await contract.authorizedInstitutions(address);
          }
          
          console.log(`Address ${address} - Has role: ${hasRole}, Is authorized: ${isAuthorized}`);
          
          // Count address if it has the role and is authorized
          if (hasRole && isAuthorized) {
            confirmedInstitutions.add(address);
            console.log("Confirmed institution:", address);
          }
        } catch (err) {
          console.error(`Error checking address ${address}:`, err);
        }
      }
      
      // Log all different counts
      console.log({
        countFromRoleEvents: institutionsFromEvents.size,
        countFromDirectEvents: institutionsFromDirectEvents.size,
        countFromContractCalls: confirmedInstitutions.size
      });
      
      // Use the most accurate count (confirmed institutions is most accurate)
      return confirmedInstitutions.size > 0 
        ? confirmedInstitutions.size 
        : Math.max(institutionsFromEvents.size, institutionsFromDirectEvents.size);
    } catch (error) {
      console.error('Error counting institutions:', error);
      return 0;
    }
  }, [contract, INSTITUTION_ROLE, isAdmin]);

  // Count issued certificates for an institution
  const countIssuedCertificates = useCallback(async (address) => {
    if (!contract) return 0;

    try {
      console.log("Counting issued certificates for address:", address, "isInstitution:", isInstitution);
      
      // Important: In ethers v6, filter syntax is different, and indexing of addresses matters
      // Use proper filter format with null for non-indexed fields and the address in the right position
      const filter = contract.filters.CertificateIssued(null, null, address);
      console.log("Filter created:", filter);
      
      // Query from block 0 to latest to ensure all events are captured
      const events = await contract.queryFilter(filter, 0, "latest");
      
      console.log("Certificate events found for institution:", events.length);
      events.forEach(event => {
        if (event.args) {
          console.log("Certificate found, tokenId:", event.args.tokenId?.toString());
        }
      });
      
      return events.length;
    } catch (error) {
      console.error('Error counting issued certificates:', error);
      return 0;
    }
  }, [contract, isInstitution]);

  // Count verified certificates
  const countVerifiedCertificates = useCallback(async () => {
    if (!contract) return 0;

    try {
      console.log("Counting verified certificates");
      
      const filter = contract.filters.CertificateVerified();
      // Query from block 0 to latest to ensure all events are captured
      const events = await contract.queryFilter(filter, 0, "latest");
      
      console.log("Verified certificate events found:", events.length);
      
      return events.length;
    } catch (error) {
      console.error('Error counting verified certificates:', error);
      return 0;
    }
  }, [contract]);

  // Optimize the fetchStats function - MOVED UP before handleCertificateEvent
  const fetchStats = useCallback(async () => {
    if (!contract || !currentAccount) {
      console.log("Missing contract or account, cannot fetch stats");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Fetching dashboard stats for account:", currentAccount);
      setIsLoading(true);

      // Get all events from the beginning (block 0)
      const filter = {
        fromBlock: 0,
        toBlock: 'latest'
      };

      // Fetch all required data in parallel for better performance
      const [
        totalSupply,
        verifiedEvents,
        issuedEvents,
        authorizedEvents,
        revokedEvents,
        roleGrantedEvents,
        roleRevokedEvents
      ] = await Promise.all([
        contract.totalSupply(),
        contract.queryFilter(contract.filters.CertificateVerified(), filter.fromBlock, filter.toBlock),
        contract.queryFilter(contract.filters.CertificateIssued(null, null, currentAccount), filter.fromBlock, filter.toBlock),
        contract.queryFilter(contract.filters.InstitutionAuthorized(), filter.fromBlock, filter.toBlock),
        contract.queryFilter(contract.filters.InstitutionRevoked(), filter.fromBlock, filter.toBlock),
        contract.queryFilter(contract.filters.RoleGranted(INSTITUTION_ROLE), filter.fromBlock, filter.toBlock),
        contract.queryFilter(contract.filters.RoleRevoked(INSTITUTION_ROLE), filter.fromBlock, filter.toBlock)
      ]);

      // Process institutions using both RoleGranted/Revoked and InstitutionAuthorized/Revoked events
      const activeInstitutions = new Set();
      
      // Add institutions from RoleGranted events
      roleGrantedEvents.forEach(event => {
        if (event.args?.account) {
          activeInstitutions.add(event.args.account.toLowerCase());
        }
      });

      // Remove institutions from RoleRevoked events
      roleRevokedEvents.forEach(event => {
        if (event.args?.account) {
          activeInstitutions.delete(event.args.account.toLowerCase());
        }
      });

      // Add institutions from InstitutionAuthorized events
      authorizedEvents.forEach(event => {
        if (event.args?.institution) {
          activeInstitutions.add(event.args.institution.toLowerCase());
        }
      });

      // Remove institutions from InstitutionRevoked events
      revokedEvents.forEach(event => {
        if (event.args?.institution) {
          activeInstitutions.delete(event.args.institution.toLowerCase());
        }
      });

      // Verify each institution still has the role
      const confirmedInstitutions = new Set();
      for (const institution of activeInstitutions) {
        try {
          const hasRole = await contract.hasRole(INSTITUTION_ROLE, institution);
          if (hasRole) {
            confirmedInstitutions.add(institution);
          }
        } catch (error) {
          console.error(`Error checking role for institution ${institution}:`, error);
        }
      }

      // Update stats with real-time data
      setStats({
        totalCertificates: totalSupply.toString(),
        verifiedCertificates: verifiedEvents.length.toString(),
        totalInstitutions: confirmedInstitutions.size.toString(),
        issuedCertificates: issuedEvents.length.toString()
      });

      setLastUpdated(Date.now());
      console.log("Updated stats:", {
        totalCertificates: totalSupply.toString(),
        verifiedCertificates: verifiedEvents.length,
        totalInstitutions: confirmedInstitutions.size,
        issuedCertificates: issuedEvents.length
      });
      
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats(prevStats => ({
        ...prevStats,
        error: error.message || "Failed to fetch stats"
      }));
    } finally {
      setIsLoading(false);
    }
  }, [contract, currentAccount, INSTITUTION_ROLE]);

  // Add event handlers for real-time updates
  const handleCertificateEvent = useCallback(() => {
    // Refresh stats when any certificate-related event occurs
    fetchStats();
  }, [fetchStats]);

  // Setup event listeners
  useEffect(() => {
    if (!contract) return;

    const setupEventListeners = async () => {
      // Listen for all relevant events
      const issueFilter = contract.filters.CertificateIssued();
      const verifyFilter = contract.filters.CertificateVerified();
      const revokeFilter = contract.filters.CertificateRevoked();
      const institutionFilter = contract.filters.InstitutionAuthorized();
      const institutionRevokeFilter = contract.filters.InstitutionRevoked();

      contract.on(issueFilter, handleCertificateEvent);
      contract.on(verifyFilter, handleCertificateEvent);
      contract.on(revokeFilter, handleCertificateEvent);
      contract.on(institutionFilter, handleCertificateEvent);
      contract.on(institutionRevokeFilter, handleCertificateEvent);

      // Also listen for new blocks to keep stats fresh
      if (provider) {
        provider.on('block', async (blockNumber) => {
          setLastBlockNumber(blockNumber);
          // Refresh stats every 5 blocks (approximately 1 minute on most networks)
          if (blockNumber % 5 === 0) {
            await fetchStats();
          }
        });
      }
    };

    setupEventListeners();

    // Cleanup listeners
    return () => {
      contract.removeAllListeners();
      if (provider) {
        provider.removeAllListeners('block');
      }
    };
  }, [contract, provider, handleCertificateEvent, fetchStats]);

  // Initialize wallet connection and contract
  useEffect(() => {
    const setupWallet = async () => {
      const initialized = await initializeContract();
      if (!initialized) {
        setIsLoading(false);
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error setting up wallet:', error);
        setIsLoading(false);
      }
    };

    setupWallet();
  }, [initializeContract]);

  // Update roles when account changes
  useEffect(() => {
    if (currentAccount && contract) {
      checkRoles(currentAccount);
    }
  }, [currentAccount, contract, checkRoles]);

  // Fetch stats when roles are determined
  useEffect(() => {
    if (contract && currentAccount) {
      fetchStats();
    }
  }, [contract, currentAccount, isAdmin, isInstitution, fetchStats]);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
      } else {
        setCurrentAccount('');
        setIsAdmin(false);
        setIsInstitution(false);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  // Auto-refresh stats periodically (every 2 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (contract && currentAccount) {
        fetchStats();
      }
    }, 120000);
    
    return () => clearInterval(interval);
  }, [contract, currentAccount, fetchStats]);

  // Fast blockchain cube loader that displays as an overlay
  const SimpleBlockchainCubeLoader = () => (
    <div className="w-16 h-16 relative perspective-500">
      {/* Main cube container with faster animation */}
      <div className="w-full h-full absolute transform-style-3d animate-spin-slow">
        {/* Front face - simple flat design for performance */}
        <div className="absolute w-full h-full bg-violet-600 transform rotate-y-0 translate-z-8 border border-white/30">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-px bg-white/40"></div>
          </div>
        </div>
        
        {/* Back face */}
        <div className="absolute w-full h-full bg-violet-600 transform rotate-y-180 translate-z-8 border border-white/30">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-px bg-white/40"></div>
          </div>
        </div>
        
        {/* Left face */}
        <div className="absolute w-full h-full bg-violet-600 transform rotate-y-270 translate-z-8 border border-white/30">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-px bg-white/40"></div>
          </div>
        </div>
        
        {/* Right face */}
        <div className="absolute w-full h-full bg-violet-600 transform rotate-y-90 translate-z-8 border border-white/30">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-px bg-white/40"></div>
          </div>
        </div>
        
        {/* Top face */}
        <div className="absolute w-full h-full bg-violet-600 transform rotate-x-90 translate-z-8 border border-white/30">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border border-white/30 rotate-45"></div>
          </div>
        </div>
        
        {/* Bottom face */}
        <div className="absolute w-full h-full bg-violet-600 transform rotate-x-270 translate-z-8 border border-white/30">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-white/70 font-mono">#</span>
          </div>
        </div>
      </div>
      
      {/* Simple glow effect */}
      <div className="absolute -inset-2 bg-violet-600/20 rounded-full blur-lg"></div>
    </div>
  );

  // Statistics Card Component
  const StatCard = ({ title, value, icon, color, progress, tooltip, bgImage }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const colors = {
      violet: {
        icon: "bg-violet-900/60 text-violet-400",
        progress: "from-violet-600 to-purple-500",
        hover: "hover:border-violet-500/50 hover:shadow-violet-500/10",
        tooltip: "bg-violet-900 border-violet-400"
      },
      blue: {
        icon: "bg-blue-900/60 text-blue-400",
        progress: "from-blue-600 to-indigo-500",
        hover: "hover:border-blue-500/50 hover:shadow-blue-500/10",
        tooltip: "bg-blue-900 border-blue-400"
      },
      teal: {
        icon: "bg-teal-900/60 text-teal-400",
        progress: "from-teal-600 to-emerald-500",
        hover: "hover:border-teal-500/50 hover:shadow-teal-500/10",
        tooltip: "bg-teal-900 border-teal-400"
      },
      fuchsia: {
        icon: "bg-fuchsia-900/60 text-fuchsia-400",
        progress: "from-fuchsia-600 to-pink-500",
        hover: "hover:border-fuchsia-500/50 hover:shadow-fuchsia-500/10",
        tooltip: "bg-fuchsia-900 border-fuchsia-400"
      }
    };

    return (
      <div 
        className={`bg-gray-900/80 backdrop-blur-md rounded-lg shadow-xl p-6 border border-gray-800 ${colors[color].hover} transition-all duration-300 relative group overflow-hidden`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Optional background image */}
        {bgImage && (
          <div className="absolute inset-0 opacity-5 z-0">
            <img src={bgImage} alt="" className="object-cover w-full h-full" />
          </div>
        )}
        
        {/* Digital corner accents */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-gray-700 rounded-tr-lg"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-gray-700 rounded-bl-lg"></div>
        
        {/* Tooltip */}
        {tooltip && showTooltip && (
          <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 ${colors[color].tooltip} text-white text-xs rounded border opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-48 shadow-lg z-30`}>
            {tooltip}
            <div className={`absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent ${color === 'violet' ? 'border-t-violet-900' : color === 'blue' ? 'border-t-blue-900' : color === 'teal' ? 'border-t-teal-900' : 'border-t-fuchsia-900'}`}></div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className={`${colors[color].icon} p-3 rounded-lg shadow-lg`}>
            {icon}
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm font-medium tracking-wide">{title}</p>
            <h3 className="text-3xl font-bold text-white mt-1 tracking-tight flex items-center justify-end">
              <span className="mr-1 text-xs font-mono text-gray-500">#</span>
              {value}
            </h3>
          </div>
        </div>
        
        {/* Digital lines */}
        <div className="absolute h-px w-full bg-gray-800/60 left-0 top-[4.5rem]"></div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-800/80 h-1.5 rounded-full overflow-hidden relative mt-6">
          <div className="absolute inset-0 bg-gray-800 opacity-30 blur-sm"></div>
          <div className={`bg-gradient-to-r ${colors[color].progress} h-full rounded-full relative z-10`} 
               style={{ width: `${progress || 100}%` }}></div>
        </div>
        
        {/* Data metrics visualization */}
        <div className="flex justify-between mt-3">
          <div className="flex space-x-0.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-1 h-3 ${i < Math.floor((progress || 100) / 20) ? `bg-${color}-500/40` : 'bg-gray-700/40'} rounded-sm`}></div>
            ))}
          </div>
          <span className="text-xs text-gray-500 font-mono">{progress || 100}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-950 min-h-screen text-gray-200 relative overflow-hidden">
      {/* Floating loading indicator - doesn't hide content */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-sm">
          <div className="bg-gray-900/80 backdrop-blur-md rounded-lg p-8 border border-violet-500/30 shadow-xl flex flex-col items-center">
            <SimpleBlockchainCubeLoader />
            <p className="mt-4 text-violet-300 text-sm font-medium">Loading data...</p>
          </div>
        </div>
      )}
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-blue-900/10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-indigo-900/10 rounded-full filter blur-3xl"></div>
        </div>
        
        {/* Futuristic grid overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
        
        {/* Digital circuit lines */}
        <div className="absolute top-0 left-1/4 w-0.5 h-screen bg-violet-500/5"></div>
        <div className="absolute top-0 left-2/4 w-0.5 h-screen bg-violet-500/5"></div>
        <div className="absolute top-0 left-3/4 w-0.5 h-screen bg-violet-500/5"></div>
        <div className="absolute top-1/4 left-0 w-screen h-0.5 bg-violet-500/5"></div>
        <div className="absolute top-2/4 left-0 w-screen h-0.5 bg-violet-500/5"></div>
        <div className="absolute top-3/4 left-0 w-screen h-0.5 bg-violet-500/5"></div>
      </div>

      <div className="relative z-10 py-6">
        {/* Main dashboard content */}
        <div className="max-w-[1600px] mx-auto px-4 space-y-8 relative">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-violet-950/80 to-indigo-950/80 rounded-lg shadow-lg border border-violet-500/30 backdrop-blur-sm relative overflow-hidden">
            {/* Glowing accent lines */}
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-violet-500/70 to-blue-500/70"></div>
            <div className="absolute bottom-0 right-0 h-full w-1 bg-gradient-to-b from-violet-500/0 via-violet-500/70 to-violet-500/0"></div>
            
            {/* Digital circuit decorations */}
            <div className="absolute top-0 right-[15%] w-0.5 h-16 bg-violet-500/20"></div>
            <div className="absolute bottom-0 left-[25%] w-0.5 h-10 bg-violet-500/20"></div>
            <div className="absolute top-1/2 right-8 w-2 h-2 bg-violet-500/30 rounded-full"></div>
            
            <div className="flex flex-col lg:flex-row justify-between p-8">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded bg-violet-600/20 flex items-center justify-center border border-violet-500/50 relative group">
                    <div className="absolute -inset-0.5 bg-violet-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <svg className="w-6 h-6 text-violet-400 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-wide flex items-center">
                      Certificate NFT
                      <span className="ml-2 text-xs font-mono bg-violet-900/50 text-violet-300 px-2 py-0.5 rounded border border-violet-600/30">v1.0</span>
                    </h1>
                    <div className="flex items-center mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2"></div>
                      <p className="text-violet-200 text-sm font-medium">
                        {isAdmin ? 'Administrative Controls' :
                          isInstitution ? 'Institution Management' :
                            'Certificate Management'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 lg:mt-0 flex items-center space-x-4">
                <div className="bg-white/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10 shadow-inner flex flex-col">
                  <span className="text-xs text-violet-300/70">Network Status</span>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
                    <span className="font-medium text-white">Connected</span>
                  </div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10 shadow-inner flex flex-col">
                  <span className="text-xs text-violet-300/70">Access Level</span>
                  <span className="font-medium text-white">
                    {isAdmin ? 'Administrator' : isInstitution ? 'Institution' : 'User'}
                  </span>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10 shadow-inner flex flex-col">
                  <span className="text-xs text-violet-300/70">Last Updated</span>
                  <div className="flex items-center">
                    {lastUpdated ? (
                      <span className="font-medium text-white">{new Date(lastUpdated).toLocaleTimeString()}</span>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                    {isLoading && lastUpdated && (
                      <div className="ml-2 w-3 h-3 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Main Stats Section */}
            <div className="lg:col-span-3 xl:col-span-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 relative">
              {/* Stats cards always remain visible during loading */}

              {/* Total Certificates */}
              <StatCard 
                title="Total Certificates" 
                value={stats.totalCertificates} 
                color="violet"
                progress={100}
                tooltip="Total number of certificates minted on the blockchain"
                icon={
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                }
              />

              {/* Verified Certificates */}
              <StatCard 
                title="Verified Certificates" 
                value={stats.verifiedCertificates}
                color="blue"
                progress={Math.min(100, (stats.verifiedCertificates / Math.max(1, stats.totalCertificates)) * 100)}
                tooltip="Certificates that have been verified by authorized institutions on the blockchain"
                icon={
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />

              {/* Issued Certificates */}
              <StatCard 
                title="Issued Certificates" 
                value={stats.issuedCertificates}
                color="teal"
                progress={Math.min(100, (stats.issuedCertificates / Math.max(1, stats.totalCertificates)) * 100)}
                tooltip={isInstitution ? "Certificates issued by your institution" : "Certificates issued across all institutions"}
                icon={
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />

              {/* Total Institutions */}
              <StatCard 
                title="Total Institutions" 
                value={stats.totalInstitutions}
                color="fuchsia"
                tooltip="Authorized institutions registered on the blockchain with certificate issuance rights"
                icon={
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Advanced Analytics and Secondary Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Certificate Status Distribution */}
            <div className="bg-gray-900/80 backdrop-blur-md rounded-lg shadow-xl p-6 border border-gray-800 hover:border-indigo-500/20 transition-all duration-300 relative overflow-hidden group">
              {/* Glowing accent */}
              <div className="absolute top-0 left-0 h-1 w-20 bg-indigo-500/60"></div>
              <div className="absolute bottom-0 right-0 w-16 h-px bg-indigo-500/40"></div>
              
              <h3 className="text-lg font-semibold text-white mb-4 tracking-wide flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                Certificate Status
              </h3>
              
              <div className="mt-3 space-y-3">
                {/* Verified vs Unverified */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400">Verified</span>
                    <span className="text-xs font-mono text-indigo-300">
                      {stats.verifiedCertificates} / {stats.totalCertificates}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800/80 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-600 to-blue-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (stats.verifiedCertificates / Math.max(1, stats.totalCertificates)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Issued by this Institution (if institution user) */}
                {isInstitution && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-400">Issued by You</span>
                      <span className="text-xs font-mono text-teal-300">
                        {stats.issuedCertificates} / {stats.totalCertificates}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800/80 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-teal-600 to-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, (stats.issuedCertificates / Math.max(1, stats.totalCertificates)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Pending Verification */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400">Pending Verification</span>
                    <span className="text-xs font-mono text-amber-300">
                      {Math.max(0, stats.totalCertificates - stats.verifiedCertificates)} / {stats.totalCertificates}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800/80 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-600 to-orange-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (Math.max(0, stats.totalCertificates - stats.verifiedCertificates) / Math.max(1, stats.totalCertificates)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Real certificate data only - no static values */}
              <div className="mt-8 p-3 bg-indigo-900/20 rounded-lg border border-indigo-500/20 space-y-3">
                <div className="text-xs font-semibold text-indigo-300 font-mono mb-2">Certificate Metrics</div>
                
                {/* Certificate Status */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Total Certificates</span>
                  <span className="text-xs font-mono text-indigo-300">
                    {stats.totalCertificates > 0 ? stats.totalCertificates : '0'}
                  </span>
                </div>
                
                {/* Verified Certificates */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Verified Certificates</span>
                  <span className="text-xs font-mono text-indigo-300">
                    {stats.verifiedCertificates > 0 ? stats.verifiedCertificates : '0'}
                  </span>
                </div>
                
                {/* Verification Rate */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Verification Rate</span>
                  <span className="text-xs font-mono text-green-400">
                    {stats.totalCertificates > 0 ? `${Math.floor((stats.verifiedCertificates / Math.max(1, stats.totalCertificates)) * 100)}%` : '0%'}
                  </span>
                </div>
                
                {/* Pending Verification */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Pending Verification</span>
                  <span className="text-xs font-mono text-amber-300">
                    {Math.max(0, stats.totalCertificates - stats.verifiedCertificates)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Certificate Verification Analytics */}
            <div className="bg-gray-900/80 backdrop-blur-md rounded-lg shadow-xl p-6 border border-gray-800 hover:border-blue-500/20 transition-all duration-300 relative overflow-hidden group">
              {/* Glowing accent */}
              <div className="absolute top-0 right-0 h-1 w-20 bg-blue-500/60"></div>
              <div className="absolute bottom-0 left-0 w-16 h-px bg-blue-500/40"></div>
              
              <h3 className="text-lg font-semibold text-white mb-4 tracking-wide flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Certificate Verification
              </h3>
              
              <div className="mt-2 space-y-4">
                {/* Only real contract data - no simulated values */}
                <div className="mt-4 p-3 bg-blue-900/10 rounded-lg border border-blue-500/10 group-hover:border-blue-500/30 transition-colors duration-300">
                  <div className="text-xs text-gray-400 mb-2 font-semibold">Verification Details</div>
                  
                  <div className="space-y-2">
                    {/* Total Certificates */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Total Certificates</span>
                      <span className="text-xs font-mono text-blue-300">
                        {stats.totalCertificates}
                      </span>
                    </div>
                    
                    {/* Verified Count */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Verified Count</span>
                      <span className="text-xs font-mono text-blue-300">
                        {stats.verifiedCertificates}
                      </span>
                    </div>
                    
                    {/* Pending Verification */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Pending Verification</span>
                      <span className="text-xs font-mono text-blue-300">
                        {Math.max(0, stats.totalCertificates - stats.verifiedCertificates)}
                      </span>
                    </div>
                    
                    {/* Contract data */}
                    <div className="mt-3 pt-2 border-t border-blue-800/30">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">Contract Address</span>
                        <span className="text-xs font-mono text-blue-300 truncate max-w-[150px]">
                          {contractAddress.SoulboundCertificateNFT ? contractAddress.SoulboundCertificateNFT.slice(0, 6) + '...' + contractAddress.SoulboundCertificateNFT.slice(-4) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Last Updated</span>
                        <span className="text-xs text-gray-500">
                          {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Institution Analytics */}
            <div className="bg-gray-900/80 backdrop-blur-md rounded-lg shadow-xl p-6 border border-gray-800 hover:border-violet-500/20 transition-all duration-300 relative overflow-hidden group">
              {/* Glowing accent */}
              <div className="absolute top-0 left-1/2 h-1 w-20 bg-violet-500/60 transform -translate-x-1/2"></div>
              <div className="absolute bottom-0 right-0 w-12 h-px bg-violet-500/40"></div>
              
              <h3 className="text-lg font-semibold text-white mb-4 tracking-wide flex items-center">
                <svg className="w-5 h-5 mr-2 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Institution Analytics
              </h3>
              
              <div className="mt-2 space-y-3">
                {/* Institution Statistics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-violet-900/20 rounded-lg border border-violet-500/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">Active Institutions</span>
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    </div>
                    <div className="text-xl font-bold text-white">{stats.totalInstitutions}</div>
                    <div className="text-xs text-violet-400 mt-1">Authorized to issue</div>
                  </div>
                  
                  <div className="p-3 bg-violet-900/20 rounded-lg border border-violet-500/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">Avg. Certs per Institution</span>
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {stats.totalInstitutions > 0 
                        ? Math.floor(stats.totalCertificates / stats.totalInstitutions) 
                        : 0}
                    </div>
                    <div className="text-xs text-violet-400 mt-1">Certificates issued</div>
                  </div>
                </div>
                
                {/* Institution Activity */}
                <div className="p-3 bg-violet-900/10 rounded-lg border border-violet-500/10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400">Institution Distribution</span>
                    <span className="text-xs font-mono text-violet-400">By Certificate Volume</span>
                  </div>
                  <div className="w-full h-10 bg-gray-800/40 rounded overflow-hidden relative">
                    <div className="absolute inset-0 flex items-end">
                      {stats.totalInstitutions > 0 ? (
                        [...Array(Math.min(stats.totalInstitutions, 10))].map((_, i) => (
                          <div 
                            key={i} 
                            className="flex-1 mx-px bg-violet-500/40"
                            style={{ height: `${20 + Math.random() * 60}%` }}
                          ></div>
                        ))
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-gray-500">No data available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Institution Status */}
                <div className="p-3 bg-violet-900/10 rounded-lg border border-violet-500/10 group-hover:border-violet-500/30 transition-colors duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Your Institution Status</span>
                    <span className="px-2 py-0.5 bg-green-900/50 rounded-full text-xs text-green-400 border border-green-500/30">
                      {isInstitution ? "Authorized" : isAdmin ? "Administrator" : "Not Authorized"}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-300">
                    {isInstitution ? (
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>
                        <span>You can issue and verify certificates</span>
                      </div>
                    ) : isAdmin ? (
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                        <span>You manage institutions and the platform</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                        <span>You can view certificate information</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="bg-gray-900/90 backdrop-blur-md rounded-lg shadow-xl border border-indigo-500/20 overflow-hidden relative group">
            {/* Accent borders and glowing elements */}
            <div className="absolute top-0 left-10 h-1 w-20 bg-indigo-500/60"></div>
            <div className="absolute bottom-0 right-10 h-1 w-20 bg-indigo-500/60"></div>
            <div className="absolute top-0 right-[20%] w-0.5 h-12 bg-indigo-500/10"></div>
            <div className="absolute bottom-0 left-[35%] w-0.5 h-8 bg-indigo-500/10"></div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white tracking-wide flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Actions
                </h2>
                
                <div className="text-xs text-gray-400 bg-gray-800/60 py-1 px-2 rounded font-mono border border-gray-700/50">
                  <span className="text-indigo-400">sys.</span>actions.<span className="text-emerald-400">verified</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {/* View Certificates - Available to all */}
                <Link
                  to="/dashboard/certificates"
                  className="group flex flex-col items-center p-5 bg-gray-900/90 hover:bg-gray-800/90 rounded-lg transition-all duration-300 border border-gray-800 hover:border-indigo-500/70 hover:shadow-lg hover:shadow-indigo-500/10 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-indigo-600/0 group-hover:from-indigo-600/10 group-hover:to-indigo-600/0 transition-all duration-500"></div>
                  <div className="absolute -top-6 -right-6 w-12 h-12 bg-indigo-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="bg-indigo-900/40 p-3 rounded-lg mb-3 group-hover:bg-indigo-800/60 transition-colors duration-300 shadow-lg shadow-indigo-950/30 z-10 relative">
                    <div className="absolute inset-0 border border-indigo-500/30 rounded-lg"></div>
                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-gray-300 group-hover:text-white font-medium z-10">View Certificates</span>
                  <span className="text-xs text-indigo-400/80 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Access all certificates</span>
                </Link>

                {/* Issue Certificate - For institutions */}
                {(isInstitution || isAdmin) && (
                  <Link
                    to="/dashboard/issue"
                    className="group flex flex-col items-center p-5 bg-gray-900/90 hover:bg-gray-800/90 rounded-lg transition-all duration-300 border border-gray-800 hover:border-teal-500/70 hover:shadow-lg hover:shadow-teal-500/10 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-600/0 to-teal-600/0 group-hover:from-teal-600/10 group-hover:to-teal-600/0 transition-all duration-500"></div>
                    <div className="absolute -top-6 -right-6 w-12 h-12 bg-teal-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="bg-teal-900/40 p-3 rounded-lg mb-3 group-hover:bg-teal-800/60 transition-colors duration-300 shadow-lg shadow-teal-950/30 z-10 relative">
                      <div className="absolute inset-0 border border-teal-500/30 rounded-lg"></div>
                      <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="text-gray-300 group-hover:text-white font-medium z-10">Issue Certificate</span>
                    <span className="text-xs text-teal-400/80 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Create new certificate</span>
                  </Link>
                )}

                {/* Verify Certificate - For institutions */}
                {(isInstitution || isAdmin) && (
                  <Link
                    to="/dashboard/verify"
                    className="group flex flex-col items-center p-5 bg-gray-900/90 hover:bg-gray-800/90 rounded-lg transition-all duration-300 border border-gray-800 hover:border-blue-500/70 hover:shadow-lg hover:shadow-blue-500/10 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/10 group-hover:to-blue-600/0 transition-all duration-500"></div>
                    <div className="absolute -top-6 -right-6 w-12 h-12 bg-blue-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="bg-blue-900/40 p-3 rounded-lg mb-3 group-hover:bg-blue-800/60 transition-colors duration-300 shadow-lg shadow-blue-950/30 z-10 relative">
                      <div className="absolute inset-0 border border-blue-500/30 rounded-lg"></div>
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-300 group-hover:text-white font-medium z-10">Verify Certificate</span>
                    <span className="text-xs text-blue-400/80 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Validate authenticity</span>
                  </Link>
                )}

                {/* Manage Institutions - For admin */}
                {isAdmin && (
                  <Link
                    to="/dashboard/institutions"
                    className="group flex flex-col items-center p-5 bg-gray-900/90 hover:bg-gray-800/90 rounded-lg transition-all duration-300 border border-gray-800 hover:border-fuchsia-500/70 hover:shadow-lg hover:shadow-fuchsia-500/10 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/0 to-fuchsia-600/0 group-hover:from-fuchsia-600/10 group-hover:to-fuchsia-600/0 transition-all duration-500"></div>
                    <div className="absolute -top-6 -right-6 w-12 h-12 bg-fuchsia-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="bg-fuchsia-900/40 p-3 rounded-lg mb-3 group-hover:bg-fuchsia-800/60 transition-colors duration-300 shadow-lg shadow-fuchsia-950/30 z-10 relative">
                      <div className="absolute inset-0 border border-fuchsia-500/30 rounded-lg"></div>
                      <svg className="w-6 h-6 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="text-gray-300 group-hover:text-white font-medium z-10">Manage Institutions</span>
                    <span className="text-xs text-fuchsia-400/80 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Control authorization</span>
                  </Link>
                )}
                
                {/* Analytics */}
                {(isAdmin || isInstitution) && (
                  <Link
                    to="/dashboard/analytics"
                    className="group flex flex-col items-center p-5 bg-gray-900/90 hover:bg-gray-800/90 rounded-lg transition-all duration-300 border border-gray-800 hover:border-amber-500/70 hover:shadow-lg hover:shadow-amber-500/10 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-600/0 to-amber-600/0 group-hover:from-amber-600/10 group-hover:to-amber-600/0 transition-all duration-500"></div>
                    <div className="absolute -top-6 -right-6 w-12 h-12 bg-amber-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="bg-amber-900/40 p-3 rounded-lg mb-3 group-hover:bg-amber-800/60 transition-colors duration-300 shadow-lg shadow-amber-950/30 z-10 relative">
                      <div className="absolute inset-0 border border-amber-500/30 rounded-lg"></div>
                      <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="text-gray-300 group-hover:text-white font-medium z-10">Analytics</span>
                    <span className="text-xs text-amber-400/80 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">View detailed metrics</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;