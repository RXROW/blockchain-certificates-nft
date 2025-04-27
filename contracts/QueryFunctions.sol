// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BatchOperations.sol";

// Contract for certificate queries and filtering
contract QueryFunctions is BatchOperations {
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
        require(tokenExists(tokenId), "Certificate does not exist");
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
        uint256 total = totalSupply();
        if (startIndex >= total || limit == 0) return new uint256[](0);
        
        // First count matching items up to our limit to allocate properly sized array
        uint256 matchCount = 0;
        uint256 skip = 0;
        
        for (uint256 i = 0; i < total && matchCount < limit; i++) {
            uint256 tokenId = tokenByIndex(i);
            AcademicCertificate memory cert = academicCertificates[tokenId];
            
            if (cert.isVerified == verified && cert.isRevoked == revoked) {
                if (skip < startIndex) {
                    skip++;
                } else {
                    matchCount++;
                }
            }
        }
        
        // Now fill the array with the right certificates
        uint256[] memory result = new uint256[](matchCount);
        uint256 resultIndex = 0;
        skip = 0;
        
        for (uint256 i = 0; i < total && resultIndex < matchCount; i++) {
            uint256 tokenId = tokenByIndex(i);
            AcademicCertificate memory cert = academicCertificates[tokenId];
            
            if (cert.isVerified == verified && cert.isRevoked == revoked) {
                if (skip < startIndex) {
                    skip++;
                } else {
                    result[resultIndex] = tokenId;
                    resultIndex++;
                }
            }
        }
        
        return result;
    }

    // Count functions for pagination metadata
    function countCertificatesByStatus(bool verified, bool revoked) external view returns (uint256) {
        uint256 total = totalSupply();
        uint256 count = 0;
        
        for (uint256 i = 0; i < total; i++) {
            uint256 tokenId = tokenByIndex(i);
            AcademicCertificate memory cert = academicCertificates[tokenId];
            
            if (cert.isVerified == verified && cert.isRevoked == revoked) {
                count++;
            }
        }
        
        return count;
    }

    // Get certificates by institution with pagination
    function getCertificatesByInstitution(address institution, uint256 startIndex, uint256 limit) external view returns (uint256[] memory) {
        uint256 total = totalSupply();
        if (startIndex >= total || limit == 0) return new uint256[](0);
        
        // Two-phase approach (count then fill)
        uint256 matchCount = 0;
        uint256 skip = 0;
        
        for (uint256 i = 0; i < total && matchCount < limit; i++) {
            uint256 tokenId = tokenByIndex(i);
            if (academicCertificates[tokenId].institutionAddress == institution) {
                if (skip < startIndex) {
                    skip++;
                } else {
                    matchCount++;
                }
            }
        }
        
        uint256[] memory result = new uint256[](matchCount);
        uint256 resultIndex = 0;
        skip = 0;
        
        for (uint256 i = 0; i < total && resultIndex < matchCount; i++) {
            uint256 tokenId = tokenByIndex(i);
            if (academicCertificates[tokenId].institutionAddress == institution) {
                if (skip < startIndex) {
                    skip++;
                } else {
                    result[resultIndex] = tokenId;
                    resultIndex++;
                }
            }
        }
        
        return result;
    }

    // Count certificates by institution
    function countCertificatesByInstitution(address institution) external view returns (uint256) {
        uint256 total = totalSupply();
        uint256 count = 0;
        
        for (uint256 i = 0; i < total; i++) {
            uint256 tokenId = tokenByIndex(i);
            if (academicCertificates[tokenId].institutionAddress == institution) {
                count++;
            }
        }
        
        return count;
    }
} 