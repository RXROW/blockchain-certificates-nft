// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// Base contract with core data structures and functionality
contract CertificateNFTBase is ERC721URIStorage, ERC721Enumerable, Ownable, AccessControl {
    // Token counter
    uint256 internal _tokenIds;

    // Role definitions
    bytes32 public constant INSTITUTION_ROLE = keccak256("INSTITUTION_ROLE");
    bytes32 public constant INSTRUCTOR_ROLE = keccak256("INSTRUCTOR_ROLE");

    // Certificate data structure
    struct AcademicCertificate {
        address studentAddress;      // Student's wallet
        address institutionAddress;  // Institution's wallet
        uint256 courseId;            // Unique course identifier
        uint256 completionDate;      // Completion timestamp
        uint256 grade;               // Numerical grade
        bool isVerified;             // Verification status
        string certificateHash;      // Hash of full certificate data
        bool isRevoked;              // Revocation status
        string revocationReason;     // Reason for revocation if revoked
        uint256 version;             // Certificate version number
        uint256 lastUpdateDate;      // Last update timestamp
        string updateReason;         // Reason for update
    }

    // Essential mappings
    mapping(uint256 => AcademicCertificate) public academicCertificates;
    mapping(address => bool) public authorizedInstitutions;
    mapping(uint256 => bool) public verifiedCertificates;
    mapping(uint256 => string) public courseNames;  // Course ID to name mapping
    
    // Transfer control for Soulbound functionality
    bool public transfersAllowedByInstitution;   // Global transfer control for institutions only
    
    // Core events
    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed student,
        address indexed institution,
        uint256 courseId,
        uint256 completionDate,
        uint256 grade
    );

    event CertificateVerified(
        uint256 indexed tokenId,
        address indexed verifier
    );

    event CertificateRevoked(
        uint256 indexed tokenId,
        address indexed revoker,
        string reason
    );

    event CertificateUpdated(
        uint256 indexed tokenId,
        uint256 newGrade,
        string updateReason
    );

    event CertificateStatusChanged(
        uint256 indexed tokenId,
        bool isVerified,
        bool isRevoked,
        address indexed updatedBy,
        uint256 timestamp
    );

    event InstitutionAuthorized(address indexed institution);
    event InstitutionRevoked(address indexed institution);
    event TransferStatusChanged(bool enabled);

    constructor() ERC721("SoulboundAcademicCertificate", "SACERT") Ownable(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(INSTITUTION_ROLE, msg.sender);
        transfersAllowedByInstitution = false; // Disable transfers by default (Soulbound)
    }

    // Modifiers
    modifier onlyInstitution() {
        require(hasRole(INSTITUTION_ROLE, msg.sender), "Caller is not an institution");
        _;
    }

    modifier onlyInstructor() {
        require(hasRole(INSTRUCTOR_ROLE, msg.sender), "Caller is not an instructor");
        _;
    }

    // Required overrides for ERC721 extensions
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Implements Soulbound behavior:
        // 1. Allow minting (when from is zero address)
        // 2. Allow burning (when to is zero address)
        // 3. Allow institutional transfers if explicitly enabled
        // 4. Disallow all other transfers
        
        if (from != address(0) && to != address(0)) {
            // This is a transfer (not minting or burning)
            
            // Only allow transfers by institutions when explicitly enabled
            require(hasRole(INSTITUTION_ROLE, auth) && transfersAllowedByInstitution, 
                "Certificate is Soulbound: transfers not allowed");
            
            // Update the student address when transferring
            academicCertificates[tokenId].studentAddress = to;
        }
        
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    // Helper function - used by multiple contracts
    function tokenExists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    // Function to enable/disable institutional transfers (admin only)
    function setInstitutionTransfersAllowed(bool _enabled) public onlyOwner {
        transfersAllowedByInstitution = _enabled;
        emit TransferStatusChanged(_enabled);
    }
} 