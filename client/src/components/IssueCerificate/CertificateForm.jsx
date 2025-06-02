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
import FuturisticMinting from '../animations/FuturisticMinting';

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
  // Animation state - using refs to avoid hook order issues
  const animationRef = useRef({ startAnimation: () => {}, resetAnimation: () => {} });
  
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
    try {
      console.log('Fetching courses using batch method...');
      
      // Create an array of course IDs to check (1-100)
      const courseIdsToCheck = Array.from({ length: 100 }, (_, i) => (i + 1).toString());
      
      // Use the batch function to get all course names at once
      const courseNames = await contract.getCourseNamesBatch(courseIdsToCheck);
      
      // Process results - only include courses with non-empty names
      const allCourses = [];
      courseNames.forEach((name, index) => {
        if (name && name.trim()) {
          allCourses.push({
            id: courseIdsToCheck[index],
            name: name
          });
        }
      });
      
      console.log(`Found ${allCourses.length} courses`);
      
      // Sort by ID
      return allCourses.sort((a, b) => Number(a.id) - Number(b.id));
    } catch (error) {
      console.error('Error using getCourseNamesBatch:', error);
      
      // Fallback to individual fetching if batch method fails
      console.log('Falling back to individual course fetching...');
      const allCourses = [];
      
      // Check for courses one by one (1-100)
      for (let i = 1; i <= 100; i++) {
        try {
          const courseId = i.toString();
          const courseName = await contract.getCourseName(courseId);
          
          if (courseName && courseName.trim()) {
            allCourses.push({
              id: courseId,
              name: courseName
            });
          }
        } catch (err) {
          // Skip errors for individual courses
        }
      }
      
      console.log(`Fallback method found ${allCourses.length} courses`);
      return allCourses.sort((a, b) => Number(a.id) - Number(b.id));
    }
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

      // Start animation with doors closing - only start if not already active
      animationRef.current.startAnimation();

      const toastId = toast.loading('Starting certificate issuance...');
      
      try {
        await processCertificateIssuance(toastId);
      } catch (error) {
        // Error during issuance process - reset animation only if it's a critical error
        animationRef.current.resetAnimation();
        handleMintingError(error, toastId);
        throw error;
      }

    } catch (error) {
      handleMintingError(error, toastId);
      // Reset animation if error occurs
      animationRef.current.resetAnimation();
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
      
      // Step 1: Create or get a group for this course
      setUploadProgress(5);
      toast.loading('Creating course group...', { id: toastId });
      const groupId = await createOrGetCourseGroup(formData.courseId, courseName);

      // Step 2: Upload image to IPFS
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

      // Step 3: Create and upload metadata
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

      // Step 4: Mint the certificate on blockchain
      toast.loading('Minting certificate on blockchain...', { id: toastId });
      await mintCertificateOnBlockchain(metadataCID, toastId, courseName, generatedCertId, imageCID, groupId);

      toast.success('Certificate issued successfully!', { id: toastId });
      setSuccess(`Certificate issued successfully! Unique ID: ${generatedCertId}`);

      // Step 5: Update animation with certificate data for reveal
      const certificateData = {
        imageUrl: `https://gateway.pinata.cloud/ipfs/${imageCID}`,
        title: formData.certificateData.trim() || `${courseName} Certificate`,
        id: generatedCertId
      };
      
      // Show certificate in animation - use a timeout to ensure animation has time to progress
      setTimeout(() => {
        animationRef.current.startAnimation(certificateData);
      }, 1000);

      // Reset form
      resetForm();
    } catch (error) {
      // Let the parent function handle the error
      throw error;
    }
  };

  const createCertificateMetadata = (imageCID, courseName, certId, txHash = '') => {
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
        },
        {
          trait_type: "Transaction Hash",
          value: txHash
        }
      ],
      courseId: formData.courseId,
      courseName: courseName,
      uniqueCertificateId: certId,
      grade: formData.grade,
      studentAddress: formData.studentAddress,
      issueDate: new Date().toISOString(),
      transactionHash: txHash
    };
  };

  const mintCertificateOnBlockchain = async (metadataCID, toastId, courseName, certId, imageCID, groupId) => {
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
    
    // Wait for transaction confirmation to get the transaction hash
    const receipt = await tx.wait();
    console.log('Transaction receipt:', receipt);
    
    // Update the metadata on IPFS with the transaction hash
    if (receipt && receipt.hash) {
      try {
        // Create updated metadata with transaction hash
        const updatedMetadata = createCertificateMetadata(imageCID, courseName, certId, receipt.hash);
        
        // Upload the updated metadata
        const updatedMetadataCID = await uploadJSONToIPFS(
          updatedMetadata,
          () => {},
          formData.courseId,
          formData.studentAddress,
          groupId
        );
        
        if (updatedMetadataCID) {
          console.log('Updated metadata with transaction hash:', updatedMetadataCID);
          // Update the token URI with the new metadata
          const updatedTokenURI = `ipfs://${updatedMetadataCID}`;
          try {
            const updateTx = await contract.setCertificateURI(
              receipt.logs[0].topics[3], // This is the token ID from the transfer event
              updatedTokenURI
            );
            await updateTx.wait();
            console.log('Updated token URI with transaction hash metadata');
          } catch (error) {
            console.error('Error updating token URI:', error);
          }
        }
      } catch (error) {
        console.error('Error updating metadata with transaction hash:', error);
      }
    }
    
    return receipt;
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

  const handleMintingError = (error, toastId) => {
    if (toastId) toast.dismiss(toastId); // Dismiss the loading toast if present
    console.error("Minting error:", error);
    if (error.message && (error.message.includes('IPFS') || error.message.includes('Pinata') || error.message.includes('upload'))) {
      toast.error('Failed to upload to IPFS. Please try again later.');
      setError('Failed to upload to IPFS. Please try again later. Error: ' + error.message);
    } else if (error.message && error.message.includes('user rejected')) {
      toast.error('Transaction was rejected by user');
      setError('Transaction was rejected by user');
    } else {
      toast.error(error.message || "Failed to issue certificate");
      setError(error.message || "Failed to issue certificate");
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newValidationErrors = {};

    // Aggressive Ethereum address validation
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!formData.studentAddress.trim()) {
      newValidationErrors.studentAddress = 'Student address is required';
      isValid = false;
    } else if (!ethAddressRegex.test(formData.studentAddress.trim())) {
      newValidationErrors.studentAddress = 'Invalid Ethereum address format';
      isValid = false;
    }

    // Grade: must be number 1-100
    const gradeNum = Number(formData.grade);
    if (!formData.grade.trim()) {
      newValidationErrors.grade = 'Grade is required';
      isValid = false;
    } else if (!/^[0-9]+$/.test(formData.grade.trim())) {
      newValidationErrors.grade = 'Grade must be a number';
      isValid = false;
    } else if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 100) {
      newValidationErrors.grade = 'Grade must be between 1 and 100';
      isValid = false;
    }

    // Certificate title: only letters and spaces, max 40 chars
    if (!formData.certificateData.trim()) {
      newValidationErrors.certificateData = 'Certificate title is required';
      isValid = false;
    } else if (!/^[A-Za-z ]+$/.test(formData.certificateData.trim())) {
      newValidationErrors.certificateData = 'Title must contain only letters and spaces';
      isValid = false;
    } else if (formData.certificateData.trim().length > 40) {
      newValidationErrors.certificateData = 'Title must be 40 characters or less';
      isValid = false;
    }

    // Course
    if (!formData.courseId) {
      newValidationErrors.courseId = 'Course is required';
      isValid = false;
    }

    // Image
    if (!certificateImage) {
      newValidationErrors.certificateImage = 'Please select an image';
      isValid = false;
    }

    setValidationErrors(newValidationErrors);
    return isValid;
  };

  return (
    <FuturisticMinting.Provider>
      <AnimationHookHandler animationRef={animationRef} />
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

        {/* Futuristic minting animation overlay */}
        <FuturisticMinting.Overlay />
      </div>
    </FuturisticMinting.Provider>
  );
}

// Helper component to properly use the animation hook inside the provider
function AnimationHookHandler({ animationRef }) {
  const animation = FuturisticMinting.useAnimation();
  
  // Update the ref with the actual functions
  React.useEffect(() => {
    animationRef.current = animation;
  }, [animation, animationRef]);
  
  return null;
}

export default CertificateForm;