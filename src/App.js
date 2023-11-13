import {
  ConnectWallet,
  useContract,
  useContractWrite,
  useSDK,
  useAddress,
} from "@thirdweb-dev/react";
import { useState, useEffect } from "react";

export default function Home() {
  const [raffle, setRaffle] = useState([]);
  const [activeRaffles, setActiveRaffles] = useState([]);
  const { data: contract } = useContract(
    "0xb9ED86FD5645c98a5136f681f0680De84283bE18"
  );
  const sdk = useSDK();
  const address = useAddress();
  useEffect(() => {
    async function getRaffles() {
      let contract = await sdk.getContract(
        "0xb9ED86FD5645c98a5136f681f0680De84283bE18"
      );
      const data = await contract.call("getActiveRaffles", []);
      let raffleArray = [];
      for (let i = 0; i < data.length; i++) {
        let final = await contract.call("getRaffle", [data[i].toString()]);
        raffleArray.push(final);
      }
      setActiveRaffles(raffleArray);
    }
    getRaffles();
  }, []);
  console.log(activeRaffles);
  const { mutateAsync: createRaffle, isLoading } = useContractWrite(
    contract,
    "createRaffle"
  );
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setRaffle((prevRaffle) => ({
      ...prevRaffle,
      [name]: value,
    }));
    console.log(raffle, name, value);
  };
  const call = async () => {
    try {
      let nftcon = await sdk.getContract(raffle.nftContract);
      let isApproved = await nftcon.call("isApprovedForAll", [
        address,
        "0xb9ED86FD5645c98a5136f681f0680De84283bE18",
      ]);
      console.log(isApproved);
      if (!isApproved) {
        await nftcon.call("setApprovalForAll", [
          "0xb9ED86FD5645c98a5136f681f0680De84283bE18",
          true,
        ]);
      }
      const data = await createRaffle({
        args: [
          raffle.raffleName,
          raffle.raffleDesc,
          raffle.maxTickets,
          raffle.ticketPrice,
          Date.parse(raffle.endTimestamp),
          raffle.nftContract,
          raffle.tokenId,
          raffle.raffleCurrency,
        ],
      });
      console.info("contract call successs", data);
    } catch (err) {
      console.error("contract call failure", err);
    }
  };

  return (
    <main className="main">
      <div className="container">
        <div className="header">
          <div className="connect">
            <ConnectWallet
              dropdownPosition={{
                side: "bottom",
                align: "center",
              }}
            />
            <br />
            <label>RAFFLE NAME</label>
            <input type="text" name="raffleName" onChange={handleInputChange} />
            <br />
            <label>RAFFLE DESCRIPTION</label>
            <input type="text" name="raffleDesc" onChange={handleInputChange} />
            <br />
            <label>MAX TICKETS</label>
            <input
              type="number"
              name="maxTickets"
              onChange={handleInputChange}
            />
            <br />
            <label>TICKET PRICE</label>
            <input
              type="number"
              name="ticketPrice"
              onChange={handleInputChange}
            />
            <br />
            <label>END TIME</label>
            <input
              type="datetime-local"
              name="endTimestamp"
              onChange={handleInputChange}
            />
            <br />
            <label>CONTRACT ADDRESS</label>
            <input
              type="text"
              name="nftContract"
              onChange={handleInputChange}
            />
            <br />
            <label>TOKEN ID</label>
            <input type="number" name="tokenId" onChange={handleInputChange} />
            <br />
            <label>CURRENCY</label>
            <input
              type="text"
              name="raffleCurrency"
              onChange={handleInputChange}
            />
            <br />
            <button onClick={call}>Submit</button>

            <br />
            <br />
            {activeRaffles &&
              activeRaffles.map((raffle) => {
                return (
                  <>
                    <h1>{raffle.raffleName}</h1>
                    <p>{raffle.raffleDesc}</p>
                    <p>{raffle.ticketPrice.toString()}</p>
                  </>
                );
              })}
          </div>
        </div>
      </div>
    </main>
  );
}
