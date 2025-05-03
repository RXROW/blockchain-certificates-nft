import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import contractAddress from '../../config/contractAddress.json';
import contractABI from '../../config/abi.json';
import { uploadToIPFS, uploadJSONToIPFS, createOrGetCourseGroup } from '../../utils/ipfs';
import LoadingSpinner from '../Shared/LoadingSpinner';
import PINATA_CONFIG from '../../config/pinata';
import StudentInfoForm from './StudentInfoForm';
import CertificateImageUpload from './CertificateImageUpload';
import ProgressBar from '../Shared/ProgressBar';
import SuccessMessage from '../Shared/SuccessMessage';
import ErrorMessage from '../Shared/ErrorMessage';
import IPFSResultsPanel from './IPFSResultsPanel';

// Set constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const COURSES_CACHE_KEY = 'courses_cache';
const AUTH_CHECK_INTERVAL = 15000; // Check authorization every 15 seconds
const TOAST_DEBOUNCE_TIME = 3000; // Prevent duplicate toasts within 3 seconds

// Helper function to generate a unique certificate ID
const generateUniqueCertificateId = (courseId, studentAddress) => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 8);
  const courseIdShort = courseId.substring(0, 4);
  const studentShort = studentAddress.substring(2, 6);
  
  return `${courseIdShort}-${studentShort}-${timestamp.toString(36)}-${randomPart}`;
};

