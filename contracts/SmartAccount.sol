// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

/// @title SmartAccount - A simple ERC-4337 compatible smart account
/// @author Kyle Tredway
/// @notice A wallet-as-a-contract that validates user operations and executes transactions

import "@account-abstraction/contracts/core/BaseAccount.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract SmartAccount is BaseAccount {

    using ECDSA for bytes32;

    // ─── Events ───────────────────────────────────────────────────────────────

    event SmartAccountInitialized(
        address indexed entryPoint,
        address indexed owner
    );

    event TransactionExecuted(
        address indexed dest,
        uint256 value,
        bytes data
    );

    // ─── State Variables ──────────────────────────────────────────────────────
    
    address public owner;
    IEntryPoint private immutable _entryPoint;

    constructor(address _owner, IEntryPoint entryPointAddress) {
        owner = _owner;
        _entryPoint = entryPointAddress;
        emit SmartAccountInitialized(address(entryPointAddress), _owner);
    }

    function entryPoint() public view override returns (IEntryPoint) {
        return _entryPoint;
    }

    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal override returns (uint256 validationData) {
        bytes32 hash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        address signer = hash.recover(userOp.signature);
        if (signer != owner) return 1;
        return 0;
    }

    /// @notice Executes a transaction from this smart account
    /// @param dest The destination address
    /// @param value The amount of ETH to send
    /// @param func The encoded function call data
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external override {
        _requireFromEntryPointOrOwner();
        (bool success, bytes memory result) = dest.call{value: value}(func);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
        emit TransactionExecuted(dest, value, func);
    }

    /// @notice Ensures caller is either the EntryPoint or the owner
    function _requireFromEntryPointOrOwner() internal view {
        require(
            msg.sender == address(entryPoint()) || msg.sender == owner,
            "Not authorized"
        );
    }

    receive() external payable {}

}