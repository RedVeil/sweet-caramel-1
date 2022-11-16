import { useEffect, useState } from "react";
import { Contract } from "ethers";

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

export default function useProxyFilter(owner: string, provider) {
  const contract = new Contract(PROXY_FACTORY_ADDRESS, PROXY_FACTORY_ABI, provider);

  const [proxyAddress, setProxyAddress] = useState();

  useEffect(() => {
    contract.queryFilter(contract.filters.Created(null, owner, null, null)).then((events) => {
      /**
       * events returns the list but we are only interested in the first proxy we find.
       * args[2] is where the proxy address is stored.
       */
      events.length > 0 && setProxyAddress(events[0].args[2]);
    });
  }, [owner]);

  return proxyAddress;
}
