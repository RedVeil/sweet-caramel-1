import { useAccount, useConnect, useEnsName } from "wagmi";
import { useContractWrite, usePrepareContractWrite, useContractRead } from "wagmi";

const ABI = [
  {
    constant: true,
    inputs: [{ name: "", type: "address" }],
    name: "isProxy",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "cache",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
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
    constant: false,
    inputs: [{ name: "owner", type: "address" }],
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

const PROXY_FACTORY_ADDRESS = "0xD5bFeBDce5c91413E41cc7B24C8402c59A344f7c";

export const ProxyTest = () => {
  const { address, isConnected } = useAccount();
  const { data: ensName } = useEnsName({ address });

  console.log(address);
  console.log("isConnected:", isConnected);

  const { config } = usePrepareContractWrite({
    addressOrName: "0xA26e15C895EFc0616177B7c1e7270A4C7D51C997",
    contractInterface: ABI,
    functionName: "build",
    // args: ["0xEd6715D2172BFd50C2DBF608615c2AB497904803"],
    onError(error) {
      console.log(2222);
      console.log("Error", error);
    },
    onSuccess(i) {
      console.log("Success", i);
    },
  });

  console.log(config);
  const { data: dd, isSuccess, write } = useContractWrite(config);
  console.log(7777);
  console.log(write);

  const { data: da } = useContractRead({
    addressOrName: "0xA26e15C895EFc0616177B7c1e7270A4C7D51C997",
    contractInterface: ABI,
    functionName: "cache",

    onError(error) {
      console.log(2222);
      console.log("Error", error);
    },
    onSuccess(i) {
      console.log("Success", i);
    },
  });
}

export default ProxyTest;