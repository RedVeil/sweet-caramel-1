import { TvlWithLoading } from "../components/GroupedTvl";
import useSum from "../hooks/useSum";
import { ChainId, named } from "packages/utils";

import useNamedAccounts from "../hooks/useNamedAccounts";
const { eth, poly, arb, bnb, localhost, op, all } = named;

const Map = {
  [ChainId.Ethereum]: "1" as any,
};
export const TvlPromises: React.FC = () => {
  const eth_contracts = useNamedAccounts('1', ['butter', 'threeX']);

  const contracts = [...eth_contracts];

  const { loading, sum, add } = useSum({ count: contracts.length });

  return <><TvlWithLoading loading={loading} contracts={contracts} add={add} tvl={sum} /></>;
};

export default TvlPromises;
