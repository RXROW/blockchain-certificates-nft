import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrowserProvider, Contract } from 'ethers';
import contractAddress from '../../config/contractAddress.json';
import contractABI from '../../config/abi.json';
import { useContractInitialization } from '../../hooks/useContractInitialization';
import { useCertificateUpdate } from '../../hooks/useCertificateUpdate';
import { formatGrade, getStatusColor, getStatusText } from '../../components/sperates/cert_utilits';
import { FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import CertificateDetails from '../../components/Certificates/CertificateDetails';

const UpdateCertificate = () => {
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState(null);

  // Form values
  const [formValues, setFormValues] = useState({
    searchType: 'id',
    searchQuery: '',
    newGrade: '',
    updateReason: '',
  });

  // Initialize contract
  useEffect(() => {
    const initializeContract = async () => {
      try {
        if (window.ethereum) {
          const provider = new BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0].address);
            setConnected(true);
          }
          
          // Initialize the contract
          const certContract = new Contract(
            contractAddress.SoulboundCertificateNFT,
            contractABI.SoulboundCertificateNFT,
            provider
          );
          setContract(certContract);
        }
      } catch (error) {
        console.error('Failed to initialize contract:', error);
      }
    };

    initializeContract();
  }, []);

  // Connect wallet function
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setConnected(true);
        }
      } else {
        alert('Please install MetaMask or another Ethereum wallet.');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Use the certificate update hook
  const {
    searchResults,
    selectedCertificate,
    isLoading,
    error,
    isSuccess,
    txHash,
    searchCertificate,
    selectCertificate,
    updateCertificateGrade
  } = useCertificateUpdate(contract);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!formValues.searchType || !formValues.searchQuery) {
      return;
    }
    searchCertificate(formValues.searchType, formValues.searchQuery);
  };

  // Handle update form submission
  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    if (!selectedCertificate) return;
    
    updateCertificateGrade(
      selectedCertificate.id,
      formValues.newGrade,
      formValues.updateReason
    );
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormValues({
      searchType: 'id',
      searchQuery: '',
      newGrade: '',
      updateReason: '',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-violet-950 p-6">
      <div className="container mx-auto max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-violet-400 hover:text-violet-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </button>

        <div className="bg-white/5 backdrop-blur-lg rounded-xl shadow-2xl p-8 border border-white/10">
          <h1 className="text-4xl py-4 text-center font-bold sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-yellow-500 mb-4">
            Update Certificate
          </h1>
          <p className="text-center text-white/70 mb-8 max-w-2xl mx-auto">
            Search for a certificate, then update the grade and provide a reason for the update.
          </p>

          {/* Wallet Connection Status */}
          {!connected ? (
            <div className="mb-6 text-center">
              <button
                onClick={connectWallet}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-indigo-500/25"
              >
                Connect Wallet
              </button>
              <p className="mt-2 text-amber-400">Please connect your wallet to update certificates.</p>
            </div>
          ) : (
            <div className="mb-6 text-center text-green-400">
              <p>Wallet connected: {account?.slice(0, 6)}...{account?.slice(-4)}</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center text-white">
              <FaExclamationTriangle className="flex-shrink-0 mr-3 text-red-400" />
              <p>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center text-white">
              <FaCheck className="flex-shrink-0 mr-3 text-green-400" />
              <div>
                <p className="font-semibold">Certificate Updated Successfully!</p>
                {txHash && (
                  <p className="text-sm text-green-300 mt-1">
                    Transaction Hash: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Search Section */}
          <form onSubmit={handleSearchSubmit} className="mb-8">
            <div className="flex gap-2">
              <div className="relative">
                <select
                  name="searchType"
                  value={formValues.searchType}
                  onChange={handleChange}
                  className="w-32 p-3 rounded-lg bg-white/10 border border-white/20 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all text-white"
                  disabled={isLoading}
                >
                  <option value="id">Certificate ID</option>
                  <option value="name">Course Name</option>
                  <option value="student">Student Address</option>
                  <option value="institution">Institution</option>
                </select>
              </div>

              <div className="relative flex-1">
                <input
                  type="text"
                  name="searchQuery"
                  value={formValues.searchQuery}
                  onChange={handleChange}
                  placeholder={`Search by ${formValues.searchType}...`}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all text-white placeholder-white/50"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-lg hover:from-violet-700 hover:to-violet-800 transition-all shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !connected}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <FaSpinner className="animate-spin mr-2" />
                    Searching...
                  </span>
                ) : (
                  "Search"
                )}
              </button>
            </div>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && !selectedCertificate && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-violet-300 mb-4">Search Results</h3>
              <div className="bg-white/10 rounded-lg overflow-auto max-h-80">
                <table className="w-full text-white">
                  <thead className="bg-violet-900/50">
                    <tr>
                      <th className="p-3 text-left">ID</th>
                      <th className="p-3 text-left">Course</th>
                      <th className="p-3 text-left">Student</th>
                      <th className="p-3 text-left">Current Grade</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((cert) => (
                      <tr key={cert.id} className="border-t border-white/10 hover:bg-white/5">
                        <td className="p-3">{cert.id}</td>
                        <td className="p-3">{cert.courseName || `Course ${cert.courseId}`}</td>
                        <td className="p-3 text-xs">{cert.student.slice(0, 6)}...{cert.student.slice(-4)}</td>
                        <td className="p-3">{cert.grade} ({formatGrade(cert.grade)})</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(cert)}`}>
                            {getStatusText(cert)}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => selectCertificate(cert)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
                            disabled={cert.isRevoked}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Certificate Update Form - Only show when a certificate is selected */}
          {selectedCertificate && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-violet-300">Update Certificate</h3>
                <button
                  onClick={() => selectCertificate(null)}
                  className="text-sm text-violet-400 hover:text-violet-300"
                >
                  Select Different Certificate
                </button>
              </div>

              {/* Replace the hard-coded certificate details with our component */}
              <div className="mb-6">
                <CertificateDetails certificate={selectedCertificate} compact={true} />
              </div>

              {selectedCertificate.isRevoked ? (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-white text-center">This certificate has been revoked and cannot be updated.</p>
                </div>
              ) : (
                <form onSubmit={handleUpdateSubmit} className="space-y-6">
                  {/* New Grade */}
                  <div className="space-y-2">
                    <label htmlFor="newGrade" className="block text-lg font-medium text-white/90">
                      New Grade (0-100)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="newGrade"
                        id="newGrade"
                        min="0"
                        max="100"
                        value={formValues.newGrade}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all text-white appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  {/* Update Reason */}
                  <div className="space-y-2">
                    <label htmlFor="updateReason" className="block text-lg font-medium text-white/90">
                      Update Reason
                    </label>
                    <div className="relative">
                      <textarea
                        name="updateReason"
                        id="updateReason"
                        rows={4}
                        value={formValues.updateReason}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all text-white resize-none"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading || !connected || selectedCertificate.isRevoked}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <FaSpinner className="animate-spin mr-2" />
                          Updating...
                        </span>
                      ) : (
                        "Update Certificate"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        selectCertificate(null);
                        resetForm();
                      }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-gray-500/25"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateCertificate;
