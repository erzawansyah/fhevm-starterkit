// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title confidential-survey
 * @notice Privacy-preserving survey system where all responses remain encrypted until survey closure.
 * @author M.E.W (github: erzawansyah)
 * @custom:author-url https://github.com/erzawansyah
 *
 * @dev Details:
 * This contract implements a fully confidential survey system using Fully Homomorphic Encryption (FHE).
 * All survey responses are encrypted on-chain and can only be decrypted after survey closure.
 * The contract computes encrypted statistics in real-time without revealing individual responses.
 *
 * @dev Key Features:
 * - Encrypted response submission with FHE operations
 * - Real-time encrypted statistical aggregation (mean, variance, min, max, frequency)
 * - Survey lifecycle management (Created → Active → Closed)
 * - Configurable respondent limits and question constraints
 * - Granular decryption permissions for owners and respondents
 *
 * @dev Usage Flow:
 * 1. Initialize survey with metadata and questions
 * 2. Publish survey with max scores per question
 * 3. Respondents submit encrypted responses
 * 4. Survey auto-closes when limit reached or manually closed
 * 5. Grant decrypt permissions to view aggregated statistics
 *
 * @custom:category advanced
 * @custom:chapter encryption
 * @custom:tags Survey, Statistics, Privacy, Governance
 * @custom:ui true
 *
 * @dev Constraints:
 * - Max 1000 respondents per survey (gas optimization)
 * - Max 15 questions per survey
 * - Max score 10 per question (1-10 range)
 * - Single response per address (no revisions)
 *
 * @custom:security
 * - ReentrancyGuard protects submission flow
 * - Owner-only functions for survey management
 * - Encrypted statistics prevent data leakage
 * - Permission-based decryption model
 *
 * @custom:since 0.1.0
 */
