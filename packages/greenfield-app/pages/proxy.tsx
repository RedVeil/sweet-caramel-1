import useProxy, { PROXY_REGISTRY_ADDRESS, PROXY_REGISTRY_ABI, DS_PROXY_ABI } from "hooks/useProxy";
import { useContractWrite, usePrepareContractWrite, useAccount } from "wagmi";
import { ProxyMultiCall } from "@popcorn/utils/MultiCallProxy";
import { useEffect, useState } from "react";
import { Contract, ethers } from "ethers";
import useMulticall, { useWriteMulticall } from "hooks/useMulticall";

export const VAULT_ABI = [
  {
    name: "deposit",
    type: "function",
    inputs: [
      {
        type: "uint256",
        name: "assets",
      },
      {
        type: "address",
        name: "receiver",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
  },
];

const DEPOSIT_TOKEN_ABI = [
  {
    constant: false,
    inputs: [
      {
        name: "_spender",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    name: "transferFrom",
    type: "function",
    inputs: [
      {
        type: "address",
        name: "sender",
      },
      {
        type: "address",
        name: "recipient",
      },
      {
        type: "uint256",
        name: "amount",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    name: "approve",
    type: "function",
    inputs: [
      {
        type: "address",
        name: "spender",
      },
      {
        type: "uint256",
        name: "amount",
      },
    ],
    stateMutability: "nonpayable",
  },
];

const DEPOSIT_TOKEN_ADDRESS = "0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c";
const VAULT_ADDRESS = "0x2538a10b7ffb1b78c890c870fc152b10be121f04";

export default function Proxy(): JSX.Element {
  const { address } = useAccount();
  const [bytes, setBytes] = useState();

  const { config } = usePrepareContractWrite({
    address: PROXY_REGISTRY_ADDRESS,
    abi: PROXY_REGISTRY_ABI,
    functionName: "build()",
  });

  const { data, isSuccess, write, isLoading } = useContractWrite(config);

  const { proxyAddress } = useProxy();

  // @ts-ignore should use Contract from utils package
  const { pmc } = useMulticall([
    // @ts-ignore should use Contract from utils package
    ["depositToken", new Contract(DEPOSIT_TOKEN_ADDRESS, DEPOSIT_TOKEN_ABI)],
    // @ts-ignore should use Contract from utils package
    ["vault", new Contract(VAULT_ADDRESS, VAULT_ABI)],
  ]);

  useEffect(() => {
    if (pmc) {
      // deposit + stake example
      pmc.push("depositToken", "transferFrom", [address, proxyAddress, "1"]);
      pmc.push("depositToken", "approve", [VAULT_ADDRESS, "1"]);
      pmc.push("vault", "deposit", ["1", proxyAddress]);
      const bytes = pmc.submit();
      setBytes(bytes);
    }
  }, [pmc]);

  const { write: writeExecCall } = useWriteMulticall(bytes);

  const { config: config3 } = usePrepareContractWrite({
    address: DEPOSIT_TOKEN_ADDRESS,
    abi: DEPOSIT_TOKEN_ABI,
    functionName: "approve(address,uint256)",
    args: [proxyAddress, ethers.utils.parseEther("100")],
  });

  const { write: write3 } = useContractWrite(config3);

  return (
    <div>
      <button disabled={!write} onClick={() => write?.()}>
        Build
      </button>
      {isLoading && <div>Check Wallet</div>}
      {isSuccess && <div>Transaction: {JSON.stringify(data)}</div>}
      {proxyAddress && proxyAddress}
      <button disabled={!writeExecCall} onClick={() => writeExecCall?.()}>
        Execute
      </button>
      <button disabled={!write3} onClick={() => write3?.()}>
        Approve
      </button>
    </div>
  );
}
