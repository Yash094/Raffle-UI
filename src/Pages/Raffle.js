import {
  ConnectWallet,
  useContract,
  Web3Button,
  useContractRead,
  useSDK,
  useAddress,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { RAFFLE_CONTRACT_ADDRESS } from "../const/address";
import { Flex, Box, Image, Text, Stack, Heading } from "@chakra-ui/react";
import { formatTime } from "../utils/utils";
import Nav from "../components/Nav";
const OPENSEA_URL = "https://testnets.opensea.io/assets/mumbai/";

function Raffle() {
  const [timeLeft, setTimeLeft] = useState();
  const [NftMetadata, setNftMetadata] = useState();
  const params = useParams();
  const address = useAddress();
  const sdk = useSDK();
  const { data: contract } = useContract(RAFFLE_CONTRACT_ADDRESS);
  const { data, isLoading } = useContractRead(contract, "getRaffle", [
    params.id,
  ]);
  
  useEffect(() => {
    if (isLoading || !data) return;
    async function setTime() {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeLeftInSeconds = data.endTimestamp.toString() - currentTime;

      if (timeLeftInSeconds > 0) {
        setTimeLeft(timeLeftInSeconds);
      } else {
        setTimeLeft(0); // Raffle has ended
      }

      let nftContract = await sdk.getContract(data.nftContract);
      
      let nft;
      try {
        nft = await nftContract.erc721.get(data.tokenId);
      } catch (e) {
        nft = await nftContract.erc1155.get(data.tokenId);
      }
    
      setNftMetadata(nft);
    }
    setTime();
  }, [data]);

  const getTicketCount = (address) => {
    let count = 0;
    for (let i = 0; i <= data.RaffleMembers.length; i++) {
      if (data.RaffleMembers[i] == address) {
        count++;
      }
    }
    return count;
  };
  if (isLoading) return <h1>Loading...</h1>;
  return (
    <>
      <Nav />
      <Flex align="center" justify="center" minH="100vh">
        <Box maxW="400px" mx="4">
          <Image
           src={NftMetadata && NftMetadata.metadata.image}
            alt="Image Alt Text"
            borderRadius="md"
            boxSize="100%"
          />
        </Box>

        <Box maxW="600px" mx="4" color="white">
        <Heading mb="4">{NftMetadata && NftMetadata.metadata.name}</Heading> 
          <Text fontSize="lg" mb="4">
            {NftMetadata && NftMetadata.metadata.description}
          </Text>

          <Stack mt="6" spacing="3">
            <Text fontSize="lg">
              Price: {data.ticketPrice.toString() / 1000000000000000000}{" "}
              {data.raffleCurrency == ethers.constants.AddressZero
                ? "Matic"
                : ""}
            </Text>
            <Text fontSize="lg">
              Tickets Sold: {data && data.ticketsSold.toString()}/
              {data && data.maxTickets.toString()}
            </Text>

            {address && (
              <Text fontSize="lg">
                Raffle Tickets Bought: {getTicketCount(address)}
              </Text>
            )}
            {data.raffleWinner !==
              "0x0000000000000000000000000000000000000000" && (
              <Web3Button mt="4" isDisabled={true}>
                Raffle Ended, Winner: {data.raffleWinner}
              </Web3Button>
            )}
            {timeLeft !== 0 && (
              <>
                <Web3Button mt="4" isDisabled={true}>
                  {formatTime(timeLeft)}
                </Web3Button>
                <Web3Button
                  mt="4"
                  contractAddress={RAFFLE_CONTRACT_ADDRESS}
                  action={async (contract) => {
                    if (data.raffleCurrency !== ethers.constants.AddressZero) {
                      let tokencon = await sdk.getContract(data.raffleCurrency);
                      await tokencon.call("approve", [
                        RAFFLE_CONTRACT_ADDRESS,
                        data.ticketPrice.toString(),
                      ]);
                      contract.call("joinRaffle", [params.id, 1], {});
                      return;
                    } else {
                      contract.call("joinRaffle", [params.id, 1], {
                        value: data.ticketPrice.toString(),
                      });
                    }
                  }}
                >
                  Join Raffle
                </Web3Button>
              </>
            )}

            {data.raffleWinner ===
              "0x0000000000000000000000000000000000000000" &&
              timeLeft === 0 && (
                <Web3Button
                  mt="4"
                  contractAddress={RAFFLE_CONTRACT_ADDRESS}
                  action={(contract) => {
                    contract.call("endRaffle", [params.id]);
                  }}
                >
                  End Raffle
                </Web3Button>
              )}
          </Stack>
        </Box>
      </Flex>
    </>
  );
}
export default Raffle;
