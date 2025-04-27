// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CertificateManagement.sol";

// Contract for batch operations
contract BatchOperations is CertificateManagement {
    // Bulk certificate verification for efficiency
    function verifyMultipleCertificates(uint256[] calldata tokenIds) external onlyInstitution {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            if (tokenExists(tokenId) && 
                !academicCertificates[tokenId].isRevoked &&
                !academicCertificates[tokenId].isVerified) {
                
                academicCertificates[tokenId].isVerified = true;
                verifiedCertificates[tokenId] = true;
                
                emit CertificateVerified(tokenId, msg.sender);
                emit CertificateStatusChanged(tokenId, true, false, msg.sender, block.timestamp);
            }
        }
    }
    
    /**
     * @dev Request to burn multiple certificates - initiates the timelock period
     * @param tokenIds Array of certificate IDs to request for burning
     * @param reason Common reason for burning all certificates
     */
    function requestBurnMultipleCertificates(uint256[] calldata tokenIds, string calldata reason) external onlyInstitution {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            // Skip if token doesn't exist
            if (!tokenExists(tokenId)) continue;
            
            // Only allow institution to request burning their own certificates
            if (academicCertificates[tokenId].institutionAddress == msg.sender) {
                // Set the timestamp for the burn request
                burnRequestTimestamps[tokenId] = block.timestamp;
                
                // Emit an event for the burn request
                emit CertificateBurnRequested(tokenId, msg.sender, reason, block.timestamp + burnTimelock);
            }
        }
    }
    
    /**
     * @dev Admin can approve multiple certificates for burning - bypasses timelock
     * @param tokenIds Array of certificate IDs to approve for burning
     */
    function approveBurnMultipleCertificates(uint256[] calldata tokenIds) external onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            if (tokenExists(tokenId)) {
                burnApproved[tokenId] = true;
                emit CertificateBurnApproved(tokenId, msg.sender);
            }
        }
    }
    
    /**
     * @dev Burns multiple certificates in a single transaction, respecting timelock and approval
     * @param tokenIds Array of certificate IDs to burn
     * @param reason Common reason for burning all certificates
     */
    function burnMultipleCertificates(uint256[] calldata tokenIds, string calldata reason) external {
        // Check if caller is contract owner
        bool isOwner = owner() == msg.sender;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            // Skip if token doesn't exist
            if (!tokenExists(tokenId)) continue;
            
            if (isOwner) {
                // Owner can burn any certificate immediately
                emit CertificateBurned(tokenId, msg.sender, reason);
                _burn(tokenId);
                
                // Clean up the burn request data
                burnRequestTimestamps[tokenId] = 0;
                burnApproved[tokenId] = false;
            } 
            else if (academicCertificates[tokenId].institutionAddress == msg.sender) {
                // Institution can only burn if approved or timelock passed
                if (burnApproved[tokenId] || 
                    (burnRequestTimestamps[tokenId] > 0 && 
                     block.timestamp >= burnRequestTimestamps[tokenId] + burnTimelock)) {
                    
                    emit CertificateBurned(tokenId, msg.sender, reason);
                    _burn(tokenId);
                    
                    // Clean up the burn request data
                    burnRequestTimestamps[tokenId] = 0;
                    burnApproved[tokenId] = false;
                }
            }
        }
    }

    // Batch setting course names
    function setMultipleCourseNames(
        uint256[] calldata courseIds, 
        string[] calldata names
    ) external onlyInstitution {
        if (courseIds.length != names.length) {
            revert("Arrays length mismatch");
        }
        
        for (uint256 i = 0; i < courseIds.length; i++) {
            if (courseIds[i] == 0) {
                revert("Invalid course ID");
            }
            if (bytes(names[i]).length == 0) {
                revert("Course name cannot be empty");
            }
            
            courseNames[courseIds[i]] = names[i];
            emit CourseNameSet(courseIds[i], names[i]);
        }
    }

    // Batch setting of URIs
    function setBatchCertificateURIs(
        uint256[] calldata tokenIds, 
        string[] calldata uris
    ) external onlyInstitution {
        if (tokenIds.length != uris.length) {
            revert("Arrays length mismatch");
        }
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            if (tokenExists(tokenId) && academicCertificates[tokenId].institutionAddress == msg.sender) {
                _setTokenURI(tokenId, uris[i]);
            }
        }
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
        students = new address[](tokenIds.length);
        institutions = new address[](tokenIds.length);
        courseIds = new uint256[](tokenIds.length);
        completionDates = new uint256[](tokenIds.length);
        grades = new uint256[](tokenIds.length);
        verificationStatuses = new bool[](tokenIds.length);
        revocationStatuses = new bool[](tokenIds.length);
        
        // Fill in data for each certificate
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            if (tokenExists(tokenId)) {
                AcademicCertificate memory cert = academicCertificates[tokenId];
                students[i] = cert.studentAddress;
                institutions[i] = cert.institutionAddress;
                courseIds[i] = cert.courseId;
                completionDates[i] = cert.completionDate;
                grades[i] = cert.grade;
                verificationStatuses[i] = cert.isVerified;
                revocationStatuses[i] = cert.isRevoked;
            }
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
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            if (tokenExists(tokenId)) {
                AcademicCertificate memory cert = academicCertificates[tokenId];
                revocationReasons[i] = cert.revocationReason;
                versions[i] = cert.version;
                lastUpdateDates[i] = cert.lastUpdateDate;
                updateReasons[i] = cert.updateReason;
            }
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
        
        for (uint256 i = 0; i < courseIds.length; i++) {
            names[i] = courseNames[courseIds[i]];
        }
        
        return names;
    }
} 