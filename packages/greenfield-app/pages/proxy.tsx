import useProxy, { PROXY_REGISTRY_ADDRESS, PROXY_REGISTRY_ABI, DS_PROXY_ABI } from "hooks/useProxy";
import { useContractWrite, usePrepareContractWrite } from "wagmi";
import { ProxyMultiCall } from "@popcorn/utils/MultiCallProxy";
import { useEffect, useState } from "react";
import { Contract, BigNumber, ethers } from "ethers";

const VAULT_ADDRESS = "0x2538a10b7ffb1b78c890c870fc152b10be121f04";

export const VAULT_ABI = [
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
    constant: true,
    inputs: [{ name: "", type: "address" }],
    name: "proxies",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

const DEPOSIT_TOKEN_ADDRESS = "0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c";
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
];

export default function Proxy(): JSX.Element {
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
        // @ts-ignore should use Contract from utils package
        targets: [["deposit", new Contract(DEPOSIT_TOKEN_ADDRESS, DEPOSIT_TOKEN_ABI)]],
      });

      // deposit + stake example
      tx.push("deposit", "approve", [VAULT_ADDRESS, ethers.utils.parseEther("100")]);
      const bytes = tx.submit();
      setBytes(bytes);
    }
  }, [proxyAddress]);

  const { config: config2 } = usePrepareContractWrite({
    address: proxyAddress,
    abi: DS_PROXY_ABI,
    functionName: "execute(address,bytes)",
    args: ["0xcA11bde05977b3631167028862bE2a173976CA11", bytes],
    onSuccess: () => {
      console.log("success");
    },
    onError: (err) => {
      console.log("error", err);
    },
  });
  const { data: data2, isSuccess: isSuccess2, write: write2, isLoading: isLoading2 } = useContractWrite(config);
  console.log("write2", write2);

  return (
    <div>
      <button disabled={!write} onClick={() => write?.()}>
        Feed
      </button>
      {isLoading && <div>Check Wallet</div>}
      {isSuccess && <div>Transaction: {JSON.stringify(data)}</div>}
      {proxyAddress && proxyAddress}
      <button disabled={!write2} onClick={() => write2?.()}>
        Feed2
      </button>
    </div>
  );
}
