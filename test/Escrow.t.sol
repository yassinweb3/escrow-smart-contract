// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {Escrow} from "../src/Escrow.sol";

contract EscrowTest is Test {
    Escrow public escrow;

    address public buyer;
    address public seller;
    address public arbiter;
    address public stranger;

    uint256 public constant AMOUNT = 1 ether;

    // 1. Test Setup
    function setUp() public {
        buyer = makeAddr("buyer");
        seller = makeAddr("seller");
        arbiter = makeAddr("arbiter");
        stranger = makeAddr("stranger");

        vm.deal(buyer, 10 ether);

        vm.prank(buyer);
        escrow = new Escrow{value: AMOUNT}(buyer, seller, arbiter);
    }

    // 2. Test Constructor
    function test_Constructor() public view {
        assertEq(escrow.BUYER(), buyer);
        assertEq(escrow.SELLER(), seller);
        assertEq(escrow.ARBITER(), arbiter);
        assertEq(escrow.AMOUNT(), AMOUNT);
        assertEq(address(escrow).balance, AMOUNT);

        assertFalse(escrow.buyerApproved());
        assertFalse(escrow.sellerApproved());
        assertFalse(escrow.isDisputeRaised());
        assertFalse(escrow.isSettled());
    }

    // Constructor: reject zero address
    function test_ConstructorRejectsZeroAddress() public {
        vm.prank(buyer);
        vm.expectRevert(Escrow.Escrow__InvalidAddress.selector);

        new Escrow{value: AMOUNT}(address(0), seller, arbiter);
    }

    // Constructor: reject duplicate addresses
    function test_ConstructorRejectsDuplicateAddress() public {
        vm.prank(buyer);
        vm.expectRevert(Escrow.Escrow__InvalidAddress.selector);

        new Escrow{value: AMOUNT}(buyer, seller, buyer);
    }

    // Constructor: reject zero ETH
    function test_ConstructorRejectsZeroAmount() public {
        vm.prank(buyer);
        vm.expectRevert(Escrow.Escrow__InvalidAmount.selector);

        new Escrow(buyer, seller, arbiter);
    }

    // Constructor: only buyer can fund
    function test_ConstructorRejectsNonBuyer() public {
        vm.deal(stranger, AMOUNT);

        vm.prank(stranger);
        vm.expectRevert(Escrow.Escrow__OnlyBuyerCanFund.selector);

        new Escrow{value: AMOUNT}(buyer, seller, arbiter);
    }

    // 3. Test Approval: buyer
    function test_BuyerApproval() public {
        vm.prank(buyer);
        escrow.approveByBuyer();

        assertTrue(escrow.buyerApproved());
        assertFalse(escrow.sellerApproved());
        assertFalse(escrow.isSettled());
        assertEq(address(escrow).balance, AMOUNT);
    }

    // 4. Test Approval: seller
    function test_SellerApproval() public {
        vm.prank(seller);
        escrow.approveBySeller();

        assertTrue(escrow.sellerApproved());
        assertFalse(escrow.buyerApproved());
        assertFalse(escrow.isSettled());
        assertEq(address(escrow).balance, AMOUNT);
    }

    // Reject unauthorized buyer approval
    function test_BuyerApprovalRejectsStranger() public {
        vm.prank(stranger);
        vm.expectRevert(Escrow.Escrow__OnlyBuyer.selector);

        escrow.approveByBuyer();
    }

    // Reject unauthorized seller approval
    function test_SellerApprovalRejectsStranger() public {
        vm.prank(stranger);
        vm.expectRevert(Escrow.Escrow__OnlySeller.selector);

        escrow.approveBySeller();
    }

    // 5. Test Release Funds: successful transfer
    function test_ReleaseFunds() public {
        uint256 sellerBalanceBefore = seller.balance;

        vm.prank(buyer);
        escrow.approveByBuyer();

        vm.prank(seller);
        escrow.approveBySeller();

        assertTrue(escrow.isSettled());
        assertEq(address(escrow).balance, 0);
        assertEq(seller.balance, sellerBalanceBefore + AMOUNT);
    }

    // 6. Negative scenario #1:
    // One approval must not release funds
    function test_ReleaseFundsNegativeScenario1() public {
        vm.prank(buyer);
        escrow.approveByBuyer();

        assertFalse(escrow.isSettled());
        assertEq(address(escrow).balance, AMOUNT);
        assertEq(seller.balance, 0);
    }

    // 7. Negative scenario #2:
    // Approval cannot release funds during a dispute
    function test_ReleaseFundsNegativeScenario2() public {
        vm.prank(buyer);
        escrow.approveByBuyer();

        vm.prank(seller);
        escrow.raiseDispute();

        vm.prank(seller);
        vm.expectRevert(Escrow.Escrow__DisputeActive.selector);
        escrow.approveBySeller();

        assertTrue(escrow.isDisputeRaised());
        assertFalse(escrow.isSettled());
        assertEq(address(escrow).balance, AMOUNT);
    }

    // 8. Test Raise Dispute
    function test_RaiseDispute() public {
        vm.prank(buyer);
        escrow.raiseDispute();

        assertTrue(escrow.isDisputeRaised());
        assertFalse(escrow.isSettled());
        assertEq(address(escrow).balance, AMOUNT);
    }

    // Stranger cannot raise dispute
    function test_RaiseDisputeRejectsStranger() public {
        vm.prank(stranger);
        vm.expectRevert(Escrow.Escrow__OnlyBuyerOrSeller.selector);

        escrow.raiseDispute();
    }

    // 9. Test Resolve Dispute: seller wins
    function test_ResolveDisputeForSeller() public {
        vm.prank(buyer);
        escrow.raiseDispute();

        uint256 sellerBalanceBefore = seller.balance;

        vm.prank(arbiter);
        escrow.resolveDispute(true);

        assertTrue(escrow.isSettled());
        assertFalse(escrow.isDisputeRaised());
        assertEq(address(escrow).balance, 0);
        assertEq(seller.balance, sellerBalanceBefore + AMOUNT);
    }

    // 10. Test Resolve Dispute: buyer wins
    function test_ResolveDisputeForBuyer() public {
        vm.prank(seller);
        escrow.raiseDispute();

        uint256 buyerBalanceBefore = buyer.balance;

        vm.prank(arbiter);
        escrow.resolveDispute(false);

        assertTrue(escrow.isSettled());
        assertFalse(escrow.isDisputeRaised());
        assertEq(address(escrow).balance, 0);
        assertEq(buyer.balance, buyerBalanceBefore + AMOUNT);
    }

    // Only arbiter can resolve dispute
    function test_ResolveDisputeRejectsStranger() public {
        vm.prank(buyer);
        escrow.raiseDispute();

        vm.prank(stranger);
        vm.expectRevert(Escrow.Escrow__OnlyArbiter.selector);

        escrow.resolveDispute(true);
    }

    // Cannot resolve without an active dispute
    function test_ResolveDisputeRequiresDispute() public {
        vm.prank(arbiter);
        vm.expectRevert(Escrow.Escrow__NoDisputeRaised.selector);

        escrow.resolveDispute(true);
    }
}
