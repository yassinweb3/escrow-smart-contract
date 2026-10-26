// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Escrow {
    // =========================
    // Custom Errors
    // =========================

    error Escrow__OnlyBuyer();
    error Escrow__OnlySeller();
    error Escrow__OnlyBuyerOrSeller();
    error Escrow__OnlyArbiter();
    error Escrow__NoDisputeRaised();
    error Escrow__TransferFailed();
    error Escrow__InvalidAddress();
    error Escrow__InvalidAmount();
    error Escrow__OnlyBuyerCanFund();
    error Escrow__AlreadySettled();
    error Escrow__DisputeActive();
    error Escrow__Reentrancy();

    // =========================
    // State Variables
    // =========================

    address public immutable BUYER;
    address public immutable SELLER;
    address public immutable ARBITER;

    uint256 public immutable AMOUNT;

    bool public buyerApproved;
    bool public sellerApproved;
    bool public isDisputeRaised;
    bool public isSettled;

    // Reentrancy lock
    bool private locked;

    // =========================
    // Events
    // =========================

    event BuyerApproved(address indexed buyer);
    event SellerApproved(address indexed seller);
    event DisputeRaised(address indexed raisedBy);
    event DisputeResolved(address indexed recipient);
    event FundsReleased(address indexed recipient, uint256 amount);

    // =========================
    // Reentrancy Modifier
    // =========================

    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() internal {
        if (locked) {
            revert Escrow__Reentrancy();
        }

        locked = true;
    }

    function _nonReentrantAfter() internal {
        locked = false;
    }

    // =========================
    // Constructor
    // =========================

    constructor(address _buyer, address _seller, address _arbiter) payable {
        if (
            _buyer == address(0) ||
            _seller == address(0) ||
            _arbiter == address(0)
        ) {
            revert Escrow__InvalidAddress();
        }

        if (_buyer == _seller || _buyer == _arbiter || _seller == _arbiter) {
            revert Escrow__InvalidAddress();
        }

        if (msg.value == 0) {
            revert Escrow__InvalidAmount();
        }

        if (msg.sender != _buyer) {
            revert Escrow__OnlyBuyerCanFund();
        }

        BUYER = _buyer;
        SELLER = _seller;
        ARBITER = _arbiter;
        AMOUNT = msg.value;
    }

    // =========================
    // Buyer Approval
    // =========================

    function approveByBuyer() external nonReentrant {
        if (msg.sender != BUYER) {
            revert Escrow__OnlyBuyer();
        }

        if (isSettled) {
            revert Escrow__AlreadySettled();
        }

        if (isDisputeRaised) {
            revert Escrow__DisputeActive();
        }

        if (!buyerApproved) {
            buyerApproved = true;
            emit BuyerApproved(msg.sender);
        }

        releaseIfAgreed();
    }

    // =========================
    // Seller Approval
    // =========================

    function approveBySeller() external nonReentrant {
        if (msg.sender != SELLER) {
            revert Escrow__OnlySeller();
        }

        if (isSettled) {
            revert Escrow__AlreadySettled();
        }

        if (isDisputeRaised) {
            revert Escrow__DisputeActive();
        }

        if (!sellerApproved) {
            sellerApproved = true;
            emit SellerApproved(msg.sender);
        }

        releaseIfAgreed();
    }

    // =========================
    // Release Funds
    // =========================

    function releaseIfAgreed() internal {
        if (buyerApproved && sellerApproved && !isDisputeRaised && !isSettled) {
            // Effects before external interaction
            isSettled = true;

            emit FundsReleased(SELLER, AMOUNT);

            // Send ETH to seller
            (bool success, ) = payable(SELLER).call{value: AMOUNT}("");

            if (!success) {
                revert Escrow__TransferFailed();
            }
        }
    }

    // =========================
    // Raise Dispute
    // =========================

    function raiseDispute() external nonReentrant {
        if (msg.sender != BUYER && msg.sender != SELLER) {
            revert Escrow__OnlyBuyerOrSeller();
        }

        if (isSettled) {
            revert Escrow__AlreadySettled();
        }

        if (isDisputeRaised) {
            revert Escrow__DisputeActive();
        }

        isDisputeRaised = true;

        emit DisputeRaised(msg.sender);
    }

    // =========================
    // Resolve Dispute
    // =========================

    function resolveDispute(bool _approveForSeller) external nonReentrant {
        if (msg.sender != ARBITER) {
            revert Escrow__OnlyArbiter();
        }

        if (isSettled) {
            revert Escrow__AlreadySettled();
        }

        if (!isDisputeRaised) {
            revert Escrow__NoDisputeRaised();
        }

        // Effects before external interaction
        isSettled = true;
        isDisputeRaised = false;

        address recipient = _approveForSeller ? SELLER : BUYER;

        emit DisputeResolved(recipient);
        emit FundsReleased(recipient, AMOUNT);

        // Send ETH to recipient
        (bool success, ) = payable(recipient).call{value: AMOUNT}("");

        if (!success) {
            revert Escrow__TransferFailed();
        }
    }
}
