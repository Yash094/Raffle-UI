import { useContract, useContractRead } from "@thirdweb-dev/react";
import { RAFFLE_CONTRACT_ADDRESS } from "../const/address";
import RaffleViewer from "../components/RaffleViewer";
import Nav from "../components/Nav";
import { SimpleGrid, Text } from "@chakra-ui/react";

function Home() {
  const { data: contract } = useContract(RAFFLE_CONTRACT_ADDRESS);
  const { data, isLoading } = useContractRead(contract, "getActiveRaffles", []);

  return (
    <>
      <Nav />
        <SimpleGrid m={10} spacing={5} columns={{ base: 1, md: 2, lg: 3 }}>
        {data &&
          data.map((raffle, index) => {
            return (
              
                <RaffleViewer raffle={raffle} key={index} />
             
            );
          })}
        {data && data.length == 0 && (
          <Text color="white" fontSize="2xl">
            No Active Raffles
          </Text>
        )}
      </SimpleGrid>
    </>
  );
}
export default Home;
