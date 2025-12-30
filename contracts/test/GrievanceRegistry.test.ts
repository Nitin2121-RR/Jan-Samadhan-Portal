import { expect } from "chai";
import { ethers } from "hardhat";
import { GrievanceRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("GrievanceRegistry", function () {
  let registry: GrievanceRegistry;
  let owner: SignerWithAddress;
  let submitter: SignerWithAddress;
  let updater: SignerWithAddress;
  let other: SignerWithAddress;

  const testGrievanceId = "test-grievance-123";
  const testHash = ethers.keccak256(ethers.toUtf8Bytes("test grievance data"));

  beforeEach(async function () {
    [owner, submitter, updater, other] = await ethers.getSigners();

    const GrievanceRegistry = await ethers.getContractFactory("GrievanceRegistry");
    registry = await GrievanceRegistry.deploy();
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });
  });

  describe("Grievance Registration", function () {
    it("Should register a new grievance", async function () {
      await expect(
        registry.connect(submitter).storeGrievanceHash(testHash, testGrievanceId, submitter.address)
      )
        .to.emit(registry, "GrievanceRegistered")
        .withArgs(testHash, testGrievanceId, submitter.address, await registry.getGrievanceInfo(testHash).then(g => g.createdAt));

      const grievance = await registry.getGrievanceInfo(testHash);
      expect(grievance.exists).to.be.true;
      expect(grievance.grievanceId).to.equal(testGrievanceId);
      expect(grievance.submitter).to.equal(submitter.address);
    });

    it("Should reject duplicate grievance hash", async function () {
      await registry.connect(submitter).storeGrievanceHash(testHash, testGrievanceId, submitter.address);

      await expect(
        registry.connect(submitter).storeGrievanceHash(testHash, "another-id", submitter.address)
      ).to.be.revertedWith("Grievance already exists");
    });

    it("Should reject invalid hash", async function () {
      await expect(
        registry.connect(submitter).storeGrievanceHash(ethers.ZeroHash, testGrievanceId, submitter.address)
      ).to.be.revertedWith("Invalid hash");
    });

    it("Should reject empty grievance ID", async function () {
      await expect(
        registry.connect(submitter).storeGrievanceHash(testHash, "", submitter.address)
      ).to.be.revertedWith("Invalid grievance ID");
    });

    it("Should initialize with pending status", async function () {
      await registry.connect(submitter).storeGrievanceHash(testHash, testGrievanceId, submitter.address);

      const status = await registry.getCurrentStatus(testHash);
      expect(status).to.equal("pending");
    });
  });

  describe("Status Updates", function () {
    beforeEach(async function () {
      await registry.connect(submitter).storeGrievanceHash(testHash, testGrievanceId, submitter.address);
    });

    it("Should update grievance status", async function () {
      await expect(
        registry.connect(updater).updateGrievanceStatus(testHash, "in_progress", "Work started")
      )
        .to.emit(registry, "StatusUpdated")
        .withArgs(testHash, "pending", "in_progress", updater.address, await registry.getStatusUpdateCount(testHash).then(c => c), "Work started");

      const status = await registry.getCurrentStatus(testHash);
      expect(status).to.equal("in_progress");
    });

    it("Should maintain status history", async function () {
      await registry.connect(updater).updateGrievanceStatus(testHash, "acknowledged", "Acknowledged");
      await registry.connect(updater).updateGrievanceStatus(testHash, "in_progress", "In progress");
      await registry.connect(updater).updateGrievanceStatus(testHash, "resolved", "Resolved");

      const history = await registry.getGrievanceHistory(testHash);
      expect(history.length).to.equal(4); // 1 initial + 3 updates

      expect(history[0].status).to.equal("pending");
      expect(history[1].status).to.equal("acknowledged");
      expect(history[2].status).to.equal("in_progress");
      expect(history[3].status).to.equal("resolved");
    });

    it("Should reject status update for non-existent grievance", async function () {
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      await expect(
        registry.connect(updater).updateGrievanceStatus(fakeHash, "resolved", "Test")
      ).to.be.revertedWith("Grievance does not exist");
    });
  });

  describe("Verification", function () {
    it("Should verify existing grievance", async function () {
      await registry.connect(submitter).storeGrievanceHash(testHash, testGrievanceId, submitter.address);

      const verified = await registry.verifyGrievance(testHash);
      expect(verified).to.be.true;
    });

    it("Should return false for non-existent grievance", async function () {
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      const verified = await registry.verifyGrievance(fakeHash);
      expect(verified).to.be.false;
    });
  });

  describe("Wallet Linking", function () {
    const userId = "user-123";

    it("Should link wallet to user ID", async function () {
      await expect(
        registry.connect(submitter).linkWallet(submitter.address, userId)
      )
        .to.emit(registry, "WalletLinked")
        .withArgs(submitter.address, userId, await registry.walletToUserId(submitter.address).then(() => 0));

      expect(await registry.walletToUserId(submitter.address)).to.equal(userId);
      expect(await registry.userIdToWallet(userId)).to.equal(submitter.address);
    });

    it("Should allow updating link to same user", async function () {
      await registry.connect(submitter).linkWallet(submitter.address, userId);
      await registry.connect(submitter).linkWallet(submitter.address, userId);

      expect(await registry.walletToUserId(submitter.address)).to.equal(userId);
    });

    it("Should reject linking to different user", async function () {
      await registry.connect(submitter).linkWallet(submitter.address, userId);

      await expect(
        registry.connect(submitter).linkWallet(submitter.address, "different-user")
      ).to.be.revertedWith("Wallet already linked to different user");
    });
  });
});


