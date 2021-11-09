// SPDX-License-Identifier: GPL-3.0
pragma solidity >0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMerkleOrchard {
  struct Claim {
    uint256 distributionId;
    uint256 balance;
    address distributor;
    uint256 tokenIndex;
    bytes32[] merkleProof;
  }

  function createDistribution(
    IERC20 token,
    bytes32 merkleRoot,
    uint256 amount,
    uint256 distributionId
  ) external;

  function verifyClaim(
    IERC20 token,
    address distributor,
    uint256 distributionId,
    address claimer,
    uint256 claimedBalance,
    bytes32[] memory merkleProof
  ) external view returns (bool);

  function claimDistributions(
    address claimer,
    Claim[] memory claims,
    IERC20[] memory tokens
  ) external;
}
