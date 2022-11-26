import { Price, WalletTokenBalance, Networth, ContractTvlWithLoading } from "../components";
import { useNamedAccounts, useSum } from "../hooks";
import { NextPage } from "next";
import { useCallback, useEffect, useReducer } from "react";
import { DefaultState, reducer, reset, updateToken, updateWallet, updateNetworth } from "../reducers/portfolio";
import { useAccount } from "wagmi";
import { ChainId } from "@popcorn/utils";
import { useFeatures } from "@popcorn/components/hooks";
import { Apy } from "../components/Apy";
import { Balance } from "../components/Balance";
import { BalanceValue } from "../components/BalanceValue";
import useLog from "../hooks/utils/useLog";
import Token from "../components/Token";
import { BigNumber } from "ethers";

export const Portfolio: NextPage = () => {
  const {
    features: { portfolio: visible },
  } = useFeatures();

  const [state, dispatch] = useReducer(reducer, DefaultState);

  const { address: account } = useAccount({ onDisconnect: () => dispatch(reset()) });


  const contractsEth = useNamedAccounts("1", [
    "pop",
    "popStaking",
    "threeX",
    "threeXStaking",
    "butter",
    "butterStaking",
    "xenStaking",
    "popUsdcArrakisVaultStaking",
    "rewardsEscrow",
  ]);

  const contractsPoly = useNamedAccounts("137", [
    "pop",
    "popStaking",
    "popUsdcSushiLP",
    "popUsdcArrakisVault",
    "popUsdcArrakisVaultStaking",
    "rewardsEscrow",
    "xPop",
  ]);

  const contractsBnb = useNamedAccounts("56", ["pop", "rewardsEscrow"]);

  const contractsArbitrum = useNamedAccounts("42161", ["pop", "rewardsEscrow"]);

  const contractsOp = useNamedAccounts("10", ["pop", "popUsdcArrakisVault"]);

  useLog({ state });

  const _updateWallet = useCallback((args) => dispatch(updateWallet(args)), [dispatch]);
  const _updateNetworth = useCallback((args) => dispatch(updateNetworth(args)), [dispatch]);

  const { sum, add, loading } = useSum({ expected: contractsEth.length });

  return (
    <div className={visible ? "" : "hidden"}>
      <Networth account={account} state={{ ...state }} value={sum} loading={loading} />

      <br />

      {[
        ...contractsEth,
        ...contractsPoly,
        ...contractsBnb,
        ...contractsArbitrum,
        ...contractsOp
      ].map((token) => (
        <Token
          alias={token.__alias}
          key={`${token.chainId}:${token.address}`}
          chainId={Number(token.chainId) as unknown as ChainId}
          updateToken={(args) => { dispatch(updateToken(args)) }}
          state={{ ...state }}
          address={token.address}
        >
          <Balance
            account={account}
            address={token.address}
            chainId={token.chainId}
            resolver={token.balanceResolver}
          //   updateWallet={_updateWallet}
          />

        </Token>
      ))}
    </div>
  );
};

export default Portfolio;
