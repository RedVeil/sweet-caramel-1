import useProxy, { PROXY_REGISTRY_ADDRESS, PROXY_REGISTRY_ABI, DS_PROXY_ABI } from "hooks/useProxy";
import { useContractWrite, usePrepareContractWrite, useAccount } from "wagmi";
import { ProxyMultiCall } from "@popcorn/utils/MultiCallProxy";
import { useEffect, useState } from "react";
import { Contract, ethers } from "ethers";

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

const MULTICALL_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
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
  console.log("proxyAddress", proxyAddress);

  useEffect(() => {
    if (proxyAddress) {
      const tx = new ProxyMultiCall({
        proxyAddress: proxyAddress,
        targets: [
          // @ts-ignore should use Contract from utils package
          ["depositToken", new Contract(DEPOSIT_TOKEN_ADDRESS, DEPOSIT_TOKEN_ABI)],
          // @ts-ignore should use Contract from utils package
          ["vault", new Contract(VAULT_ADDRESS, VAULT_ABI)],
        ],
      });

      // deposit + stake example
      tx.push("depositToken", "transferFrom", [address, proxyAddress, "1"]);
      tx.push("depositToken", "approve", [VAULT_ADDRESS, "1"]);
      tx.push("vault", "deposit", ["1", proxyAddress]);
      const bytes = tx.submit();
      setBytes(bytes);
    }
  }, [proxyAddress]);

  const { config: config2 } = usePrepareContractWrite({
    address: proxyAddress,
    abi: DS_PROXY_ABI,
    functionName: "execute(address,bytes)",
    args: [MULTICALL_ADDRESS, bytes],
  });

  const { data: data2, isSuccess: isSuccess2, write: write2, isLoading: isLoading2 } = useContractWrite(config2);
  console.log("write2", write2);

  const { config: config3 } = usePrepareContractWrite({
    address: DEPOSIT_TOKEN_ADDRESS,
    abi: DEPOSIT_TOKEN_ABI,
    functionName: "approve(address,uint256)",
    args: [proxyAddress, ethers.utils.parseEther("100")],
  });

  const { data: data3, write: write3 } = useContractWrite(config3);
  console.log("write3", write3);

  return (
    <div>
      <button disabled={!write} onClick={() => write?.()}>
        Build
      </button>
      {isLoading && <div>Check Wallet</div>}
      {isSuccess && <div>Transaction: {JSON.stringify(data)}</div>}
      {proxyAddress && proxyAddress}
      <button disabled={!write2} onClick={() => write2?.()}>
        Execute
      </button>
      <button disabled={!write3} onClick={() => write3?.()}>
        Approve
      </button>
    </div>
  );
}
