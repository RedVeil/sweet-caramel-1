import { useEffect } from "react";
import { useAccount, useConnect, useEnsName, useSendTransaction } from "wagmi";
import { useContractWrite, usePrepareContractWrite, useContractRead } from "wagmi";

// @prettier-ignore
const ABI = [{ "constant": true, "inputs": [{ "name": "", "type": "address" }], "name": "isProxy", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "cache", "outputs": [{ "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [], "name": "build", "outputs": [{ "name": "proxy", "type": "address" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "owner", "type": "address" }], "name": "build", "outputs": [{ "name": "proxy", "type": "address" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "sender", "type": "address" }, { "indexed": true, "name": "owner", "type": "address" }, { "indexed": false, "name": "proxy", "type": "address" }, { "indexed": false, "name": "cache", "type": "address" }], "name": "Created", "type": "event" }];

const PROXY_FACTORY_ADDRESS = "0xD5bFeBDce5c91413E41cc7B24C8402c59A344f7c";

export const ProxyTest = () => {
  const { address, isConnected } = useAccount();

  const { config } = usePrepareContractWrite({
    addressOrName: "0xA26e15C895EFc0616177B7c1e7270A4C7D51C997",
    contractInterface: ABI,
    functionName: "build(address)",
    args: [address],
    enabled: isConnected && !!address,
    onError(error) {
      console.log({ error });
    },
    onSuccess(success) {
      console.log({ success });
    },
  });

  const {
    data,
    isSuccess,
    sendTransaction,
    error: sendTxError,
    reset,
  } = useSendTransaction(config);

  useEffect(() => {
    if (isConnected && !!address && sendTransaction) {
      sendTransaction();
    }
  }, [isConnected, address, sendTransaction]);


  return <></>;
}

export default ProxyTest;