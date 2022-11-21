import useProxyFilter, { PROXY_FACTORY_ADDRESS, PROXY_FACTORY_ABI } from "hooks/useProxyFilter";
import { useContractWrite, usePrepareContractWrite } from "wagmi";
import { useRpcProvider } from "@popcorn/app/hooks/useRpcProvider";
import { useNetwork, useAccount } from "wagmi";

export default function Proxy(): JSX.Element {
  const { chain } = useNetwork();
  const { address } = useAccount();

  const { config } = usePrepareContractWrite({
    address: PROXY_FACTORY_ADDRESS,
    abi: PROXY_FACTORY_ABI,
    functionName: "build()",
  });

  const { data, isSuccess, write, isLoading } = useContractWrite(config);

  const provider = useRpcProvider(chain.id);

  // 0x690B9A9E9aa1C9dB991C7721a92d351Db4FaC990
  // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 mm
  const proxyAddress = useProxyFilter(address, provider);

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
