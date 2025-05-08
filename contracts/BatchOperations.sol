// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CertificateManagement.sol";

// Contract for batch operations
contract BatchOperations is CertificateManagement {
    // Custom errors
    error ArrayLengthMismatch();
    
    /**
     * @dev Internal helper to validate array lengths match
     */
    function _validateArrayLengths(uint256 length1, uint256 length2) internal pure {
        if (length1 != length2) {
            revert ArrayLengthMismatch();
        }
    }
    
    // Bulk certificate verification for efficiency
    function verifyMultipleCertificates(uint256[] calldata tokenIds) external onlyInstitution {
        uint256 currentTime = block.timestamp; // Cache timestamp once
        
        for (uint256 i = 0; i < tokenIds.length;) {
            uint256 tokenId = tokenIds[i];
            
            // Cache certificate in memory to avoid multiple SLOADs
            if (tokenExists(tokenId)) {
                AcademicCertificate memory cert = academicCertificates[tokenId];
                
                if (!cert.isRevoked && !cert.isVerified) {
                    // Update storage
                    academicCertificates[tokenId].isVerified = true;
                    verifiedCertificates[tokenId] = true;
                    
                    emit CertificateVerified(tokenId, msg.sender);
                    emit CertificateStatusChanged(tokenId, true, false, msg.sender, currentTime);
                }
            }
            unchecked { ++i; }
        }
    }
    
    /**
     * @dev Request to burn multiple certificates - initiates the timelock period
     * @param tokenIds Array of certificate IDs to request for burning
     * @param reason Common reason for burning all certificates
     */
    function requestBurnMultipleCertificates(uint256[] calldata tokenIds, string calldata reason) external onlyInstitution {
        uint256 currentTime = block.timestamp; // Cache timestamp once
        uint256 executionTime = currentTime + burnTimelock; // Cache execution time
        address sender = msg.sender; // Cache msg.sender
        
        for (uint256 i = 0; i < tokenIds.length;) {
            uint256 tokenId = tokenIds[i];
            
            // Skip if token doesn't exist
            if (!tokenExists(tokenId)) {
                unchecked { ++i; }
                continue;
            }
            
            // Cache the certificate data to avoid multiple SLOADs
            address issuer = academicCertificates[tokenId].institutionAddress;
            
            // Only allow institution to request burning their own certificates
            if (issuer == sender) {
                // Set the timestamp for the burn request
                burnRequestTimestamps[tokenId] = currentTime;
                
                // Emit an event for the burn request
                emit CertificateBurnRequested(tokenId, sender, reason, executionTime);
            }
            unchecked { ++i; }
        }
    }
    
    /**
     * @dev Admin can approve multiple certificates for burning - bypasses timelock
     * @param tokenIds Array of certificate IDs to approve for burning
     */
    function approveBurnMultipleCertificates(uint256[] calldata tokenIds) external onlyOwner {
        address sender = msg.sender; // Cache sender address
        
        for (uint256 i = 0; i < tokenIds.length;) {
            uint256 tokenId = tokenIds[i];
            
            if (tokenExists(tokenId)) {
                burnApproved[tokenId] = true;
                emit CertificateBurnApproved(tokenId, sender);
            }
            unchecked { ++i; }
        }
    }
    
    /**
     * @dev Internal helper to burn a certificate with proper validations
     */
    function _burnCertificateInternal(uint256 tokenId, string memory reason, address caller) internal {
        // Cache frequently accessed values
        address contractOwner = owner();
        bool isOwner = contractOwner == caller;
        
        // Skip if token doesn't exist
        if (!tokenExists(tokenId)) return;
        
        // Cache the certificate data
        address issuer = academicCertificates[tokenId].institutionAddress;
        bool isIssuer = issuer == caller;
        
        // Check caller permissions and burn conditions
        if (isOwner || 
            (isIssuer && 
            (burnApproved[tokenId] || 
             (burnRequestTimestamps[tokenId] > 0 && 
              block.timestamp >= burnRequestTimestamps[tokenId] + burnTimelock)))) {
            
            emit CertificateBurned(tokenId, caller, reason);
            _burn(tokenId);
            
            // Clean up the burn request data
            _cleanupBurnData(tokenId);
        }
    }
    
    /**
     * @dev Burns multiple certificates in a single transaction, respecting timelock and approval
     * @param tokenIds Array of certificate IDs to burn
     * @param reason Common reason for burning all certificates
     */
    function burnMultipleCertificates(uint256[] calldata tokenIds, string calldata reason) external {
        address sender = msg.sender; // Cache sender address
        
        for (uint256 i = 0; i < tokenIds.length;) {
            _burnCertificateInternal(tokenIds[i], reason, sender);
            unchecked { ++i; }
        }
    }

    // Batch setting course names
    function setMultipleCourseNames(
        uint256[] calldata courseIds, 
        string[] calldata names
    ) external onlyInstitution {
        _validateArrayLengths(courseIds.length, names.length);
        
        address sender = msg.sender; // Cache sender address
        
        for (uint256 i = 0; i < courseIds.length;) {
            uint256 courseId = courseIds[i];
            string calldata name = names[i];
            
            if (courseId == 0) {
                revert InvalidCourseId(courseId);
            }
            if (bytes(name).length == 0) {
                revert CourseNameEmpty();
            }
            
            courseNames[courseId] = name;
            emit CourseNameSet(courseId, name);
            unchecked { ++i; }
        }
    }

    // Batch setting of URIs
    function setBatchCertificateURIs(
        uint256[] calldata tokenIds, 
        string[] calldata uris
    ) external onlyInstitution {
        _validateArrayLengths(tokenIds.length, uris.length);
        
        address sender = msg.sender; // Cache sender address
        
        for (uint256 i = 0; i < tokenIds.length;) {
            uint256 tokenId = tokenIds[i];
            
            // Cache certificate issuer
            bool exists = tokenExists(tokenId);
            
            if (exists) {
                address issuer = academicCertificates[tokenId].institutionAddress;
                if (issuer == sender) {
                    _setTokenURI(tokenId, uris[i]);
                }
            }
            unchecked { ++i; }
        }
    }
    
    /**
     * @dev Internal helper for initializing arrays for batch certificate data
     */
    function _initializeCertificateBatchArrays(uint256 length) internal pure returns (
        address[] memory students,
        address[] memory institutions,
        uint256[] memory courseIds,
        uint256[] memory completionDates,
        uint256[] memory grades,
        bool[] memory verificationStatuses,
        bool[] memory revocationStatuses
    ) {
        students = new address[](length);
        institutions = new address[](length);
        courseIds = new uint256[](length);
        completionDates = new uint256[](length);
        grades = new uint256[](length);
        verificationStatuses = new bool[](length);
        revocationStatuses = new bool[](length);
        
        return (students, institutions, courseIds, completionDates, grades, verificationStatuses, revocationStatuses);
    }
    
    /**
     * @dev Fills certificate data arrays at a specific index
     */
    function _fillCertificateData(
        uint256 index,
        uint256 tokenId,
        address[] memory students,
        address[] memory institutions,
        uint256[] memory courseIds,
        uint256[] memory completionDates,
        uint256[] memory grades,
        bool[] memory verificationStatuses,
        bool[] memory revocationStatuses
    ) internal view {
        // Use memory to avoid multiple SLOADs
        AcademicCertificate memory cert = academicCertificates[tokenId];
        students[index] = cert.studentAddress;
        institutions[index] = cert.institutionAddress;
        courseIds[index] = cert.courseId;
        completionDates[index] = cert.completionDate;
        grades[index] = cert.grade;
        verificationStatuses[index] = cert.isVerified;
        revocationStatuses[index] = cert.isRevoked;
    }
    
    // Get multiple certificates in a single call
    function getCertificatesBatch(uint256[] calldata tokenIds) 
        external view returns (
            address[] memory students,
            address[] memory institutions,
            uint256[] memory courseIds,
            uint256[] memory completionDates,
            uint256[] memory grades,
            bool[] memory verificationStatuses,
            bool[] memory revocationStatuses
        ) 
    {
        // Initialize arrays
        (students, institutions, courseIds, completionDates, grades, 
         verificationStatuses, revocationStatuses) = _initializeCertificateBatchArrays(tokenIds.length);
        
        // Fill in data for each certificate
        for (uint256 i = 0; i < tokenIds.length;) {
            uint256 tokenId = tokenIds[i];
            
            if (tokenExists(tokenId)) {
                _fillCertificateData(
                    i, 
                    tokenId, 
                    students, 
                    institutions, 
                    courseIds, 
                    completionDates, 
                    grades, 
                    verificationStatuses, 
                    revocationStatuses
                );
            }
            unchecked { ++i; }
        }
        
        return (
            students,
            institutions,
            courseIds,
            completionDates,
            grades,
            verificationStatuses,
            revocationStatuses
        );
    }
    
    // Get detailed certificates batch (second part of information)
    function getCertificatesBatchDetails(uint256[] calldata tokenIds) 
        external view returns (
            string[] memory revocationReasons,
            uint256[] memory versions,
            uint256[] memory lastUpdateDates,
            string[] memory updateReasons
        ) 
    {
        // Initialize arrays
        revocationReasons = new string[](tokenIds.length);
        versions = new uint256[](tokenIds.length);
        lastUpdateDates = new uint256[](tokenIds.length);
        updateReasons = new string[](tokenIds.length);
        
        // Fill in data for each certificate
        for (uint256 i = 0; i < tokenIds.length;) {
            uint256 tokenId = tokenIds[i];
            
            if (tokenExists(tokenId)) {
                // Use memory to avoid multiple SLOADs
                AcademicCertificate memory cert = academicCertificates[tokenId];
                revocationReasons[i] = cert.revocationReason;
                versions[i] = cert.version;
                lastUpdateDates[i] = cert.lastUpdateDate;
                updateReasons[i] = cert.updateReason;
            }
            unchecked { ++i; }
        }
        
        return (
            revocationReasons,
            versions,
            lastUpdateDates,
            updateReasons
        );
    }
    
    // Get course names batch
    function getCourseNamesBatch(uint256[] calldata courseIds) external view returns (string[] memory) {
        string[] memory names = new string[](courseIds.length);
        
        for (uint256 i = 0; i < courseIds.length;) {
            names[i] = courseNames[courseIds[i]];
            unchecked { ++i; }
        }
        
        return names;
    }

    /**
     * @dev Cancel multiple burn requests in a single transaction
     * @param tokenIds Array of certificate IDs to cancel burn requests for
     */
    function cancelBurnMultipleRequests(uint256[] calldata tokenIds) external {
        // Cache frequently accessed values
        address sender = msg.sender;
        address contractOwner = owner();
        bool isOwner = contractOwner == sender;

        for (uint256 i = 0; i < tokenIds.length;) {
            uint256 tokenId = tokenIds[i];
            
            // Skip if token doesn't exist or no burn request
            if (!tokenExists(tokenId)) {
                unchecked { ++i; }
                continue;
            }
            
            // Cache burn request timestamp
            uint256 requestTime = burnRequestTimestamps[tokenId];
            if (requestTime == 0) {
                unchecked { ++i; }
                continue;
            }
            
            // Only the issuing institution or contract owner can cancel
            // Cache certificate issuer
            address issuer = academicCertificates[tokenId].institutionAddress;
            bool isIssuer = issuer == sender;
            
            if (isOwner || isIssuer) {
                // Reset the burn request data
                _cleanupBurnData(tokenId);
                
                // Emit the cancellation event
                emit CertificateBurnRequestCanceled(tokenId, sender);
            }
            unchecked { ++i; }
        }
    }
} 