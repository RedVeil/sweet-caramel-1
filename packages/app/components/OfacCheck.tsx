import { setSingleActionModal } from "@popcorn/app/context/actions";
import { store } from "@popcorn/app/context/store";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
// import { useProxy } from "hooks/useProxy";
import { useContext, useEffect, useState } from "react";
import { useDisconnect } from "wagmi";
import { useContractWrite, usePrepareContractWrite, useContractRead } from "wagmi";
import { useAccount, useConnect, useEnsName } from "wagmi";

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

export default function OfacCheck(): JSX.Element {
  const { dispatch } = useContext(store);
  const { account } = useWeb3();
  const [data, setData] = useState<{ success: boolean; permitted: boolean }>(null);
  const [isLoading, setLoading] = useState(false);
  const { disconnect } = useDisconnect();

  // useProxy();

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
  console.log(da);

  return (
    <>
      fdsfdsfds
      {/* {write && <div>ttttttt</div>} */}
    </>
  );
}
