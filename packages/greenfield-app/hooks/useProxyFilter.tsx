import { useEffect, useState } from "react";
import { useRpcProvider } from "@popcorn/app/hooks/useRpcProvider";
import { Contract, ethers } from "ethers";

const PROXY_FACTORY_ADDRESS = "0xD5bFeBDce5c91413E41cc7B24C8402c59A344f7c";

const PROXY_FACTORY_ABI = [
  {
    constant: false,
    inputs: [],
    name: "build",
    outputs: [{ name: "proxy", type: "address" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "sender", type: "address" },
      { indexed: true, name: "owner", type: "address" },
      { indexed: false, name: "proxy", type: "address" },
      { indexed: false, name: "cache", type: "address" },
    ],
    name: "Created",
    type: "event",
  },
];

export default function useProxyFilter({ owner }) {
  const provider = useRpcProvider(1337);
  const contract = new Contract(PROXY_FACTORY_ADDRESS, PROXY_FACTORY_ABI, provider);

  const [events, setEvents] = useState();

  useEffect(() => {
    contract.queryFilter(contract.filters.Created(null, owner)).then((events) => {
      setEvents(events);
    });
  }, [owner]);

  return events;
}
