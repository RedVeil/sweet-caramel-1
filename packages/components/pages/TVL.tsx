import useNamedAccounts from "../hooks/useNamedAccounts";
import { GroupedTvl } from "../components/GroupedTvl";
import { useEffect, useState } from "react";
import { formatAndRoundBigNumber } from '../../utils/src/formatBigNumber';
import { constants } from "ethers";

export const TVL = () => {
  const contracts = useNamedAccounts("1", [
    'butter', "threeX"
  ]);
  const [sum, setSum] = useState(constants.Zero);
  const sumTvl = (tvl) => {
    setSum(sum.add(tvl));
  }


  return (<>
    <div>Total: {sum && formatAndRoundBigNumber(sum, 18)} </div>
    <GroupedTvl contracts={contracts} sumArr={contracts.map(sumTvl)} />
  </>);
};

export default TVL;