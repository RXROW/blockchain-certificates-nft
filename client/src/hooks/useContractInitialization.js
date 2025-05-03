import { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import contractAddress from '../config/contractAddress.json';
import contractABI from '../config/abi.json';
import { fetchAllCertificates } from '../components/sperates/cert_fetch.js';
import { fetchCertificates } from '../components/sperates/cert_fetch.js';

export const useContractInitialization = (
  connectWalletHelper,
  checkAdminStatus,
  isAdmin,
  maxResults,
  currentPage,
  certificates,
  loadingMore,
  isSearching,
  searchTerm,
  statusFilter,
  studentAddressFilter,
  institutionFilter,
  startDate,
  endDate,
  setCurrentPage,
  setHasMore,
  setLoading,
  setSearchLoading,
  setCertificates,
  setVisibleCertificates,
  setLoadingMore,
  setIsSearching,
  setError,
  setTotalCertificates,
  setLastUpdated,
  setNoResultsAddress,
  updateVisibleCertificates,
  setContract
) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setErrorState] = useState(null);

  const initialize = async () => {
    try {
      console.log('Starting initialization...');
      setLoading(true);
      setErrorState('');

      // Check if MetaMask is installed
      if (!window.ethereum) {
        setErrorState('Please install MetaMask to use this application');
        setLoading(false);
        return;
      }

      // Connect wallet first
      console.log('Connecting wallet...');
      const connectedAccount = await connectWalletHelper();
      if (!connectedAccount) {
        console.log('Failed to connect wallet');
        setErrorState('Please connect your wallet to view certificates');
        setLoading(false);
        return;
      }

      // Check network
      console.log('Checking network...');
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) { // Sepolia
        setErrorState('Please connect to Sepolia network');
        setLoading(false);
        return;
      }

      // Initialize contract
      console.log('Initializing contract...');
      // Debug logging
      console.log('Contract address:', contractAddress.SoulboundCertificateNFT);
      
      // Detailed debug of ABI structure
      console.log('ABI structure type:', typeof contractABI);
      
      // MODIFIED APPROACH: Handle ABI regardless of structure
      let abi;
      
      if (typeof contractABI === 'object' && contractABI.SoulboundCertificateNFT) {
        // If ABI is structured with SoulboundCertificateNFT key
        console.log('Found SoulboundCertificateNFT key in ABI object');
        abi = contractABI.SoulboundCertificateNFT;
      } else if (Array.isArray(contractABI)) {
        // If ABI is directly an array
        console.log('ABI is array format');
        abi = contractABI;
      } else {
        // If ABI is in a different format, try to find the ABI content
        console.log('ABI in unknown format, searching for array content');
        // Look for the first array property which might be the ABI
        const keys = Object.keys(contractABI);
        for (const key of keys) {
          if (Array.isArray(contractABI[key])) {
            console.log(`Found array in key: ${key}`);
            abi = contractABI[key];
            break;
          }
        }
        
        // If still no ABI, check if the ABI itself is the contract interface
        if (!abi && typeof contractABI === 'object' && Object.keys(contractABI).length > 0) {
          console.log('Using contractABI directly as interface');
          abi = contractABI;
        }
      }
      
      if (!abi) {
        console.error('Could not find valid ABI format:', contractABI);
        setErrorState('Contract ABI is invalid or missing');
        setLoading(false);
        return;
      }
      
      console.log('Using ABI:', typeof abi, Array.isArray(abi) ? abi.length : 'non-array');

      // Create the contract instance with better error handling
      try {
        const targetAddress = contractAddress.SoulboundCertificateNFT || 
                             (contractAddress.defaultNetwork && contractAddress[contractAddress.defaultNetwork]?.SoulboundCertificateNFT);
        
        if (!targetAddress) {
          throw new Error('Contract address not found in configuration');
        }
        
        console.log('Creating contract with address:', targetAddress);
        
        let contractInstance = new Contract(
          targetAddress,
          abi,
          provider
        );
        
        // Log contract methods to verify contract is initialized with the correct ABI
        const contractMethods = Object.keys(contractInstance.interface?.functions || {})
          .filter(name => name.indexOf('(') !== -1)
          .map(name => name.substring(0, name.indexOf('(')));
          
        console.log('Contract interface methods:', contractMethods);

        // Specifically check for key methods
        const searchMethods = ['getCertificatesByStudent', 'getCertificatesByInstitution', 'getVerifiedCertificateIds'];
        const missingMethods = searchMethods.filter(method => !contractMethods.includes(method));
        
        if (missingMethods.length > 0) {
          console.log('Adding custom implementations for methods not detected in interface:', missingMethods);
          
          // Helper function to create contract call method
          const createContractMethod = (method, paramTypes) => {
            return async (...args) => {
              try {
                console.log(`Calling ${method} with args:`, args);
                // Create the full function signature
                const signature = `${method}(${paramTypes})`;
                
                try {
                  // Use the proper ethers.js pattern for calling a function
                  const data = contractInstance.interface.encodeFunctionData(method, args);
                  const result = await provider.call({
                    to: targetAddress,
                    data
                  });
                  
                  return contractInstance.interface.decodeFunctionResult(method, result)[0];
                } catch (e) {
                  console.warn(`Error calling ${method} via interface:`, e);
                  
                  // Try with full signature as fallback
                  const data = contractInstance.interface.encodeFunctionData(signature, args);
                  const result = await provider.call({
                    to: targetAddress,
                    data
                  });
                  
                  return contractInstance.interface.decodeFunctionResult(signature, result)[0];
                }
              } catch (error) {
                console.error(`Error in ${method}:`, error);
                throw error;
              }
            };
          };
          
          // Add direct method access for the missing methods
          missingMethods.forEach(method => {
            if (method === 'getCertificatesByStudent') {
              contractInstance.getCertificatesByStudent = createContractMethod(method, 'address,uint256,uint256');
            } else if (method === 'getCertificatesByInstitution') {
              contractInstance.getCertificatesByInstitution = createContractMethod(method, 'address,uint256,uint256');
            } else if (method === 'getVerifiedCertificateIds') {
              contractInstance.getVerifiedCertificateIds = createContractMethod(method, 'uint256,uint256');
            }
          });
          
          console.log('Added direct method access for missing methods');
          
          // Check if methods were successfully added
          const customMethodsAdded = missingMethods.every(method => typeof contractInstance[method] === 'function');
          if (customMethodsAdded) {
            console.log('✅ Successfully added all required contract methods. Search functionality should now work properly.');
            
            // Test one of the functions to verify it works properly
            if (typeof contractInstance.getVerifiedCertificateIds === 'function') {
              try {
                console.log('Testing getVerifiedCertificateIds method...');
                const testResult = await contractInstance.getVerifiedCertificateIds(0, 1);
                console.log('Test successful! Method returned:', testResult);
              } catch (testError) {
                console.warn('Test call to getVerifiedCertificateIds failed:', testError.message);
                console.log('This may not be an error if there are no verified certificates yet.');
              }
            }
          } else {
            console.warn('❌ Failed to add some required contract methods. Search may not work correctly.');
          }
        } else {
          console.log('All important search methods available');
        }
        
        // Verify the contract has the correct structure by checking a simple method
        try {
          console.log('Verifying contract with totalSupply call...');
          await contractInstance.totalSupply();
          console.log('Contract verified successfully with totalSupply');
        } catch (error) {
          console.error('Error verifying contract with totalSupply:', error);
          // If we can't call totalSupply, try to recreate the contract with full ABI
          console.log('Attempting to reinitialize contract with full ABI...');
          
          // Ensure we have the full ABI from the JSON
          const fullAbi = contractABI.SoulboundCertificateNFT;
          
          if (Array.isArray(fullAbi) && fullAbi.length > 0) {
            // Recreate the contract with the full ABI
            const newContractInstance = new Contract(targetAddress, fullAbi, provider);
            
            // Test this new contract
            try {
              await newContractInstance.totalSupply();
              console.log('New contract initialized successfully');
              contractInstance = newContractInstance; // Replace the contract instance
            } catch (innerError) {
              console.error('Failed to initialize with full ABI:', innerError);
            }
          }
        }
        
        // Continue with normal flow
        setContract(contractInstance);

        // Check admin status
        console.log('Checking admin status...');
        const adminStatus = await checkAdminStatus(contractInstance, connectedAccount);

        // Fetch appropriate certificates based on admin status
        console.log('Contract initialized, fetching certificates...');
        if (adminStatus) {
          // Admin users see all certificates
          await fetchAllCertificates(contractInstance, {
            reset: true,
            isAdmin,
            maxResults,
            currentPage,
            certificates,
            loadingMore,
            isSearching,
            searchTerm,
            statusFilter,
            studentAddressFilter,
            institutionFilter,
            startDate,
            endDate,
            setCurrentPage,
            setHasMore,
            setLoading,
            setSearchLoading,
            setCertificates,
            setVisibleCertificates,
            setLoadingMore,
            setIsSearching,
            setError,
            setTotalCertificates,
            setLastUpdated,
            setNoResultsAddress,
            updateVisibleCertificates
          });
        } else {
          // Regular users see only their certificates
          await fetchCertificates(contractInstance, connectedAccount);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Contract initialization error:', error);
        setErrorState('Failed to initialize: ' + error.message);
      }
    } catch (error) {
      console.error('Initialization error:', error);
      setErrorState('Failed to initialize: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  return {
    isInitialized,
    error,
    initialize
  };
}; 