contract ConfidentialSurvey is ZamaEthereumConfig, ReentrancyGuard {
    // -------------------------------------
    // Enums & Structs
    // -------------------------------------

    /**
     * @dev Survey lifecycle states (immutable state transitions)
     * @param Created Initial state - survey configuration in progress
     * @param Active Live state - accepting encrypted responses from participants
     * @param Closed Final state - statistics can be decrypted, no new responses
     * @param Trashed Deleted state - survey marked as deleted (soft delete)
     */
    enum SurveyStatus {
        Created, // 0: Editable config, not yet accepting responses
        Active, // 1: Live and accepting responses
        Closed, // 2: Finalized, ready for decryption
        Trashed // 3: Soft-deleted (cannot revert)
    }

    /**
     * @dev Complete survey metadata and configuration
     * @param owner Address of the survey creator/owner
     * @param symbol Symbol for the survey (Required. Max 10 characters)
     * @param metadataCID IPFS CID containing survey metadata
     * @param questionsCID IPFS CID containing survey questions
     * @param totalQuestions Number of questions in the survey
     * @param createdAt Timestamp when survey was created
     * @param respondentLimit Maximum number of allowed respondents
     * @param status Current status of the survey
     */
    struct SurveyDetails {
        address owner;
        string symbol;
        string metadataCID;
        string questionsCID;
        uint256 totalQuestions;
        uint256 respondentLimit;
        uint256 createdAt;
        SurveyStatus status;
    }

    /**
     * @dev Encrypted statistics for individual survey questions
     * @param total Sum of all responses for this question (Σ x)
     * @param sumSquares Sum of squares of all responses (Σ x²) - used for variance calculation
     * @param minScore Current minimum score observed (encrypted)
     * @param maxScore Maximum observed score for this question (encrypted)
     */
    struct QuestionStats {
        euint64 total; // Σ x
        euint64 sumSquares; // Σ x²
        euint8 minScore; // empirical minimum
        euint8 maxScore; // empirical maximum
    }

    /**
     * @dev Encrypted statistics for individual respondents across all their answers
     * @param total Sum of all responses from this respondent
     * @param sumSquares Sum of squares of all responses from this respondent
     * @param minScore Minimum score given by this respondent
     * @param maxScore Maximum score given by this respondent
     */
    struct RespondentStats {
        euint64 total;
        euint64 sumSquares;
        euint8 minScore;
        euint8 maxScore;
    }

    // -------------------------------------
    // Constants
    // -------------------------------------

    /// @custom:since 0.1.0
    /// @dev Maximum number of respondents allowed per survey (gas optimization limit)
    uint256 internal constant MAX_RESPONDENTS = 1000;

    /// @custom:since 0.1.0
    /// @dev Minimum number of respondents required to close the survey (1-1000)
    uint256 internal constant MIN_RESPONDENTS = 1;

    /// @custom:since 0.1.0
    /// @dev Maximum allowed score per question to keep gas costs bounded (1-10 range)
    uint8 internal constant MAX_SCORE_PER_QUESTION = 10;

    /// @custom:since 0.1.0
    /// @dev Maximum question count for a survey (gas optimization limit)
    uint256 internal constant MAX_QUESTIONS = 15;

    // -------------------------------------
    // Events
    // -------------------------------------

    event SurveyCreated(address indexed owner, string symbol, string metadataCID);
    event SurveyMetadataUpdated(string cid);
    event SurveyQuestionsUpdated(uint256 totalQuestions);
    event SurveyPublished();
    event SurveyClosed(uint256 totalRespondents);
    event SurveyDeleted();
    event ResponsesSubmitted();

    event SurveyInitialized(
        address indexed owner,
        string symbol,
        string metadataCID,
        string questionsCID,
        uint256 totalQuestions,
        uint256 respondentLimit
    );

    // -------------------------------------
    // Storage
    // -------------------------------------

    /// @notice Complete survey configuration and metadata
    SurveyDetails public survey;

    /// @notice Current number of users who have submitted responses
    uint256 public totalRespondents;

    /// @dev Tracks whether each address has already responded to prevent duplicate submissions
    mapping(address => bool) public hasResponded;

    /// @dev Array of all respondent addresses for enumeration (limited to MAX_RESPONDENTS for gas efficiency)
    address[] public respondents;

    /// @dev Encrypted responses: respondent address => question index => encrypted answer
    mapping(address => mapping(uint256 => euint8)) public responses;

    /// @dev Encrypted statistical data for each question indexed by question number
    mapping(uint256 => QuestionStats) public questionStatistics;

    /// @dev Encrypted frequency counts for each question indexed by question number
    mapping(uint256 => mapping(uint8 => euint64)) public frequencyCounts;

    /// @dev Plaintext maximum scores for each question (used for frequency mapping bounds)
    mapping(uint256 => uint8) public maxScores;

    /// @dev Encrypted statistical data for each respondent indexed by their address
    mapping(address => RespondentStats) public respondentStatistics;

    // -------------------------------------
    // Modifiers
    // -------------------------------------

    /// @dev Only survey owner can execute
    modifier onlyOwner() {
        require(msg.sender == survey.owner, "not owner");
        _;
    }

    /// @dev Prevents owner from participating in their own survey
    modifier notOwner() {
        require(msg.sender != survey.owner, "owner not allowed");
        _;
    }

    /// @dev Survey must be in Active state
    modifier onlyActive() {
        require(survey.status == SurveyStatus.Active, "not active");
        _;
    }

    /// @dev Survey must be in Closed state for decryption
    modifier onlyClosed() {
        require(survey.status == SurveyStatus.Closed, "not closed");
        _;
    }

    /// @dev Survey must not be trashed/deleted
    modifier notTrashed() {
        require(survey.status != SurveyStatus.Trashed, "trashed");
        _;
    }

    /// @dev Survey must be in Created state for editing
    modifier canEdit() {
        require(survey.status == SurveyStatus.Created, "immutable state");
        _;
    }

    /// @dev User can only respond once
    modifier notResponded() {
        require(!hasResponded[msg.sender], "already responded");
        _;
    }

    /// @dev Ensures survey configuration is complete before publishing
    modifier metadataReady() {
        require(
            survey.totalQuestions > 0 && bytes(survey.metadataCID).length > 0 && bytes(survey.questionsCID).length > 0,
            "metadata or questions not set"
        );
        _;
    }

    /// @dev Minimum respondent threshold must be met before closing
    modifier minReached() {
        require(totalRespondents >= MIN_RESPONDENTS, "min not reached");
        _;
    }

    // -------------------------------------
    // Initialization (replaces constructor)
    // -------------------------------------

    /**
     * @custom:since 0.1.0
     * @notice Initializes survey config once (replaces constructor).
     * @dev Can only be called once. Starts in Created state.
     * @param _owner Address that will own and manage the survey
     * @param _symbol Symbol for the survey (Required. Max 10 characters)
     * @param _metadataCID IPFS CID containing survey metadata
     * @param _questionsCID IPFS CID containing survey questions
     * @param _totalQuestions Total number of questions in the survey
     * @param _respondentLimit Maximum number of respondents allowed (1-1000)
     */
    function initializeSurvey(
        address _owner,
        string calldata _symbol,
        string calldata _metadataCID,
        string calldata _questionsCID,
        uint256 _totalQuestions,
        uint256 _respondentLimit
    ) external {
        require(survey.createdAt == 0, "already initialized");
        require(_owner != address(0), "bad owner");

        require(_respondentLimit >= MIN_RESPONDENTS && _respondentLimit <= MAX_RESPONDENTS, "bad respondentLimit");
        require(bytes(_symbol).length > 0 && bytes(_symbol).length <= 10, "symbol length invalid");
        require(_totalQuestions > 0 && _totalQuestions <= MAX_QUESTIONS, "totalQuestions out of range");

        survey = SurveyDetails({
            owner: _owner,
            symbol: _symbol,
            metadataCID: _metadataCID,
            questionsCID: _questionsCID,
            totalQuestions: _totalQuestions,
            createdAt: block.timestamp,
            respondentLimit: _respondentLimit,
            status: SurveyStatus.Created
        });

        emit SurveyInitialized(_owner, _symbol, _metadataCID, _questionsCID, _totalQuestions, _respondentLimit);
        emit SurveyCreated(_owner, _symbol, _metadataCID);
    }

    // -------------------------------------
    // Survey Management
    // -------------------------------------

    /// @notice Updates survey metadata IPFS CID (only in Created state)
    function updateSurveyMetadata(string calldata _cid) external onlyOwner notTrashed canEdit {
        require(bytes(_cid).length > 0, "metadataCID cannot be empty");
        survey.metadataCID = _cid;
        emit SurveyMetadataUpdated(_cid);
    }

    /// @notice Updates survey questions and question count (only in Created state)
    /// @param _cid IPFS CID for questions JSON
    /// @param _totalQuestions Total number of questions (1-15)
    function updateQuestions(string calldata _cid, uint256 _totalQuestions) external onlyOwner notTrashed canEdit {
        require(bytes(_cid).length > 0, "questionsCID cannot be empty");
        require(_totalQuestions > 0 && _totalQuestions <= MAX_QUESTIONS, "totalQuestions out of range");
        survey.questionsCID = _cid;
        survey.totalQuestions = _totalQuestions;
        emit SurveyQuestionsUpdated(_totalQuestions);
    }

    /// @notice Activates survey and initializes question statistics with max scores
    /// @dev Transitions survey from Created → Active state
    /// @param _maxScores Array of max scores for each question (length must match totalQuestions)
    function publishSurvey(uint8[] calldata _maxScores) external onlyOwner notTrashed canEdit metadataReady {
        require(survey.createdAt != 0, "not initialized");
        require(survey.totalQuestions == _maxScores.length, "length mismatch");

        // Initialize encrypted statistics for each question
        for (uint256 i = 0; i < survey.totalQuestions; ++i) {
            uint8 maxScore = _maxScores[i];
            require(maxScore > 1 && maxScore <= MAX_SCORE_PER_QUESTION, "invalid maxScore");
            _initializeQuestionStatistics(i, maxScore);
        }

        // Activate survey to accept responses
        survey.status = SurveyStatus.Active;
        emit SurveyPublished();
    }

    /// @notice Manually closes the survey and enables decryption
    /// @dev Requires minimum respondent threshold to be met
    function closeSurvey() external onlyOwner onlyActive minReached {
        survey.status = SurveyStatus.Closed;
        emit SurveyClosed(totalRespondents);
    }

    /// @notice Soft-deletes the survey (cannot be reverted)
    /// @dev Can only delete surveys in Created or Closed state (not Active)
    function deleteSurvey() external onlyOwner notTrashed {
        require(survey.createdAt != 0, "not initialized");
        require(survey.status != SurveyStatus.Active, "cannot delete active survey");
        survey.status = SurveyStatus.Trashed;
        emit SurveyDeleted();
    }

    // -------------------------------------
    // Respondent Capabilities
    // -------------------------------------

    /// @notice Submits encrypted survey responses for the caller
    /// @dev Processes all responses, updates statistics, and auto-closes if limit reached
    /// @param _encryptedResponses Array of encrypted responses (one per question)
    /// @param _proofs Cryptographic proofs for encrypted inputs
    function submitResponses(
        externalEuint8[] calldata _encryptedResponses,
        bytes calldata _proofs
    ) external onlyActive notResponded notOwner nonReentrant {
        uint256 numQuestions = survey.totalQuestions;
        require(numQuestions > 0, "bad questions");
        require(_encryptedResponses.length == numQuestions, "wrong responses len");
        require(totalRespondents < survey.respondentLimit, "respondent cap");

        // Initialize encrypted stats container for this respondent
        _initializeRespondentStatistics(msg.sender);

        // Process each encrypted response
        for (uint256 i = 0; i < numQuestions; ++i) {
            // Convert external encrypted input to internal euint8
            euint8 response = FHE.fromExternal(_encryptedResponses[i], _proofs);
            FHE.allowThis(response);
            FHE.allow(response, msg.sender);

            // Store encrypted response
            responses[msg.sender][i] = response;

            // Update aggregated question statistics
            _updateQuestionStatistics(i, response);

            // Update respondent's personal statistics
            _updateRespondentStatistics(msg.sender, response);
        }

        // Grant respondent permission to decrypt their own statistics
        _grantRespondentPermissions(msg.sender);

        // Mark respondent as completed
        hasResponded[msg.sender] = true;
        respondents.push(msg.sender);
        unchecked {
            ++totalRespondents;
        }

        emit ResponsesSubmitted();

        // Auto-close survey if respondent limit reached
        if (totalRespondents >= survey.respondentLimit) {
            survey.status = SurveyStatus.Closed;
            emit SurveyClosed(totalRespondents);
        }
    }

    // -------------------------------------
    // Decrypt Capabilities
    // -------------------------------------

    /// @notice Grants owner permission to decrypt question statistics
    /// @dev Can only be called after survey is closed
    /// @param _qIdx Question index to grant decrypt permission for
    function grantOwnerDecrypt(uint256 _qIdx) external onlyOwner onlyClosed {
        _grantQuestionStatsDecrypt(_qIdx, msg.sender);
    }

    /// @notice Grants respondent permission to decrypt question statistics
    /// @dev Respondents can only decrypt after survey is closed
    /// @param _qIdx Question index to grant decrypt permission for
    function grantRespondentDecrypt(uint256 _qIdx) external onlyClosed {
        require(hasResponded[msg.sender], "Not respondent");
        _grantQuestionStatsDecrypt(_qIdx, msg.sender);
    }

    // -------------------------------------
    // Statistics Functions
    // -------------------------------------

    /// @dev Initializes encrypted statistics storage for a question
    /// @param _questionIndex Index of the question to initialize
    /// @param _maxScore Maximum score value for this question (determines frequency array size)
    function _initializeQuestionStatistics(uint256 _questionIndex, uint8 _maxScore) internal {
        require(_questionIndex < survey.totalQuestions, "bad index");
        require(_maxScore > 1 && _maxScore <= MAX_SCORE_PER_QUESTION, "maxScore out of range");

        QuestionStats storage qs = questionStatistics[_questionIndex];

        // Initialize sum and sum-of-squares to zero
        qs.total = FHE.asEuint64(0);
        qs.sumSquares = FHE.asEuint64(0);

        // Initialize min to max value (will be updated on first response)
        qs.minScore = FHE.asEuint8(_maxScore);

        // Initialize max to max value (empirical max will be tracked)
        qs.maxScore = FHE.asEuint8(_maxScore);

        // Grant contract permission to update these values
        FHE.allowThis(qs.total);
        FHE.allowThis(qs.sumSquares);
        FHE.allowThis(qs.minScore);
        FHE.allowThis(qs.maxScore);

        // Initialize frequency counters for each possible score value
        for (uint8 i = 1; i <= _maxScore; ++i) {
            frequencyCounts[_questionIndex][i] = FHE.asEuint64(0);
            FHE.allowThis(frequencyCounts[_questionIndex][i]);
        }

        maxScores[_questionIndex] = _maxScore;
    }

    /// @dev Updates encrypted question statistics with a new response
    /// @param _qIdx Question index
    /// @param _response Encrypted response value (euint8)
    function _updateQuestionStatistics(uint256 _qIdx, euint8 _response) internal {
        QuestionStats storage qs = questionStatistics[_qIdx];

        // Convert to euint64 for arithmetic operations
        euint64 resp64 = FHE.asEuint64(_response);
        FHE.allowThis(resp64);

        // Update sum: Σx
        qs.total = FHE.add(qs.total, resp64);
        FHE.allowThis(qs.total);

        // Update sum of squares: Σx² (for variance calculation)
        qs.sumSquares = FHE.add(qs.sumSquares, FHE.mul(resp64, resp64));
        FHE.allowThis(qs.sumSquares);

        // Update encrypted min (if response < current min, use response)
        qs.minScore = FHE.select(FHE.lt(_response, qs.minScore), _response, qs.minScore);
        FHE.allowThis(qs.minScore);

        // Update encrypted max (if response > current max, use response)
        qs.maxScore = FHE.select(FHE.gt(_response, qs.maxScore), _response, qs.maxScore);
        FHE.allowThis(qs.maxScore);

        // Update frequency counts for each possible score
        uint8 maxScore = maxScores[_qIdx];
        for (uint8 i = 1; i <= maxScore; ++i) {
            // Check if response equals current score value
            ebool isMatch = FHE.eq(_response, FHE.asEuint8(i));
            // Increment frequency by 1 if match, 0 otherwise
            euint64 increment = FHE.select(isMatch, FHE.asEuint64(1), FHE.asEuint64(0));
            frequencyCounts[_qIdx][i] = FHE.add(frequencyCounts[_qIdx][i], increment);
            FHE.allowThis(frequencyCounts[_qIdx][i]);
        }
    }

    /// @dev Initializes encrypted statistics storage for a respondent
    /// @param _respondent Address of the respondent
    function _initializeRespondentStatistics(address _respondent) internal {
        RespondentStats storage rs = respondentStatistics[_respondent];

        // Initialize sums to zero
        rs.total = FHE.asEuint64(0);
        rs.sumSquares = FHE.asEuint64(0);

        // Initialize min to max possible value (will decrease)
        rs.minScore = FHE.asEuint8(255);

        // Initialize max to min possible value (will increase)
        rs.maxScore = FHE.asEuint8(0);

        // Grant contract permission to update
        FHE.allowThis(rs.total);
        FHE.allowThis(rs.sumSquares);
        FHE.allowThis(rs.minScore);
        FHE.allowThis(rs.maxScore);
    }

    /// @dev Updates encrypted respondent statistics with a new response
    /// @param _respondent Address of the respondent
    /// @param _response Encrypted response value
    function _updateRespondentStatistics(address _respondent, euint8 _response) internal {
        RespondentStats storage rs = respondentStatistics[_respondent];
        euint64 resp64 = FHE.asEuint64(_response);
        FHE.allowThis(resp64);

        // Accumulate respondent's total score
        rs.total = FHE.add(rs.total, resp64);

        // Accumulate sum of squares for variance
        rs.sumSquares = FHE.add(rs.sumSquares, FHE.mul(resp64, resp64));

        // Track respondent's min score
        rs.minScore = FHE.select(FHE.lt(_response, rs.minScore), _response, rs.minScore);

        // Track respondent's max score
        rs.maxScore = FHE.select(FHE.gt(_response, rs.maxScore), _response, rs.maxScore);

        // Update permissions
        FHE.allowThis(rs.total);
        FHE.allowThis(rs.sumSquares);
        FHE.allowThis(rs.minScore);
        FHE.allowThis(rs.maxScore);
    }

    /// @dev Grants respondent permission to decrypt their own statistics
    /// @param _respondent Address to grant permissions to
    function _grantRespondentPermissions(address _respondent) internal {
        RespondentStats storage rs = respondentStatistics[_respondent];
        FHE.allow(rs.total, _respondent);
        FHE.allow(rs.sumSquares, _respondent);
        FHE.allow(rs.minScore, _respondent);
        FHE.allow(rs.maxScore, _respondent);
    }

    /// @dev Internal helper to grant decrypt permission for question statistics
    /// @param _qIdx Question index
    /// @param _account Address to grant permissions to
    function _grantQuestionStatsDecrypt(uint256 _qIdx, address _account) internal {
        require(_qIdx < survey.totalQuestions, "bad index");
        QuestionStats storage qs = questionStatistics[_qIdx];

        // Grant permission for aggregated stats
        FHE.allow(qs.total, _account);
        FHE.allow(qs.sumSquares, _account);
        FHE.allow(qs.minScore, _account);
        FHE.allow(qs.maxScore, _account);

        // Grant permission for frequency counts
        uint8 maxScore = maxScores[_qIdx];
        for (uint8 i = 1; i <= maxScore; ++i) {
            FHE.allow(frequencyCounts[_qIdx][i], _account);
        }
    }

    // -------------------------------------
    // View Functions (Getters)
    // -------------------------------------

    /// @notice Returns complete survey details
    function getSurvey() external view returns (SurveyDetails memory) {
        return survey;
    }

    /// @notice Returns current survey status
    function getSurveyStatus() external view returns (SurveyStatus) {
        return survey.status;
    }

    /// @notice Returns survey owner address
    function getSurveyOwner() external view returns (address) {
        return survey.owner;
    }

    /// @notice Returns total number of questions
    function getTotalQuestions() external view returns (uint256) {
        return survey.totalQuestions;
    }

    /// @notice Returns maximum allowed respondents
    function getRespondentLimit() external view returns (uint256) {
        return survey.respondentLimit;
    }

    /// @notice Returns current number of respondents who submitted responses
    function getTotalRespondents() external view returns (uint256) {
        return totalRespondents;
    }

    /// @notice Checks if an address has already responded
    function getHasResponded(address _respondent) external view returns (bool) {
        return hasResponded[_respondent];
    }

    /// @notice Returns respondent address at specific index
    /// @param _index Index in respondents array (0-based)
    function getRespondentAt(uint256 _index) external view returns (address) {
        require(_index < totalRespondents, "index out of bounds");
        return respondents[_index];
    }

    /// @notice Returns array of all respondent addresses
    function getAllRespondents() external view returns (address[] memory) {
        address[] memory result = new address[](totalRespondents);
        for (uint256 i = 0; i < totalRespondents; i++) {
            result[i] = respondents[i];
        }
        return result;
    }

    /// @notice Returns encrypted response for specific respondent and question
    /// @param _respondent Address of respondent
    /// @param _questionIndex Question index
    function getRespondentResponse(address _respondent, uint256 _questionIndex) external view returns (euint8) {
        require(_questionIndex < survey.totalQuestions, "invalid question index");
        require(hasResponded[_respondent], "respondent has not responded");
        return responses[_respondent][_questionIndex];
    }

    /// @notice Returns all encrypted responses for a respondent
    /// @param _respondent Address of respondent
    function getRespondentResponses(address _respondent) external view returns (euint8[] memory) {
        require(hasResponded[_respondent], "respondent has not responded");

        euint8[] memory userResponses = new euint8[](survey.totalQuestions);
        for (uint256 i = 0; i < survey.totalQuestions; i++) {
            userResponses[i] = responses[_respondent][i];
        }
        return userResponses;
    }

    /// @notice Returns encrypted statistics for a question
    /// @param _questionIndex Question index
    function getQuestionStatistics(uint256 _questionIndex) external view returns (QuestionStats memory) {
        require(_questionIndex < survey.totalQuestions, "invalid question index");
        return questionStatistics[_questionIndex];
    }

    /// @notice Returns encrypted frequency count for specific answer value
    /// @param _questionIndex Question index
    /// @param _answerValue Answer value (1 to maxScore)
    function getFrequencyCount(uint256 _questionIndex, uint8 _answerValue) external view returns (euint64) {
        require(_questionIndex < survey.totalQuestions, "invalid question index");
        require(_answerValue > 0 && _answerValue <= maxScores[_questionIndex], "invalid answer value");
        return frequencyCounts[_questionIndex][_answerValue];
    }

    /// @notice Returns all encrypted frequency counts for a question
    /// @param _questionIndex Question index
    function getQuestionFrequencies(uint256 _questionIndex) external view returns (euint64[] memory) {
        require(_questionIndex < survey.totalQuestions, "invalid question index");

        uint8 maxScore = maxScores[_questionIndex];
        euint64[] memory frequencies = new euint64[](maxScore);

        for (uint8 i = 1; i <= maxScore; i++) {
            frequencies[i - 1] = frequencyCounts[_questionIndex][i];
        }

        return frequencies;
    }

    /// @notice Returns maximum score for a question
    /// @param _questionIndex Question index
    function getMaxScore(uint256 _questionIndex) external view returns (uint8) {
        require(_questionIndex < survey.totalQuestions, "invalid question index");
        return maxScores[_questionIndex];
    }

    /// @notice Returns array of max scores for all questions
    function getAllMaxScores() external view returns (uint8[] memory) {
        uint8[] memory scores = new uint8[](survey.totalQuestions);
        for (uint256 i = 0; i < survey.totalQuestions; i++) {
            scores[i] = maxScores[i];
        }
        return scores;
    }

    /// @notice Returns encrypted statistics for a respondent
    /// @param _respondent Address of respondent
    function getRespondentStatistics(address _respondent) external view returns (RespondentStats memory) {
        require(hasResponded[_respondent], "respondent has not responded");
        return respondentStatistics[_respondent];
    }

    /// @notice Returns survey creation timestamp
    function getCreatedAt() external view returns (uint256) {
        return survey.createdAt;
    }

    /// @notice Returns IPFS CID for survey metadata
    function getMetadataCID() external view returns (string memory) {
        return survey.metadataCID;
    }

    /// @notice Returns IPFS CID for survey questions
    function getQuestionsCID() external view returns (string memory) {
        return survey.questionsCID;
    }

    /// @notice Returns survey symbol
    function getSurveySymbol() external view returns (string memory) {
        return survey.symbol;
    }

    /// @notice Checks if survey is currently active
    function isActive() external view returns (bool) {
        return survey.status == SurveyStatus.Active;
    }

    /// @notice Checks if survey is closed
    function isClosed() external view returns (bool) {
        return survey.status == SurveyStatus.Closed;
    }

    /// @notice Checks if survey has been deleted
    function isTrashed() external view returns (bool) {
        return survey.status == SurveyStatus.Trashed;
    }

    /// @notice Checks if respondent limit has been reached
    function hasReachedLimit() external view returns (bool) {
        return totalRespondents >= survey.respondentLimit;
    }

    /// @notice Returns survey completion progress as percentage (0-100)
    function getProgress() external view returns (uint256) {
        if (survey.respondentLimit == 0) return 0;
        return (totalRespondents * 100) / survey.respondentLimit;
    }

    /// @notice Returns remaining available respondent slots
    function getRemainingSlots() external view returns (uint256) {
        if (totalRespondents >= survey.respondentLimit) return 0;
        return survey.respondentLimit - totalRespondents;
    }
}
