import React, { useState, useEffect } from 'react';
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

function CertificateForm() {
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

  // Load courses when component mounts
  useEffect(() => {
    fetchCourses();
  }, []);

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
        contractAddress.CertificateNFT,
        contractABI.CertificateNFT,
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

      const metadata = createCertificateMetadata(imageCID, courseName);
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
      setSuccess('Certificate issued successfully!');

      // Reset form
      resetForm();
    } catch (error) {
      throw error;
    }
  };

  const createCertificateMetadata = (imageCID, courseName) => {
    return {
      name: formData.certificateData,
      description: "Academic Certificate",
      image: `ipfs://${imageCID}`,
      attributes: [
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
      contractAddress.CertificateNFT,
      contractABI.CertificateNFT,
      signer
    );

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <StudentInfoForm
          formData={formData}
          onInputChange={handleInputChange}
          validationErrors={validationErrors}
          touchedFields={touchedFields}
          loading={loading}
          courses={courses}
          loadingCourses={loadingCourses}
        />

        <div className="space-y-6">
          <CertificateImageUpload
            imagePreview={imagePreview}
            onImageUpload={handleImageUpload}
            loading={loading}
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
          disabled={loading}
          className="px-8 py-4 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="small" />
              <span>Processing...</span>
            </div>
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