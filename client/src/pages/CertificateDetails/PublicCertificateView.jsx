import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { FaExternalLinkAlt, FaCheckCircle, FaTimesCircle, FaClock, FaImage } from 'react-icons/fa';
import FuturisticSpinner from '../../components/ui/FuturisticSpinner';
import contractAddress from '../../config/contractAddress.json';
import contractABI from '../../config/abi.json';
import { formatGrade } from '../../components/sperates/cert_utilits';
import { 
  CERTIFICATES_CACHE_KEY, 
  fetchMetadataFromIPFS,
  getCachedData, 
  setCachedData,
  placeholderImage
} from '../../components/sperates/f1.js';
import PINATA_CONFIG from '../../config/pinata';

// Define fallback RPC URLs for Sepolia network
const RPC_URLS = [
  'https://ethereum-sepolia.publicnode.com',
  'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  'https://eth-sepolia.g.alchemy.com/v2/demo'
];

// Create a prioritized list of IPFS gateways
const IPFS_GATEWAYS = [
  `https://${PINATA_CONFIG.gateway}/ipfs/`,
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/'
];

// Debug function to fetch raw metadata for a certificate
async function debugFetchCertificateMetadata(certificateId) {
  // Only run in development environment 
  if (process.env.NODE_ENV !== 'development') return;
  
  try {
    console.log(`DEBUG: Fetching raw metadata for certificate #${certificateId}...`);
    
    // Try each RPC URL
    let provider = null;
    for (const rpcUrl of RPC_URLS) {
      try {
        const tempProvider = new ethers.JsonRpcProvider(rpcUrl);
        await tempProvider.getNetwork();
        provider = tempProvider;
        console.log(`DEBUG: Connected to ${rpcUrl}`);
        break;
      } catch (err) {
        console.warn(`DEBUG: Failed to connect to ${rpcUrl}`);
      }
    }
    
    if (!provider) {
      console.error("DEBUG: Failed to connect to any RPC endpoint");
      return;
    }
    
    // Create contract instance
    const contract = new ethers.Contract(
      contractAddress.SoulboundCertificateNFT,
      contractABI.SoulboundCertificateNFT,
      provider
    );
    
    // Try to get tokenURI
    try {
      const tokenURI = await contract.tokenURI(certificateId);
      console.log(`DEBUG: Token URI for #${certificateId}:`, tokenURI);
      
      if (tokenURI) {
        // Extract CID if it's an IPFS URI
        const metadataCID = tokenURI.startsWith('ipfs://') ? 
          tokenURI.replace('ipfs://ipfs/', '').replace('ipfs://', '') : tokenURI;
        
        console.log(`DEBUG: Metadata CID:`, metadataCID);
        
        // Try to fetch the metadata from IPFS gateways
        for (const gateway of IPFS_GATEWAYS) {
          try {
            const ipfsUrl = `${gateway}${metadataCID}`;
            console.log(`DEBUG: Trying to fetch metadata from ${ipfsUrl}`);
            const response = await fetch(ipfsUrl);
            if (response.ok) {
              const metadata = await response.json();
              console.log(`DEBUG: Successfully fetched metadata:`, metadata);
              
              // If there's an image field, try to resolve it
              if (metadata.image) {
                const imageCID = metadata.image.startsWith('ipfs://') ? 
                  metadata.image.replace('ipfs://ipfs/', '').replace('ipfs://', '') : 
                  metadata.image;
                
                console.log(`DEBUG: Image CID found:`, imageCID);
                console.log(`DEBUG: Full image URL would be:`, `${IPFS_GATEWAYS[0]}${imageCID}`);
              } else {
                console.warn(`DEBUG: No image field in metadata`);
              }
              
              return;
            }
          } catch (err) {
            console.warn(`DEBUG: Failed to fetch metadata from ${gateway}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.error(`DEBUG: Error getting tokenURI:`, err.message);
    }
    
    // Fallback - try to get certificate data directly
    try {
      const certData = await contract.getCertificate(certificateId);
      console.log(`DEBUG: Raw certificate data:`, certData);
    } catch (err) {
      console.error(`DEBUG: Error getting certificate data:`, err.message);
    }
  } catch (err) {
    console.error("DEBUG ERROR:", err);
  }
}

const PublicCertificateView = () => {
  const { id } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [verified, setVerified] = useState(null);
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const [gatewayAttempts, setGatewayAttempts] = useState({});
  const [showImageInput, setShowImageInput] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const canvasRef = useRef(null);
  const [useDebug, setUseDebug] = useState(false); // Control debug mode

  // Generate a certificate template image for certificates with no image
  const generateCertificateTemplate = () => {
    if (!certificate || !canvasRef.current) return;
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 1200;
      canvas.height = 800;
      
      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1a1f2e');
      gradient.addColorStop(1, '#0f1319');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Border
      ctx.strokeStyle = '#4c1d95';
      ctx.lineWidth = 10;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
      
      // Add border decoration
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
      
      // Title
      ctx.font = 'bold 80px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('CERTIFICATE', canvas.width / 2, 150);
      
      // Tagline
      ctx.font = 'italic 40px Arial';
      ctx.fillStyle = '#8b5cf6';
      ctx.fillText('Blockchain Verified', canvas.width / 2, 210);
      
      // Course name
      ctx.font = 'bold 60px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(certificate.courseName || `Course ${certificate.courseId}`, canvas.width / 2, 320);
      
      // Certificate ID
      ctx.font = '30px Arial';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`Certificate #${certificate.id}`, canvas.width / 2, 380);
      
      // Recipient
      ctx.font = '36px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Awarded to`, canvas.width / 2, 460);
      
      // Recipient address (truncated)
      const address = certificate.student;
      const truncatedAddress = address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'Unknown';
      ctx.font = 'bold 44px Arial';
      ctx.fillStyle = '#8b5cf6';
      ctx.fillText(truncatedAddress, canvas.width / 2, 520);
      
      // Grade
      if (certificate.grade) {
        ctx.font = '36px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Grade: ${formatGrade(certificate.grade)} (${certificate.grade}%)`, canvas.width / 2, 590);
      }
      
      // Completion date
      if (certificate.completionDate) {
        ctx.font = '30px Arial';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Completion Date: ${certificate.completionDate}`, canvas.width / 2, 650);
      }
      
      // Verification status
      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = certificate.isVerified ? '#22c55e' : certificate.isRevoked ? '#ef4444' : '#f59e0b';
      ctx.fillText(
        certificate.isRevoked ? 'REVOKED' : certificate.isVerified ? 'VERIFIED' : 'PENDING', 
        canvas.width / 2, 
        720
      );
      
      // Blockchain icon
      ctx.font = '20px Arial';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`On Sepolia • Token ID: ${certificate.id}`, canvas.width / 2, 760);
      
      // Use the canvas as an image source
      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);
      setImageLoading(false);
      
      // Cache this image for future use
      const updatedCert = {
        ...certificate,
        generatedImageUrl: dataUrl
      };
      setCertificate(updatedCert);
      setCachedData(`${CERTIFICATES_CACHE_KEY}_${certificate.id}`, updatedCert);
      
    } catch (err) {
      console.error('Failed to generate certificate template:', err);
    }
  };

  useEffect(() => {
    // Generate a certificate template if we have certificate data but no image
    if (certificate && !imageUrl && !imageLoading && canvasRef.current) {
      // Check if we have a previously generated image
      if (certificate.generatedImageUrl) {
        setImageUrl(certificate.generatedImageUrl);
      } else {
        generateCertificateTemplate();
      }
    }
  }, [certificate, imageUrl, imageLoading]);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        console.log(`Fetching certificate #${id}...`);
        
        // Check if we have a valid certificate ID
        const certificateId = parseInt(id);
        if (isNaN(certificateId)) {
          throw new Error('Invalid certificate ID');
        }
        
        // Try to get from cache first
        const cachedCert = getCachedData(`${CERTIFICATES_CACHE_KEY}_${certificateId}`);
        if (cachedCert) {
          console.log(`Using cached certificate data for token ${certificateId}`);
          
          // Only log certificate data in development mode and when debugging is enabled
          if (process.env.NODE_ENV === 'development' && useDebug) {
            console.log("Certificate data:", {
              hasImageUrl: !!cachedCert.imageUrl,
              hasImageCID: !!cachedCert.imageCID,
              imageUrl: cachedCert.imageUrl,
              imageCID: cachedCert.imageCID,
              tokenURI: cachedCert.tokenURI,
              metadata: cachedCert.metadata
            });
          }
          
          // Update state with cached data
          setCertificate(cachedCert);
          setVerified(cachedCert.isVerified && !cachedCert.isRevoked);
          
          // Load image if available
          if (cachedCert.imageUrl) {
            if (process.env.NODE_ENV === 'development' && useDebug) {
              console.log(`Using cached image URL: ${cachedCert.imageUrl}`);
            }
            setImageUrl(cachedCert.imageUrl);
            // Don't set imageLoading for cached images that have been loaded before
            if (cachedCert.imageLoadedBefore) {
              setImageLoading(false);
            } else {
              setImageLoading(true);
            }
          } else if (cachedCert.imageCID) {
            if (process.env.NODE_ENV === 'development' && useDebug) {
              console.log(`Using image CID: ${cachedCert.imageCID}`);
            }
            setImageLoading(true);
            setImageUrl(`${IPFS_GATEWAYS[0]}${cachedCert.imageCID}`);
            setGatewayIndex(0);
          } else if (cachedCert.generatedImageUrl) {
            // Use previously generated image
            setImageUrl(cachedCert.generatedImageUrl);
            setImageLoading(false);
          } else {
            if (process.env.NODE_ENV === 'development' && useDebug) {
              console.warn("Certificate has no image CID or URL");
            }
          }
          
          setLoading(false);
          return;
        }
        
        // If not in cache, run debug fetch in development mode
        if (process.env.NODE_ENV === 'development' && useDebug) {
          await debugFetchCertificateMetadata(certificateId);
        }
        
        // Create provider
        let provider = null;
        let lastError = null;
        
        // Try each RPC URL
        for (const rpcUrl of RPC_URLS) {
          try {
            console.log(`Connecting to ${rpcUrl}...`);
            const tempProvider = new ethers.JsonRpcProvider(rpcUrl);
            const network = await tempProvider.getNetwork();
            provider = tempProvider;
            console.log(`Connected to ${network.name}`);
            break;
          } catch (err) {
            console.warn(`Failed to connect to ${rpcUrl}:`, err);
            lastError = err;
          }
        }
        
        if (!provider) {
          throw new Error(`Could not connect to any Ethereum node: ${lastError?.message || 'Unknown error'}`);
        }
        
        // Create contract instance
        const contract = new ethers.Contract(
          contractAddress.SoulboundCertificateNFT,
          contractABI.SoulboundCertificateNFT,
          provider
        );
        
        // Check if token exists by trying to get its owner
        // This is a safer approach than using exists() which may not exist in your contract
        let student = null;
        try {
          student = await contract.ownerOf(certificateId);
        } catch (err) {
          console.error("Token doesn't exist:", err);
          throw new Error('Certificate not found or does not exist');
        }
        
        console.log(`Certificate #${certificateId} exists, student: ${student}`);
        
        // Get certificate data
        const cert = await contract.getCertificate(certificateId).catch(err => {
          console.error("Error getting certificate:", err);
          return null;
        });
        
        if (!cert || !Array.isArray(cert) || cert.length < 5) {
          console.error("Invalid certificate data:", cert);
          // Try alternate methods to get minimal info if getCertificate fails
          
          // We know the owner from ownerOf call above
          // Let's try to get other data through alternative methods
          
          // Get minimal data and continue rather than throwing
          let tokenURI = null;
          
          try {
            tokenURI = await contract.tokenURI(certificateId);
          } catch (err) {
            console.error("Failed to get tokenURI:", err);
          }
          
          // Create minimal certificate with what we have
          const minimalCertData = {
            id: certificateId,
            student: student,
            institution: "Unknown Institution",
            courseName: `Certificate #${certificateId}`,
            courseId: 0,
            grade: 0,
            completionDate: "",
            isVerified: false,
            isRevoked: false,
            tokenURI,
            status: 'pending',
          };
          
          // Try to get metadata if we have tokenURI
          if (tokenURI) {
            const metadataCID = tokenURI.startsWith('ipfs://') ? 
              tokenURI.replace('ipfs://ipfs/', '').replace('ipfs://', '') : tokenURI;
            
            try {
              const metadata = await fetchMetadataFromIPFS(metadataCID);
              if (metadata) {
                // Update with metadata info
                minimalCertData.metadata = metadata;
                minimalCertData.courseName = metadata.name || `Certificate #${certificateId}`;
                
                if (metadata.attributes) {
                  const courseAttr = metadata.attributes.find(a => a.trait_type === 'Course Name');
                  if (courseAttr) minimalCertData.courseName = courseAttr.value;
                  
                  const gradeAttr = metadata.attributes.find(a => a.trait_type === 'Grade');
                  if (gradeAttr) minimalCertData.grade = Number(gradeAttr.value);
                  
                  const dateAttr = metadata.attributes.find(a => a.trait_type === 'Completion Date');
                  if (dateAttr) minimalCertData.completionDate = dateAttr.value;
                }
                
                // Handle image
                if (metadata.image) {
                  const imageCID = metadata.image.startsWith('ipfs://') ? 
                    metadata.image.replace('ipfs://ipfs/', '').replace('ipfs://', '') : 
                    metadata.image;
                  
                  minimalCertData.imageCID = imageCID;
                  setImageUrl(`${IPFS_GATEWAYS[0]}${imageCID}`);
                  setImageLoading(true);
                  setGatewayIndex(0);
                }
              }
            } catch (err) {
              console.error("Failed to fetch metadata:", err);
            }
          }
          
          // Set the minimal certificate and return early
          setCertificate(minimalCertData);
          setVerified(false);
          setCachedData(`${CERTIFICATES_CACHE_KEY}_${certificateId}`, minimalCertData);
          return;
        }
        
        console.log("Raw certificate data:", cert);
        
        // According to ABI, getCertificate returns this structure:
        // student (0), institution (1), courseId (2), completionDate (3), grade (4),
        // isVerified (5), isRevoked (6), revocationReason (7), version (8),
        // lastUpdateDate (9), updateReason (10)
        console.log("Certificate structure details:", {
          courseId: cert[2]?.toString(),
          student: cert[0],
          institution: cert[1],
          completionDate: cert[3]?.toString(),
          grade: cert[4]?.toString(), 
          isVerified: cert[5],
          isRevoked: cert[6],
          revocationReason: cert[7]
        });
        
        // Extract values with safer approach
        const studentAddr = cert[0];
        const institutionAddr = cert[1];
        const courseId = cert[2] ? Number(cert[2]) : 0;
        const completionDate = cert[3] ? Number(cert[3]) : 0;
        const grade = cert[4] ? Number(cert[4]) : 0;
        
        // Get token URI for metadata
        const tokenURI = await contract.tokenURI(certificateId).catch(err => {
          console.error("Error getting tokenURI:", err);
          return null;
        });
        
        // Get verification status directly from the certificate data
        const isVerified = cert[5] || false;
        const isRevoked = cert[6] || false;
        const revocationReason = cert[7] || '';
        const version = cert[8] ? Number(cert[8]) : 0;
        const lastUpdateDate = cert[9] ? Number(cert[9]) : 0;
        const updateReason = cert[10] || '';
        
        // Fetch metadata from IPFS if available
        let metadata = {};
        let metadataCID = null;
        let imageCID = null;
        
        if (tokenURI) {
          console.log("Token URI:", tokenURI);
          metadataCID = tokenURI.startsWith('ipfs://') ? tokenURI.replace('ipfs://ipfs/', '').replace('ipfs://', '') : tokenURI;
          
          try {
            metadata = await fetchMetadataFromIPFS(metadataCID);
            console.log("Retrieved metadata:", metadata);
          } catch (err) {
            console.error("Error fetching metadata:", err);
            metadata = {
              attributes: [],
              name: `Certificate #${certificateId}`,
              description: 'Certificate metadata could not be loaded'
            };
          }
        }
        
        // Extract attributes
        const attributes = metadata.attributes || [];
        
        // Get image CID
        if (metadata.image) {
          imageCID = metadata.image.startsWith('ipfs://') ? 
            metadata.image.replace('ipfs://ipfs/', '').replace('ipfs://', '') : 
            metadata.image;
          
          // Get image URL using our prioritized gateway
          setImageUrl(`${IPFS_GATEWAYS[0]}${imageCID}`);
          setImageLoading(true);
          setGatewayIndex(0);
        }
        
        // Determine status text
        const statusText = isRevoked ? 'revoked' : (isVerified ? 'verified' : 'pending');
        
        // Format the certificate data
        const certData = {
          id: certificateId,
          courseId: courseId,
          courseName: attributes.find(a => a.trait_type === 'Course Name')?.value || 
                      metadata.name || 
                      `Course ${courseId}`,
          student: studentAddr,
          institution: institutionAddr,
          grade: grade,
          completionTimestamp: completionDate,
          completionDate: attributes.find(a => a.trait_type === 'Completion Date')?.value || 
                         (completionDate ? new Date(Number(completionDate) * 1000).toLocaleDateString() : ''),
          isVerified,
          isRevoked,
          // Metadata fields
          tokenURI,
          metadataCID,
          metadata,
          imageCID,
          imageUrl: imageUrl,
          metadataLoaded: !!metadata,
          status: statusText,
          transactionHash: metadata.transactionHash || '',
          // Additional fields from getCertificate
          revocationReason,
          version,
          lastUpdateDate,
          updateReason
        };
        
        // Cache the certificate data
        setCachedData(`${CERTIFICATES_CACHE_KEY}_${certificateId}`, certData);
        
        // Update component state
        setCertificate(certData);
        setVerified(isVerified && !isRevoked);
        
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError(err.message || "Failed to load certificate");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCertificate();
    }
  }, [id, useDebug]);

  // Preload images once they're loaded the first time
  useEffect(() => {
    if (certificate?.imageUrl && !certificate.imageLoadedBefore) {
      // Mark the certificate as having its image loaded
      const updatedCert = {
        ...certificate,
        imageLoadedBefore: true
      };
      setCertificate(updatedCert);
      setCachedData(`${CERTIFICATES_CACHE_KEY}_${certificate.id}`, updatedCert);
    }
  }, [certificate]);

  // Handle image load complete
  const handleImageLoad = () => {
    setImageLoading(false);
    // Quietly log success without error messages
    if (process.env.NODE_ENV === 'development' && useDebug) {
      console.log(`Successfully loaded image from gateway: ${IPFS_GATEWAYS[gatewayIndex]}`);
    }
    
    // Update certificate in cache with working image URL and mark as loaded
    if (certificate) {
      const updatedCert = {
        ...certificate,
        imageUrl: imageUrl,
        imageLoadedBefore: true
      };
      setCertificate(updatedCert);
      setCachedData(`${CERTIFICATES_CACHE_KEY}_${certificate.id}`, updatedCert);
    }
  };

  // Handle image load error - cycle through gateways
  const handleImageError = () => {
    // Track gateway attempt
    setGatewayAttempts(prev => ({
      ...prev,
      [gatewayIndex]: true
    }));
    
    // Add more detailed error logging
    if (process.env.NODE_ENV === 'development' && useDebug) {
      console.log(`Image load failed from gateway ${gatewayIndex}: ${IPFS_GATEWAYS[gatewayIndex]}${certificate?.imageCID}`);
    }
    
    // Try next gateway if available
    if (certificate?.imageCID && gatewayIndex < IPFS_GATEWAYS.length - 1) {
      const nextIndex = gatewayIndex + 1;
      const nextGateway = IPFS_GATEWAYS[nextIndex];
      
      // Only log on first gateway failure to reduce console noise
      if (gatewayIndex === 0 && process.env.NODE_ENV === 'development' && useDebug) {
        console.log(`Failed to load image from primary source. Trying alternative IPFS gateway: ${nextGateway}`);
      }
      
      // Update the state to use next gateway
      setGatewayIndex(nextIndex);
      setImageUrl(`${nextGateway}${certificate.imageCID}`);
    } else {
      // All gateways failed, generate a certificate template
      if (process.env.NODE_ENV === 'development' && useDebug) {
        console.error(`Failed to load image from all IPFS gateways for CID: ${certificate?.imageCID}`);
      }
      setImageLoading(false);
      
      // If there's a canvas ref, generate a template
      if (canvasRef.current) {
        generateCertificateTemplate();
      }
    }
  };

  // Function to set a placeholder or custom image for certificates with missing images
  const setManualImage = (url) => {
    if (!certificate) return;
    
    // Update the certificate object with the image URL
    const updatedCert = {
      ...certificate,
      imageUrl: url || placeholderImage,
      customImage: true
    };
    
    // Update state
    setCertificate(updatedCert);
    setImageUrl(url || placeholderImage);
    setImageLoading(false);
    
    // Save to cache
    setCachedData(`${CERTIFICATES_CACHE_KEY}_${certificate.id}`, updatedCert);
    console.log(`Manual image set for certificate #${certificate.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <FuturisticSpinner size="lg" color="violet" />
          <p className="mt-4 text-gray-300">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-lg max-w-md text-center border border-red-500/50">
          <FaTimesCircle className="text-red-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-400 mb-2">Certificate Not Found</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link to="/" className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors inline-block">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Hidden canvas for certificate generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Header with verification status */}
      <div className={`w-full py-4 ${verified ? 'bg-green-900/80' : verified === false ? 'bg-red-900/80' : 'bg-amber-900/80'} sticky top-0 z-10`}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            Blockchain Certificate System
          </Link>
          
          <div className="flex items-center space-x-2">
            {verified === true && (
              <>
                <FaCheckCircle className="text-green-400" />
                <span className="font-medium">Verified Certificate</span>
              </>
            )}
            {verified === false && (
              <>
                <FaTimesCircle className="text-red-400" />
                <span className="font-medium">
                  {certificate?.isRevoked ? 'Revoked Certificate' : 'Unverified Certificate'}
                </span>
              </>
            )}
            {verified === null && (
              <>
                <FaClock className="text-amber-400" />
                <span className="font-medium">Pending Verification</span>
              </>
            )}
            
            {/* Debug controls - only in development mode */}
            {process.env.NODE_ENV === 'development' && (
              <div className="flex space-x-2 ml-4">
                <button 
                  className={`px-2 py-1 text-xs rounded ${useDebug ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                  onClick={() => setUseDebug(!useDebug)}
                  title="Toggle debug mode"
                >
                  {useDebug ? 'Debug: ON' : 'Debug: OFF'}
                </button>
                <button 
                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  onClick={() => {
                    if (certificate?.id) {
                      localStorage.removeItem(`${CERTIFICATES_CACHE_KEY}_${certificate.id}`);
                      console.log(`Cache cleared for certificate #${certificate.id}`);
                      // Force refresh the page
                      window.location.reload();
                    }
                  }}
                  title="Clear cached data for this certificate"
                >
                  Clear Cache
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-10">
        {/* Certificate title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Certificate #{certificate?.id}</h1>
          <p className="text-xl text-gray-300">{certificate?.courseName}</p>
        </div>
        
        {/* Certificate image and details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Certificate image */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 flex items-center justify-center relative min-h-[500px]">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 backdrop-blur-sm z-10">
                <FuturisticSpinner size="lg" color="violet" />
              </div>
            )}
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={`Certificate for ${certificate?.courseName}`} 
                className="max-w-full max-h-[600px] rounded shadow-lg"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : (
              <div className="text-center text-gray-400 p-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p className="text-lg mb-2">Generating certificate image...</p>
                <p className="text-sm opacity-75">The system is creating a visual representation of your certificate.</p>
              </div>
            )}
          </div>
          
          {/* Certificate details */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-violet-400 mb-6">Certificate Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Certificate ID</p>
                <p className="font-medium">{certificate?.id}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Course Name</p>
                <p className="font-medium">{certificate?.courseName}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Course ID</p>
                <p className="font-medium">{certificate?.courseId}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Completion Date</p>
                <p className="font-medium">{certificate?.completionDate}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Grade</p>
                <p className="font-medium">{formatGrade(certificate?.grade)} ({certificate?.grade}%)</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Status</p>
                <p className={`font-medium ${verified ? 'text-green-400' : certificate?.isRevoked ? 'text-red-400' : 'text-amber-400'}`}>
                  {certificate?.isRevoked ? 'Revoked' : certificate?.isVerified ? 'Verified' : 'Pending'}
                </p>
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-6 mb-6">
              <h3 className="text-xl font-bold text-violet-400 mb-4">Blockchain Information</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Recipient</p>
                  <p className="font-mono text-sm break-all">{certificate?.student}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm mb-1">Issuing Institution</p>
                  <p className="font-mono text-sm break-all">{certificate?.institution}</p>
                </div>
                
                {certificate?.transactionHash && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Transaction Hash</p>
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${certificate?.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm break-all text-blue-400 hover:text-blue-300 flex items-center"
                    >
                      {certificate?.transactionHash}
                      <FaExternalLinkAlt className="ml-2 h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-xl font-bold text-violet-400 mb-4">Verification</h3>
              
              <p className="text-gray-300 mb-4">
                This certificate is stored on the blockchain and its authenticity can be verified. 
                The certificate is {certificate?.isRevoked ? 'revoked' : certificate?.isVerified ? 'verified' : 'pending verification'}.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <a 
                  href={`https://sepolia.etherscan.io/token/${contractAddress.SoulboundCertificateNFT}?a=${certificate?.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  View on Etherscan
                  <FaExternalLinkAlt className="ml-2 h-3 w-3" />
                </a>
                
                <Link 
                  to="/"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicCertificateView; 