import React, { useState, useEffect } from 'react'
import CertificateForm from '../../components/IssueCerificate/CertificateForm'
import { ethers } from 'ethers';
import contractAddress from '../../config/contractAddress.json';
import contractABI from '../../config/abi.json';
import LoadingSpinner from '../../components/Shared/LoadingSpinner';

const IssueCertificate = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userAddress, setUserAddress] = useState('');

  // Check if user is admin on page load
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);
        if (!window.ethereum) {
          console.error("No Ethereum provider found");
          setIsLoading(false);
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length === 0) {
          console.error("No accounts found");
          setIsLoading(false);
          return;
        }
        
        const address = accounts[0].address;
        setUserAddress(address);
        
        const contract = new ethers.Contract(
          contractAddress.SoulboundCertificateNFT,
          contractABI.SoulboundCertificateNFT,
          provider
        );
        
        // Default admin role is always bytes32(0)
        const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
        
        // Check if address has admin role
        const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, address);
        setIsAdmin(hasAdminRole);
      } catch (error) {
        console.error("Error checking admin status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-violet-950 py-6 px-4 pb-10 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-green-300">
            Issue New Certificate
          </h1>
          <p className="mt-1 text-xl text-gray-300 max-w-2xl mx-auto">
            Create and issue a new blockchain-based certificate with secure verification and permanent storage
          </p>
          {isAdmin && (
            <div className="mt-3 inline-block px-4 py-2 bg-violet-900/50 text-white text-sm font-medium rounded-full">
              Admin Access
            </div>
          )}
        </div>
        <div className="bg-gray-800/40 backdrop-blur-lg rounded p-8 border border-gray-700/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner size="large" />
              <p className="mt-4 text-gray-300">Checking authorization status...</p>
            </div>
          ) : (
            <CertificateForm isAdmin={isAdmin} userAddress={userAddress} />
          )}
        </div>
      </div>
    </div>
  )
}

export default IssueCertificate