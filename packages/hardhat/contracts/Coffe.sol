// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract BuyMeCoffee {
    event CoffeeBought(
        address indexed supporter,
        uint256 amount,
        string message,
        uint256 timestamp
    );

    address public owner;

    struct Contribution {
        address supporter;
        uint256 amount;
        string message;
        uint256 timestamp;
    }
    
    Contribution[] public contributions;

    constructor() {
        owner = msg.sender;
    }

    function buyCoffee(string memory message) external payable {
        require(msg.value > 0, "Amount must be greater than zero.");
        contributions.push(
            Contribution(msg.sender, msg.value, message, block.timestamp)
        );

        emit CoffeeBought(msg.sender, msg.value, message, block.timestamp);
    }

    function withdraw() external {
        require(msg.sender == owner, "Only the owner can withdraw funds.");
        payable(owner).transfer(address(this).balance);
    }

    function getContributions() external view returns (Contribution[] memory) {
        return contributions;
    }

    function setOwner(address newOwner) external {
        require(msg.sender == owner, "Only the owner can set a new owner.");
        owner = newOwner;
    }
}