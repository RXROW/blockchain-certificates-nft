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
    
    // Custom errors
    error InstitutionAlreadyAuthorized(address institution);
    error InstitutionNotAuthorized(address institution);
    error InvalidStudentAddress(address student);
    error InvalidCertificateHash(string certificateHash);
    error InvalidCourseId(uint256 courseId);
    error CertificateDoesNotExist(uint256 tokenId);
    error CertificateAlreadyVerified(uint256 tokenId);
    error CertificateIsRevoked(uint256 tokenId);
    error NotCertificateIssuer(uint256 tokenId, address caller);
    error BurnRequestStillTimelocked(uint256 tokenId);
    error NoBurnRequestExists(uint256 tokenId);
    error NotAuthorizedToCancelBurn(uint256 tokenId, address caller);
    error CourseNameEmpty();
    
    // Internal helper functions for common validations
    function _validateCertificateExists(uint256 tokenId) internal view {
        if (!tokenExists(tokenId)) {
            revert CertificateDoesNotExist(tokenId);
        }
    }
    
    function _validateNotRevoked(uint256 tokenId) internal view {
        // Cache the certificate in memory to avoid an extra SLOAD
        AcademicCertificate memory cert = academicCertificates[tokenId];
        if (cert.isRevoked) {
            revert CertificateIsRevoked(tokenId);
        }
    }
    
    function _validateIsIssuer(uint256 tokenId) internal view {
        // Cache the certificate issuer in memory to avoid an extra SLOAD
        address issuer = academicCertificates[tokenId].institutionAddress;
        if (issuer != msg.sender) {
            revert NotCertificateIssuer(tokenId, msg.sender);
        }
    }
    
    function _validateCourseId(uint256 courseId) internal pure {
        if (courseId == 0) {
            revert InvalidCourseId(courseId);
        }
    }
    
    // Institution Management
    function authorizeInstitution(address institution) public onlyOwner {
        // Short-circuit: Check address validity first (cheapest check)
        if (institution == address(0)) {
            revert InvalidStudentAddress(institution);
        }
        
        // Cache the authorization status to avoid multiple SLOADs
        bool isAuthorized = authorizedInstitutions[institution];
        if (isAuthorized) {
            revert InstitutionAlreadyAuthorized(institution);
        }
        
        // Perform state changes after all validations passed
        authorizedInstitutions[institution] = true;
        _grantRole(INSTITUTION_ROLE, institution);
        emit InstitutionAuthorized(institution);
    }

    function revokeInstitution(address institution) public onlyOwner {
        // Short-circuit: Check address validity first (cheapest check)
        if (institution == address(0)) {
            revert InvalidStudentAddress(institution);
        }
        
        // Cache the authorization status to avoid multiple SLOADs
        bool isAuthorized = authorizedInstitutions[institution];
        if (!isAuthorized) {
            revert InstitutionNotAuthorized(institution);
        }
        
        // Perform state changes after all validations passed
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
        // Short-circuit: Validate cheaper params first
        if (student == address(0)) {
            revert InvalidStudentAddress(student);
        }
        if (bytes(certificateHash).length == 0) {
            revert InvalidCertificateHash(certificateHash);
        }
        _validateCourseId(courseId);

        // Cache the current timestamp to avoid multiple TIMESTAMP calls
        uint256 currentTime = block.timestamp;
        
        // Increment token ID using unchecked math - this can't overflow in practice
        unchecked {
            _tokenIds += 1;
        }
        uint256 newTokenId = _tokenIds;

        _mint(student, newTokenId);

        academicCertificates[newTokenId] = AcademicCertificate({
            studentAddress: student,
            institutionAddress: msg.sender,
            courseId: courseId,
            completionDate: currentTime,
            grade: grade,
            isVerified: false,
            certificateHash: certificateHash,
            isRevoked: false,
            revocationReason: "",
            version: 1,
            lastUpdateDate: currentTime,
            updateReason: "Initial issuance"
        });

        emit CertificateIssued(
            newTokenId,
            student,
            msg.sender,
            courseId,
            currentTime,
            grade
        );

        return newTokenId;
    }

    function verifyCertificate(uint256 tokenId) public onlyInstitution {
        // Short-circuit: Check existence first (cheaper)
        _validateCertificateExists(tokenId);
        
        // Cache certificate in memory
        AcademicCertificate memory cert = academicCertificates[tokenId];
        
        // Short-circuit: Check verification status before revocation (cheaper)
        if (cert.isVerified) {
            revert CertificateAlreadyVerified(tokenId);
        }
        if (cert.isRevoked) {
            revert CertificateIsRevoked(tokenId);
        }

        // Update storage after all validations passed
        academicCertificates[tokenId].isVerified = true;
        verifiedCertificates[tokenId] = true;

        // Cache timestamp to avoid multiple TIMESTAMP calls
        uint256 currentTime = block.timestamp;
        
        emit CertificateVerified(tokenId, msg.sender);
        // Also emit the consolidated event
        emit CertificateStatusChanged(tokenId, true, false, msg.sender, currentTime);
    }

    function revokeCertificate(uint256 tokenId, string memory reason) public onlyInstitution {
        // Short-circuit: Check existence first (cheaper)
        _validateCertificateExists(tokenId);
        
        // Cache the certificate in memory to avoid multiple SLOADs
        AcademicCertificate memory cert = academicCertificates[tokenId];
        
        // Short-circuit: Check revocation status (cheaper check)
        if (cert.isRevoked) {
            revert CertificateIsRevoked(tokenId);
        }
        
        // Short-circuit: Check if caller is the issuer
        if (cert.institutionAddress != msg.sender) {
            revert NotCertificateIssuer(tokenId, msg.sender);
        }

        // Cache current timestamp
        uint256 currentTime = block.timestamp;
        
        // Use storage reference for the update to avoid multiple SSTORE operations
        AcademicCertificate storage certStorage = academicCertificates[tokenId];
        certStorage.isRevoked = true;
        certStorage.revocationReason = reason;
        unchecked {
            certStorage.version += 1;
        }
        certStorage.lastUpdateDate = currentTime;
        certStorage.updateReason = "Certificate revoked";

        emit CertificateRevoked(tokenId, msg.sender, reason);
        // Also emit the consolidated event
        emit CertificateStatusChanged(tokenId, false, true, msg.sender, currentTime);
    }

    /**
     * @dev Request to burn a certificate - initiates the timelock period
     * This implements a security mechanism to prevent malicious burning
     * @param tokenId The ID of the certificate to request burning
     * @param reason Documentation of why the certificate should be burned
     */
    function requestBurnCertificate(uint256 tokenId, string memory reason) public {
        // Short-circuit: Check token existence first (cheaper)
        _validateCertificateExists(tokenId);
        
        // Short-circuit: Check if caller is the issuer (cheaper than burn logic)
        _validateIsIssuer(tokenId);
        
        // Cache current timestamp
        uint256 currentTime = block.timestamp;
        
        // Calculate execution time using unchecked math (won't overflow)
        uint256 executionTime;
        unchecked {
            executionTime = currentTime + burnTimelock;
        }
        
        // Set the timestamp for the burn request
        burnRequestTimestamps[tokenId] = currentTime;
        
        // Emit an event for the burn request
        emit CertificateBurnRequested(tokenId, msg.sender, reason, executionTime);
    }
    
    /**
     * @dev Admin approval for certificate burning - can bypass timelock
     * @param tokenId The ID of the certificate to approve for burning
     */
    function approveBurnCertificate(uint256 tokenId) public onlyOwner {
        // Short-circuit: Check token existence first (cheaper)
        _validateCertificateExists(tokenId);
        
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
     * @dev Check if burn conditions are met for non-owner
     */
    function _canBurn(uint256 tokenId) internal view returns (bool) {
        // Cache frequently accessed storage variables
        bool isApproved = burnApproved[tokenId];
        
        // Short-circuit: If already approved, return early
        if (isApproved) return true;
        
        uint256 requestTime = burnRequestTimestamps[tokenId];
        
        // Short-circuit: If no request exists, return early
        if (requestTime == 0) return false;
        
        uint256 lockTime = burnTimelock;
        
        // Calculate unlock time using unchecked math (won't overflow)
        uint256 unlockTime;
        unchecked {
            unlockTime = requestTime + lockTime;
        }
        
        return block.timestamp >= unlockTime;
    }

    /**
     * @dev Helper to clean up burn data after burning
     */
    function _cleanupBurnData(uint256 tokenId) internal {
        burnRequestTimestamps[tokenId] = 0;
        burnApproved[tokenId] = false;
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
        // Short-circuit: Check token existence first (cheaper)
        _validateCertificateExists(tokenId);
        
        // Cache values to avoid multiple storage reads
        address contractOwner = owner();
        
        // Contract owner can burn any certificate immediately
        bool isOwner = contractOwner == msg.sender;
        
        // Short-circuit: If owner, process burn directly
        if (isOwner) {
            // Record the burn action before deleting the certificate
            emit CertificateBurned(tokenId, msg.sender, reason);
            
            // Burn the token - this will remove it completely
            _burn(tokenId);
            
            // Clean up the burn request data
            _cleanupBurnData(tokenId);
            return;
        }
        
        // If not owner, check if caller is issuer
        _validateIsIssuer(tokenId);
        
        // Check if the certificate has admin approval or has passed the timelock period
        if (!_canBurn(tokenId)) {
            revert BurnRequestStillTimelocked(tokenId);
        }
        
        // Record the burn action before deleting the certificate
        emit CertificateBurned(tokenId, msg.sender, reason);
        
        // Burn the token - this will remove it completely
        _burn(tokenId);
        
        // Clean up the burn request data
        _cleanupBurnData(tokenId);
    }

    function updateCertificate(
        uint256 tokenId,
        uint256 newGrade,
        string memory updateReason
    ) public onlyInstitution {
        // Short-circuit: Check token existence first (cheaper)
        _validateCertificateExists(tokenId);
        
        // Short-circuit: Check revocation before accessing storage again
        _validateNotRevoked(tokenId);
        
        // Check if caller is the issuer of this certificate
        _validateIsIssuer(tokenId);
        
        // Short-circuit: Check reason validity
        if (bytes(updateReason).length == 0) {
            revert InvalidCertificateHash(updateReason);
        }
        
        // Use storage reference for more efficient updates
        AcademicCertificate storage cert = academicCertificates[tokenId];
        cert.grade = newGrade;
        unchecked {
            cert.version += 1;
        }
        cert.lastUpdateDate = block.timestamp;
        cert.updateReason = updateReason;
        
        emit CertificateUpdated(tokenId, newGrade, updateReason);
    }

    // Course Management
    function setCourseName(uint256 courseId, string memory name) public onlyInstitution {
        // Short-circuit: Check courseId first (cheaper)
        _validateCourseId(courseId);
        
        // Short-circuit: Check name validity
        if (bytes(name).length == 0) {
            revert CourseNameEmpty();
        }
        
        courseNames[courseId] = name;
        emit CourseNameSet(courseId, name);
    }

    function getCourseName(uint256 courseId) public view returns (string memory) {
        return courseNames[courseId];
    }

    // Set token URI with validation
    function setCertificateURI(uint256 tokenId, string calldata uri) external onlyInstitution {
        // Short-circuit: Check token existence first (cheaper)
        _validateCertificateExists(tokenId);
        
        // Check if caller is the issuer
        _validateIsIssuer(tokenId);
        
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

    /**
     * @dev Cancel a pending burn request before it is executed
     * @param tokenId The ID of the certificate to cancel the burn request for
     */
    function cancelBurnRequest(uint256 tokenId) public {
        // Short-circuit: Check token existence first (cheaper)
        _validateCertificateExists(tokenId);
        
        // Cache burn request timestamp to avoid multiple SLOADs
        uint256 requestTime = burnRequestTimestamps[tokenId];
        
        // Short-circuit: Check if burn request exists
        if (requestTime == 0) {
            revert NoBurnRequestExists(tokenId);
        }
        
        // Cache values to reduce storage reads
        address contractOwner = owner();
        address certIssuer = academicCertificates[tokenId].institutionAddress;
        
        // Only the issuing institution or contract owner can cancel the burn request
        bool isOwner = contractOwner == msg.sender;
        bool isIssuer = certIssuer == msg.sender;
        
        // Short-circuit: Check authorization
        if (!isOwner && !isIssuer) {
            revert NotAuthorizedToCancelBurn(tokenId, msg.sender);
        }
        
        // Reset the burn request data
        _cleanupBurnData(tokenId);
        
        // Emit the cancellation event
        emit CertificateBurnRequestCanceled(tokenId, msg.sender);
    }

    event CertificateBurnRequestCanceled(
        uint256 indexed tokenId,
        address indexed canceler
    );
} 