# Soulbound Academic Certificate NFT

A blockchain-based solution for issuing, verifying, and managing academic certificates as Soulbound NFTs (non-transferable tokens).

## What are Soulbound NFTs?

Soulbound NFTs are non-transferable tokens that remain bound to the recipient's wallet address. Unlike typical NFTs, they cannot be transferred or sold once minted, making them ideal for credentials, certificates, and identity-related applications.

## Key Features

- **Soulbound Tokens**: Certificates cannot be transferred after issuance, ensuring authenticity and preventing certificate trading.
- **Institution Management**: Authorized institutions can issue, verify, and revoke certificates.
- **Certificate Verification**: Official verification process to validate a certificate's authenticity.
- **Certificate Revocation**: Institutions can revoke certificates with documented reasons.
- **Certificate Burning**: Complete removal of certificates for GDPR compliance and critical error correction.
- **Secure Burn Protocol**: Timelock and approval system to prevent malicious certificate destruction.
- **Comprehensive Querying**: Advanced filtering and search capabilities for certificate discovery.
- **Batch Operations**: Efficient bulk operations for certificate management at scale.
- **Role-Based Access Control**: Separate roles for institutions, instructors, and administrators.

## Contract Structure

The system is built with a modular design:

1. **SoulboundCertificateNFT.sol**: Main contract that inherits all functionality.
2. **CertificateNFTBase.sol**: Core data structures and Soulbound implementation.
3. **CertificateManagement.sol**: Certificate issuance and management functions.
4. **BatchOperations.sol**: Bulk operations for efficiency.
5. **QueryFunctions.sol**: Basic certificate queries.
6. **AdvancedQueries.sol**: Advanced filtering and queries.

## Certificate Data Structure

Each certificate contains:
- Student's wallet address
- Issuing institution's address
- Course information
- Completion date
- Grade
- Verification status
- Certificate hash
- Revocation status and reason (if applicable)
- Version history

## Security Features

- Soulbound implementation prevents certificate transfers
- Only authorized institutions can issue certificates
- Role-based access control for different operations
- Certificate versioning for tracking updates
- Revocation capabilities with reason documentation
- Timelock system for burn operations (default: 3 days waiting period)
- Admin approval workflow for urgent burn requests

## Certificate Lifecycle Management

The system supports the complete lifecycle of certificates:

1. **Issuance**: Minting a new certificate to a student's wallet
2. **Verification**: Validating the certificate's authenticity
3. **Updates**: Modifying certificate data with version tracking
4. **Revocation**: Invalidating certificates while preserving their history
5. **Burning**: Complete removal of certificates with multi-layer security

### Revocation vs. Burning

- **Revocation**: Marks a certificate as invalid while preserving its data and history
- **Burning**: Completely removes a certificate from the blockchain
  - Used for GDPR "right to be forgotten" requests
  - Correcting critical issuance errors
  - System migration after certificate reissuance
  - Test certificate cleanup

### Secure Burn Protocol

To prevent malicious destruction of valid certificates, the system implements a secure burn protocol:

1. **Request Phase**: Institution requests to burn a certificate with documented reason
2. **Timelock Period**: 3-day waiting period before the burn can be executed
3. **Admin Approval**: Contract owner can approve urgent burn requests to bypass timelock
4. **Execution Phase**: After timelock or approval, the burn can be executed
5. **Event Tracking**: All burn requests, approvals, and executions are tracked on-chain

This multi-layered approach prevents compromised institutions from immediately destroying valid certificates while still providing flexibility for legitimate use cases.

## Use Cases

- Academic degree and course certificates
- Professional certifications
- Training completion certificates
- Achievement verifications
- Skill credentials
