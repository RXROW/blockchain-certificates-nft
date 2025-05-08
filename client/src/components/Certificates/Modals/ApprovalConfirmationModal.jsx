import React, { useState, useEffect } from 'react';
import { FaFire, FaCheckCircle, FaClock, FaSpinner, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { ethers } from 'ethers';
import contractAddress from '../../../config/contractAddress.json';
import contractABI from '../../../config/abi.json';

const ApprovalConfirmationModal = ({ 
  certificate, 
  onClose, 
  onApprove, 
  onExecuteBurn,
  isApproved 
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [burnTimelock, setBurnTimelock] = useState(0);
  const [timelockRemaining, setTimelockRemaining] = useState(null);
  const [isTimelockExpired, setIsTimelockExpired] = useState(false);
  
  // Get burn timelock from contract when component mounts
  useEffect(() => {
    const getBurnTimelock = async () => {
      if (!window.ethereum) return;
      
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          contractAddress.SoulboundCertificateNFT,
          contractABI.SoulboundCertificateNFT,
          provider
        );
        
        const timelock = await contract.burnTimelock();
        setBurnTimelock(Number(timelock) * 1000); // Convert to milliseconds
      } catch (error) {
        console.error("Error getting burn timelock:", error);
      }
    };
    
    getBurnTimelock();
  }, []);
  
  // Update timelock remaining time
  useEffect(() => {
    if (!certificate || !burnTimelock) return;
    
    const calculateTimeRemaining = () => {
      const now = Date.now();
      const requestTime = new Date(certificate.burnRequestTime).getTime();
      const elapsed = now - requestTime;
      const remaining = Math.max(0, burnTimelock - elapsed);
      
      setTimelockRemaining(remaining);
      setIsTimelockExpired(remaining <= 0);
    };
    
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [certificate, burnTimelock]);
  
  // Format timelock remaining for display
  const formatTimelockRemaining = () => {
    if (!timelockRemaining) return "Unknown";
    if (timelockRemaining <= 0) return "Timelock expired";
    
    const days = Math.floor(timelockRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timelockRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timelockRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };
  
  const handleApprove = async () => {
    if (isApproved) return;
    
    setIsApproving(true);
    try {
      await onApprove();
    } catch (error) {
      console.error("Error approving burn request:", error);
    } finally {
      setIsApproving(false);
    }
  };
  
  const handleExecuteBurn = async () => {
    if (!isApproved || !isTimelockExpired) return;
    
    setIsBurning(true);
    try {
      await onExecuteBurn(certificate);
      onClose();
    } catch (error) {
      console.error("Error executing burn:", error);
    } finally {
      setIsBurning(false);
    }
  };
  
  if (!certificate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 w-full max-w-lg rounded-lg p-6 shadow-xl border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <FaFire className="mr-2 text-red-500" />
            Burn Request Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Certificate Details */}
        <div className="border border-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Certificate ID</p>
              <p className="text-white font-medium">#{certificate.id}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Status</p>
              {certificate.burnApproved ? (
                isTimelockExpired ? (
                  <span className="inline-flex items-center text-green-400">
                    <FaCheckCircle className="mr-1" />
                    Ready for Burn
                  </span>
                ) : (
                  <span className="inline-flex items-center text-blue-400">
                    <FaCheckCircle className="mr-1" />
                    Approved, Awaiting Timelock
                  </span>
                )
              ) : (
                <span className="inline-flex items-center text-yellow-400">
                  <FaClock className="mr-1" />
                  Pending Approval
                </span>
              )}
            </div>
            <div>
              <p className="text-gray-400 text-sm">Student</p>
              <p className="text-white font-medium">{`${certificate.student.substring(0, 6)}...${certificate.student.substring(certificate.student.length - 4)}`}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Institution</p>
              <p className="text-white font-medium">{`${certificate.institution.substring(0, 6)}...${certificate.institution.substring(certificate.institution.length - 4)}`}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Request Date</p>
              <p className="text-white font-medium">{certificate.burnRequestTime.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Certificate Grade</p>
              <p className="text-white font-medium">{certificate.grade}</p>
            </div>
          </div>
          
          {/* Burn Reason */}
          <div className="mt-4 bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <FaFire className="text-red-400 mr-2" />
              <p className="text-gray-300 font-medium">Burn Reason</p>
            </div>
            <p className="text-gray-300">{certificate.burnReason || "No reason provided"}</p>
          </div>
          
          {/* Timelock Information */}
          {certificate.burnApproved && (
            <div className="mt-4 bg-gray-900/50 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <FaClock className="text-blue-400 mr-2" />
                <p className="text-gray-300 font-medium">Timelock Status</p>
              </div>
              <div className="flex items-center">
                <div className={`h-2 rounded-full flex-grow ${isTimelockExpired ? 'bg-green-500' : 'bg-gradient-to-r from-red-500 via-yellow-500 to-green-500'}`}>
                  {!isTimelockExpired && (
                    <div 
                      className="h-full bg-gray-700 rounded-r-full" 
                      style={{ 
                        width: `${timelockRemaining ? (timelockRemaining / burnTimelock) * 100 : 100}%` 
                      }}
                    />
                  )}
                </div>
                <span className="ml-3 text-gray-300 whitespace-nowrap">{formatTimelockRemaining()}</span>
              </div>
            </div>
          )}
          
          {/* Certificate Verification Status */}
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <FaInfoCircle className="text-blue-400 mr-2" />
              <p className="text-gray-300 font-medium">Certificate Status</p>
            </div>
            <div className="bg-gray-900 p-3 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Verified:</span>
                <span className={certificate.isVerified ? "text-green-400" : "text-red-400"}>
                  {certificate.isVerified ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Revoked:</span>
                <span className={certificate.isRevoked ? "text-red-400" : "text-green-400"}>
                  {certificate.isRevoked ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            onClick={onClose}
          >
            Close
          </button>
          
          {!isApproved && (
            <button
              className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 flex items-center transition-colors"
              onClick={handleApprove}
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <FaCheckCircle className="mr-2" />
                  Approve Burn Request
                </>
              )}
            </button>
          )}
          
          {isApproved && isTimelockExpired && onExecuteBurn && (
            <button
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-500 flex items-center transition-colors"
              onClick={handleExecuteBurn}
              disabled={isBurning}
            >
              {isBurning ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <FaFire className="mr-2" />
                  Execute Burn
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalConfirmationModal; 