import { useRpcProvider } from "@popcorn/app/hooks/useRpcProvider";
import { Contract, ethers } from "ethers";
import { useContractWrite, usePrepareContractWrite } from "wagmi";

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

export default function Proxy(): JSX.Element {
  const { config } = usePrepareContractWrite({
    addressOrName: PROXY_FACTORY_ADDRESS,
    contractInterface: PROXY_FACTORY_ABI,
    functionName: "build()",
  });

  const { data, isSuccess, write, isLoading } = useContractWrite(config);

  const provider = useRpcProvider(1337);
  const contract = new Contract(PROXY_FACTORY_ADDRESS, PROXY_FACTORY_ABI, provider);
  console.log(contract);

  const aa = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const ff = contract.filters.Created(null, aa);
  console.log(3333);
  console.log(ff);

  contract.queryFilter(ff).then((events) => {
    console.log(events);
  });

  return (
    <div>
      <button disabled={!write} onClick={() => write?.()}>
        Feed
      </button>
      {isLoading && <div>Check Wallet</div>}
      {isSuccess && <div>Transaction: {JSON.stringify(data)}</div>}
    </div>
  );
}
