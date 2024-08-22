// SPDX-License-Identifier: MIT
// ╔════════════════════════════════════════════════╗
// ║                  Disclaimer                   ║
// ╚════════════════════════════════════════════════╝
// This smart contract is provided as-is for educational and testing purposes. Deploying it on the mainnet without thorough testing may result in the loss of funds. The contract creator/author is absolved of responsibility for any issues, losses, or damages that may arise from the use of this contract.
//
// Please be aware that this contract has not undergone a security audit and may contain vulnerabilities. Exercise caution and adhere to best practices, especially when deploying smart contracts in a production environment.
// ═══════════════════════════════════════════════════

// Author: Yash J
pragma solidity ^0.8.20;

import "./RaffleBase.sol";

contract Raffle is RaffleBase {
    constructor(
        address _platformFeeRecipient,
        uint16 _platformFeeBps
    ) RaffleBase(_platformFeeRecipient, _platformFeeBps) {}

    uint256 private raffleIdCounter;

    /**
     * @dev Creates a new raffle with the specified parameters.
     * @param params.maxTickets The maximum amount of tickets that can be sold
     * @param params.ticketPrice Price for each ticket
     * @param params.endTimestamp Time for when buying of new tickets is disabled
     * @param params.nftContract Contract address of the nft being raffled
     * @param params.tokenId TokenID address of the nft being raffled
     * @param params.raffleCurrency Currency address to accept the ticketPrice
     * @return ID ID of the created raffle.
     */
    function createRaffle(
        raffleParams calldata params
    ) public nonReentrant onlyRaffleCreator onlyAssetRole(params.nftContract) returns (uint256) {
        require(
            params.endTimestamp > block.timestamp,
            "End timestamp must be in the future"
        );

        raffleIdCounter += 1;
        uint256 raffleId = raffleIdCounter;
        raffles[raffleId] = RaffleInfo({
            raffleId: raffleId,
            raffleOwner: msg.sender,
            raffleWinner: address(0),
            raffleMembers: new address[](0),
            raffleCurrency: params.raffleCurrency,
            nftInfo: Nftinfo({
                nftContract: params.nftContract,
                tokenId: params.tokenId,
                tokenType: getTokenType(params.nftContract) // or TokenType.ERC1155 based on your use case
            }),
            maxTickets: params.maxTickets,
            ticketPrice: params.ticketPrice,
            ticketsSold: 0,
            endTimestamp: params.endTimestamp,
            winnerDeclared: false
        });
        transferNft(
            params.nftContract,
            msg.sender,
            address(this),
            params.tokenId,
            getTokenType(params.nftContract)
        );
        activeRaffleIDs.push(raffleId);
        emit RaffleCreated(raffleId, msg.sender);
        return raffleId;
    }

    /**
     * @dev Allows a participant to join a raffle by purchasing tickets.
     * @param raffleId The ID of the raffle to join.
     * @param numOfTickets The number of tickets to purchase.
     * @return A confirmation message.
     */

    function joinRaffle(
        uint256 raffleId,
        uint256 numOfTickets
    ) public payable nonReentrant returns (string memory) {
        RaffleInfo storage raffle = raffles[raffleId];
        require(block.timestamp < raffle.endTimestamp, "Ended");
        require(numOfTickets > 0, "Tickets>0");
        require(
            numOfTickets + raffle.ticketsSold <= raffle.maxTickets,
            "Sold Out"
        );
        if (raffle.raffleCurrency != address(0)) {
            require(
                IERC20(raffle.raffleCurrency).balanceOf(msg.sender) >=
                    numOfTickets * raffle.ticketPrice &&
                    IERC20(raffle.raffleCurrency).allowance(
                        msg.sender,
                        address(this)
                    ) >=
                    numOfTickets * raffle.ticketPrice,
                "!BAL20"
            );
            require(
                IERC20(raffle.raffleCurrency).transferFrom(
                    msg.sender,
                    address(this),
                    numOfTickets * raffle.ticketPrice
                ),
                "Transfer Fail"
            );
        } else {
            require(
                numOfTickets * raffle.ticketPrice == msg.value,
                "Incorrect Amount"
            );
        }
        for (uint256 i = 0; i < numOfTickets; i++) {
            raffle.ticketsSold++;
            raffle.raffleMembers.push(msg.sender);
        }
        emit RaffleJoined(raffleId, msg.sender, numOfTickets);
        return "Entry Confirmed";
    }

    /**
     * @dev Ends a raffle, determines the winner, and handles payouts.
     * @param raffleId The ID of the raffle to end.
     * @return The address of the winner.
     */

    function endRaffle(uint256 raffleId) public nonReentrant returns (address) {
        RaffleInfo storage raffle = raffles[raffleId];
        require(block.timestamp > raffle.endTimestamp, "!ENDED");
        require(!raffle.winnerDeclared, "winner declared");

        if (raffle.raffleMembers.length == 0) {
            transferNft(
                raffle.nftInfo.nftContract,
                address(this),
                raffle.raffleOwner,
                raffle.nftInfo.tokenId,
                raffle.nftInfo.tokenType
            );
            raffle.raffleWinner = raffle.raffleOwner;
            raffle.winnerDeclared = true;
            removeRaffleId(raffleId);
            emit RaffleEnded(raffleId, raffle.raffleWinner, raffle.ticketsSold);
            return raffle.raffleOwner;
        }

        uint256 num = getRandomNumber(raffle.raffleMembers.length);
        address winner = raffle.raffleMembers[num];
        transferNft(
            raffle.nftInfo.nftContract,
            address(this),
            winner,
            raffle.nftInfo.tokenId,
            raffle.nftInfo.tokenType
        );
        (
            address platformFeeRecipient,
            uint16 platformFeeBps
        ) = getPlatformFeeInfo();
        uint256 platformFee = (raffle.ticketsSold *
            raffle.ticketPrice *
            platformFeeBps) / 10_000;
        uint256 winnerPayout = (raffle.ticketsSold * raffle.ticketPrice) -
            platformFee;
        if (raffle.raffleCurrency != address(0)) {
            IERC20(raffle.raffleCurrency).approve(
                address(this),
                raffle.ticketsSold * raffle.ticketPrice
            );

            IERC20(raffle.raffleCurrency).transferFrom(
                address(this),
                platformFeeRecipient,
                platformFee
            );
            IERC20(raffle.raffleCurrency).transferFrom(
                address(this),
                raffle.raffleOwner,
                winnerPayout
            );
            raffle.winnerDeclared = true;
            raffle.raffleWinner = winner;
            removeRaffleId(raffleId);
            emit RaffleEnded(raffleId, raffle.raffleWinner, raffle.ticketsSold);
            return winner;
        } else {
            payable(platformFeeRecipient).transfer(platformFee);
            payable(raffle.raffleOwner).transfer(winnerPayout);
            raffle.winnerDeclared = true;
            raffle.raffleWinner = winner;
            removeRaffleId(raffleId);
            emit RaffleEnded(raffleId, raffle.raffleWinner, raffle.ticketsSold);
            return winner;
        }
    }

    /**
     * @dev Retrieves information about a specific raffle.
     * @param raffle_id The ID of the raffle to query.
     
     */
    function getRaffle(
        uint256 raffle_id
    )
        public
        view
        returns (
            address raffleOwner,
            address raffleWinner,
            address[] memory RaffleMembers,
            address raffleCurrency,
            address nftContract,
            uint256 tokenId,
            uint256 maxTickets,
            uint256 ticketPrice,
            uint256 ticketsSold,
            uint256 endTimestamp,
            bool winnerDeclared
        )
    {
        RaffleInfo storage raffle = raffles[raffle_id];
        return (
            raffle.raffleOwner,
            raffle.raffleWinner,
            raffle.raffleMembers,
            raffle.raffleCurrency,
            raffle.nftInfo.nftContract,
            raffle.nftInfo.tokenId,
            raffle.maxTickets,
            raffle.ticketPrice,
            raffle.ticketsSold,
            raffle.endTimestamp,
            raffle.winnerDeclared
        );
    }

    /**
     * @dev Retrieves information about all active raffles.
     */
    function getActiveRaffles() public view returns (RaffleInfo[] memory) {
        RaffleInfo[] memory result = new RaffleInfo[](activeRaffleIDs.length);
        for (uint256 i = 0; i < activeRaffleIDs.length; i++) {
            uint256 raffleId = activeRaffleIDs[i];
            result[i] = raffles[raffleId];
        }
        return result;
    }

    function getRandomNumber(uint256 max) internal view returns (uint256) {
        require(max > 0, "Max value must be greater than 0");

        uint256 random = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)
            )
        ) % max;

        return random;
    }

    function removeRaffleId(uint256 raffleId) internal {
        for (uint256 i = 0; i < activeRaffleIDs.length; i++) {
            if (activeRaffleIDs[i] == raffleId) {
                // Shift elements to overwrite the element to be removed
                for (uint256 j = i; j < activeRaffleIDs.length - 1; j++) {
                    activeRaffleIDs[j] = activeRaffleIDs[j + 1];
                }
                // Reduce the length of the array to remove the last element
                activeRaffleIDs.pop();
                return;
            }
        }
    }
}