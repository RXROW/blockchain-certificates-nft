// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AdvancedQueries.sol";

/**
 * @title SoulboundCertificateNFT
 * @dev Academic Certificate NFT with comprehensive management and query capabilities
 * Implements Soulbound token pattern - certificates cannot be transferred after issuance
 * This is the main contract that inherits from a chain of specialized contracts to
 * reduce individual contract size, making deployment more gas-efficient.
 */
contract SoulboundCertificateNFT is AdvancedQueries {
    // This contract inherits all functionality from:
    // 1. CertificateNFTBase - Core data structures and Soulbound implementation
    // 2. CertificateManagement - Certificate issuance and management
    // 3. BatchOperations - Bulk operations for efficiency
    // 4. QueryFunctions - Basic certificate queries
    // 5. AdvancedQueries - Advanced filtering and queries
    
    // The constructor is inherited from CertificateNFTBase
} 