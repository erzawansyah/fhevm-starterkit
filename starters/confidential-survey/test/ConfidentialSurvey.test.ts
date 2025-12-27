/**
 * @example-id confidential-survey
 * @test-suite ConfidentialSurvey
 * @test-goal
 * - Comprehensive testing for ConfidentialSurvey contract
 * - Test survey lifecycle: initialize → publish → respond → close → decrypt
 * - Validate FHE operations: encrypted input, statistics aggregation, decryption permissions
 * - Test access control and permission model
 * - Edge cases: limits, boundaries, error handling
 */

import { FhevmType } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

import { ConfidentialSurvey, ConfidentialSurvey__factory } from "../types";

type LocalSigners = {
  owner: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

/**
 * Deploy fixture for ConfidentialSurvey contract
 * Deploys a fresh contract instance without initializing it
 */
async function deployFixture() {
  const factory = (await ethers.getContractFactory("ConfidentialSurvey")) as ConfidentialSurvey__factory;
  const survey = (await factory.deploy()) as ConfidentialSurvey;
  const surveyAddress = await survey.getAddress();
  return { survey, surveyAddress };
}

/**
 * Helper: Initialize a basic survey with default parameters
 */
async function initializeSurvey(
  survey: ConfidentialSurvey,
  owner: HardhatEthersSigner,
  overrides?: {
    symbol?: string;
    metadataCID?: string;
    questionsCID?: string;
    totalQuestions?: number;
    respondentLimit?: number;
  },
) {
  const defaults = {
    symbol: "TEST-SRV", // Max 10 chars
    metadataCID: "QmTest123",
    questionsCID: "QmQuestions456",
    totalQuestions: 3,
    respondentLimit: 10,
  };

  const params = { ...defaults, ...overrides };

  await survey.initializeSurvey(
    owner.address,
    params.symbol,
    params.metadataCID,
    params.questionsCID,
    params.totalQuestions,
    params.respondentLimit,
  );
}

/**
 * Helper: Publish a survey with default max scores
 */
async function publishSurvey(survey: ConfidentialSurvey, owner: HardhatEthersSigner, maxScores?: number[]) {
  const defaults = [5, 5, 5]; // 3 questions with max score of 5
  const scores = maxScores || defaults;
  await survey.connect(owner).publishSurvey(scores);
}

describe("ConfidentialSurvey", function () {
  let signers: LocalSigners;
  let survey: ConfidentialSurvey;
  let surveyAddress: string;

  before(async function () {
    const s: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { owner: s[0], alice: s[1], bob: s[2], charlie: s[3] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This test suite runs only on FHEVM mock environment");
      this.skip();
    }
    ({ survey, surveyAddress } = await deployFixture());
  });

  // =========================================================================
  // Initialization & Configuration
  // =========================================================================

  describe("Initialization", function () {
    it("should initialize survey with valid parameters", async function () {
      await initializeSurvey(survey, signers.owner);

      const details = await survey.getSurvey();
      expect(details.owner).to.eq(signers.owner.address);
      expect(details.symbol).to.eq("TEST-SRV");
      expect(details.metadataCID).to.eq("QmTest123");
      expect(details.questionsCID).to.eq("QmQuestions456");
      expect(details.totalQuestions).to.eq(3);
      expect(details.respondentLimit).to.eq(10);
      expect(details.status).to.eq(0); // SurveyStatus.Created
      expect(details.createdAt).to.be.gt(0);
    });

    it("should reject initialization with zero address as owner", async function () {
      await expect(
        survey.initializeSurvey(ethers.ZeroAddress, "SYMBOL", "QmTest123", "QmQuestions456", 3, 10),
      ).to.be.revertedWith("bad owner");
    });

    it("should reject initialization with invalid respondent limit (too low)", async function () {
      await expect(
        survey.initializeSurvey(signers.owner.address, "SYMBOL", "QmTest123", "QmQuestions456", 3, 0),
      ).to.be.revertedWith("bad respondentLimit");
    });

    it("should reject initialization with invalid respondent limit (too high)", async function () {
      await expect(
        survey.initializeSurvey(signers.owner.address, "SYMBOL", "QmTest123", "QmQuestions456", 3, 1001),
      ).to.be.revertedWith("bad respondentLimit");
    });

    it("should reject initialization with empty symbol", async function () {
      await expect(
        survey.initializeSurvey(signers.owner.address, "", "QmTest123", "QmQuestions456", 3, 10),
      ).to.be.revertedWith("symbol length invalid");
    });

    it("should reject initialization with symbol too long", async function () {
      await expect(
        survey.initializeSurvey(signers.owner.address, "TOOLONGSYMBOL", "QmTest123", "QmQuestions456", 3, 10),
      ).to.be.revertedWith("symbol length invalid");
    });

    it("should reject initialization with zero questions", async function () {
      await expect(
        survey.initializeSurvey(signers.owner.address, "SYMBOL", "QmTest123", "QmQuestions456", 0, 10),
      ).to.be.revertedWith("totalQuestions out of range");
    });

    it("should reject initialization with too many questions", async function () {
      await expect(
        survey.initializeSurvey(signers.owner.address, "SYMBOL", "QmTest123", "QmQuestions456", 16, 10),
      ).to.be.revertedWith("totalQuestions out of range");
    });

    it("should reject double initialization", async function () {
      await initializeSurvey(survey, signers.owner);
      await expect(initializeSurvey(survey, signers.owner)).to.be.revertedWith("already initialized");
    });
  });

  // =========================================================================
  // Survey Management (Owner Actions)
  // =========================================================================

  describe("Survey Management", function () {
    beforeEach(async function () {
      await initializeSurvey(survey, signers.owner);
    });

    describe("Update Metadata", function () {
      it("should allow owner to update metadata CID in Created state", async function () {
        const newCID = "QmNewMetadata789";
        await survey.connect(signers.owner).updateSurveyMetadata(newCID);

        const details = await survey.getSurvey();
        expect(details.metadataCID).to.eq(newCID);
      });

      it("should reject empty metadata CID", async function () {
        await expect(survey.connect(signers.owner).updateSurveyMetadata("")).to.be.revertedWith(
          "metadataCID cannot be empty",
        );
      });

      it("should reject non-owner updates", async function () {
        await expect(survey.connect(signers.alice).updateSurveyMetadata("QmNew")).to.be.revertedWith("not owner");
      });

      it("should reject updates after survey is published", async function () {
        await publishSurvey(survey, signers.owner);
        await expect(survey.connect(signers.owner).updateSurveyMetadata("QmNew")).to.be.revertedWith(
          "immutable state",
        );
      });
    });

    describe("Update Questions", function () {
      it("should allow owner to update questions CID and count", async function () {
        const newCID = "QmNewQuestions999";
        const newCount = 5;
        await survey.connect(signers.owner).updateQuestions(newCID, newCount);

        const details = await survey.getSurvey();
        expect(details.questionsCID).to.eq(newCID);
        expect(details.totalQuestions).to.eq(newCount);
      });

      it("should reject empty questions CID", async function () {
        await expect(survey.connect(signers.owner).updateQuestions("", 5)).to.be.revertedWith(
          "questionsCID cannot be empty",
        );
      });

      it("should reject invalid question count (zero)", async function () {
        await expect(survey.connect(signers.owner).updateQuestions("QmNew", 0)).to.be.revertedWith(
          "totalQuestions out of range",
        );
      });

      it("should reject invalid question count (too many)", async function () {
        await expect(survey.connect(signers.owner).updateQuestions("QmNew", 16)).to.be.revertedWith(
          "totalQuestions out of range",
        );
      });

      it("should reject non-owner updates", async function () {
        await expect(survey.connect(signers.alice).updateQuestions("QmNew", 5)).to.be.revertedWith("not owner");
      });
    });

    describe("Publish Survey", function () {
      it("should successfully publish survey with valid max scores", async function () {
        await publishSurvey(survey, signers.owner);

        const status = await survey.getSurveyStatus();
        expect(status).to.eq(1); // SurveyStatus.Active

        // Check max scores are set
        const maxScores = await survey.getAllMaxScores();
        expect(maxScores.length).to.eq(3);
        expect(maxScores[0]).to.eq(5);
        expect(maxScores[1]).to.eq(5);
        expect(maxScores[2]).to.eq(5);
      });

      it("should reject publishing with mismatched max scores length", async function () {
        await expect(survey.connect(signers.owner).publishSurvey([5, 5])).to.be.revertedWith("length mismatch");
      });

      it("should reject publishing with invalid max score (too low)", async function () {
        await expect(survey.connect(signers.owner).publishSurvey([5, 1, 5])).to.be.revertedWith("invalid maxScore");
      });

      it("should reject publishing with invalid max score (too high)", async function () {
        await expect(survey.connect(signers.owner).publishSurvey([5, 11, 5])).to.be.revertedWith("invalid maxScore");
      });

      it("should reject publishing without metadata set", async function () {
        const freshSurvey = (await (
          await ethers.getContractFactory("ConfidentialSurvey")
        ).deploy()) as ConfidentialSurvey;
        await freshSurvey.initializeSurvey(signers.owner.address, "TEST", "", "QmQ", 3, 10);
        await expect(freshSurvey.connect(signers.owner).publishSurvey([5, 5, 5])).to.be.revertedWith(
          "metadata or questions not set",
        );
      });

      it("should reject publishing by non-owner", async function () {
        await expect(survey.connect(signers.alice).publishSurvey([5, 5, 5])).to.be.revertedWith("not owner");
      });

      it("should reject double publishing", async function () {
        await publishSurvey(survey, signers.owner);
        await expect(survey.connect(signers.owner).publishSurvey([5, 5, 5])).to.be.revertedWith("immutable state");
      });
    });

    describe("Close Survey", function () {
      beforeEach(async function () {
        await publishSurvey(survey, signers.owner);
      });

      it("should successfully close active survey with minimum respondents", async function () {
        // Submit one response to meet minimum threshold
        const input = await fhevm.createEncryptedInput(surveyAddress, signers.alice.address);
        input.add8(3).add8(4).add8(5);
        const { handles, inputProof } = await input.encrypt();

        await survey.connect(signers.alice).submitResponses(handles, inputProof);

        await survey.connect(signers.owner).closeSurvey();

        const status = await survey.getSurveyStatus();
        expect(status).to.eq(2); // SurveyStatus.Closed
      });

      it("should reject closing survey without minimum respondents", async function () {
        await expect(survey.connect(signers.owner).closeSurvey()).to.be.revertedWith("min not reached");
      });

      it("should reject closing by non-owner", async function () {
        const input = await fhevm.createEncryptedInput(surveyAddress, signers.alice.address);
        input.add8(3).add8(4).add8(5);
        const { handles, inputProof } = await input.encrypt();
        await survey.connect(signers.alice).submitResponses(handles, inputProof);

        await expect(survey.connect(signers.alice).closeSurvey()).to.be.revertedWith("not owner");
      });

      it("should reject closing non-active survey", async function () {
        // Create a new survey in Created state (not Active)
        const createdSurvey = (await (
          await ethers.getContractFactory("ConfidentialSurvey")
        ).deploy()) as ConfidentialSurvey;
        await createdSurvey.initializeSurvey(signers.owner.address, "CREATED", "QmTest", "QmQ", 3, 10);

        // Try to close without publishing (survey is in Created state, not Active)
        await expect(createdSurvey.connect(signers.owner).closeSurvey()).to.be.revertedWith("not active");
      });
    });

    describe("Delete Survey", function () {
      it("should allow deleting survey in Created state", async function () {
        await survey.connect(signers.owner).deleteSurvey();

        const status = await survey.getSurveyStatus();
        expect(status).to.eq(3); // SurveyStatus.Trashed
      });

      it("should reject deleting active survey", async function () {
        await publishSurvey(survey, signers.owner);
        await expect(survey.connect(signers.owner).deleteSurvey()).to.be.revertedWith("cannot delete active survey");
      });

      it("should allow deleting closed survey", async function () {
        await publishSurvey(survey, signers.owner);

        const input = await fhevm.createEncryptedInput(surveyAddress, signers.alice.address);
        input.add8(3).add8(4).add8(5);
        const { handles, inputProof } = await input.encrypt();
        await survey.connect(signers.alice).submitResponses(handles, inputProof);

        await survey.connect(signers.owner).closeSurvey();

        await survey.connect(signers.owner).deleteSurvey();
        const status = await survey.getSurveyStatus();
        expect(status).to.eq(3); // SurveyStatus.Trashed
      });

      it("should reject deleting by non-owner", async function () {
        await expect(survey.connect(signers.alice).deleteSurvey()).to.be.revertedWith("not owner");
      });
    });
  });

  // =========================================================================
  // Response Submission
  // =========================================================================

  describe("Response Submission", function () {
    beforeEach(async function () {
      await initializeSurvey(survey, signers.owner);
      await publishSurvey(survey, signers.owner);
    });

    it("should successfully submit valid encrypted responses", async function () {
      const input = await fhevm.createEncryptedInput(surveyAddress, signers.alice.address);
      input.add8(3).add8(4).add8(5);
      const { handles, inputProof } = await input.encrypt();

      await survey.connect(signers.alice).submitResponses(handles, inputProof);

      expect(await survey.getHasResponded(signers.alice.address)).to.be.true;
      expect(await survey.getTotalRespondents()).to.eq(1);

      const respondent = await survey.getRespondentAt(0);
      expect(respondent).to.eq(signers.alice.address);
    });

    it("should reject submission by survey owner", async function () {
      const input = await fhevm.createEncryptedInput(surveyAddress, signers.owner.address);
      input.add8(3).add8(4).add8(5);
      const { handles, inputProof } = await input.encrypt();

      await expect(survey.connect(signers.owner).submitResponses(handles, inputProof)).to.be.revertedWith(
        "owner not allowed",
      );
    });

    it("should reject duplicate submission by same user", async function () {
      const input = await fhevm.createEncryptedInput(surveyAddress, signers.alice.address);
      input.add8(3).add8(4).add8(5);
      const { handles, inputProof } = await input.encrypt();

      await survey.connect(signers.alice).submitResponses(handles, inputProof);

      const input2 = await fhevm.createEncryptedInput(surveyAddress, signers.alice.address);
      input2.add8(2).add8(3).add8(4);
      const { handles: handles2, inputProof: inputProof2 } = await input2.encrypt();

      await expect(survey.connect(signers.alice).submitResponses(handles2, inputProof2)).to.be.revertedWith(
        "already responded",
      );
    });

    it("should reject submission with wrong number of responses", async function () {
      const input = await fhevm.createEncryptedInput(surveyAddress, signers.alice.address);
      input.add8(3).add8(4); // Only 2 responses instead of 3
      const { handles, inputProof } = await input.encrypt();

      await expect(survey.connect(signers.alice).submitResponses(handles, inputProof)).to.be.revertedWith(
        "wrong responses len",
      );
    });

    it("should reject submission when survey is not active", async function () {
      const input = await fhevm.createEncryptedInput(surveyAddress, signers.alice.address);
      input.add8(3).add8(4).add8(5);
      const { handles, inputProof } = await input.encrypt();

      // Close survey first
      await survey.connect(signers.alice).submitResponses(handles, inputProof);
      await survey.connect(signers.owner).closeSurvey();

      const input2 = await fhevm.createEncryptedInput(surveyAddress, signers.bob.address);
      input2.add8(2).add8(3).add8(4);
      const { handles: handles2, inputProof: inputProof2 } = await input2.encrypt();

      await expect(survey.connect(signers.bob).submitResponses(handles2, inputProof2)).to.be.revertedWith(
        "not active",
      );
    });

    it("should auto-close survey when respondent limit is reached", async function () {
      // Create survey with limit of 2
      const limitedSurvey = (await (
        await ethers.getContractFactory("ConfidentialSurvey")
      ).deploy()) as ConfidentialSurvey;
      const limitedAddress = await limitedSurvey.getAddress();

      await limitedSurvey.initializeSurvey(
        signers.owner.address,
        "LIMITED",
        "QmTest",
        "QmQ",
        3,
        2, // Limit: 2 respondents
      );
      await limitedSurvey.connect(signers.owner).publishSurvey([5, 5, 5]);

      // First respondent
      const input1 = await fhevm.createEncryptedInput(limitedAddress, signers.alice.address);
      input1.add8(3).add8(4).add8(5);
      const { handles: h1, inputProof: p1 } = await input1.encrypt();
      await limitedSurvey.connect(signers.alice).submitResponses(h1, p1);

      expect(await limitedSurvey.getSurveyStatus()).to.eq(1); // Still Active

      // Second respondent (should trigger auto-close)
      const input2 = await fhevm.createEncryptedInput(limitedAddress, signers.bob.address);
      input2.add8(2).add8(3).add8(4);
      const { handles: h2, inputProof: p2 } = await input2.encrypt();
      await limitedSurvey.connect(signers.bob).submitResponses(h2, p2);

      expect(await limitedSurvey.getSurveyStatus()).to.eq(2); // Auto-closed
      expect(await limitedSurvey.getTotalRespondents()).to.eq(2);
    });

    it("should allow multiple respondents to submit responses", async function () {
      // Alice submits
      const input1 = await fhevm.createEncryptedInput(surveyAddress, signers.alice.address);
      input1.add8(3).add8(4).add8(5);
      const { handles: h1, inputProof: p1 } = await input1.encrypt();
      await survey.connect(signers.alice).submitResponses(h1, p1);

      // Bob submits
      const input2 = await fhevm.createEncryptedInput(surveyAddress, signers.bob.address);
      input2.add8(2).add8(3).add8(4);
      const { handles: h2, inputProof: p2 } = await input2.encrypt();
      await survey.connect(signers.bob).submitResponses(h2, p2);

      // Charlie submits
      const input3 = await fhevm.createEncryptedInput(surveyAddress, signers.charlie.address);
      input3.add8(1).add8(2).add8(3);
      const { handles: h3, inputProof: p3 } = await input3.encrypt();
      await survey.connect(signers.charlie).submitResponses(h3, p3);

      expect(await survey.getTotalRespondents()).to.eq(3);

      const allRespondents = await survey.getAllRespondents();
      expect(allRespondents.length).to.eq(3);
      expect(allRespondents[0]).to.eq(signers.alice.address);
      expect(allRespondents[1]).to.eq(signers.bob.address);
      expect(allRespondents[2]).to.eq(signers.charlie.address);
    });
  });

  // =========================================================================
  // Decryption & Permissions
  // =========================================================================

  describe("Decryption & Permissions", function () {
    beforeEach(async function () {
      await initializeSurvey(survey, signers.owner);
      await publishSurvey(survey, signers.owner);

      // Alice submits responses
      const input = await fhevm.createEncryptedInput(surveyAddress, signers.alice.address);
      input.add8(3).add8(4).add8(5);
      const { handles, inputProof } = await input.encrypt();
      await survey.connect(signers.alice).submitResponses(handles, inputProof);

      // Close survey
      await survey.connect(signers.owner).closeSurvey();
    });

    it("should grant owner permission to decrypt question statistics", async function () {
      await expect(survey.connect(signers.owner).grantOwnerDecrypt(0)).to.not.be.reverted;
      await expect(survey.connect(signers.owner).grantOwnerDecrypt(1)).to.not.be.reverted;
      await expect(survey.connect(signers.owner).grantOwnerDecrypt(2)).to.not.be.reverted;
    });

    it("should grant respondent permission to decrypt question statistics", async function () {
      await expect(survey.connect(signers.alice).grantRespondentDecrypt(0)).to.not.be.reverted;
      await expect(survey.connect(signers.alice).grantRespondentDecrypt(1)).to.not.be.reverted;
      await expect(survey.connect(signers.alice).grantRespondentDecrypt(2)).to.not.be.reverted;
    });

    it("should reject decryption grant for invalid question index", async function () {
      await expect(survey.connect(signers.owner).grantOwnerDecrypt(99)).to.be.revertedWith("bad index");
    });

    it("should reject decryption grant when survey is not closed", async function () {
      // Create new active survey
      const activeSurvey = (await (
        await ethers.getContractFactory("ConfidentialSurvey")
      ).deploy()) as ConfidentialSurvey;
      await activeSurvey.initializeSurvey(signers.owner.address, "ACTIVE", "QmTest", "QmQ", 3, 10);
      await activeSurvey.connect(signers.owner).publishSurvey([5, 5, 5]);

      await expect(activeSurvey.connect(signers.owner).grantOwnerDecrypt(0)).to.be.revertedWith("not closed");
    });

    it("should reject respondent decrypt grant for non-respondent", async function () {
      await expect(survey.connect(signers.bob).grantRespondentDecrypt(0)).to.be.revertedWith("Not respondent");
    });

    it("should reject owner decrypt grant by non-owner", async function () {
      await expect(survey.connect(signers.alice).grantOwnerDecrypt(0)).to.be.revertedWith("not owner");
    });

    it("should allow decrypting respondent's own responses", async function () {
      // Grant permissions and decrypt
      await survey.connect(signers.alice).grantRespondentDecrypt(0);

      const encryptedResponse = await survey.getRespondentResponse(signers.alice.address, 0);
      const decrypted = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        encryptedResponse,
        surveyAddress,
        signers.alice,
      );

      expect(decrypted).to.eq(3); // We submitted [3, 4, 5]
    });

    it("should provide encrypted statistics after responses", async function () {
      const stats = await survey.getQuestionStatistics(0);
      expect(stats.total).to.not.eq(ethers.ZeroHash);
      expect(stats.sumSquares).to.not.eq(ethers.ZeroHash);
      expect(stats.minScore).to.not.eq(ethers.ZeroHash);
      expect(stats.maxScore).to.not.eq(ethers.ZeroHash);
    });

    it("should track respondent statistics", async function () {
      const respondentStats = await survey.getRespondentStatistics(signers.alice.address);
      expect(respondentStats.total).to.not.eq(ethers.ZeroHash);
      expect(respondentStats.sumSquares).to.not.eq(ethers.ZeroHash);
      expect(respondentStats.minScore).to.not.eq(ethers.ZeroHash);
      expect(respondentStats.maxScore).to.not.eq(ethers.ZeroHash);
    });
  });

  // =========================================================================
  // View Functions & Getters
  // =========================================================================

  describe("View Functions", function () {
    beforeEach(async function () {
      await initializeSurvey(survey, signers.owner);
      await publishSurvey(survey, signers.owner);
    });

    it("should return correct survey details", async function () {
      const details = await survey.getSurvey();
      expect(details.owner).to.eq(signers.owner.address);
      expect(details.symbol).to.eq("TEST-SRV");
      expect(details.totalQuestions).to.eq(3);
      expect(details.respondentLimit).to.eq(10);
    });

    it("should return correct survey status", async function () {
      expect(await survey.getSurveyStatus()).to.eq(1); // Active
      expect(await survey.isActive()).to.be.true;
      expect(await survey.isClosed()).to.be.false;
      expect(await survey.isTrashed()).to.be.false;
    });

    it("should calculate progress percentage correctly", async function () {
      expect(await survey.getProgress()).to.eq(0);

      // Submit 3 responses out of 10
      for (let i = 1; i <= 3; i++) {
        const signer = [signers.alice, signers.bob, signers.charlie][i - 1];
        const input = await fhevm.createEncryptedInput(surveyAddress, signer.address);
        input.add8(3).add8(4).add8(5);
        const { handles, inputProof } = await input.encrypt();
        await survey.connect(signer).submitResponses(handles, inputProof);
      }

      expect(await survey.getProgress()).to.eq(30); // 3/10 = 30%
    });

    it("should calculate remaining slots correctly", async function () {
      expect(await survey.getRemainingSlots()).to.eq(10);

      const input = await fhevm.createEncryptedInput(surveyAddress, signers.alice.address);
      input.add8(3).add8(4).add8(5);
      const { handles, inputProof } = await input.encrypt();
      await survey.connect(signers.alice).submitResponses(handles, inputProof);

      expect(await survey.getRemainingSlots()).to.eq(9);
    });
  });

  // =========================================================================
  // Complete Workflow (End-to-End)
  // =========================================================================

  describe("Complete Survey Lifecycle", function () {
    it("should execute full survey lifecycle: initialize → publish → respond → close → decrypt", async function () {
      // 1. Initialize
      await initializeSurvey(survey, signers.owner, {
        symbol: "E2E-TEST",
        totalQuestions: 5,
        respondentLimit: 3,
      });

      expect(await survey.getSurveyStatus()).to.eq(0); // Created

      // 2. Publish with different max scores per question
      await survey.connect(signers.owner).publishSurvey([3, 5, 7, 10, 5]);
      expect(await survey.getSurveyStatus()).to.eq(1); // Active

      // 3. Multiple respondents submit
      const respondents = [signers.alice, signers.bob, signers.charlie];
      for (const respondent of respondents) {
        const input = await fhevm.createEncryptedInput(surveyAddress, respondent.address);
        input.add8(2).add8(3).add8(5).add8(7).add8(4);
        const { handles, inputProof } = await input.encrypt();
        await survey.connect(respondent).submitResponses(handles, inputProof);
      }

      // Survey auto-closes at capacity
      expect(await survey.getSurveyStatus()).to.eq(2); // Closed
      expect(await survey.getTotalRespondents()).to.eq(3);

      // 4. Owner grants decrypt permissions
      await survey.connect(signers.owner).grantOwnerDecrypt(0);

      // 5. Respondents grant themselves decrypt permissions
      await survey.connect(signers.alice).grantRespondentDecrypt(0);

      // 6. Verify statistics are available
      const stats = await survey.getQuestionStatistics(0);
      expect(stats.total).to.not.eq(ethers.ZeroHash);

      const frequencies = await survey.getQuestionFrequencies(0);
      expect(frequencies.length).to.eq(3); // maxScore for question 0 is 3
    });

    it("should handle survey with no submissions (edge case)", async function () {
      await initializeSurvey(survey, signers.owner);
      await publishSurvey(survey, signers.owner);

      expect(await survey.getTotalRespondents()).to.eq(0);
      expect(await survey.getRemainingSlots()).to.eq(10);

      // Cannot close without minimum respondents
      await expect(survey.connect(signers.owner).closeSurvey()).to.be.revertedWith("min not reached");
    });
  });

  // =========================================================================
  // Edge Cases & Error Handling
  // =========================================================================

  describe("Edge Cases", function () {
    beforeEach(async function () {
      await initializeSurvey(survey, signers.owner);
      await publishSurvey(survey, signers.owner);
    });

    it("should handle boundary values for max scores (2 and 10)", async function () {
      const boundarySurvey = (await (
        await ethers.getContractFactory("ConfidentialSurvey")
      ).deploy()) as ConfidentialSurvey;
      await boundarySurvey.initializeSurvey(signers.owner.address, "BOUNDARY", "QmTest", "QmQ", 2, 10);

      // Min valid: 2, Max valid: 10
      await boundarySurvey.connect(signers.owner).publishSurvey([2, 10]);

      const maxScores = await boundarySurvey.getAllMaxScores();
      expect(maxScores[0]).to.eq(2);
      expect(maxScores[1]).to.eq(10);
    });

    it("should handle maximum questions (15)", async function () {
      const maxQSurvey = (await (
        await ethers.getContractFactory("ConfidentialSurvey")
      ).deploy()) as ConfidentialSurvey;
      const maxQAddress = await maxQSurvey.getAddress();

      // Test with 15 questions (max allowed)
      await maxQSurvey.initializeSurvey(signers.owner.address, "MAX-Q", "QmTest", "QmQ", 15, 10);

      // Verify initialization with 15 questions
      expect(await maxQSurvey.getTotalQuestions()).to.eq(15);

      // Successfully publish with 15 max scores
      await maxQSurvey.connect(signers.owner).publishSurvey([5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);

      expect(await maxQSurvey.getSurveyStatus()).to.eq(1); // Active

      const maxScores = await maxQSurvey.getAllMaxScores();
      expect(maxScores.length).to.eq(15);
    });

    it("should handle single question survey", async function () {
      const singleQSurvey = (await (
        await ethers.getContractFactory("ConfidentialSurvey")
      ).deploy()) as ConfidentialSurvey;
      const singleQAddress = await singleQSurvey.getAddress();

      await singleQSurvey.initializeSurvey(signers.owner.address, "SINGLE", "QmTest", "QmQ", 1, 10);
      await singleQSurvey.connect(signers.owner).publishSurvey([5]);

      const input = await fhevm.createEncryptedInput(singleQAddress, signers.alice.address);
      input.add8(4);
      const { handles, inputProof } = await input.encrypt();

      await expect(singleQSurvey.connect(signers.alice).submitResponses(handles, inputProof)).to.not.be.reverted;
      expect(await singleQSurvey.getTotalRespondents()).to.eq(1);
    });

    it("should handle single respondent survey", async function () {
      const singleRSurvey = (await (
        await ethers.getContractFactory("ConfidentialSurvey")
      ).deploy()) as ConfidentialSurvey;
      const singleRAddress = await singleRSurvey.getAddress();

      await singleRSurvey.initializeSurvey(signers.owner.address, "SINGLE-R", "QmTest", "QmQ", 3, 1);
      await singleRSurvey.connect(signers.owner).publishSurvey([5, 5, 5]);

      const input = await fhevm.createEncryptedInput(singleRAddress, signers.alice.address);
      input.add8(3).add8(4).add8(5);
      const { handles, inputProof } = await input.encrypt();
      await singleRSurvey.connect(signers.alice).submitResponses(handles, inputProof);

      // Should auto-close at limit
      expect(await singleRSurvey.getSurveyStatus()).to.eq(2); // Closed
      expect(await singleRSurvey.hasReachedLimit()).to.be.true;
    });
  });
});
