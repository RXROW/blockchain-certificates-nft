// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./QueryFunctions.sol";

// Contract for advanced certificate query functions
contract AdvancedQueries is QueryFunctions {
    // Get certificates by student with pagination
    function getCertificatesByStudent(address student, uint256 startIndex, uint256 limit) external view returns (uint256[] memory) {
        uint256 total = totalSupply();
        if (startIndex >= total || limit == 0) return new uint256[](0);
        
        // Two-phase approach (count then fill)
        uint256 matchCount = 0;
        uint256 skip = 0;
        
        for (uint256 i = 0; i < total && matchCount < limit; i++) {
            uint256 tokenId = tokenByIndex(i);
            if (academicCertificates[tokenId].studentAddress == student) {
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
            if (academicCertificates[tokenId].studentAddress == student) {
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

    // Get certificates by course ID with pagination
    function getCertificatesByCourse(uint256 courseId, uint256 startIndex, uint256 limit) external view returns (uint256[] memory) {
        uint256 total = totalSupply();
        if (startIndex >= total || limit == 0) return new uint256[](0);
        
        // Two-phase approach (count then fill)
        uint256 matchCount = 0;
        uint256 skip = 0;
        
        for (uint256 i = 0; i < total && matchCount < limit; i++) {
            uint256 tokenId = tokenByIndex(i);
            if (academicCertificates[tokenId].courseId == courseId) {
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
            if (academicCertificates[tokenId].courseId == courseId) {
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

    // Get certificates issued within a date range
    function getCertificatesByDateRange(uint256 startDate, uint256 endDate, uint256 startIndex, uint256 limit) 
        external view returns (uint256[] memory) 
    {
        require(startDate <= endDate, "Invalid date range");
        
        uint256 total = totalSupply();
        if (startIndex >= total || limit == 0) return new uint256[](0);
        
        // Two-phase approach (count then fill)
        uint256 matchCount = 0;
        uint256 skip = 0;
        
        for (uint256 i = 0; i < total && matchCount < limit; i++) {
            uint256 tokenId = tokenByIndex(i);
            AcademicCertificate memory cert = academicCertificates[tokenId];
            
            if (cert.completionDate >= startDate && cert.completionDate <= endDate) {
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
            AcademicCertificate memory cert = academicCertificates[tokenId];
            
            if (cert.completionDate >= startDate && cert.completionDate <= endDate) {
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

    // Count certificates by course
    function countCertificatesByCourse(uint256 courseId) external view returns (uint256) {
        uint256 total = totalSupply();
        uint256 count = 0;
        
        for (uint256 i = 0; i < total; i++) {
            uint256 tokenId = tokenByIndex(i);
            if (academicCertificates[tokenId].courseId == courseId) {
                count++;
            }
        }
        
        return count;
    }

    // Get the most recent certificates (by issuance date)
    function getRecentCertificates(uint256 limit) external view returns (uint256[] memory) {
        uint256 total = totalSupply();
        uint256 resultSize = (limit < total) ? limit : total;
        
        uint256[] memory result = new uint256[](resultSize);
        
        // Start from the newest certificates (highest indices)
        for (uint256 i = 0; i < resultSize; i++) {
            if (total > i) {
                uint256 index = total - i - 1;
                result[i] = tokenByIndex(index);
            }
        }
        
        return result;
    }
} 