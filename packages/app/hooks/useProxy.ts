import { useEffect } from "react";
import { useContractWrite, usePrepareContractWrite, useAccount, useBlockNumber } from "wagmi";

const PROXY_FACTORY_ADDRESS = "0xD5bFeBDce5c91413E41cc7B24C8402c59A344f7c ";
// const PROXY_FACTORY_ADDRESS = "0xA26e15C895EFc0616177B7c1e7270A4C7D51C997";

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

const tt = [
  {
    inputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "proxy",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "cache",
        type: "address",
      },
    ],
    name: "Created",
    type: "event",
  },
  {
    constant: false,
    inputs: [],
    name: "build",
    outputs: [
      {
        internalType: "address payable",
        name: "proxy",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "build",
    outputs: [
      {
        internalType: "address payable",
        name: "proxy",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "cache",
    outputs: [
      {
        internalType: "contract DSProxyCache",
        name: "",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "isProxy",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];
export function useProxy() {
  const { address, isConnecting, isDisconnected } = useAccount();

  console.log(address);

  const { config } = usePrepareContractWrite({
    addressOrName: PROXY_FACTORY_ADDRESS,
    contractInterface: ABI,
    functionName: "build",
  });

  const { data, isLoading, isSuccess, write } = useContractWrite(config);
  console.log(write);

  useEffect(() => {
    console.log(555);
  });
}