function CertificateForm({ isAdmin = false, userAddress: initialUserAddress = '' }) {
  const [formData, setFormData] = useState({
    studentAddress: '',
    courseId: '',
    grade: '',
    certificateData: '',
  });
  const [certificateImage, setCertificateImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [metadataCID, setMetadataCID] = useState(null);
  const [imageCID, setImageCID] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [uniqueCertId, setUniqueCertId] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(isAdmin);
  const [userAddress, setUserAddress] = useState(initialUserAddress);
  const [checkingAuth, setCheckingAuth] = useState(!isAdmin);
  
  // Refs for cleanup and preventing memory leaks
  const authCheckIntervalRef = useRef(null);
  const isComponentMounted = useRef(true);
  // Refs for toast debouncing
  const lastToastTimeRef = useRef({
    revoked: 0,
    authorized: 0
  });

  // Function to show toast with debounce
  const showDebouncedToast = useCallback((type, message, options = {}) => {
    const currentTime = Date.now();
    
    // Only show toast if enough time has passed since the last same-type toast
    if (currentTime - lastToastTimeRef.current[type] > TOAST_DEBOUNCE_TIME) {
      toast[type](message, options);
      lastToastTimeRef.current[type] = currentTime;
      return true;
    }
    return false;
  }, []);

  // Memoize the checkAuthorization function so it can be used in useEffect cleanup
  const checkAuthorization = useCallback(async (showToast = false) => {
    // Skip check if user is already identified as admin from props
    if (isAdmin) {
      setIsAuthorized(true);
      setCheckingAuth(false);
      return;
    }
    
    if (!isComponentMounted.current) return;
    
    try {
      setCheckingAuth(true);
      
      // Skip check if no provider is available
      if (!window.ethereum) {
        setError('No Ethereum provider detected. Please install MetaMask.');
        setIsAuthorized(false);
        setCheckingAuth(false);
        return;
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get current address if not already provided
      let address = userAddress;
      if (!address) {
        const signer = await provider.getSigner();
        address = await signer.getAddress();
        
        // Only update if address changed
        if (address !== userAddress) {
          setUserAddress(address);
        }
      }
      
      const contract = new ethers.Contract(
        contractAddress.SoulboundCertificateNFT,
        contractABI.SoulboundCertificateNFT,
        provider
      );
      
      // Default admin role is always bytes32(0)
      const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
      
      // Check if account has admin role
      const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, address);
      
      // Check if institution has the role and is authorized
      const hasRole = await contract.hasRole(await contract.INSTITUTION_ROLE(), address);
      const authorized = await contract.authorizedInstitutions(address);
      
      const wasAuthorized = isAuthorized;
      // Account is authorized if it's an admin OR if it has institution role and is authorized
      const newAuthStatus = hasAdminRole || (hasRole && authorized);
      
      // Only update state if authorization status changed or first check
      if (wasAuthorized !== newAuthStatus || checkingAuth) {
        setIsAuthorized(newAuthStatus);
        
        // Only show toasts when status actually changes, not on first load
        if (showToast && wasAuthorized !== newAuthStatus) {
          if (!newAuthStatus && wasAuthorized) {
            // Use debounced toast for revocation
            showDebouncedToast('error', 'Your institution authorization has been revoked!', { duration: 5000 });
            setError('Your institution is no longer authorized to issue certificates.');
          } else if (newAuthStatus && !wasAuthorized) {
            // Use debounced toast for authorization
            showDebouncedToast('success', 'Your institution is now authorized!', { duration: 3000 });
            setError('');
          }
        } else {
          if (hasAdminRole) {
            // Admin is always authorized
            setError('');
          } else if (!hasRole) {
            setError('Your account does not have the institution role. You cannot issue certificates.');
          } else if (!authorized) {
            setError('Your institution has been revoked and is not authorized to issue certificates.');
          } else {
            setError('');
          }
        }
      }
    } catch (err) {
      console.error('Error checking authorization:', err);
      if (showToast) {
        toast.error('Failed to verify institution authorization status');
      }
      setError('Failed to check institution authorization status.');
    } finally {
      if (isComponentMounted.current) {
        setCheckingAuth(false);
      }
    }
  }, [isAuthorized, userAddress, checkingAuth, showDebouncedToast, isAdmin]);

  // Load courses and check authorization when component mounts
  useEffect(() => {
    isComponentMounted.current = true;
    
    fetchCourses();
    
    // Define event handlers outside of conditional blocks so they're accessible in cleanup
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0 && accounts[0] !== userAddress) {
        // Address changed, re-check authorization
        checkAuthorization(true);
      }
    };
    
    // Set up network change listener
    const handleChainChanged = () => {
      // Network changed, re-check authorization
      checkAuthorization(true);
    };
    
    // Skip authorization check if isAdmin is true
    if (!isAdmin) {
      // Don't show toast on initial load
      checkAuthorization(false);
      
      // Set up periodic auth checking (but not for admins)
      authCheckIntervalRef.current = setInterval(() => {
        // Show toast for automatic checks if status changes
        checkAuthorization(true);
      }, AUTH_CHECK_INTERVAL);
      
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      }
    } else {
      // If admin, we're already authorized
      setCheckingAuth(false);
    }
    
    // Clean up
    return () => {
      isComponentMounted.current = false;
      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
      }
      
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [checkAuthorization, isAdmin]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);

      // First try to get from cache
      const cachedData = localStorage.getItem(COURSES_CACHE_KEY);
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          // Use cache if it's less than 5 minutes old
          if (Date.now() - timestamp < 5 * 60 * 1000 && Array.isArray(data) && data.length > 0) {
            setCourses(data);
            setLoadingCourses(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing cached course data:', e);
        }
      }

      // If no valid cache, fetch from blockchain
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        contractAddress.SoulboundCertificateNFT,
        contractABI.SoulboundCertificateNFT,
        provider
      );

      const coursesData = await loadCoursesFromContract(contract);
      setCourses(coursesData);

      // Update cache
      localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify({
        data: coursesData,
        timestamp: Date.now()
      }));

    } catch (err) {
      console.error('Error fetching courses:', err);
      toast.error('Failed to load courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadCoursesFromContract = async (contract) => {
    // Get all courses
    const uniqueCourseIds = new Set();
    const allCourses = [];

    // Try to get courses from existing certificates
    const totalCertificates = Number(await contract.totalSupply());
    const maxToCheck = Math.min(totalCertificates, 100);

    for (let i = 0; i < maxToCheck; i++) {
      try {
        const tokenId = await contract.tokenByIndex(i);
        const cert = await contract.getCertificate(tokenId);
        uniqueCourseIds.add(cert[2].toString());
      } catch (err) {
        // Skip errors
      }
    }

    // Also check for courses without certificates
    for (let i = 1; i <= 100; i++) {
      try {
        const courseName = await contract.getCourseName(i.toString());
        if (courseName && courseName.trim()) {
          uniqueCourseIds.add(i.toString());
        }
      } catch (err) {
        // Skip errors
      }
    }

    // Get course names
    for (const courseId of uniqueCourseIds) {
      try {
        const courseName = await contract.getCourseName(courseId);
        if (courseName && courseName.trim()) {
          allCourses.push({
            id: courseId,
            name: courseName
          });
        }
      } catch (err) {
        // Skip errors
      }
    }

    // Sort by ID
    return allCourses.sort((a, b) => Number(a.id) - Number(b.id));
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleImageUpload = (file) => {
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setValidationErrors(prev => ({
        ...prev,
        certificateImage: 'Invalid file type. Please upload a JPEG, PNG, or GIF image.'
      }));
      toast.error('Invalid file type. Please upload a JPEG, PNG, or GIF image.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setValidationErrors(prev => ({
        ...prev,
        certificateImage: 'File size too large. Maximum size is 5MB.'
      }));
      toast.error('File size too large. Maximum size is 5MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    setCertificateImage(file);
    setValidationErrors(prev => ({
      ...prev,
      certificateImage: ''
    }));
    setTouchedFields(prev => ({
      ...prev,
      certificateImage: true
    }));
  };

  const mintCertificate = async () => {
    try {
      // Skip authorization check for admins
      if (!isAdmin) {
        // Check authorization status right before proceeding
        await checkAuthorization(false);
        
        // Verify authorization again before proceeding
        if (!isAuthorized) {
          toast.error('Your institution is not authorized to issue certificates');
          return;
        }
      }

      // Mark all fields as touched
      setTouchedFields({
        studentAddress: true,
        courseId: true,
        grade: true,
        certificateData: true,
        certificateImage: true
      });

      if (!validateForm()) {
        toast.error('Please fix the validation errors before proceeding');
        return;
      }

      setLoading(true);
      setError('');
      setSuccess('');
      setMetadataCID(null);
      setImageCID(null);
      setUploadProgress(0);

      const toastId = toast.loading('Starting certificate issuance...');
      await processCertificateIssuance(toastId);

    } catch (error) {
      handleMintingError(error);
    } finally {
      setLoading(false);
    }
  };

  const processCertificateIssuance = async (toastId) => {
    try {
      // Get the course name to include in metadata
      const selectedCourse = courses.find(course => course.id === formData.courseId);
      const courseName = selectedCourse ? selectedCourse.name : "Unknown Course";
      
      // Generate a unique certificate ID
      const generatedCertId = generateUniqueCertificateId(formData.courseId, formData.studentAddress);
      setUniqueCertId(generatedCertId);
      
      // Create or get a group for this course
      setUploadProgress(5);
      toast.loading('Creating course group...', { id: toastId });
      const groupId = await createOrGetCourseGroup(formData.courseId, courseName);

      // Upload image to IPFS
      setUploadProgress(10);
      toast.loading('Uploading image to IPFS...', { id: toastId });
      const imageCID = await uploadToIPFS(
        certificateImage,
        (progress) => {
          setUploadProgress(10 + (progress * 0.4));
          toast.loading(`Uploading image: ${Math.round(progress * 100)}%`, { id: toastId });
        },
        formData.courseId,
        formData.studentAddress,
        'cert',
        groupId
      );

      if (!imageCID) {
        throw new Error("Failed to get CID from image upload");
      }

      setImageCID(imageCID);
      setUploadProgress(50);

      // Create and upload metadata
      setUploadProgress(70);
      toast.loading('Creating and uploading metadata...', { id: toastId });

      const metadata = createCertificateMetadata(imageCID, courseName, generatedCertId);
      const metadataCID = await uploadJSONToIPFS(
        metadata,
        (progress) => {
          setUploadProgress(70 + (progress * 0.3));
          toast.loading(`Uploading metadata: ${Math.round(progress * 100)}%`, { id: toastId });
        },
        formData.courseId,
        formData.studentAddress,
        groupId
      );

      if (!metadataCID) {
        throw new Error("Failed to get CID from metadata upload");
      }

      setMetadataCID(metadataCID);
      setUploadProgress(100);

      // Mint the certificate on blockchain
      await mintCertificateOnBlockchain(metadataCID, toastId);

      toast.success('Certificate issued successfully!', { id: toastId });
      setSuccess(`Certificate issued successfully! Unique ID: ${generatedCertId}`);

      // Reset form
      resetForm();
    } catch (error) {
      throw error;
    }
  };

  const createCertificateMetadata = (imageCID, courseName, certId) => {
    // Generate certificate title if not provided
    const certificateTitle = formData.certificateData.trim() || 
      `${courseName} Certificate for ${formData.studentAddress.substring(0, 6)}...`;
    
    return {
      name: certificateTitle,
      description: "Academic Certificate",
      image: `ipfs://${imageCID}`,
      uniqueId: certId,
      attributes: [
        {
          trait_type: "Certificate ID",
          value: certId
        },
        {
          trait_type: "Course ID",
          value: formData.courseId
        },
        {
          trait_type: "Course Name",
          value: courseName
        },
        {
          trait_type: "Grade",
          value: formData.grade
        },
        {
          trait_type: "Issue Date",
          value: new Date().toISOString()
        },
        {
          trait_type: "Student Address",
          value: formData.studentAddress
        }
      ],
      courseId: formData.courseId,
      courseName: courseName,
      uniqueCertificateId: certId,
      grade: formData.grade,
      studentAddress: formData.studentAddress,
      issueDate: new Date().toISOString()
    };
  };

  const mintCertificateOnBlockchain = async (metadataCID, toastId) => {
    toast.loading('Minting certificate on blockchain...', { id: toastId });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      contractAddress.SoulboundCertificateNFT,
      contractABI.SoulboundCertificateNFT,
      signer
    );

    // If user is admin, skip authorization check
    if (!isAdmin) {
      // Get the default admin role
      const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
      
      // Check if user is admin
      const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, userAddress);
      
      // Verify authorization status one last time before transaction
      const isStillAuthorized = hasAdminRole || await contract.authorizedInstitutions(userAddress);
      if (!isStillAuthorized) {
        throw new Error("Your institution's authorization status has changed. You cannot issue certificates.");
      }
    }

    // Create the IPFS URI with ipfs:// prefix
    const tokenURI = `ipfs://${metadataCID}`;
    console.log('Setting token URI:', tokenURI);

    // Issue the certificate with the IPFS URI as certificateHash
    const tx = await contract.issueCertificate(
      formData.studentAddress,
      formData.courseId,
      formData.grade,
      tokenURI  // This will be stored as both certificateHash and tokenURI
    );
    await tx.wait();
  };

  const resetForm = () => {
    setFormData({
      studentAddress: '',
      courseId: '',
      grade: '',
      certificateData: '',
    });
    setCertificateImage(null);
    setImagePreview(null);
    setUploadProgress(0);
    setTouchedFields({});
    setValidationErrors({});
  };

  const handleMintingError = (error) => {
    console.error("Minting error:", error);
    if (error.message.includes('IPFS') || error.message.includes('Pinata') || error.message.includes('upload')) {
      toast.error('Failed to upload to IPFS. Please try again later.');
      setError('Failed to upload to IPFS. Please try again later. Error: ' + error.message);
    } else if (error.message.includes('user rejected')) {
      toast.error('Transaction was rejected by user');
      setError('Transaction was rejected by user');
    } else {
      toast.error(error.message || "Failed to issue certificate");
      setError(error.message || "Failed to issue certificate");
    }
  };

  const validateForm = () => {
    let isValid = true;

    // Reset validation errors
    const newValidationErrors = {};

    // Check student address
    if (!formData.studentAddress.trim()) {
      newValidationErrors.studentAddress = 'Student address is required';
      isValid = false;
    }

    // Check course
    if (!formData.courseId) {
      newValidationErrors.courseId = 'Course is required';
      isValid = false;
    }

    // Check grade
    if (!formData.grade.trim()) {
      newValidationErrors.grade = 'Grade is required';
      isValid = false;
    }

    // Check certificate title
    if (!formData.certificateData.trim()) {
      newValidationErrors.certificateData = 'Certificate title is required';
      isValid = false;
    }

    // Check image
    if (!certificateImage) {
      newValidationErrors.certificateImage = 'Please select an image';
      isValid = false;
    }

    setValidationErrors(newValidationErrors);
    return isValid;
  };

  return (
    <div className="space-y-8">
      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} />}

      {!isAuthorized && !checkingAuth && (
        <div className="p-4 bg-red-900/50 border border-red-800 rounded-lg text-white">
          <h3 className="text-lg font-medium">Authorization Error</h3>
          <p className="mt-1">Your institution is not authorized to issue certificates. Please contact the administrator.</p>
          <button 
            onClick={() => checkAuthorization(true)}
            className="mt-2 px-4 py-1 bg-red-700 hover:bg-red-600 rounded text-sm font-medium transition-colors"
          >
            Check Status Again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <StudentInfoForm
          formData={formData}
          onInputChange={handleInputChange}
          validationErrors={validationErrors}
          touchedFields={touchedFields}
          loading={loading || !isAuthorized}
          courses={courses}
          loadingCourses={loadingCourses}
        />

        <div className="space-y-6">
          <CertificateImageUpload
            imagePreview={imagePreview}
            onImageUpload={handleImageUpload}
            loading={loading || !isAuthorized}
            validationError={validationErrors.certificateImage}
            touched={touchedFields.certificateImage}
          />

          {loading && (
            <ProgressBar
              progress={uploadProgress}
              stage={
                uploadProgress < 50
                  ? 'Uploading image...'
                  : uploadProgress < 80
                    ? 'Processing metadata...'
                    : 'Minting certificate...'
              }
            />
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={mintCertificate}
          disabled={loading || !isAuthorized || checkingAuth}
          className="px-8 py-4 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="small" />
              <span>Processing...</span>
            </div>
          ) : checkingAuth ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="small" />
              <span>Checking Authorization...</span>
            </div>
          ) : !isAuthorized ? (
            'Not Authorized'
          ) : (
            'Mint Certificate'
          )}
        </button>
      </div>

      {metadataCID && imageCID && (
        <IPFSResultsPanel
          metadataCID={metadataCID}
          imageCID={imageCID}
        />
      )}
    </div>
  );
}

export default CertificateForm;