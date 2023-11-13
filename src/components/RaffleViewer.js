import {
  Card,
  Stack,
  Divider,
  ButtonGroup,
  CardBody,
  CardFooter,
  Image,
  Text,
  Skeleton,
  Button,
} from "@chakra-ui/react";
import { useContract, useNFT } from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { formatTime } from "../utils/utils";
import { useState, useEffect } from "react";
const OPENSEA_URL = "https://testnets.opensea.io/assets/mumbai/";

export default function RaffleViewer(raffle) {
  const [timeLeft, setTimeLeft] = useState();
  raffle = raffle.raffle;
  
  const { contract } = useContract(raffle.nftInfo.nftContract);
  const {
    data: nft,
    isLoading,
    error,
  } = useNFT(contract, raffle.nftInfo.tokenId.toString());
  useEffect(() => {
    async function setTime() {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeLeftInSeconds = raffle.endTimestamp.toString() - currentTime;

      if (timeLeftInSeconds > 0) {
        setTimeLeft(timeLeftInSeconds);
      } else {
        setTimeLeft(0); // Raffle has ended
      }
    }
    setTime();
  }, []);
  return (
      <Card maxW="sm" bg="black" border="2px" borderColor="white">
        <CardBody>
          <Image
            border="2px"
            borderColor="black.200"
            src={nft?.metadata.image}
            borderRadius="lg"
          />
          <Stack mt="6" spacing="3">
            <Text color="white" fontSize="xl">
              {nft?.metadata.name}
            </Text>

            <Text color="white" fontSize="xl">
              Price: {raffle.ticketPrice.toString() / 1000000000000000000}{" "}
              {raffle.raffleCurrency == ethers.constants.AddressZero
                ? "Matic"
                : ""}
            </Text>
            <Text color="white" fontSize="sm">
              {nft?.metadata.description}
            </Text>
            <Text color="white" fontSize="sm">
              Ends In: {formatTime(timeLeft)}
            </Text>
          </Stack>
        </CardBody>
        <Divider />
        <CardFooter>
          <ButtonGroup spacing="2">
            <Button
              as="a"
              href={"/raffle/" + raffle.raffleId}
              target="_blank"
              border="2px"
              bordercolor="white"
              bg="black"
              color="white"
              _hover={{
                bg: "black", // Set the same background color on hover
              }}
            >
              View Raffle
            </Button>
            <Button
              as="a"
              href={
                OPENSEA_URL +
                raffle.nftInfo.nftContract +
                "/" +
                raffle.nftInfo.tokenId.toString()
              }
              target="_blank"
              border="2px"
              bordercolor="white"
              bg="black"
              color="white"
              _hover={{
                bg: "black", // Set the same background color on hover
              }}
            >
              Opensea 
            </Button>
          </ButtonGroup>
        </CardFooter>
      </Card>
  
  );
}
