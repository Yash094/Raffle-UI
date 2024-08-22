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
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@thirdweb-dev/contracts/extension/PermissionsEnumerable.sol";
import "@thirdweb-dev/contracts/extension/PlatformFee.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RaffleBase is
    ERC1155Holder,
    ERC721Holder,
    PermissionsEnumerable,
    PlatformFee,
    ReentrancyGuard
{
    address private owner;
    bytes32 public constant RAFFLE_CREATOR = keccak256("RAFFLE_CREATOR");
    bytes32 public constant ASSET_ROLE = keccak256("ASSET_ROLE");

    constructor(address _platformFeeRecipient, uint16 _platformFeeBps) {
        require(_platformFeeBps <= 1000, "Cannot be more than 10%");
        _setupPlatformFeeInfo(_platformFeeRecipient, _platformFeeBps);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(keccak256("RAFFLE_CREATOR"), msg.sender);
        _setupRole(keccak256("ASSET_ROLE"), address(0));
        owner = msg.sender;
    }

    enum TokenType {
        ERC721,
        ERC1155
    }
    struct Nftinfo {
        address nftContract;
        uint256 tokenId;
        TokenType tokenType;
    }

    /**
     *  @notice Structure for a raffle
     *
     *  @param raffleId Unique ID of the raffle
     *  @param raffleOwner Address of the owner who initiated the raffle
     *  @param raffleWinner Address of the winner of the raffle
     *  @param raffleMembers Array of addresses representing participants in the raffle
     *  @param raffleCurrency Address of the currency (token) used for transactions related to the raffle
     *  @param maxTickets Maximum number of tickets available for the raffle
     *  @param ticketPrice Price per ticket in the specified currency
     *  @param ticketsSold Number of tickets already sold
     *  @param endTimestamp UNIX timestamp indicating when the raffle ends and NFTs can be bought
     *  @param winnerDeclared Boolean indicating whether the raffle winner has been declared
     *  @param nftInfo Instance of the Nftinfo struct, containing information about the NFTs involved in the raffle
     */
    struct RaffleInfo {
        // structure to include all details about the raffle
        uint256 raffleId;
        address raffleOwner;
        address raffleWinner;
        address[] raffleMembers;
        address raffleCurrency;
        uint256 maxTickets;
        uint256 ticketPrice;
        uint256 ticketsSold;
        uint256 endTimestamp;
        bool winnerDeclared;
        Nftinfo nftInfo;
    }

    mapping(uint256 => RaffleInfo) public raffles;
    uint256[] public activeRaffleIDs;

    /// @notice Emitted when a new raffle is created.
    event RaffleCreated(uint256 indexed raffleId, address indexed creator);

    /// @notice Emitted when a someone joins a raffle
    event RaffleJoined(
        uint256 indexed raffleId,
        address indexed participant,
        uint256 numberOfTickets
    );

    /// @notice Emitted when a new raffle is ended.
    event RaffleEnded(
        uint256 indexed raffleId,
        address indexed winner,
        uint256 totalTicketsSold
    );

    /**
     *  @notice Structure for defining parameters to create a raffle
     *
     *  @param maxTickets Maximum number of tickets available for the raffle
     *  @param ticketPrice Price per ticket in the specified currency
     *  @param endTimestamp UNIX timestamp indicating when the raffle ends and NFTs can be bought
     *  @param nftContract Address of the NFT contract
     *  @param tokenId Token ID of the specific NFT
     *  @param raffleCurrency Address of the currency (token) used for transactions related to the raffle
     */
    struct raffleParams {
        uint256 maxTickets;
        uint256 ticketPrice;
        uint256 endTimestamp;
        address nftContract;
        uint256 tokenId;
        address raffleCurrency;
    }

    modifier onlyRaffleCreator() {
        require(
            Permissions(address(this)).hasRoleWithSwitch(
                RAFFLE_CREATOR,
                msg.sender
            ),
            "!Raffle Creator"
        );
        _;
    }

    /// @dev Checks whether the caller has ASSET_ROLE.
    modifier onlyAssetRole(address asset) {
        require(
            Permissions(address(this)).hasRoleWithSwitch(ASSET_ROLE, asset) ,
            "!ASSET_ROLE"
        );
        _;
    }

    /// @dev function to set Platform Fees
    function _canSetPlatformFeeInfo() internal view override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @dev Returns the interface supported by a contract.
    function getTokenType(
        address _assetContract
    ) internal view returns (TokenType tokenType) {
        if (
            IERC165(_assetContract).supportsInterface(
                type(IERC1155).interfaceId
            )
        ) {
            tokenType = TokenType.ERC1155;
        } else if (
            IERC165(_assetContract).supportsInterface(type(IERC721).interfaceId)
        ) {
            tokenType = TokenType.ERC721;
        } else {
            revert("Raffle: Token must be ERC1155 or ERC721.");
        }
    }

    /**
     * @dev Transfer erc721 or erc115 nfts
     */
    function transferNft(
        address _assetContract,
        address transferFrom,
        address transferTo,
        uint256 tokenId,
        TokenType tokenType
    ) internal {
        if (tokenType == TokenType.ERC1155) {
            require(
                IERC1155(_assetContract).balanceOf(transferFrom, tokenId) > 0,
                "Message sender does not own the specified NFT."
            );
            IERC1155(_assetContract).safeTransferFrom(
                transferFrom,
                transferTo,
                tokenId,
                1,
                ""
            );
        } else {
            require(
                IERC721(_assetContract).ownerOf(tokenId) == transferFrom,
                "Message sender does not own the specified NFT."
            );
            IERC721(_assetContract).transferFrom(
                transferFrom,
                transferTo,
                tokenId
            );
        }
    }

    /**
    @dev check if nft is owned by msg sender
     */
    function validateOwnershipAndApproval(
        address tokenOwner,
        address assetContract,
        uint256 tokenId,
        TokenType tokenType
    ) internal view returns (bool isValid) {
        address raffleMarket = address(this);

        if (tokenType == TokenType.ERC1155) {
            isValid =
                IERC1155(assetContract).balanceOf(tokenOwner, tokenId) >= 1 &&
                IERC1155(assetContract).isApprovedForAll(
                    tokenOwner,
                    raffleMarket
                );
        } else if (tokenType == TokenType.ERC721) {
            address owner;
            address operator;

            // failsafe for reverts in case of non-existent tokens
            try IERC721(assetContract).ownerOf(tokenId) returns (
                address _owner
            ) {
                owner = _owner;

                // Nesting the approval check inside this try block, to run only if owner check doesn't revert.
                // If the previous check for owner fails, then the return value will always evaluate to false.
                try IERC721(assetContract).getApproved(tokenId) returns (
                    address _operator
                ) {
                    operator = _operator;
                } catch {}
            } catch {}

            isValid =
                owner == tokenOwner &&
                (operator == raffleMarket ||
                    IERC721(assetContract).isApprovedForAll(
                        tokenOwner,
                        raffleMarket
                    ));
        }
    }
}