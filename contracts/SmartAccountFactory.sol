// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

/// @title SmartAccountFactory - Deploys SmartAccount contracts on demand
/// @author Kyle Tredway
/// @notice Uses Create2 for deterministic address generation before deployment

import "@openzeppelin/contracts/utils/Create2.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "./SmartAccount.sol";

contract SmartAccountFactory {

    // ─── State Variables ──────────────────────────────────────────────────────

    IEntryPoint public immutable entryPoint;

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
    }

    // ─── Functions ────────────────────────────────────────────────────────────

    /// @notice Deploys a new SmartAccount for the given owner
    /// @param owner The address that will own the SmartAccount
    /// @param salt A unique value to generate a deterministic address
    /// @return The address of the deployed SmartAccount
    function createAccount(
        address owner,
        uint256 salt
    ) external returns (SmartAccount) {
        address addr = getAddress(owner, salt);
        uint256 codeSize = addr.code.length;
        if (codeSize > 0) {
            return SmartAccount(payable(addr));
        }
        return SmartAccount(payable(
            new SmartAccount{salt: bytes32(salt)}(owner, entryPoint)
        ));
    }

    /// @notice Returns the deterministic address for a SmartAccount before deployment
    /// @param owner The address that will own the SmartAccount
    /// @param salt A unique value used during deployment
    /// @return The predicted address of the SmartAccount
    function getAddress(
        address owner,
        uint256 salt
    ) public view returns (address) {
        return Create2.computeAddress(
            bytes32(salt),
            keccak256(abi.encodePacked(
                type(SmartAccount).creationCode,
                abi.encode(owner, entryPoint)
            ))
        );
    }
}