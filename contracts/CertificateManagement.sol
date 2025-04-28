// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CertificateNFTBase.sol";

// Certificate management functions (issuance, verification, revocation, updates)
contract CertificateManagement is CertificateNFTBase {
    // New mapping to track burn approvals
    mapping(uint256 => bool) public burnApproved;
    
    // Timelock for burn operations (default: 3 days)
    uint256 public burnTimelock = 3 days;
    
    // Mapping to track burn requests
    mapping(uint256 => uint256) public burnRequestTimestamps;
    
    // Institution Management
    function authorizeInstitution(address institution) public onlyOwner {
        require(!authorizedInstitutions[institution], "Institution already authorized");
        authorizedInstitutions[institution] = true;
        _grantRole(INSTITUTION_ROLE, institution);
        emit InstitutionAuthorized(institution);
    }

    function revokeInstitution(address institution) public onlyOwner {
        require(authorizedInstitutions[institution], "Institution not authorized");
        authorizedInstitutions[institution] = false;
        _revokeRole(INSTITUTION_ROLE, institution);
        emit InstitutionRevoked(institution);
    }

    // Certificate Management
    function issueCertificate(
        address student,
        uint256 courseId,
        uint256 grade,
        string memory certificateHash
    ) public onlyInstitution returns (uint256) {
        require(student != address(0), "Invalid student address");
        require(bytes(certificateHash).length > 0, "Invalid certificate hash");
        require(courseId > 0, "Invalid course ID");

        _tokenIds += 1;
        uint256 newTokenId = _tokenIds;

        _mint(student, newTokenId);

        academicCertificates[newTokenId] = AcademicCertificate({
            studentAddress: student,
            institutionAddress: msg.sender,
            courseId: courseId,
            completionDate: block.timestamp,
            grade: grade,
            isVerified: false,
            certificateHash: certificateHash,
            isRevoked: false,
            revocationReason: "",
            version: 1,
            lastUpdateDate: block.timestamp,
            updateReason: "Initial issuance"
        });

        emit CertificateIssued(
            newTokenId,
            student,
            msg.sender,
            courseId,
            block.timestamp,
            grade
        );

        return newTokenId;
    }

    function verifyCertificate(uint256 tokenId) public onlyInstitution {
        require(tokenExists(tokenId), "Certificate does not exist");
        require(!academicCertificates[tokenId].isRevoked, "Certificate is revoked");
        require(!academicCertificates[tokenId].isVerified, "Certificate already verified");

        academicCertificates[tokenId].isVerified = true;
        verifiedCertificates[tokenId] = true;

        emit CertificateVerified(tokenId, msg.sender);
        // Also emit the consolidated event
        emit CertificateStatusChanged(tokenId, true, false, msg.sender, block.timestamp);
    }

    function revokeCertificate(uint256 tokenId, string memory reason) public onlyInstitution {
        require(tokenExists(tokenId), "Certificate does not exist");
        require(!academicCertificates[tokenId].isRevoked, "Certificate already revoked");

        academicCertificates[tokenId].isRevoked = true;
        academicCertificates[tokenId].revocationReason = reason;
        academicCertificates[tokenId].version += 1;
        academicCertificates[tokenId].lastUpdateDate = block.timestamp;
        academicCertificates[tokenId].updateReason = "Certificate revoked";

        emit CertificateRevoked(tokenId, msg.sender, reason);
        // Also emit the consolidated event
        emit CertificateStatusChanged(tokenId, false, true, msg.sender, block.timestamp);
    }

    /**
     * @dev Request to burn a certificate - initiates the timelock period
     * This implements a security mechanism to prevent malicious burning
     * @param tokenId The ID of the certificate to request burning
     * @param reason Documentation of why the certificate should be burned
     */
    function requestBurnCertificate(uint256 tokenId, string memory reason) public {
        require(tokenExists(tokenId), "Certificate does not exist");
        
        // Only the issuing institution can request a burn
        require(academicCertificates[tokenId].institutionAddress == msg.sender, 
            "Only the issuing institution can request certificate burning");
        
        // Set the timestamp for the burn request
        burnRequestTimestamps[tokenId] = block.timestamp;
        
        // Emit an event for the burn request
        emit CertificateBurnRequested(tokenId, msg.sender, reason, block.timestamp + burnTimelock);
    }
    
    /**
     * @dev Admin approval for certificate burning - can bypass timelock
     * @param tokenId The ID of the certificate to approve for burning
     */
    function approveBurnCertificate(uint256 tokenId) public onlyOwner {
        require(tokenExists(tokenId), "Certificate does not exist");
        burnApproved[tokenId] = true;
        emit CertificateBurnApproved(tokenId, msg.sender);
    }
    
    /**
     * @dev Set the timelock period for burn operations
     * @param newTimelock New timelock duration in seconds
     */
    function setBurnTimelock(uint256 newTimelock) public onlyOwner {
        burnTimelock = newTimelock;
        emit BurnTimelockChanged(newTimelock);
    }

    /**
     * @dev Completely burns (deletes) a certificate
     * This should only be used in specific situations:
     * - GDPR "right to be forgotten" requests
     * - Critical issuance errors
     * - System migration after reissuance
     * - Test certificate cleanup
     * @param tokenId The ID of the certificate to burn
     * @param reason Documentation of why the certificate was burned
     */
    function burnCertificate(uint256 tokenId, string memory reason) public {
        require(tokenExists(tokenId), "Certificate does not exist");
        
        // Contract owner can burn any certificate immediately
        bool isOwner = owner() == msg.sender;
        
        if (!isOwner) {
            // For institutions, check if they issued the certificate
            require(academicCertificates[tokenId].institutionAddress == msg.sender,
                "Only the issuing institution can burn this certificate");
            
            // Check if the certificate has admin approval or has passed the timelock period
            require(burnApproved[tokenId] || 
                (burnRequestTimestamps[tokenId] > 0 && 
                 block.timestamp >= burnRequestTimestamps[tokenId] + burnTimelock),
                "Certificate burn request is still in timelock period or not approved");
        }
        
        // Record the burn action before deleting the certificate
        emit CertificateBurned(tokenId, msg.sender, reason);
        
        // Burn the token - this will remove it completely
        _burn(tokenId);
        
        // Clean up the burn request data
        burnRequestTimestamps[tokenId] = 0;
        burnApproved[tokenId] = false;
    }

    function updateCertificate(
        uint256 tokenId,
        uint256 newGrade,
        string memory updateReason
    ) public onlyInstitution {
        require(tokenExists(tokenId), "Certificate does not exist");
        require(!academicCertificates[tokenId].isRevoked, "Certificate is revoked");
        
        AcademicCertificate storage cert = academicCertificates[tokenId];
        cert.grade = newGrade;
        cert.version += 1;
        cert.lastUpdateDate = block.timestamp;
        cert.updateReason = updateReason;
        
        emit CertificateUpdated(tokenId, newGrade, updateReason);
    }

    // Course Management
    function setCourseName(uint256 courseId, string memory name) public onlyInstitution {
        require(courseId > 0, "Invalid course ID");
        require(bytes(name).length > 0, "Course name cannot be empty");
        courseNames[courseId] = name;
        emit CourseNameSet(courseId, name);
    }

    function getCourseName(uint256 courseId) public view returns (string memory) {
        return courseNames[courseId];
    }

    // Set token URI with validation
    function setCertificateURI(uint256 tokenId, string calldata uri) external onlyInstitution {
        require(tokenExists(tokenId), "Certificate does not exist");
        require(academicCertificates[tokenId].institutionAddress == msg.sender, "Not certificate issuer");
        
        _setTokenURI(tokenId, uri);
    }
    
    // Event for course name setting
    event CourseNameSet(uint256 indexed courseId, string name);
    
    // Event for certificate burning
    event CertificateBurned(
        uint256 indexed tokenId,
        address indexed burner,
        string reason
    );
    
    // Events for burn request and approval
    event CertificateBurnRequested(
        uint256 indexed tokenId,
        address indexed requester,
        string reason,
        uint256 executionTime
    );
    
    event CertificateBurnApproved(
        uint256 indexed tokenId,
        address indexed approver
    );
    
    event BurnTimelockChanged(uint256 newTimelock);
} 