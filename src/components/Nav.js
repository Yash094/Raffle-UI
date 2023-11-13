import { Container, Flex, Heading } from "@chakra-ui/react";
import { ConnectWallet } from "@thirdweb-dev/react";

export default function Nav() {
    return (
        <Container maxW={"1600px"} py={4}>
            <Flex direction={"row"} justifyContent={"space-between"}>
                <Heading color="white">NFT RAFFLE APPLICATION</Heading>
                <ConnectWallet />
            </Flex>
        </Container>
    )
}