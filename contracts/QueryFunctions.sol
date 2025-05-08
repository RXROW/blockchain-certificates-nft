// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BatchOperations.sol";

// Contract for certificate queries and filtering
contract QueryFunctions is BatchOperations {
    /**
     * @dev Internal helper to check if a certificate matches status criteria
     */
    function _matchesStatus(uint256 tokenId, bool verified, bool revoked) internal view returns (bool) {
        // Cache in memory to avoid multiple SLOADs
        AcademicCertificate memory cert = academicCertificates[tokenId];
        return cert.isVerified == verified && cert.isRevoked == revoked;
    }
    
    /**
     * @dev Internal helper to check if a certificate belongs to an institution
     */
    function _belongsToInstitution(uint256 tokenId, address institution) internal view returns (bool) {
        return academicCertificates[tokenId].institutionAddress == institution;
    }
    
    /**
     * @dev Internal helper for paginated status-based filtering
     */
    function _getStatusFilteredCertificates(bool verified, bool revoked, uint256 startIndex, uint256 limit) 
        internal view returns (uint256[] memory) 
    {
        uint256 total = totalSupply();
        if (startIndex >= total || limit == 0) return new uint256[](0);
        
        // First count matching items up to our limit to allocate properly sized array
        uint256 matchCount = 0;
        uint256 skip = 0;
        
        for (uint256 i = 0; i < total && matchCount < limit;) {
            uint256 tokenId = tokenByIndex(i);
            
            if (_matchesStatus(tokenId, verified, revoked)) {
                if (skip < startIndex) {
                    unchecked { ++skip; }
                } else {
                    unchecked { ++matchCount; }
                }
            }
            unchecked { ++i; }
        }
        
        // Now fill the array with the right certificates
        uint256[] memory result = new uint256[](matchCount);
        uint256 resultIndex = 0;
        skip = 0;
        
        for (uint256 i = 0; i < total && resultIndex < matchCount;) {
            uint256 tokenId = tokenByIndex(i);
            
            if (_matchesStatus(tokenId, verified, revoked)) {
                if (skip < startIndex) {
                    unchecked { ++skip; }
                } else {
                    result[resultIndex] = tokenId;
                    unchecked { ++resultIndex; }
                }
            }
            unchecked { ++i; }
        }
        
        return result;
    }
    
    /**
     * @dev Internal helper for paginated institution-based filtering
     */
    function _getInstitutionFilteredCertificates(address institution, uint256 startIndex, uint256 limit) 
        internal view returns (uint256[] memory) 
    {
        uint256 total = totalSupply();
        if (startIndex >= total || limit == 0) return new uint256[](0);
        
        // First count matching items up to our limit to allocate properly sized array
        uint256 matchCount = 0;
        uint256 skip = 0;
        
        for (uint256 i = 0; i < total && matchCount < limit;) {
            uint256 tokenId = tokenByIndex(i);
            
            if (_belongsToInstitution(tokenId, institution)) {
                if (skip < startIndex) {
                    unchecked { ++skip; }
                } else {
                    unchecked { ++matchCount; }
                }
            }
            unchecked { ++i; }
        }
        
        // Now fill the array with the right certificates
        uint256[] memory result = new uint256[](matchCount);
        uint256 resultIndex = 0;
        skip = 0;
        
        for (uint256 i = 0; i < total && resultIndex < matchCount;) {
            uint256 tokenId = tokenByIndex(i);
            
            if (_belongsToInstitution(tokenId, institution)) {
                if (skip < startIndex) {
                    unchecked { ++skip; }
                } else {
                    result[resultIndex] = tokenId;
                    unchecked { ++resultIndex; }
                }
            }
            unchecked { ++i; }
        }
        
        return result;
    }
    
    /**
     * @dev Internal helper to count certificates by status
     */
    function _countByStatus(bool verified, bool revoked) internal view returns (uint256) {
        uint256 total = totalSupply(); // Cache the total supply
        uint256 count = 0;
        
        for (uint256 i = 0; i < total;) {
            uint256 tokenId = tokenByIndex(i);
            if (_matchesStatus(tokenId, verified, revoked)) {
                unchecked { ++count; }
            }
            unchecked { ++i; }
        }
        
        return count;
    }
    
    /**
     * @dev Internal helper to count certificates by institution
     */
    function _countByInstitution(address institution) internal view returns (uint256) {
        uint256 total = totalSupply(); // Cache the total supply
        uint256 count = 0;
        
        for (uint256 i = 0; i < total;) {
            uint256 tokenId = tokenByIndex(i);
            if (_belongsToInstitution(tokenId, institution)) {
                unchecked { ++count; }
            }
            unchecked { ++i; }
        }
        
        return count;
    }
    
    // View Functions
    function getCertificate(uint256 tokenId) public view returns (
        address student,
        address institution,
        uint256 courseId,
        uint256 completionDate,
        uint256 grade,
        bool isVerified,
        bool isRevoked,
        string memory revocationReason,
        uint256 version,
        uint256 lastUpdateDate,
        string memory updateReason
    ) {
        _validateCertificateExists(tokenId);
        
        // Cache the certificate in memory to avoid multiple SLOADs
        AcademicCertificate memory cert = academicCertificates[tokenId];
        return (
            cert.studentAddress,
            cert.institutionAddress,
            cert.courseId,
            cert.completionDate,
            cert.grade,
            cert.isVerified,
            cert.isRevoked,
            cert.revocationReason,
            cert.version,
            cert.lastUpdateDate,
            cert.updateReason
        );
    }

    // Get certificates by verification status with pagination
    function getPendingCertificateIds(uint256 startIndex, uint256 limit) external view returns (uint256[] memory) {
        return getCertificateIdsByStatus(false, false, startIndex, limit);
    }

    function getVerifiedCertificateIds(uint256 startIndex, uint256 limit) external view returns (uint256[] memory) {
        return getCertificateIdsByStatus(true, false, startIndex, limit);
    }

    function getRevokedCertificateIds(uint256 startIndex, uint256 limit) external view returns (uint256[] memory) {
        return getCertificateIdsByStatus(false, true, startIndex, limit);
    }

    // Internal helper function for status-based filtering
    function getCertificateIdsByStatus(bool verified, bool revoked, uint256 startIndex, uint256 limit) internal view returns (uint256[] memory) {
        return _getStatusFilteredCertificates(verified, revoked, startIndex, limit);
    }

    // Count functions for pagination metadata
    function countCertificatesByStatus(bool verified, bool revoked) external view returns (uint256) {
        return _countByStatus(verified, revoked);
    }

    // Get certificates by institution with pagination
    function getCertificatesByInstitution(address institution, uint256 startIndex, uint256 limit) external view returns (uint256[] memory) {
        return _getInstitutionFilteredCertificates(institution, startIndex, limit);
    }

    // Count certificates by institution
    function countCertificatesByInstitution(address institution) external view returns (uint256) {
        return _countByInstitution(institution);
    }
} 