// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import "./SmartAccount.sol";
import "./Paymaster.sol";

/// @title MockEntryPoint - A minimal EntryPoint for testing SmartAccount
contract MockEntryPoint {

    function executeFromEntryPoint(
        address account,
        address dest,
        uint256 value,
        bytes calldata func
    ) external {
        SmartAccount(payable(account)).execute(dest, value, func);
    }

    function validateSignature(
        address account,
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) external returns (uint256) {
        return SmartAccount(payable(account)).validateUserOp(userOp, userOpHash, 0);
    }

    function validatePaymaster(
        address paymasterAddress,
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) external returns (bytes memory context, uint256 validationData) {
        return Paymaster(paymasterAddress).validatePaymasterUserOp(userOp, userOpHash, 0);
    }

    function getNonce(address, uint192) external pure returns (uint256) {
        return 0;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
    return interfaceId == type(IEntryPoint).interfaceId;
}
}