// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./QueryFunctions.sol";

// Contract for advanced certificate query functions
contract AdvancedQueries is QueryFunctions {
    // Custom error
    error InvalidDateRange(uint256 startDate, uint256 endDate);
    
    /**
     * @dev Internal helper to check if a certificate belongs to a student
     */
    function _belongsToStudent(uint256 tokenId, address student) internal view returns (bool) {
        // Cache the student address to reduce SLOADs
        address certificateStudent = academicCertificates[tokenId].studentAddress;
        return certificateStudent == student;
    }
    
    /**
     * @dev Internal helper to check if a certificate belongs to a course
     */
    function _belongsToCourse(uint256 tokenId, uint256 courseId) internal view returns (bool) {
        // Cache the course ID to reduce SLOADs
        uint256 certificateCourseId = academicCertificates[tokenId].courseId;
        return certificateCourseId == courseId;
    }
    
    /**
     * @dev Internal helper to check if a certificate's completion date is within a range
     */
    function _isInDateRange(uint256 tokenId, uint256 startDate, uint256 endDate) internal view returns (bool) {
        uint256 completionDate = academicCertificates[tokenId].completionDate;
        return completionDate >= startDate && completionDate <= endDate;
    }
    
    /**
     * @dev Internal helper for paginated student-based filtering
     */
    function _getStudentFilteredCertificates(address student, uint256 startIndex, uint256 limit) 
        internal view returns (uint256[] memory) 
    {
        uint256 total = totalSupply(); // Cache total supply
        if (startIndex >= total || limit == 0) return new uint256[](0);
        
        // Two-phase approach (count then fill)
        uint256 matchCount = 0;
        uint256 skip = 0;
        
        for (uint256 i = 0; i < total && matchCount < limit;) {
            uint256 tokenId = tokenByIndex(i);
            if (_belongsToStudent(tokenId, student)) {
                if (skip < startIndex) {
                    unchecked { ++skip; }
                } else {
                    unchecked { ++matchCount; }
                }
            }
            unchecked { ++i; }
        }
        
        uint256[] memory result = new uint256[](matchCount);
        uint256 resultIndex = 0;
        skip = 0;
        
        for (uint256 i = 0; i < total && resultIndex < matchCount;) {
            uint256 tokenId = tokenByIndex(i);
            if (_belongsToStudent(tokenId, student)) {
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
     * @dev Internal helper for paginated course-based filtering
     */
    function _getCourseFilteredCertificates(uint256 courseId, uint256 startIndex, uint256 limit) 
        internal view returns (uint256[] memory) 
    {
        uint256 total = totalSupply(); // Cache total supply
        if (startIndex >= total || limit == 0) return new uint256[](0);
        
        // Two-phase approach (count then fill)
        uint256 matchCount = 0;
        uint256 skip = 0;
        
        for (uint256 i = 0; i < total && matchCount < limit;) {
            uint256 tokenId = tokenByIndex(i);
            if (_belongsToCourse(tokenId, courseId)) {
                if (skip < startIndex) {
                    unchecked { ++skip; }
                } else {
                    unchecked { ++matchCount; }
                }
            }
            unchecked { ++i; }
        }
        
        uint256[] memory result = new uint256[](matchCount);
        uint256 resultIndex = 0;
        skip = 0;
        
        for (uint256 i = 0; i < total && resultIndex < matchCount;) {
            uint256 tokenId = tokenByIndex(i);
            if (_belongsToCourse(tokenId, courseId)) {
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
     * @dev Internal helper for paginated date range filtering
     */
    function _getDateRangeFilteredCertificates(uint256 startDate, uint256 endDate, uint256 startIndex, uint256 limit) 
        internal view returns (uint256[] memory) 
    {
        uint256 total = totalSupply(); // Cache total supply
        if (startIndex >= total || limit == 0) return new uint256[](0);
        
        // Two-phase approach (count then fill)
        uint256 matchCount = 0;
        uint256 skip = 0;
        
        for (uint256 i = 0; i < total && matchCount < limit;) {
            uint256 tokenId = tokenByIndex(i);
            if (_isInDateRange(tokenId, startDate, endDate)) {
                if (skip < startIndex) {
                    unchecked { ++skip; }
                } else {
                    unchecked { ++matchCount; }
                }
            }
            unchecked { ++i; }
        }
        
        uint256[] memory result = new uint256[](matchCount);
        uint256 resultIndex = 0;
        skip = 0;
        
        for (uint256 i = 0; i < total && resultIndex < matchCount;) {
            uint256 tokenId = tokenByIndex(i);
            if (_isInDateRange(tokenId, startDate, endDate)) {
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
     * @dev Internal helper to count certificates by course
     */
    function _countByCourse(uint256 courseId) internal view returns (uint256) {
        uint256 total = totalSupply(); // Cache total supply
        uint256 count = 0;
        
        for (uint256 i = 0; i < total;) {
            uint256 tokenId = tokenByIndex(i);
            if (_belongsToCourse(tokenId, courseId)) {
                unchecked { ++count; }
            }
            unchecked { ++i; }
        }
        
        return count;
    }
    
    // Get certificates by student with pagination
    function getCertificatesByStudent(address student, uint256 startIndex, uint256 limit) external view returns (uint256[] memory) {
        return _getStudentFilteredCertificates(student, startIndex, limit);
    }

    // Get certificates by course ID with pagination
    function getCertificatesByCourse(uint256 courseId, uint256 startIndex, uint256 limit) external view returns (uint256[] memory) {
        return _getCourseFilteredCertificates(courseId, startIndex, limit);
    }

    // Get certificates issued within a date range
    function getCertificatesByDateRange(uint256 startDate, uint256 endDate, uint256 startIndex, uint256 limit) 
        external view returns (uint256[] memory) 
    {
        if (startDate > endDate) {
            revert InvalidDateRange(startDate, endDate);
        }
        
        return _getDateRangeFilteredCertificates(startDate, endDate, startIndex, limit);
    }

    // Count certificates by course
    function countCertificatesByCourse(uint256 courseId) external view returns (uint256) {
        return _countByCourse(courseId);
    }

    // Get the most recent certificates (by issuance date)
    function getRecentCertificates(uint256 limit) external view returns (uint256[] memory) {
        uint256 total = totalSupply(); // Cache total supply
        uint256 resultSize = (limit < total) ? limit : total;
        
        uint256[] memory result = new uint256[](resultSize);
        
        // Start from the newest certificates (highest indices)
        for (uint256 i = 0; i < resultSize;) {
            if (total > i) {
                uint256 index = total - i - 1;
                result[i] = tokenByIndex(index);
            }
            unchecked { ++i; }
        }
        
        return result;
    }
} 