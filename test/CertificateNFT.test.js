const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

async function deployCertificateNFTFixture() {
  const [owner, institution, student, instructor, unauthorized, otherAccount] = await ethers.getSigners();
  
  const SoulboundCertificateNFT = await ethers.getContractFactory("SoulboundCertificateNFT");
  const certificateNFT = await SoulboundCertificateNFT.deploy();
  await certificateNFT.waitForDeployment();

  // Setup roles
  await certificateNFT.authorizeInstitution(institution.address);
  await certificateNFT.grantRole(await certificateNFT.INSTRUCTOR_ROLE(), instructor.address);

  return { certificateNFT, owner, institution, student, instructor, unauthorized, otherAccount };
}

describe("SoulboundCertificateNFT", function () {
  let SoulboundCertificateNFT;
  let certificateNFT;
  let owner;
  let institution;
  let student;
  let instructor;
  let unauthorized;
  let newOwner;

  beforeEach(async function () {
    [owner, institution, student, instructor, unauthorized, newOwner] = await ethers.getSigners();
    SoulboundCertificateNFT = await ethers.getContractFactory("SoulboundCertificateNFT");
    certificateNFT = await SoulboundCertificateNFT.deploy();
    await certificateNFT.waitForDeployment();

    // Setup roles
    await certificateNFT.authorizeInstitution(institution.address);
    await certificateNFT.grantRole(await certificateNFT.INSTRUCTOR_ROLE(), instructor.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await certificateNFT.owner()).to.equal(owner.address);
    });

    it("Should have the correct name and symbol", async function () {
      expect(await certificateNFT.name()).to.equal("SoulboundAcademicCertificate");
      expect(await certificateNFT.symbol()).to.equal("SACERT");
    });

    it("Should have institutional transfers disabled by default (Soulbound)", async function () {
      expect(await certificateNFT.transfersAllowedByInstitution()).to.be.false;
    });

    it("Should set up initial roles correctly", async function () {
      expect(await certificateNFT.hasRole(await certificateNFT.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await certificateNFT.hasRole(await certificateNFT.INSTITUTION_ROLE(), institution.address)).to.be.true;
      expect(await certificateNFT.hasRole(await certificateNFT.INSTRUCTOR_ROLE(), instructor.address)).to.be.true;
    });
    
    it("Should have the default burn timelock set to 3 days", async function () {
      // 3 days in seconds = 259200
      expect(await certificateNFT.burnTimelock()).to.equal(259200);
    });
  });

  describe("Institution Management", function () {
    it("Should authorize institution correctly", async function () {
      const newInstitution = (await ethers.getSigners())[4];
      await expect(certificateNFT.authorizeInstitution(newInstitution.address))
        .to.emit(certificateNFT, "InstitutionAuthorized")
        .withArgs(newInstitution.address);
      
      expect(await certificateNFT.authorizedInstitutions(newInstitution.address)).to.be.true;
    });

    it("Should not allow unauthorized address to authorize institutions", async function () {
      const newInstitution = (await ethers.getSigners())[4];
      await expect(
        certificateNFT.connect(student).authorizeInstitution(newInstitution.address)
      ).to.be.reverted;
    });

    it("Should not allow authorizing an already authorized institution", async function () {
      const newInstitution = (await ethers.getSigners())[4];
      await certificateNFT.authorizeInstitution(newInstitution.address);
      await expect(
        certificateNFT.authorizeInstitution(newInstitution.address)
      ).to.be.reverted;
    });

    it("Should revoke institution correctly", async function () {
      const newInstitution = (await ethers.getSigners())[4];
      await certificateNFT.authorizeInstitution(newInstitution.address);
      await expect(certificateNFT.revokeInstitution(newInstitution.address))
        .to.emit(certificateNFT, "InstitutionRevoked")
        .withArgs(newInstitution.address);
      
      expect(await certificateNFT.authorizedInstitutions(newInstitution.address)).to.be.false;
    });

    it("Should not allow revoking an unauthorized institution", async function () {
      const newInstitution = (await ethers.getSigners())[4];
      await expect(
        certificateNFT.revokeInstitution(newInstitution.address)
      ).to.be.reverted;
    });
  });

  describe("Certificate Issuance", function () {
    it("Should issue a certificate with correct data", async function () {
      const courseId = 1;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      
      // Issue certificate and get the transaction
      const tx = await certificateNFT.connect(institution).issueCertificate(
        student.address,
        courseId,
        grade,
        certificateHash
      );
      
      // Wait for transaction to be mined to get the actual timestamp
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      const actualTimestamp = block.timestamp;
      
      // Verify the event was emitted with the correct data
      await expect(tx)
        .to.emit(certificateNFT, "CertificateIssued")
        .withArgs(1, student.address, institution.address, courseId, actualTimestamp, grade);

      const cert = await certificateNFT.getCertificate(1);
      expect(cert.student).to.equal(student.address);
      expect(cert.institution).to.equal(institution.address);
      expect(cert.courseId).to.equal(courseId);
      expect(cert.grade).to.equal(grade);
      expect(cert.version).to.equal(1);
      expect(cert.isVerified).to.be.false;
      expect(cert.isRevoked).to.be.false;
    });

    it("Should not allow unauthorized address to issue certificates", async function () {
      const courseId = 1;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      
      await expect(
        certificateNFT.connect(student).issueCertificate(
          student.address,
          courseId,
          grade,
          certificateHash
        )
      ).to.be.reverted;
    });

    it("Should not allow issuing certificate to zero address", async function () {
      const courseId = 1;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      
      await expect(
        certificateNFT.connect(institution).issueCertificate(
          ethers.ZeroAddress,
          courseId,
          grade,
          certificateHash
        )
      ).to.be.reverted;
    });

    it("Should not allow issuing certificate with empty hash", async function () {
      const courseId = 1;
      const grade = 85;
      
      await expect(
        certificateNFT.connect(institution).issueCertificate(
          student.address,
          courseId,
          grade,
          ""
        )
      ).to.be.reverted;
    });

    it("Should not allow issuing certificate with invalid course ID", async function () {
      const courseId = 0;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      
      await expect(
        certificateNFT.connect(institution).issueCertificate(
          student.address,
          courseId,
          grade,
          certificateHash
        )
      ).to.be.reverted;
    });

    it("Should increment token IDs correctly", async function () {
      const courseId = 1;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      
      // Issue first certificate
      await certificateNFT.connect(institution).issueCertificate(
        student.address,
        courseId,
        grade,
        certificateHash
      );
      
      // Issue second certificate
      await certificateNFT.connect(institution).issueCertificate(
        instructor.address,
        courseId,
        grade,
        certificateHash
      );
      
      expect(await certificateNFT.ownerOf(1)).to.equal(student.address);
      expect(await certificateNFT.ownerOf(2)).to.equal(instructor.address);
    });
  });

  describe("Certificate Verification", function () {
    beforeEach(async function () {
      const courseId = 1;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      await certificateNFT.connect(institution).issueCertificate(
        student.address,
        courseId,
        grade,
        certificateHash
      );
    });

    it("Should verify certificate correctly", async function () {
      await expect(certificateNFT.connect(institution).verifyCertificate(1))
        .to.emit(certificateNFT, "CertificateVerified")
        .withArgs(1, institution.address);

      const cert = await certificateNFT.getCertificate(1);
      expect(cert.isVerified).to.be.true;
      expect(await certificateNFT.verifiedCertificates(1)).to.be.true;
    });

    it("Should not allow unauthorized address to verify certificates", async function () {
      await expect(
        certificateNFT.connect(unauthorized).verifyCertificate(1)
      ).to.be.reverted;
    });

    it("Should not allow verification of non-existent certificate", async function () {
      await expect(
        certificateNFT.connect(institution).verifyCertificate(999)
      ).to.be.reverted;
    });

    it("Should not allow verification of revoked certificate", async function () {
      await certificateNFT.connect(institution).revokeCertificate(1, "Test revocation");
      await expect(
        certificateNFT.connect(institution).verifyCertificate(1)
      ).to.be.reverted;
    });

    it("Should not allow verification of already verified certificate", async function () {
      await certificateNFT.connect(institution).verifyCertificate(1);
      await expect(
        certificateNFT.connect(institution).verifyCertificate(1)
      ).to.be.reverted;
    });
  });

  describe("Certificate Updates", function () {
    beforeEach(async function () {
      const courseId = 1;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      await certificateNFT.connect(institution).issueCertificate(
        student.address,
        courseId,
        grade,
        certificateHash
      );
    });

    it("Should update certificate grade correctly", async function () {
      const newGrade = 90;
      const updateReason = "Grade correction";
      
      await expect(certificateNFT.connect(institution).updateCertificate(1, newGrade, updateReason))
        .to.emit(certificateNFT, "CertificateUpdated")
        .withArgs(1, newGrade, updateReason);

      const cert = await certificateNFT.getCertificate(1);
      expect(cert.grade).to.equal(newGrade);
      expect(cert.version).to.equal(2);
      expect(cert.updateReason).to.equal(updateReason);
      expect(cert.lastUpdateDate).to.be.gt(0);
    });

    it("Should not allow unauthorized address to update certificates", async function () {
      await expect(
        certificateNFT.connect(unauthorized).updateCertificate(1, 90, "Update attempt")
      ).to.be.reverted;
    });

    it("Should not allow updates to non-existent certificate", async function () {
      await expect(
        certificateNFT.connect(institution).updateCertificate(999, 90, "Update attempt")
      ).to.be.reverted;
    });

    it("Should not allow updates to revoked certificate", async function () {
      await certificateNFT.connect(institution).revokeCertificate(1, "Test revocation");
      await expect(
        certificateNFT.connect(institution).updateCertificate(1, 90, "Update attempt")
      ).to.be.reverted;
    });
  });

  describe("Certificate Queries", function () {
    beforeEach(async function () {
      const courseId = 1;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      
      // Issue certificate
      await certificateNFT.connect(institution).issueCertificate(
        student.address,
        courseId,
        grade,
        certificateHash
      );
    });

    it("Should return correct certificate data", async function () {
      const cert = await certificateNFT.getCertificate(1);
      
      // Check returned fields
      expect(cert.student).to.equal(student.address);
      expect(cert.institution).to.equal(institution.address);
      expect(cert.courseId).to.equal(1);
      expect(cert.grade).to.equal(85);
      expect(cert.isVerified).to.be.false;
      expect(cert.isRevoked).to.be.false;
      expect(cert.version).to.equal(1);
    });

    it("Should not allow querying non-existent certificate", async function () {
      await expect(
        certificateNFT.getCertificate(999)
      ).to.be.reverted;
    });

    it("Should return correct data after updates", async function () {
      // Update certificate
      await certificateNFT.connect(institution).updateCertificate(1, 90, "Grade correction");
      
      const cert = await certificateNFT.getCertificate(1);
      expect(cert.grade).to.equal(90);
      expect(cert.version).to.equal(2);
      expect(cert.updateReason).to.equal("Grade correction");
    });

    it("Should return correct data after revocation", async function () {
      // Revoke certificate
      await certificateNFT.connect(institution).revokeCertificate(1, "Academic misconduct");
      
      const cert = await certificateNFT.getCertificate(1);
      expect(cert.isRevoked).to.be.true;
      expect(cert.revocationReason).to.equal("Academic misconduct");
      expect(cert.version).to.equal(2);
    });
  });

  describe("Version Control", function () {
    it("Should track certificate versions correctly", async function () {
      const courseId = 1;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      
      // Issue initial certificate
      await certificateNFT.connect(institution).issueCertificate(
        student.address,
        courseId,
        grade,
        certificateHash
      );
      
      // Update certificate
      await certificateNFT.connect(institution).updateCertificate(
        1,
        90,
        "Grade correction"
      );
      
      const cert = await certificateNFT.getCertificate(1);
      expect(cert.version).to.equal(2);
      expect(cert.updateReason).to.equal("Grade correction");
    });

    it("Should increment version on revocation", async function () {
      const courseId = 1;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      
      // Issue certificate
      await certificateNFT.connect(institution).issueCertificate(
        student.address,
        courseId,
        grade,
        certificateHash
      );
      
      // Revoke certificate
      await certificateNFT.connect(institution).revokeCertificate(1, "Invalid data");
      
      const cert = await certificateNFT.getCertificate(1);
      expect(cert.version).to.equal(2);
      expect(cert.updateReason).to.equal("Certificate revoked");
    });
  });

  describe("Certificate Updates", function () {
    it("Should update certificate grade and track changes", async function () {
      const courseId = 1;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      
      // Issue certificate
      await certificateNFT.connect(institution).issueCertificate(
        student.address,
        courseId,
        grade,
        certificateHash
      );
      
      // Update grade
      const newGrade = 90;
      const updateReason = "Grade correction";
      await certificateNFT.connect(institution).updateCertificate(1, newGrade, updateReason);
      
      const cert = await certificateNFT.getCertificate(1);
      expect(cert.grade).to.equal(newGrade);
      expect(cert.version).to.equal(2);
      expect(cert.updateReason).to.equal(updateReason);
    });

    it("Should not allow updates to revoked certificates", async function () {
      const courseId = 1;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      
      // Issue certificate
      await certificateNFT.connect(institution).issueCertificate(
        student.address,
        courseId,
        grade,
        certificateHash
      );
      
      // Revoke certificate
      await certificateNFT.connect(institution).revokeCertificate(1, "Invalid data");
      
      // Attempt update should fail
      await expect(
        certificateNFT.connect(institution).updateCertificate(1, 90, "Grade correction")
      ).to.be.reverted;
    });
  });

  describe("Role Management", function () {
    it("Should manage instructor roles correctly", async function () {
      const newInstructor = (await ethers.getSigners())[4];
      
      // Grant instructor role
      await certificateNFT.grantRole(await certificateNFT.INSTRUCTOR_ROLE(), newInstructor.address);
      expect(await certificateNFT.hasRole(await certificateNFT.INSTRUCTOR_ROLE(), newInstructor.address)).to.be.true;
      
      // Revoke instructor role
      await certificateNFT.revokeRole(await certificateNFT.INSTRUCTOR_ROLE(), newInstructor.address);
      expect(await certificateNFT.hasRole(await certificateNFT.INSTRUCTOR_ROLE(), newInstructor.address)).to.be.false;
    });

    it("Should enforce role-based access for certificate operations", async function () {
      const courseId = 1;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      
      // Issue certificate as institution
      await certificateNFT.connect(institution).issueCertificate(
        student.address,
        courseId,
        grade,
        certificateHash
      );
      
      // Attempt update as instructor should fail
      await expect(
        certificateNFT.connect(instructor).updateCertificate(1, 90, "Grade correction")
      ).to.be.reverted;
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete Soulbound certificate lifecycle", async function () {
      // 1. Issue certificate
      const courseId = 1;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      
      await certificateNFT.connect(institution).issueCertificate(
        student.address,
        courseId,
        grade,
        certificateHash
      );
      
      // 2. Verify certificate
      await certificateNFT.connect(institution).verifyCertificate(1);
      
      // 3. Update certificate
      await certificateNFT.connect(institution).updateCertificate(1, 90, "Grade correction");
      
      // 4. Request burn
      await certificateNFT.connect(institution).requestBurnCertificate(1, "GDPR request");
      
      // 5. Owner approves burn
      await certificateNFT.connect(owner).approveBurnCertificate(1);
      
      // 6. Execute burn
      await certificateNFT.connect(institution).burnCertificate(1, "GDPR request execution");
      
      // Certificate should no longer exist
      await expect(certificateNFT.ownerOf(1)).to.be.reverted;
    });
    
    it("Should handle administrative transfer when needed", async function () {
      // 1. Issue certificate
      const courseId = 1;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      
      await certificateNFT.connect(institution).issueCertificate(
        student.address,
        courseId,
        grade,
        certificateHash
      );
      
      // 2. Enable institution transfers for administrative purposes
      await certificateNFT.connect(owner).setInstitutionTransfersAllowed(true);
      
      // 3. Student approves institution to transfer the certificate
      await certificateNFT.connect(student).approve(institution.address, 1);
      
      // 4. Institution transfers certificate to correct address
      await certificateNFT.connect(institution).transferFrom(student.address, newOwner.address, 1);
      
      // 5. Disable transfers again to restore Soulbound behavior
      await certificateNFT.connect(owner).setInstitutionTransfersAllowed(false);
      
      // 6. Verify certificate data was updated with new owner
      const cert = await certificateNFT.getCertificate(1);
      expect(cert.student).to.equal(newOwner.address);
      expect(await certificateNFT.ownerOf(1)).to.equal(newOwner.address);
      
      // 7. Verify transfers are no longer allowed
      // First approve the transfer
      await certificateNFT.connect(newOwner).approve(institution.address, 1);
      
      await expect(
        certificateNFT.connect(institution).transferFrom(newOwner.address, student.address, 1)
      ).to.be.reverted;
    });
  });

  describe("Course Management", function () {
    it("Should allow institution to set course name", async function () {
      const { certificateNFT, institution } = await loadFixture(deployCertificateNFTFixture);
      
      // Set course name
      await certificateNFT.connect(institution).setCourseName(1, "Blockchain Development");
      
      // Verify course name
      const courseName = await certificateNFT.getCourseName(1);
      expect(courseName).to.equal("Blockchain Development");
    });

    it("Should not allow non-institution to set course name", async function () {
      const { certificateNFT, otherAccount } = await loadFixture(deployCertificateNFTFixture);
      
      // Attempt to set course name
      await expect(
        certificateNFT.connect(otherAccount).setCourseName(1, "Blockchain Development")
      ).to.be.reverted;
    });

    it("Should not allow empty course name", async function () {
      const { certificateNFT, institution } = await loadFixture(deployCertificateNFTFixture);
      
      // Attempt to set empty course name
      await expect(
        certificateNFT.connect(institution).setCourseName(1, "")
      ).to.be.reverted;
    });

    it("Should not allow zero course ID", async function () {
      const { certificateNFT, institution } = await loadFixture(deployCertificateNFTFixture);
      
      // Attempt to set course name with ID 0
      await expect(
        certificateNFT.connect(institution).setCourseName(0, "Blockchain Development")
      ).to.be.reverted;
    });

    it("Should allow updating existing course name", async function () {
      const { certificateNFT, institution } = await loadFixture(deployCertificateNFTFixture);
      
      // Set initial course name
      await certificateNFT.connect(institution).setCourseName(1, "Blockchain Development");
      
      // Update course name
      await certificateNFT.connect(institution).setCourseName(1, "Advanced Blockchain Development");
      
      // Verify updated course name
      const courseName = await certificateNFT.getCourseName(1);
      expect(courseName).to.equal("Advanced Blockchain Development");
    });

    it("Should return empty string for non-existent course", async function () {
      const { certificateNFT } = await loadFixture(deployCertificateNFTFixture);
      
      // Get non-existent course name
      const courseName = await certificateNFT.getCourseName(999);
      expect(courseName).to.equal("");
    });

    it("Should allow anyone to read course names", async function () {
      const { certificateNFT, institution, otherAccount } = await loadFixture(deployCertificateNFTFixture);
      
      // Set course name
      await certificateNFT.connect(institution).setCourseName(1, "Blockchain Development");
      
      // Read course name from different account
      const courseName = await certificateNFT.connect(otherAccount).getCourseName(1);
      expect(courseName).to.equal("Blockchain Development");
    });
  });

  describe("New status-based filtering and pagination", function () {
    beforeEach(async function () {
      // Issue multiple certificates with different statuses for testing
      
      // Pending certificates (id: 1, 2, 3)
      await certificateNFT.connect(institution).issueCertificate(student.address, 1, 95, "QmHashOfCertificate");
      await certificateNFT.connect(institution).issueCertificate(student.address, 2, 85, "QmHashOfCertificate");
      await certificateNFT.connect(institution).issueCertificate(student.address, 3, 75, "QmHashOfCertificate");
      
      // Verified certificates (id: 4, 5, 6)
      await certificateNFT.connect(institution).issueCertificate(student.address, 4, 95, "QmHashOfCertificate");
      await certificateNFT.connect(institution).issueCertificate(student.address, 5, 85, "QmHashOfCertificate");
      await certificateNFT.connect(institution).issueCertificate(student.address, 6, 75, "QmHashOfCertificate");
      
      await certificateNFT.connect(institution).verifyCertificate(4);
      await certificateNFT.connect(institution).verifyCertificate(5);
      await certificateNFT.connect(institution).verifyCertificate(6);
      
      // Revoked certificates (id: 7, 8)
      await certificateNFT.connect(institution).issueCertificate(student.address, 7, 95, "QmHashOfCertificate");
      await certificateNFT.connect(institution).issueCertificate(student.address, 8, 85, "QmHashOfCertificate");
      
      await certificateNFT.connect(institution).revokeCertificate(7, "Academic dishonesty");
      await certificateNFT.connect(institution).revokeCertificate(8, "Academic dishonesty");
    });

    it("Should get pending certificates with pagination", async function () {
      const limit = 2;
      
      // Get first page of pending certificates
      const pendingPage1 = await certificateNFT.getPendingCertificateIds(0, limit);
      expect(pendingPage1.length).to.equal(limit);
      expect(pendingPage1[0]).to.equal(1);
      expect(pendingPage1[1]).to.equal(2);
      
      // Get second page of pending certificates
      const pendingPage2 = await certificateNFT.getPendingCertificateIds(limit, limit);
      expect(pendingPage2.length).to.equal(1);
      expect(pendingPage2[0]).to.equal(3);
    });

    it("Should get verified certificates with pagination", async function () {
      const limit = 2;
      
      // Get first page of verified certificates
      const verifiedPage1 = await certificateNFT.getVerifiedCertificateIds(0, limit);
      expect(verifiedPage1.length).to.equal(limit);
      expect(verifiedPage1[0]).to.equal(4);
      expect(verifiedPage1[1]).to.equal(5);
      
      // Get second page of verified certificates
      const verifiedPage2 = await certificateNFT.getVerifiedCertificateIds(limit, limit);
      expect(verifiedPage2.length).to.equal(1);
      expect(verifiedPage2[0]).to.equal(6);
    });

    it("Should get revoked certificates with pagination", async function () {
      const revokedCerts = await certificateNFT.getRevokedCertificateIds(0, 10);
      expect(revokedCerts.length).to.equal(2);
      expect(revokedCerts[0]).to.equal(7);
      expect(revokedCerts[1]).to.equal(8);
    });

    it("Should handle edge cases in pagination", async function () {
      // Out of bounds startIndex
      const outOfBounds = await certificateNFT.getPendingCertificateIds(100, 2);
      expect(outOfBounds.length).to.equal(0);
      
      // Zero limit
      const zeroLimit = await certificateNFT.getPendingCertificateIds(0, 0);
      expect(zeroLimit.length).to.equal(0);
    });

    it("Should correctly count certificates by status", async function () {
      const pendingCount = await certificateNFT.countCertificatesByStatus(false, false);
      expect(pendingCount).to.equal(3);
      
      const verifiedCount = await certificateNFT.countCertificatesByStatus(true, false);
      expect(verifiedCount).to.equal(3);
      
      const revokedCount = await certificateNFT.countCertificatesByStatus(false, true);
      expect(revokedCount).to.equal(2);
    });
  });

  describe("Entity-based filtering", function () {
    beforeEach(async function () {
      // Issue multiple certificates to different students and for different courses
      
      // Student1 certificates (id: 1, 2, 3)
      await certificateNFT.connect(institution).issueCertificate(student.address, 1, 95, "QmHashOfCertificate");
      await certificateNFT.connect(institution).issueCertificate(student.address, 2, 85, "QmHashOfCertificate");
      await certificateNFT.connect(institution).issueCertificate(student.address, 3, 75, "QmHashOfCertificate");
      
      // Student2 certificates (id: 4, 5)
      await certificateNFT.connect(institution).issueCertificate(instructor.address, 4, 95, "QmHashOfCertificate");
      await certificateNFT.connect(institution).issueCertificate(instructor.address, 5, 85, "QmHashOfCertificate");
      
      // Student3 certificates (id: 6)
      await certificateNFT.connect(institution).issueCertificate(unauthorized.address, 6, 75, "QmHashOfCertificate");
    });

    it("Should get certificates by student with pagination", async function () {
      const limit = 2;
      
      // Get first page of student1 certificates
      const student1Certs1 = await certificateNFT.getCertificatesByStudent(student.address, 0, limit);
      expect(student1Certs1.length).to.equal(limit);
      expect(student1Certs1[0]).to.equal(1);
      expect(student1Certs1[1]).to.equal(2);
      
      // Get second page of student1 certificates
      const student1Certs2 = await certificateNFT.getCertificatesByStudent(student.address, limit, limit);
      expect(student1Certs2.length).to.equal(1);
      expect(student1Certs2[0]).to.equal(3);
      
      // Get student2 certificates
      const student2Certs = await certificateNFT.getCertificatesByStudent(instructor.address, 0, limit);
      expect(student2Certs.length).to.equal(2);
      expect(student2Certs[0]).to.equal(4);
      expect(student2Certs[1]).to.equal(5);
      
      // Get student3 certificates
      const student3Certs = await certificateNFT.getCertificatesByStudent(unauthorized.address, 0, limit);
      expect(student3Certs.length).to.equal(1);
      expect(student3Certs[0]).to.equal(6);
    });

    it("Should get certificates by institution", async function () {
      // All certificates in tests are issued by the same institution
      const institutionCerts = await certificateNFT.getCertificatesByInstitution(institution.address, 0, 10);
      expect(institutionCerts.length).to.equal(6);
    });

    it("Should get certificates by course with pagination", async function () {
      // Different course IDs were used in certificate issuance
      // Course 1 certificates (id: 1, 4, 6)
      const course1Certs = await certificateNFT.getCertificatesByCourse(1, 0, 10);
      expect(course1Certs.length).to.equal(1);
      expect(course1Certs[0]).to.equal(1);
      
      // Course 2 certificates (id: 2, 5)
      const course2Certs = await certificateNFT.getCertificatesByCourse(2, 0, 10);
      expect(course2Certs.length).to.equal(1);
      expect(course2Certs[0]).to.equal(2);
      
      // Course 3 certificates (id: 3)
      const course3Certs = await certificateNFT.getCertificatesByCourse(3, 0, 10);
      expect(course3Certs.length).to.equal(1);
      expect(course3Certs[0]).to.equal(3);
    });

    it("Should correctly count certificates by institution", async function () {
      const institutionCount = await certificateNFT.countCertificatesByInstitution(institution.address);
      expect(institutionCount).to.equal(6);
      
      const randomAddressCount = await certificateNFT.countCertificatesByInstitution(student.address);
      expect(randomAddressCount).to.equal(0);
    });

    it("Should correctly count certificates by course", async function () {
      const course1Count = await certificateNFT.countCertificatesByCourse(1);
      expect(course1Count).to.equal(1);
      
      const course2Count = await certificateNFT.countCertificatesByCourse(2);
      expect(course2Count).to.equal(1);
      
      const course3Count = await certificateNFT.countCertificatesByCourse(3);
      expect(course3Count).to.equal(1);
      
      const nonExistentCourseCount = await certificateNFT.countCertificatesByCourse(999);
      expect(nonExistentCourseCount).to.equal(0);
    });
  });

  describe("Date range filtering", function () {
    it("Should filter certificates by date range", async function () {
      // For testing date ranges, we'll need to mock timestamp behavior
      // This is a simplified implementation using the current block timestamp
      
      // Issue a certificate now
      await certificateNFT.connect(institution).issueCertificate(student.address, 1, 95, "QmHashOfCertificate");
      
      // Get the current block timestamp
      const currentTimestamp = await time.latest();
      
      // Set a date range from the past to the future
      const startDate = currentTimestamp - 3600; // 1 hour ago
      const endDate = currentTimestamp + 3600; // 1 hour from now
      
      const certificates = await certificateNFT.getCertificatesByDateRange(startDate, endDate, 0, 10);
      expect(certificates.length).to.equal(1);
      expect(certificates[0]).to.equal(1);
      
      // Try a date range in the future
      const futureStartDate = currentTimestamp + 7200; // 2 hours from now
      const futureEndDate = currentTimestamp + 10800; // 3 hours from now
      
      const futureCertificates = await certificateNFT.getCertificatesByDateRange(futureStartDate, futureEndDate, 0, 10);
      expect(futureCertificates.length).to.equal(0);
    });
  });

  describe("Batch operations", function () {
    beforeEach(async function () {
      // Issue certificates for batch operations testing
      await certificateNFT.connect(institution).issueCertificate(student.address, 1, 95, "QmHashOfCertificate");
      await certificateNFT.connect(institution).issueCertificate(student.address, 2, 85, "QmHashOfCertificate");
      await certificateNFT.connect(institution).issueCertificate(student.address, 3, 75, "QmHashOfCertificate");
    });

    it("Should get multiple certificates in a batch", async function () {
      const tokenIds = [1, 2, 3];
      
      const [
        students,
        institutions,
        courseIds,
        completionDates,
        grades,
        verificationStatuses,
        revocationStatuses
      ] = await certificateNFT.getCertificatesBatch(tokenIds);
      
      expect(students.length).to.equal(3);
      expect(students[0]).to.equal(student.address);
      expect(students[1]).to.equal(student.address);
      expect(students[2]).to.equal(student.address);
      
      expect(institutions[0]).to.equal(institution.address);
      expect(institutions[1]).to.equal(institution.address);
      expect(institutions[2]).to.equal(institution.address);
      
      expect(courseIds[0]).to.equal(1);
      expect(courseIds[1]).to.equal(2);
      expect(courseIds[2]).to.equal(3);
      
      expect(grades[0]).to.equal(95);
      expect(grades[1]).to.equal(85);
      expect(grades[2]).to.equal(75);
      
      // All should be unverified and not revoked
      for (let i = 0; i < 3; i++) {
        expect(verificationStatuses[i]).to.equal(false);
        expect(revocationStatuses[i]).to.equal(false);
      }
    });

    it("Should verify multiple certificates in a batch", async function () {
      const tokenIds = [1, 2];
      
      await certificateNFT.connect(institution).verifyMultipleCertificates(tokenIds);
      
      // Check verification status one by one
      const cert1 = await certificateNFT.getCertificate(1);
      const cert2 = await certificateNFT.getCertificate(2);
      const cert3 = await certificateNFT.getCertificate(3);
      
      expect(cert1.isVerified).to.equal(true);
      expect(cert2.isVerified).to.equal(true);
      expect(cert3.isVerified).to.equal(false); // Not included in the batch
    });

    it("Should set multiple course names in a batch", async function () {
      const courseIds = [3, 4];
      const names = ["Advanced Cryptography", "Decentralized Finance"];
      
      await certificateNFT.connect(institution).setMultipleCourseNames(courseIds, names);
      
      // Check course names one by one
      const name3 = await certificateNFT.getCourseName(courseIds[0]);
      const name4 = await certificateNFT.getCourseName(courseIds[1]);
      
      expect(name3).to.equal(names[0]);
      expect(name4).to.equal(names[1]);
    });

    it("Should get course names in a batch", async function () {
      const courseIds = [1, 2];
      
      // Set course names first
      await certificateNFT.connect(institution).setCourseName(1, "Blockchain Development");
      await certificateNFT.connect(institution).setCourseName(2, "Smart Contract Security");
      
      const names = await certificateNFT.getCourseNamesBatch(courseIds);
      
      expect(names.length).to.equal(2);
      expect(names[0]).to.equal("Blockchain Development");
      expect(names[1]).to.equal("Smart Contract Security");
    });

    it("Should set certificate URIs in a batch", async function () {
      const tokenIds = [1, 2];
      const uris = ["ipfs://Qm1", "ipfs://Qm2"];
      
      await certificateNFT.connect(institution).setBatchCertificateURIs(tokenIds, uris);
      
      // Check token URIs one by one
      const uri1 = await certificateNFT.tokenURI(tokenIds[0]);
      const uri2 = await certificateNFT.tokenURI(tokenIds[1]);
      
      expect(uri1).to.equal(uris[0]);
      expect(uri2).to.equal(uris[1]);
    });
  });

  describe("Recent certificates retrieval", function () {
    it("Should get the most recent certificates", async function () {
      // Issue 5 certificates
      for (let i = 0; i < 5; i++) {
        await certificateNFT.connect(institution).issueCertificate(
          student.address, 1, 95, "QmHashOfCertificate"
        );
      }
      
      // Get the 3 most recent certificates
      const recentCerts = await certificateNFT.getRecentCertificates(3);
      
      expect(recentCerts.length).to.equal(3);
      expect(recentCerts[0]).to.equal(5); // Most recent
      expect(recentCerts[1]).to.equal(4);
      expect(recentCerts[2]).to.equal(3);
    });

    it("Should handle requesting more certificates than exist", async function () {
      // Issue 2 certificates
      await certificateNFT.connect(institution).issueCertificate(student.address, 1, 95, "QmHashOfCertificate");
      await certificateNFT.connect(institution).issueCertificate(student.address, 2, 85, "QmHashOfCertificate");
      
      // Request 5 (more than exist)
      const recentCerts = await certificateNFT.getRecentCertificates(5);
      
      expect(recentCerts.length).to.equal(2);
      expect(recentCerts[0]).to.equal(2);
      expect(recentCerts[1]).to.equal(1);
    });
  });

  describe("Events", function () {
    it("Should emit CertificateStatusChanged event on verification", async function () {
      await certificateNFT.connect(institution).issueCertificate(student.address, 1, 95, "QmHashOfCertificate");
      
      const currentTimestamp = await time.latest();
      
      await expect(certificateNFT.connect(institution).verifyCertificate(1))
        .to.emit(certificateNFT, 'CertificateStatusChanged')
        .withArgs(1, true, false, institution.address, currentTimestamp + 1);
    });

    it("Should emit CertificateStatusChanged event on revocation", async function () {
      await certificateNFT.connect(institution).issueCertificate(student.address, 1, 95, "QmHashOfCertificate");
      
      const currentTimestamp = await time.latest();
      
      await expect(certificateNFT.connect(institution).revokeCertificate(1, "Academic dishonesty"))
        .to.emit(certificateNFT, 'CertificateStatusChanged')
        .withArgs(1, false, true, institution.address, currentTimestamp + 1);
    });
  });

  describe("Soulbound Functionality", function () {
    beforeEach(async function () {
      const courseId = 1;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      await certificateNFT.connect(institution).issueCertificate(
        student.address,
        courseId,
        grade,
        certificateHash
      );
    });

    it("Should prevent transfer by default (Soulbound behavior)", async function () {
      // First approve the token to be transferred
      await certificateNFT.connect(student).approve(newOwner.address, 1);
      
      await expect(
        certificateNFT.connect(student).transferFrom(student.address, newOwner.address, 1)
      ).to.be.reverted;
    });

    it("Should prevent transfer even if owner tries to enable it", async function () {
      // Set institution transfers to allowed
      await certificateNFT.connect(owner).setInstitutionTransfersAllowed(true);
      
      // First approve the token to be transferred
      await certificateNFT.connect(student).approve(newOwner.address, 1);
      
      // Student still shouldn't be able to transfer
      await expect(
        certificateNFT.connect(student).transferFrom(student.address, newOwner.address, 1)
      ).to.be.reverted;
    });

    it("Should allow institutional transfers when explicitly enabled", async function () {
      // Set institution transfers to allowed
      await certificateNFT.connect(owner).setInstitutionTransfersAllowed(true);
      
      // First student needs to approve the institution to transfer
      await certificateNFT.connect(student).approve(institution.address, 1);
      
      // Institution should be able to transfer
      await certificateNFT.connect(institution).transferFrom(student.address, newOwner.address, 1);
      expect(await certificateNFT.ownerOf(1)).to.equal(newOwner.address);
      
      // The student address in the certificate data should also be updated
      const cert = await certificateNFT.getCertificate(1);
      expect(cert.student).to.equal(newOwner.address);
    });

    it("Should toggle institution transfer setting correctly", async function () {
      // Initially disabled
      expect(await certificateNFT.transfersAllowedByInstitution()).to.be.false;
      
      // Enable
      await expect(certificateNFT.setInstitutionTransfersAllowed(true))
        .to.emit(certificateNFT, "TransferStatusChanged")
        .withArgs(true);
      expect(await certificateNFT.transfersAllowedByInstitution()).to.be.true;
      
      // Disable
      await expect(certificateNFT.setInstitutionTransfersAllowed(false))
        .to.emit(certificateNFT, "TransferStatusChanged")
        .withArgs(false);
      expect(await certificateNFT.transfersAllowedByInstitution()).to.be.false;
    });
  });

  describe("Certificate Burning", function () {
    beforeEach(async function () {
      const courseId = 1;
      const grade = 85;
      const certificateHash = "ipfs://QmTestHash";
      await certificateNFT.connect(institution).issueCertificate(
        student.address,
        courseId,
        grade,
        certificateHash
      );
    });

    it("Should allow owner to burn certificate immediately", async function () {
      const reason = "Test owner burn";
      await expect(certificateNFT.connect(owner).burnCertificate(1, reason))
        .to.emit(certificateNFT, "CertificateBurned")
        .withArgs(1, owner.address, reason);
      
      // Certificate should no longer exist
      await expect(certificateNFT.ownerOf(1)).to.be.reverted;
    });

    it("Should prevent institutions from burning without request or approval", async function () {
      await expect(
        certificateNFT.connect(institution).burnCertificate(1, "Unauthorized burn attempt")
      ).to.be.reverted;
    });

    it("Should allow burning after timelock period", async function () {
      const burnReason = "GDPR request";
      
      // Request burn
      await expect(certificateNFT.connect(institution).requestBurnCertificate(1, burnReason))
        .to.emit(certificateNFT, "CertificateBurnRequested");
      
      // Fast forward time by 3 days + 1 second
      await time.increase(259201);
      
      // Now burn should succeed
      await expect(certificateNFT.connect(institution).burnCertificate(1, burnReason))
        .to.emit(certificateNFT, "CertificateBurned")
        .withArgs(1, institution.address, burnReason);
      
      // Certificate should no longer exist
      await expect(certificateNFT.ownerOf(1)).to.be.reverted;
    });

    it("Should allow burning with owner approval before timelock", async function () {
      const burnReason = "Urgent correction needed";
      
      // Request burn
      await certificateNFT.connect(institution).requestBurnCertificate(1, burnReason);
      
      // Owner approves it
      await expect(certificateNFT.connect(owner).approveBurnCertificate(1))
        .to.emit(certificateNFT, "CertificateBurnApproved")
        .withArgs(1, owner.address);
      
      // Burn should succeed immediately without waiting
      await expect(certificateNFT.connect(institution).burnCertificate(1, burnReason))
        .to.emit(certificateNFT, "CertificateBurned");
      
      // Certificate should no longer exist
      await expect(certificateNFT.ownerOf(1)).to.be.reverted;
    });

    it("Should allow changing the burn timelock period", async function () {
      // Change timelock to 1 hour (3600 seconds)
      await expect(certificateNFT.connect(owner).setBurnTimelock(3600))
        .to.emit(certificateNFT, "BurnTimelockChanged")
        .withArgs(3600);
      
      expect(await certificateNFT.burnTimelock()).to.equal(3600);
      
      // Request burn
      await certificateNFT.connect(institution).requestBurnCertificate(1, "Test with shorter timelock");
      
      // Fast forward by 1 hour + 1 second
      await time.increase(3601);
      
      // Now burn should succeed
      await certificateNFT.connect(institution).burnCertificate(1, "Test with shorter timelock");
      
      // Certificate should no longer exist
      await expect(certificateNFT.ownerOf(1)).to.be.reverted;
    });

    it("Should prevent unauthorized users from approving burns", async function () {
      await expect(
        certificateNFT.connect(unauthorized).approveBurnCertificate(1)
      ).to.be.reverted;
    });

    it("Should prevent unauthorized users from changing the timelock", async function () {
      await expect(
        certificateNFT.connect(unauthorized).setBurnTimelock(1)
      ).to.be.reverted;
    });

    it("Should prevent non-issuing institutions from requesting burns", async function () {
      // Authorize a second institution
      await certificateNFT.authorizeInstitution(newOwner.address);
      
      // Second institution tries to request burn for certificate issued by first institution
      await expect(
        certificateNFT.connect(newOwner).requestBurnCertificate(1, "Unauthorized attempt")
      ).to.be.reverted;
    });
  });

  describe("Batch Burn Operations", function () {
    beforeEach(async function () {
      // Issue multiple certificates
      for (let i = 1; i <= 5; i++) {
        await certificateNFT.connect(institution).issueCertificate(
          student.address,
          i, // courseId
          80 + i, // grade
          "ipfs://QmTestHash" + i
        );
      }
    });

    it("Should allow batch burn requests by institution", async function () {
      const tokenIds = [1, 2, 3];
      const reason = "Batch cleanup";
      
      // Make batch burn request
      await certificateNFT.connect(institution).requestBurnMultipleCertificates(tokenIds, reason);
      
      // Verify timestamps were set
      for (let i = 0; i < tokenIds.length; i++) {
        const timestamp = await certificateNFT.burnRequestTimestamps(tokenIds[i]);
        expect(timestamp).to.be.gt(0);
      }
    });

    it("Should allow batch burn approval by owner", async function () {
      const tokenIds = [1, 2, 3];
      
      // Approve multiple certificates for burn
      await certificateNFT.connect(owner).approveBurnMultipleCertificates(tokenIds);
      
      // Verify approvals were set
      for (let i = 0; i < tokenIds.length; i++) {
        const approved = await certificateNFT.burnApproved(tokenIds[i]);
        expect(approved).to.be.true;
      }
    });

    it("Should execute batch burns by owner immediately", async function () {
      const tokenIds = [1, 2, 3];
      const reason = "Batch owner burn";
      
      // Execute batch burn as owner
      await certificateNFT.connect(owner).burnMultipleCertificates(tokenIds, reason);
      
      // Verify certificates no longer exist
      for (let i = 0; i < tokenIds.length; i++) {
        await expect(certificateNFT.ownerOf(tokenIds[i])).to.be.reverted;
      }
    });

    it("Should execute batch burns by institution after timelock", async function () {
      const tokenIds = [1, 2, 3];
      const reason = "Batch timelock burn";
      
      // Make batch burn request
      await certificateNFT.connect(institution).requestBurnMultipleCertificates(tokenIds, reason);
      
      // Fast forward time by 3 days + 1 second
      await time.increase(259201);
      
      // Execute batch burn
      await certificateNFT.connect(institution).burnMultipleCertificates(tokenIds, reason);
      
      // Verify certificates no longer exist
      for (let i = 0; i < tokenIds.length; i++) {
        await expect(certificateNFT.ownerOf(tokenIds[i])).to.be.reverted;
      }
    });

    it("Should execute batch burns by institution after approval", async function () {
      const tokenIds = [1, 2, 3];
      const reason = "Batch approved burn";
      
      // Request burn
      await certificateNFT.connect(institution).requestBurnMultipleCertificates(tokenIds, reason);
      
      // Owner approves them
      await certificateNFT.connect(owner).approveBurnMultipleCertificates(tokenIds);
      
      // Execute batch burn
      await certificateNFT.connect(institution).burnMultipleCertificates(tokenIds, reason);
      
      // Verify certificates no longer exist
      for (let i = 0; i < tokenIds.length; i++) {
        await expect(certificateNFT.ownerOf(tokenIds[i])).to.be.reverted;
      }
    });

    it("Should skip non-existent or non-approved certificates in batch", async function () {
      // Set up a mix of certificates:
      // - Certificate 1: Exists but not approved
      // - Certificate 2: Exists and approved
      // - Certificate 999: Doesn't exist
      
      await certificateNFT.connect(institution).requestBurnMultipleCertificates([2], "Approval test");
      await certificateNFT.connect(owner).approveBurnCertificate(2);
      
      const tokenIds = [1, 2, 999];
      
      // Execute batch burn - should only burn certificate 2
      await certificateNFT.connect(institution).burnMultipleCertificates(tokenIds, "Mixed batch");
      
      // Certificate 1 should still exist
      expect(await certificateNFT.ownerOf(1)).to.equal(student.address);
      
      // Certificate 2 should be burned
      await expect(certificateNFT.ownerOf(2)).to.be.reverted;
    });
  });
}); 