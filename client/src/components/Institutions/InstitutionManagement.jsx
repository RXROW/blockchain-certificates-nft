import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractAddress from '../../config/contractAddress.json';
import contractABI from '../../config/abi.json';
import LoadingSpinner from '../Shared/LoadingSpinner';
import toast from 'react-hot-toast';

const InstitutionManagement = ({ onSuccess, onError }) => {
  const [institutions, setInstitutions] = useState([]);
  const [institutionDetails, setInstitutionDetails] = useState([]);
  const [newInstitution, setNewInstitution] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [institutionToDelete, setInstitutionToDelete] = useState(null);
  const [currentUserAddress, setCurrentUserAddress] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [nameError, setNameError] = useState('');

  // Define role constants
  const INSTITUTION_ROLE = ethers.keccak256(ethers.toUtf8Bytes('INSTITUTION_ROLE'));
  const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000'; // Default admin role is bytes32(0)

  useEffect(() => {
    loadCurrentUserInfo();
    loadInstitutions();
  }, []);

  const validateEthereumAddress = (address) => {
    return ethers.isAddress(address);
  };

  const validateInstitutionName = (name) => {
    // Check if name is at least 3 characters
    if (name.trim().length < 3) {
      setNameError('Institution name must be at least 3 characters long');
      return false;
    }
    
    // Check if name contains only allowed characters (letters, numbers, spaces, hyphens, periods)
    const nameRegex = /^[a-zA-Z0-9 .\-_]+$/;
    if (!nameRegex.test(name)) {
      setNameError('Institution name contains invalid characters. Only letters, numbers, spaces, hyphens, underscores and periods are allowed');
      return false;
    }
    
    setNameError('');
    return true;
  };

  const loadCurrentUserInfo = async () => {
    try {
      // Get the current user's address
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      const userAddress = accounts[0].address;
      setCurrentUserAddress(userAddress);

      // Check if the user is an admin
      const contract = new ethers.Contract(
        contractAddress.SoulboundCertificateNFT,
        contractABI.SoulboundCertificateNFT,
        provider
      );
      
      const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, userAddress);
      setIsAdmin(hasAdminRole);
    } catch (err) {
      console.error('Error loading user info:', err);
    }
  };

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        contractAddress.SoulboundCertificateNFT,
        contractABI.SoulboundCertificateNFT,
        provider
      );

      // Get all events for role granting
      const filter = contract.filters.RoleGranted(INSTITUTION_ROLE);
      const events = await contract.queryFilter(filter);
      
      // Extract unique addresses from events
      const addresses = [...new Set(events.map(event => event.args.account))];
      
      // Add the current user's address if it's not already included
      if (currentUserAddress && !addresses.includes(currentUserAddress)) {
        addresses.push(currentUserAddress);
      }
      
      // Get certificate counts for each institution and check both role and authorization
      const institutionsWithDetails = await Promise.all(
        addresses.map(async (address) => {
          const hasRole = await contract.hasRole(INSTITUTION_ROLE, address);
          const isAuthorized = await contract.authorizedInstitutions(address);
          const certificateCount = await contract.countCertificatesByInstitution(address);
          const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, address);
          
          // An institution is active if:
          // 1. It's an admin (admins are always active), OR
          // 2. It has both the institution role AND is authorized
          const isActive = hasAdminRole || (hasRole && isAuthorized);
          
          return {
            address,
            hasRole,
            isAuthorized,
            isActive,
            isAdmin: hasAdminRole,
            isSelf: address.toLowerCase() === currentUserAddress.toLowerCase(),
            certificateCount: Number(certificateCount),
            name: hasAdminRole ? `Admin ${address.substring(0, 6)}...` : `Institution ${address.substring(0, 6)}...`,
            status: isActive ? 'active' : 'inactive',
            addedDate: new Date().toISOString().split('T')[0] // Placeholder
          };
        })
      );
      
      setInstitutions(addresses);
      setInstitutionDetails(institutionsWithDetails);
      setLoading(false);
    } catch (err) {
      console.error('Error loading institutions:', err);
      setError('Failed to load institutions');
      if (onError) onError('Failed to load institutions');
      toast.error('Failed to load institutions');
      setLoading(false);
    }
  };

  const authorizeInstitution = async () => {
    if (!validateEthereumAddress(newInstitution)) {
      const errorMsg = 'Please enter a valid Ethereum address';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!institutionName.trim()) {
      const errorMsg = 'Please enter an institution name';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!validateInstitutionName(institutionName)) {
      const errorMsg = nameError;
      setError(errorMsg);
      if (onError) onError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress.SoulboundCertificateNFT,
        contractABI.SoulboundCertificateNFT,
        signer
      );

      // Only use authorizeInstitution which should handle the role granting internally
      const tx = await contract.authorizeInstitution(newInstitution);
      await tx.wait();

      const successMsg = `Institution ${institutionName} (${newInstitution}) authorized successfully`;
      setSuccess(successMsg);
      if (onSuccess) onSuccess(successMsg);
      setNewInstitution('');
      setInstitutionName('');
      toast.success(successMsg);
      
      // Update the list of institutions
      loadInstitutions();
    } catch (err) {
      console.error('Error authorizing institution:', err);
      const errorMsg = err.message || 'Failed to authorize institution';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const confirmRevokeInstitution = (institution) => {
    // Prevent revoking admins or your own account
    if (institution.isAdmin) {
      toast.error("Cannot revoke admin accounts");
      return;
    }
    
    if (institution.isSelf) {
      toast.error("Cannot revoke your own account");
      return;
    }
    
    setInstitutionToDelete(institution);
    setShowConfirmDialog(true);
  };

  const cancelRevoke = () => {
    setShowConfirmDialog(false);
    setInstitutionToDelete(null);
  };

  const revokeInstitution = async () => {
    if (!institutionToDelete) return;
    
    // Double check you're not revoking an admin or yourself
    if (institutionToDelete.isAdmin) {
      toast.error("Cannot revoke admin accounts");
      setShowConfirmDialog(false);
      setInstitutionToDelete(null);
      return;
    }
    
    if (institutionToDelete.isSelf) {
      toast.error("Cannot revoke your own account");
      setShowConfirmDialog(false);
      setInstitutionToDelete(null);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress.SoulboundCertificateNFT,
        contractABI.SoulboundCertificateNFT,
        signer
      );

      // Check institution status before attempting revocation
      const hasRole = await contract.hasRole(INSTITUTION_ROLE, institutionToDelete.address);
      const isAuthorized = await contract.authorizedInstitutions(institutionToDelete.address);

      // If neither role nor authorization exists, no need to attempt revocation
      if (!hasRole && !isAuthorized) {
        // Simply show success message and update the UI
        const successMsg = `Institution ${institutionToDelete.name} is already fully revoked`;
        setSuccess(successMsg);
        if (onSuccess) onSuccess(successMsg);
        toast.success(successMsg);
        
        // Update the list of institutions
        loadInstitutions();
        return;
      }
      
      let tx;
      
      // If the institution is authorized in the contract, use revokeInstitution
      if (isAuthorized) {
        tx = await contract.revokeInstitution(institutionToDelete.address);
        await tx.wait();
      } 
      // Otherwise, if they at least have the role, revoke that
      else if (hasRole) {
        tx = await contract.revokeRole(INSTITUTION_ROLE, institutionToDelete.address);
        await tx.wait();
      }

      const successMsg = `Institution ${institutionToDelete.name} revoked successfully`;
      setSuccess(successMsg);
      if (onSuccess) onSuccess(successMsg);
      toast.success(successMsg);
      
      // Update the list of institutions
      loadInstitutions();
    } catch (err) {
      console.error('Error revoking institution:', err);
      
      // Check for the specific "Institution not authorized" error
      const errorMessage = err.message || 'Failed to revoke institution';
      const isInstitutionNotAuthorizedError = 
        errorMessage.includes("Institution not authorized") || 
        errorMessage.includes("execution reverted") ||
        errorMessage.includes("doesn't have the institution role");
      
      let userErrorMsg = errorMessage;
      
      if (isInstitutionNotAuthorizedError) {
        userErrorMsg = "This institution is already revoked or doesn't exist in the system. Refreshing the page...";
        // Try to reload the institutions to get fresh data
        loadInstitutions();
      }
      
      setError(userErrorMsg);
      if (onError) onError(userErrorMsg);
      toast.error(userErrorMsg);
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
      setInstitutionToDelete(null);
    }
  };

  return {
    institutions: institutionDetails,
    loading,
    error,
    success,
    newInstitution,
    institutionName,
    nameError,
    showConfirmDialog,
    institutionToDelete,
    currentUserAddress,
    isAdmin,
    setNewInstitution,
    setInstitutionName,
    authorizeInstitution,
    confirmRevokeInstitution,
    cancelRevoke,
    revokeInstitution,
    validateEthereumAddress,
    validateInstitutionName
  };
};

export default InstitutionManagement; 