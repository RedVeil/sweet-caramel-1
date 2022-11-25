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

  useEffect(() => {
    console.log({ state, account });
  }, [state]);

  const _updateWallet = useCallback((args) => dispatch(updateWallet(args)), [dispatch]);
  const _updateNetworth = useCallback((args) => dispatch(updateNetworth(args)), [dispatch]);
  const _updateToken = useCallback((args) => dispatch(updateToken(args)), [dispatch]);

  const { sum, add, loading } = useSum({ expected: contractsEth.length });

  return (
    <div className={visible ? "" : "hidden"}>
      <Networth account={account} state={{ ...state }} value={sum} loading={loading} />

      <br />

      {[
        ...contractsEth,
        // ...contractsPoly, 
        // ...contractsBnb, 
        // ...contractsArbitrum, 
        // ...contractsOp
      ].map((token) => (
        <WalletTokenBalance
          alias={token.__alias}
          key={`${token.chainId}:${token.address}`}
          chainId={Number(token.chainId) as unknown as ChainId}
          //    updateWallet={_updateWallet}
          token={token.address}
          account={account}
        >
          <Balance
            account={account}
            address={token.address}
            chainId={token.chainId}
            resolver={token.balanceResolver}
          //   updateWallet={_updateWallet}
          />
          {/*
          <Price
            address={token.address}
            chainId={Number(token.chainId) as ChainId}
            resolver={token.priceResolver}
          //    updateToken={_updateToken}
          />
          <BalanceValue
            account={account}
            address={token.address}
            chainId={token.chainId}
            price={{ ...state?.tokens?.[token.chainId]?.[token.address]?.price }}
            balance={{ ...state.tokens?.[token.chainId]?.[token.address]?.balance }}
          //   updateWallet={_updateWallet}
          />
          <Apy
            address={token.address}
            chainId={Number(token.chainId) as ChainId}
            resolver={token.apyResolver}
          //   updateToken={_updateToken}
          />
          <ContractTvlWithLoading
            address={token.address}
            chainId={token.chainId}
            loading={token?.isLoading}
          //    updateToken={_updateToken}
          />
      */}
        </WalletTokenBalance>
      ))}
    </div>
  );
};

export default Portfolio;
