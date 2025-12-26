// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title SimpleVoting
/// @notice Minimal voting contract for demo purposes
/// @dev Uses a string key for candidates to keep the example small and readable
contract SimpleVoting {
    mapping(string => uint256) public votes;

    /// @notice Emit when a vote is cast
    /// @param candidate The candidate identifier
    /// @param voter The address that cast the vote
    event VoteCast(string candidate, address indexed voter);

    /// @notice Cast a vote for `candidate`
    /// @param candidate The candidate to vote for
    function vote(string memory candidate) public {
        votes[candidate] += 1;
        emit VoteCast(candidate, msg.sender);
    }

    /// @notice Get vote count for a candidate
    /// @param candidate The candidate identifier
    /// @return Number of votes
    function getVotes(string memory candidate) public view returns (uint256) {
        return votes[candidate];
    }
}
