import { networkMap } from "@popcorn/utils";
import { useComponentState } from "packages/components/hooks";
import { Pop } from "../types";
import useContractMetadata from "./hooks/useContractMetadata";

interface ContractProps extends Pop.NamedAccountsMetadata {
  alias?: string;
  children?: React.ReactElement[];
  index?: number;
}

export const Metadata: Pop.FC<ContractProps> = ({ address, chainId, children, alias, index }) => {
  const {
    data,
    status
  } = useContractMetadata({ chainId, address, alias });

  const { ready } = useComponentState({ ready: !!data, loading: status === "loading" });

  const { symbol, priceResolver, apyResolver, balanceResolver, decimals, name, icons, alias: _alias } = data || {};

  return (
    <>
      {(!!ready && (
        <div>
          <h2>{index}: {alias}</h2>
          <div>{index}: Alias: {alias}</div>
          <div>{index}: Chain: {networkMap[chainId]}</div>
          <div>{index}: Contract address: {address}</div>
          <div>{index}: Price Resolver: {priceResolver || "default"}</div>
          <div>{index}: Apy Resolver: {apyResolver || "default"}</div>
          <div>{index}: Balance Resolver: {balanceResolver || "default"}</div>
          <div>{index}: Symbol: {symbol || "n/a"}</div>
          <div>{index}: Icons: {icons && icons.length > 0 && `${`[` + icons.join(', ') + `]`}` || ''}</div>
          <div>
            {children?.length && children.map((elem, i) => (<div key={`${i}:${index}`}>{index} : {elem.key} : {elem}</div>))}
          </div>

          <br />
        </div>
      ))}
    </>
  );
};

export default Metadata;
