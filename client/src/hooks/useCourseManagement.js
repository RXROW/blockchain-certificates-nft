import { useState, useEffect, useCallback } from 'react';
import { Contract, BrowserProvider } from 'ethers';
import contractAddress from '../config/contractAddress.json';
import contractABI from '../config/abi.json';

// Constants
const COURSES_CACHE_KEY = 'courses_cache';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes cache expiry

export const useCourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Course certificate states
  const [courseCertificates, setCourseCertificates] = useState({});
  const [certificatesLoading, setCertificatesLoading] = useState(false);
  
  // Bulk operations state
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Initialize contract connection
  const getContract = useCallback(async (needSigner = false) => {
    if (!window.ethereum) {
      throw new Error('No Ethereum provider detected. Please install MetaMask.');
    }
    
    const provider = new BrowserProvider(window.ethereum);
    
    if (needSigner) {
      const signer = await provider.getSigner();
      return new Contract(
        contractAddress.SoulboundCertificateNFT,
        contractABI.SoulboundCertificateNFT,
        signer
      );
    }
    
    return new Contract(
      contractAddress.SoulboundCertificateNFT,
      contractABI.SoulboundCertificateNFT,
      provider
    );
  }, []);

  // Get all courses using optimized approach
  const fetchCourses = useCallback(async (skipCache = false) => {
    try {
      setLoading(true);
      setError('');

      // Check cache first if not skipping
      if (!skipCache) {
        const cachedData = localStorage.getItem(COURSES_CACHE_KEY);
        if (cachedData) {
          try {
            const { data, timestamp } = JSON.parse(cachedData);
            const isExpired = Date.now() - timestamp > CACHE_EXPIRY;
            
            if (!isExpired && Array.isArray(data) && data.length > 0) {
              console.log('Using cached course data');
              setCourses(data);
              setLoading(false);
              return data;
            }
          } catch (e) {
            console.error('Error parsing cached course data:', e);
          }
        }
      }

      console.log('Fetching courses from blockchain...');
      const contract = await getContract();
      
      // Approach 1: Try to get the latest course IDs using a direct method if available
      try {
        if (typeof contract.getAllCourseIds === 'function') {
          console.log('Using getAllCourseIds method');
          const courseIds = await contract.getAllCourseIds();
          if (courseIds && courseIds.length > 0) {
            const courseNamesArray = await contract.getCourseNamesBatch(courseIds);
            
            const allCourses = courseIds.map((id, index) => ({
              id: id.toString(),
              name: courseNamesArray[index] || ''
            })).filter(course => course.name && course.name.trim());
            
            allCourses.sort((a, b) => Number(a.id) - Number(b.id));
            setCourses(allCourses);
            
            // Update cache
            localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify({
              data: allCourses,
              timestamp: Date.now()
            }));
            
            return allCourses;
          }
        }
      } catch (directMethodError) {
        console.warn('Error using direct course fetching method:', directMethodError);
      }
      
      // Approach 2: Use a more targeted approach to finding existing course IDs
      console.log('Falling back to course ID discovery...');
      const uniqueCourseIds = new Set();
      
      // Step 1: Try to get course IDs from recent certificates (just 10 most recent ones)
      try {
        const totalSupply = await contract.totalSupply();
        if (totalSupply > 0) {
          // Get 10 most recent certificates (or all if less than 10)
          const maxToCheck = Math.min(Number(totalSupply), 10);
          const startIdx = Math.max(0, Number(totalSupply) - maxToCheck);
          
          // Use multicall or parallel requests for better performance
          const certificatePromises = [];
          for (let i = 0; i < maxToCheck; i++) {
            certificatePromises.push(
              contract.tokenByIndex(startIdx + i)
                .then(tokenId => contract.getCertificate(tokenId))
                .then(cert => cert[2].toString())
                .catch(() => null)
            );
          }
          
          const courseIdsFromCerts = await Promise.all(certificatePromises);
          courseIdsFromCerts.forEach(id => {
            if (id) uniqueCourseIds.add(id);
          });
        }
      } catch (certError) {
        console.warn('Error getting course IDs from certificates:', certError);
      }
      
      // Step 2: Check predefined ranges for course IDs (1-50) in parallel
      // Courses are typically created with sequential IDs, so we check a reasonable range
      const courseCheckPromises = [];
      const MAX_ID_TO_CHECK = 50; // Limit to a reasonable number
      
      for (let i = 1; i <= MAX_ID_TO_CHECK; i++) {
        courseCheckPromises.push(
          contract.getCourseName(i.toString())
            .then(name => name && name.trim() ? i.toString() : null)
            .catch(() => null)
        );
      }
      
      const potentialCourseIds = await Promise.all(courseCheckPromises);
      potentialCourseIds.forEach(id => {
        if (id) uniqueCourseIds.add(id);
      });
      
      // Step 3: If we found IDs, batch request their names
      const courseIdsArray = Array.from(uniqueCourseIds);
      
      if (courseIdsArray.length === 0) {
        console.log('No courses found');
        setCourses([]);
        setLoading(false);
        
        // Cache empty result too (short expiry)
        localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify({
          data: [],
          timestamp: Date.now()
        }));
        
        return [];
      }
      
      console.log(`Found ${courseIdsArray.length} potential course IDs, fetching names...`);
      const courseNamesArray = await contract.getCourseNamesBatch(courseIdsArray);
      
      // Map the results and filter out any with empty names
      const allCourses = courseIdsArray.map((id, index) => ({
        id: id.toString(),
        name: courseNamesArray[index] || ''
      })).filter(course => course.name && course.name.trim());
      
      // Sort by ID
      allCourses.sort((a, b) => Number(a.id) - Number(b.id));
      
      console.log(`Successfully loaded ${allCourses.length} courses`);
      
      // Update state and cache
      setCourses(allCourses);
      localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify({
        data: allCourses,
        timestamp: Date.now()
      }));
      
      return allCourses;
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to fetch courses: ' + (err.reason || err.message));
      return [];
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  // Get certificate counts for courses
  const fetchCourseCertificateCounts = useCallback(async (courseIds) => {
    if (!courseIds || courseIds.length === 0) return {};
    
    console.log(`Attempting to fetch certificate counts for ${courseIds.length} courses...`);
    setLoading(true);
    
    try {
      const contract = await getContract();
      
      console.log(`Fetching certificate counts for ${courseIds.length} courses...`);
      
      // Simple approach - just get counts one by one
      const countsMap = {};
      
      for (const id of courseIds) {
        try {
          console.log(`Fetching count for course ${id}...`);
          const count = await contract.countCertificatesByCourse(id);
          const numCount = Number(count);
          countsMap[id.toString()] = numCount;
          console.log(`Course ${id} has ${numCount} certificates`);
        } catch (err) {
          console.error(`Error fetching count for course ${id}:`, err);
          countsMap[id.toString()] = 0;
        }
      }
      
      console.log(`Fetched counts for ${Object.keys(countsMap).length} courses:`, countsMap);
      
      // Update courses with count information
      setCourses(prevCourses => {
        const updatedCourses = prevCourses.map(course => ({
          ...course,
          certificateCount: countsMap[course.id] !== undefined ? 
                          countsMap[course.id] : 
                          course.certificateCount || 0
        }));
        
        console.log('Updated courses with counts:', updatedCourses);
        
        // Also update the cache with count info so it persists across page reloads
        localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify({
          data: updatedCourses,
          timestamp: Date.now()
        }));
        
        return updatedCourses;
      });
      
      setLoading(false);
      return countsMap;
    } catch (err) {
      console.error('Error fetching certificate counts:', err);
      setLoading(false);
      return {};
    }
  }, [getContract, setCourses]);

  // Add a single course
  const addCourse = useCallback(async (courseName) => {
    if (!courseName || !courseName.trim()) {
      setError('Course name cannot be empty');
      return null;
    }
    
    try {
      setError('');
      setSuccess('');
      
      const contract = await getContract(true);
      
      // Find highest course ID
      let highestCourseId = 0;
      if (courses.length > 0) {
        highestCourseId = Math.max(...courses.map(c => Number(c.id)));
      }
      
      // Use next available ID
      const newCourseId = (highestCourseId + 1).toString();
      
      console.log(`Adding new course with ID ${newCourseId}: ${courseName}`);
      
      // Set course name
      const tx = await contract.setCourseName(newCourseId, courseName.trim());
      
      // Show optimistic UI update before confirmation
      const optimisticNewCourse = {
        id: newCourseId,
        name: courseName.trim(),
        certificateCount: 0,
        _isOptimistic: true  // Flag to identify this is not confirmed yet
      };
      
      setCourses(prevCourses => {
        const newCourses = [
          ...prevCourses,
          optimisticNewCourse
        ].sort((a, b) => Number(a.id) - Number(b.id));
        return newCourses;
      });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Course added successfully:', receipt);
      
      // Update with confirmed course
      const confirmedCourse = {
        id: newCourseId,
        name: courseName.trim(),
        certificateCount: 0
      };
      
      // Update cached data
      setCourses(prevCourses => {
        const filteredCourses = prevCourses.filter(c => 
          !(c.id === newCourseId && c._isOptimistic)
        );
        
        const updatedCourses = [
          ...filteredCourses,
          confirmedCourse
        ].sort((a, b) => Number(a.id) - Number(b.id));
        
        // Update cache
        localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify({
          data: updatedCourses,
          timestamp: Date.now()
        }));
        
        return updatedCourses;
      });
      
      setSuccess('Course added successfully');
      return confirmedCourse;
    } catch (err) {
      console.error('Error adding course:', err);
      
      // Remove optimistic update if failed
      setCourses(prevCourses => 
        prevCourses.filter(c => !c._isOptimistic)
      );
      
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setError('Transaction was cancelled by user');
      } else {
        setError('Failed to add course: ' + (err.reason || err.message));
      }
      
      return null;
    }
  }, [courses, getContract]);

  // Add multiple courses at once
  const addMultipleCourses = useCallback(async (courseNames) => {
    if (!courseNames || !courseNames.length) {
      setError('No course names provided');
      return [];
    }
    
    try {
      setError('');
      setSuccess('');
      setBulkActionLoading(true);
      
      // Filter out empty names
      const validNames = courseNames
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      if (validNames.length === 0) {
        setError('All course names were empty');
        return [];
      }
      
      const contract = await getContract(true);
      
      // Find highest course ID
      let highestCourseId = 0;
      if (courses.length > 0) {
        highestCourseId = Math.max(...courses.map(c => Number(c.id)));
      }
      
      // Generate course IDs
      const newCourseIds = [];
      for (let i = 0; i < validNames.length; i++) {
        newCourseIds.push((highestCourseId + i + 1).toString());
      }
      
      console.log(`Adding ${validNames.length} courses with IDs starting at ${newCourseIds[0]}`);
      
      // Create optimistic update objects
      const optimisticCourses = newCourseIds.map((id, index) => ({
        id,
        name: validNames[index],
        certificateCount: 0,
        _isOptimistic: true
      }));
      
      // Apply optimistic update
      setCourses(prevCourses => {
        const newCourses = [
          ...prevCourses,
          ...optimisticCourses
        ].sort((a, b) => Number(a.id) - Number(b.id));
        return newCourses;
      });
      
      // Call contract to set multiple course names
      const tx = await contract.setMultipleCourseNames(newCourseIds, validNames);
      const receipt = await tx.wait();
      
      console.log(`Successfully added ${validNames.length} courses:`, receipt);
      
      // Create confirmed courses
      const confirmedCourses = newCourseIds.map((id, index) => ({
        id,
        name: validNames[index],
        certificateCount: 0
      }));
      
      // Update courses state with confirmed data
      setCourses(prevCourses => {
        const filteredCourses = prevCourses.filter(c => !c._isOptimistic);
        
        const updatedCourses = [
          ...filteredCourses,
          ...confirmedCourses
        ].sort((a, b) => Number(a.id) - Number(b.id));
        
        // Update cache
        localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify({
          data: updatedCourses,
          timestamp: Date.now()
        }));
        
        return updatedCourses;
      });
      
      setSuccess(`Added ${validNames.length} courses successfully`);
      return confirmedCourses;
    } catch (err) {
      console.error('Error adding multiple courses:', err);
      
      // Remove optimistic updates
      setCourses(prevCourses => 
        prevCourses.filter(c => !c._isOptimistic)
      );
      
      setError('Failed to add courses: ' + (err.reason || err.message));
      return [];
    } finally {
      setBulkActionLoading(false);
    }
  }, [courses, getContract]);

  // Get certificates for a specific course
  const getCertificatesByCourse = useCallback(async (courseId, startIndex = 0, limit = 50) => {
    if (!courseId) {
      return { certificates: [], total: 0 };
    }
    
    try {
      setCertificatesLoading(true);
      console.log(`Fetching certificates for course ID ${courseId}...`);
      
      const contract = await getContract();
      
      // Ensure courseId is a string for consistent handling
      const courseIdStr = courseId.toString();
      
      // Check if we have cached certificates for this course
      const courseKey = `course_${courseIdStr}_certificates`;
      const cachedData = localStorage.getItem(courseKey);
      if (cachedData) {
        try {
          const { data, timestamp, total } = JSON.parse(cachedData);
          const isExpired = Date.now() - timestamp > CACHE_EXPIRY;
          
          if (!isExpired && Array.isArray(data)) {
            console.log(`Using cached certificates for course ${courseIdStr}`);
            setCourseCertificates(prev => ({
              ...prev,
              [courseIdStr]: data
            }));
            
            setCertificatesLoading(false);
            return { certificates: data, total };
          }
        } catch (e) {
          console.error('Error parsing cached certificate data:', e);
        }
      }
      
      // Get total count first
      const totalCount = await contract.countCertificatesByCourse(courseIdStr);
      console.log(`Course ${courseIdStr} has ${totalCount} certificates`);
      
      if (Number(totalCount) === 0) {
        setCourseCertificates(prev => ({
          ...prev,
          [courseIdStr]: []
        }));
        
        localStorage.setItem(courseKey, JSON.stringify({
          data: [],
          total: 0,
          timestamp: Date.now()
        }));
        
        setCertificatesLoading(false);
        return { certificates: [], total: 0 };
      }
      
      // Convert parameters to numbers first, then to literals
      // This is crucial for ethers.js compatibility
      const startIndexValue = Number(startIndex || 0);
      const limitValue = Number(limit || 50);
      
      // For ethers.js v6, we use direct literals instead of BigInt
      console.log(`Fetching certificate IDs for course ${courseIdStr} (${startIndexValue}-${startIndexValue+limitValue})`);
      
      // The key fix: Use a completely fresh array of arguments
      const certificateIds = await contract.getCertificatesByCourse(
        courseIdStr,            // Course ID as string
        startIndexValue,        // Start index as number
        limitValue              // Limit as number
      );
      
      if (!certificateIds || certificateIds.length === 0) {
        setCertificatesLoading(false);
        return { certificates: [], total: Number(totalCount) };
      }
      
      console.log(`Found ${certificateIds.length} certificates for course ${courseIdStr}`);
      
      // Get certificates batch - more efficient than individual calls
      const [
        students, 
        institutions, 
        courseIds, 
        completionDates, 
        grades, 
        verificationStatuses, 
        revocationStatuses
      ] = await contract.getCertificatesBatch(certificateIds);
      
      // Get additional details
      const [revocationReasons, versions, lastUpdateDates, updateReasons] = 
        await contract.getCertificatesBatchDetails(certificateIds);
      
      // Map the results to certificate objects
      const certificates = certificateIds.map((id, i) => ({
        id: id.toString(),
        student: students[i],
        institution: institutions[i],
        courseId: courseIds[i].toString(),
        completionDate: new Date(Number(completionDates[i]) * 1000),
        grade: Number(grades[i]),
        isVerified: verificationStatuses[i],
        isRevoked: revocationStatuses[i],
        revocationReason: revocationReasons[i],
        version: versions[i].toString(),
        lastUpdateDate: new Date(Number(lastUpdateDates[i]) * 1000),
        updateReason: updateReasons[i]
      }));
      
      console.log(`Processed ${certificates.length} certificates for course ${courseIdStr}`);
      
      // Update state cache
      setCourseCertificates(prev => ({
        ...prev,
        [courseIdStr]: certificates
      }));
      
      // Cache the results
      localStorage.setItem(courseKey, JSON.stringify({
        data: certificates,
        total: Number(totalCount),
        timestamp: Date.now()
      }));
      
      return { 
        certificates, 
        total: Number(totalCount)
      };
    } catch (err) {
      console.error(`Error fetching certificates for course ${courseId}:`, err);
      setError(`Error fetching certificates: ${err.message}`);
      return { certificates: [], total: 0 };
    } finally {
      setCertificatesLoading(false);
    }
  }, [getContract, setError]);

  // Initialize data on mount
  useEffect(() => {
    console.log('Initial course data load');
    fetchCourses().then(loadedCourses => {
      // Fetch certificate counts for courses after they load
      if (loadedCourses && loadedCourses.length > 0) {
        console.log('Fetching initial certificate counts');
        // Wait a brief moment to let React render the courses
        setTimeout(() => {
          fetchCourseCertificateCounts(loadedCourses.map(c => c.id));
        }, 500);
      }
    });
  }, [fetchCourses, fetchCourseCertificateCounts]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return {
    // State
    courses,
    loading,
    error,
    success,
    certificatesLoading,
    courseCertificates,
    bulkActionLoading,
    
    // Actions
    fetchCourses,
    fetchCourseCertificateCounts,
    addCourse,
    addMultipleCourses,
    getCertificatesByCourse,
    
    // Setters for error/success messages
    setError,
    setSuccess
  };
}; 