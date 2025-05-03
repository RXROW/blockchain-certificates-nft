import { useCallback } from 'react';
import { BrowserProvider } from 'ethers';

/**
 * Custom hook for wallet connection functionality
 * 
 * @param {Function} setError - State setter for error messages
 * @param {Function} setLoading - State setter for loading state
 * @param {Function} setIsConnecting - State setter for connection state
 * @param {Function} setAccount - State setter for account address
 * @returns {Object} - The wallet connection functions
 */
export const useWalletConnection = (
  setError,
  setLoading,
  setIsConnecting,
  setAccount
) => {
  
  // Function to check if MetaMask is installed
  const checkMetaMask = useCallback(() => {
    if (typeof window.ethereum === 'undefined') {
      setError('Please install MetaMask to use this application');
      setLoading(false);
      return false;
    }
    return true;
  }, [setError, setLoading]);

  // Function to get current account
  const getCurrentAccount = useCallback(async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        return accounts[0];
      }
      return null;
    } catch (err) {
      console.error('Error getting current account:', err);
      return null;
    }
  }, []);

  // Function to connect wallet
  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError('');

      if (!checkMetaMask()) {
        setIsConnecting(false);
        return null;
      }

      // First check if already connected
      let currentAccount = await getCurrentAccount();
      if (currentAccount) {
        console.log('Already connected to account:', currentAccount);
        setAccount(currentAccount);
        setIsConnecting(false);
        return currentAccount;
      }

      // If not connected, request connection
      console.log('Requesting wallet connection...');
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        setError('No accounts found. Please connect your wallet.');
        setIsConnecting(false);
        return null;
      }

      currentAccount = accounts[0];
      console.log('Connected to account:', currentAccount);
      setAccount(currentAccount);
      setIsConnecting(false);
      return currentAccount;
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet: ' + err.message);
      setIsConnecting(false);
      return null;
    }
  }, [checkMetaMask, getCurrentAccount, setAccount, setError, setIsConnecting]);

  // Function to check network
  const checkNetwork = useCallback(async () => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (network.chainId !== 11155111n) { // Sepolia chainId
        setError('Please connect to Sepolia network');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error checking network:', err);
      setError('Failed to check network: ' + err.message);
      return false;
    }
  }, [setError]);

  return {
    checkMetaMask,
    getCurrentAccount,
    connectWallet,
    checkNetwork
  };
}; 