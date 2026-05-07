// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

/// @title Paymaster - Sponsors gas fees for SmartAccount transactions
/// @author Kyle Tredway
/// @notice Covers gas costs on behalf of users so they never need ETH to interact

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

contract Paymaster is BasePaymaster {

     // ─── Events ───────────────────────────────────────────────────────────────

    event OperationSponsored(
        address indexed sender,
        bytes32 indexed userOpHash
    );

    // ─── State Variables ───────────────────────────────────────────────────────────────


    // ─── Constructor ─────────────────────────────────────────────────────────────── 
    
    constructor(IEntryPoint _entryPoint) BasePaymaster(_entryPoint) {
        
    }


    /// @notice Validates whether this paymaster will sponsor the given user operation
    /// @return context Data to pass to postOp
    /// @return validationData 0 if approved, 1 if rejected
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256
    ) internal override returns (bytes memory context, uint256 validationData) {
        emit OperationSponsored(userOp.sender, userOpHash);
        return ("", 0);
    }

}