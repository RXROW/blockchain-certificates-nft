import PINATA_CONFIG from '../../config/pinata';





const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzJkM2Q0MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2YzcyN2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';

const BATCH_SIZE = 20;
const MAX_CERTIFICATES = 10000;
const DISPLAY_LIMIT = 100;
const PAGE_SIZE = 10;
const CACHE_TTL = 24 * 60 * 60 * 1000;
const CERTIFICATES_CACHE_KEY = 'certificates_cache';
const IMAGE_CACHE_KEY = 'images_cache';
const METADATA_CACHE_KEY = 'metadata_cache';
const IPFS_GATEWAYS = [
  PINATA_CONFIG.gateway,
  'ipfs.io',
  'dweb.link',
  'cloudflare-ipfs.com'
];

const serializeBigInt = (obj) => {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
};

const deserializeBigInt = (str) => {
  return JSON.parse(str, (key, value) => {
    // Check if the value matches a BigInt pattern (numeric string)
    if (typeof value === 'string' && /^\d+$/.test(value) && value.length > 15) {
      return BigInt(value);
    }
    return value;
  });
};

const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = deserializeBigInt(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
};

const setCachedData = (key, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, serializeBigInt(cacheData));
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

const fetchMetadataFromIPFS = async (cid) => {
  try {
    // Check cache first
    const cachedMetadata = getCachedData(`${METADATA_CACHE_KEY}_${cid}`);
    if (cachedMetadata) {
      console.log('Using cached metadata for:', cid);
      return cachedMetadata;
    }

    for (const gateway of IPFS_GATEWAYS) {
      try {
        const ipfsUrl = `https://${gateway}/ipfs/${cid}`;
        const response = await fetch(ipfsUrl, { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const metadata = await response.json();
          const result = { ...metadata, gateway, url: ipfsUrl };
          setCachedData(`${METADATA_CACHE_KEY}_${cid}`, result);
          return result;
        }
      } catch (err) {
        continue;
      }
    }
    throw new Error('Failed to fetch metadata from all gateways');
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
};

const getImageUrlFromMetadata = (metadata, imageCID) => {
  if (!metadata || !imageCID) return null;
  
  // Check image cache
  const cachedImageUrl = getCachedData(`${IMAGE_CACHE_KEY}_${imageCID}`);
  if (cachedImageUrl) {
    console.log('Using cached image URL for CID:', imageCID);
    return cachedImageUrl;
  }
  
  // Get appropriate gateway with fallbacks
  const gateway = metadata.gateway || IPFS_GATEWAYS[0];
  const imageUrl = `https://${gateway}/ipfs/${imageCID}`;
  
  // Cache the URL for future use
  setCachedData(`${IMAGE_CACHE_KEY}_${imageCID}`, imageUrl);
  
  // Pre-load the image in the background
  try {
    const img = new Image();
    img.src = imageUrl;
  } catch (e) {
    console.error('Failed to preload image:', e);
  }
  
  return imageUrl;
};

// Function to normalize an Ethereum address without checksum validation
const normalizeAddress = (address) => {
  if (!address) return '';
  
  // Just clean up the address without checksum validation
  let cleaned = address.trim();
  
  // Check basic format
  if (!cleaned.match(/^0x[0-9a-fA-F]{40}$/)) {
    return null;
  }
  
  // Return the lowercase version which works for comparisons
  return cleaned.toLowerCase();
};

// Utility to remove duplicate certificates based on ID
const deduplicateCertificates = (certificates) => {
  const uniqueCertificates = [];
  const ids = new Set();
  
  for (const cert of certificates) {
    if (cert && cert.id && !ids.has(cert.id)) {
      ids.add(cert.id);
      uniqueCertificates.push(cert);
    }
  }
  
  return uniqueCertificates;
};
export {
    placeholderImage,
    BATCH_SIZE,
    MAX_CERTIFICATES,
    DISPLAY_LIMIT,
    PAGE_SIZE,
    CACHE_TTL,
    CERTIFICATES_CACHE_KEY,
    IMAGE_CACHE_KEY,
    METADATA_CACHE_KEY,
    IPFS_GATEWAYS,
    serializeBigInt,
    deserializeBigInt,
    getCachedData,
    setCachedData,
    fetchMetadataFromIPFS,
    getImageUrlFromMetadata,
    normalizeAddress,
    deduplicateCertificates,
  };