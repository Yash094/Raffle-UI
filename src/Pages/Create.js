import {
  ConnectWallet,
  useSDK,
  useAddress,
  Web3Button,
} from "@thirdweb-dev/react";
import { useState } from "react";
import { ethers } from "ethers";
import { RAFFLE_CONTRACT_ADDRESS } from "../const/address";
import {
  Input,
  FormLabel,
  FormControl,
  Select,
  Flex,
  Box,
  Text,
} from "@chakra-ui/react";
import Nav from "../components/Nav";

export default function CreatePage() {
  const [raffle, setRaffle] = useState({
    maxTickets: 0,
    ticketPrice: 0,
    nftContract: "",
    tokenId: 0,
    endTimestamp: "",
    raffleCurrency: "native", // Set the default value to "native"
    ercAddress: "",
  });
  const sdk = useSDK();
  const address = useAddress();

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setRaffle((prevRaffle) => ({
      ...prevRaffle,
      [name]: value,
    }));
    console.log(raffle, name, value);
  };
  const approve = async () => {
    let nftContract = await sdk.getContract(raffle.nftContract);
    let isApproved = await nftContract.call("isApprovedForAll", [
      address,
      RAFFLE_CONTRACT_ADDRESS,
    ]);

    if (!isApproved) {
      await nftContract.call("setApprovalForAll", [
        RAFFLE_CONTRACT_ADDRESS,
        true,
      ]);
    }
  };
  return (
    <>
      <Nav />
      <Box
        width="100%"
        height="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Box
          p={8}
          borderWidth={1}
          borderRadius="md"
          boxShadow="md"
          bg="black"
          color="white"
        >
          <Text mb={10} fontSize="2xl">
            CREATE A NEW RAFFLE
          </Text>
          <FormControl>
            {/* Use Flex and Box to arrange two inputs in a row */}
            <Flex mb={3}>
              <Box flex={1} mr={2}>
                <FormLabel color="white">MAX TICKETS</FormLabel>
                <Input
                  type="number"
                  name="maxTickets"
                  onChange={handleInputChange}
                  color="white"
                  bg="black"
                  _focus={{ borderColor: "white" }}
                />
              </Box>

              <Box flex={1} mr={2}>
                <FormLabel color="white">TICKET PRICE</FormLabel>
                <Input
                  type="number"
                  name="ticketPrice"
                  onChange={handleInputChange}
                  color="white"
                  _focus={{ borderColor: "white" }}
                />
              </Box>
            </Flex>

            <Flex mb={3}>
              <Box flex={1} mr={2}>
                <FormLabel color="white">NFT CONTRACT ADDRESS</FormLabel>
                <Input
                  type="text"
                  name="nftContract"
                  onChange={handleInputChange}
                  color="white"
                  bg="black"
                  _focus={{ borderColor: "white" }}
                />
              </Box>
              <Box flex={1} mr={2}>
                <FormLabel color="white">TOKEN ID</FormLabel>
                <Input
                  type="number"
                  name="tokenId"
                  onChange={handleInputChange}
                  color="white"
                  bg="black"
                  _focus={{ borderColor: "white" }}
                />
              </Box>
            </Flex>
            <Flex mb={3}>
              <Box flex={1} mr={2}>
                <FormLabel color="white">END TIME</FormLabel>

                <Input
                  type="datetime-local"
                  name="endTimestamp"
                  onChange={handleInputChange}
                  color="white"
                  bg="black"
                  mb={3} // Add margin-bottom
                  _focus={{ borderColor: "white" }}
                />
              </Box>
              <Box flex={1} mr={2}>
                <FormLabel color="white">CURRENCY</FormLabel>
                <Select
                  name="raffleCurrency"
                  defaultValue="native"
                  onChange={handleInputChange}
                  color="white"
                  bg="black"
                  mb={3} // Add margin-bottom
                  _focus={{ borderColor: "white" }}
                >
                  <option value="native">Native Token</option>
                  <option value="erc">ERC Token</option>
                </Select>
                {/* Conditionally render the ERC address input */}
              </Box>
            </Flex>
            {raffle.raffleCurrency === "erc" && (
              <Input
                type="text"
                name="ercAddress"
                placeholder="Enter ERC Token Address"
                onChange={handleInputChange}
                color="white"
                bg="black"
                _focus={{ borderColor: "white" }}
                mb={3} // Add margin-bottom
              />
            )}
            <Web3Button
              contractAddress={RAFFLE_CONTRACT_ADDRESS}
              action={async (contract) => {
                await approve();
                await contract.call("createRaffle", [
                  {
                    maxTickets: raffle.maxTickets,
                    ticketPrice:
                      raffle.raffleCurrency != "native"
                        ? ethers.utils.parseUnits(raffle.ticketPrice).toString()
                        : ethers.utils.parseEther(raffle.ticketPrice),
                    endTimestamp:
                      new Date(raffle.endTimestamp).getTime() / 1000,
                    nftContract: raffle.nftContract,
                    tokenId: raffle.tokenId,
                    raffleCurrency:
                      raffle.raffleCurrency == "native"
                        ? ethers.constants.AddressZero
                        : raffle.ercAddress,
                  },
                ]);
              }}
            >
              Create Raffle
            </Web3Button>
          </FormControl>
        </Box>
      </Box>
    </>
  );
}
