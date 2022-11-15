import { setSingleActionModal } from "@popcorn/app/context/actions";
import { store } from "@popcorn/app/context/store";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { useProxy } from "hooks/useProxy";
import { useContext, useEffect, useState } from "react";
import { useDisconnect } from "wagmi";
import { useContractWrite, usePrepareContractWrite, useContractRead } from "wagmi";

const ABI = [
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

const PROXY_FACTORY_ADDRESS = "0xD5bFeBDce5c91413E41cc7B24C8402c59A344f7c";

export default function OfacCheck(): JSX.Element {
  const { dispatch } = useContext(store);
  const { account } = useWeb3();
  const [data, setData] = useState<{ success: boolean; permitted: boolean }>(null);
  const [isLoading, setLoading] = useState(false);
  const { disconnect } = useDisconnect();

  useProxy();

  useEffect(() => {
    if (!account) return;
    setLoading(true);
    fetch(`/api/checkOfac?address=${account}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, [account]);

  useEffect(() => {
    if (isLoading || !data) return;
    if (data.success && !data.permitted) {
      dispatch(
        setSingleActionModal({
          keepOpen: true,
          title: "Authorization Error",
          content: "The connected wallet is not authorized to make transactions with this application",
          onConfirm: { label: "Disconnect Wallet", onClick: disconnect },
        }),
      );
    }
  }, [data, isLoading]);

  const { config } = usePrepareContractWrite({
    addressOrName: PROXY_FACTORY_ADDRESS,
    contractInterface: ABI,
    functionName: "build",
    args: ["0xEd6715D2172BFd50C2DBF608615c2AB497904803"],
    onError(error) {
      console.log(2222);
      console.log("Error", error);
    },
  });
  console.log(config);
  const { data: dd, isSuccess, write } = useContractWrite(config);
  console.log(write);

  const { data: data5555 } = useContractRead({
    addressOrName: PROXY_FACTORY_ADDRESS,
    contractInterface: ABI,
    functionName: "isProxy",
    args: ["0xEd6715D2172BFd50C2DBF608615c2AB497904803"],
    onError(error) {
      console.log("Error", error);
    },
  });
  console.log(6565665);
  console.log(data5555);

  return <>fdsfdsfds</>;
}
