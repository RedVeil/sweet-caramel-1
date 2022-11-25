import { Price, WalletTokenBalance, Networth } from "../components";
import { useNamedAccounts } from "../hooks";
import { NextPage } from "next";
import { useCallback, useReducer } from "react";
import { DefaultState, reducer, reset, updateToken, updateWallet, updateNetworth } from "../reducers/portfolio";
import { useAccount } from "wagmi";
import { ChainId } from "@popcorn/utils";
import { useFeatures } from "@popcorn/components/hooks";
import { Apy } from "../components/Apy";

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

  const _updateWallet = useCallback((args) => dispatch(updateWallet(args)), [dispatch]);
  const _updateNetworth = useCallback((args) => dispatch(updateNetworth(args)), [dispatch]);
  const _updateToken = useCallback((args) => dispatch(updateToken(args)), [dispatch]);

  return (
    <div className={visible ? "" : "hidden"}>
      <Networth account={account} state={state} updateNetworth={_updateNetworth} />

      <br />

      {[...contractsEth, ...contractsPoly, ...contractsBnb, ...contractsArbitrum, ...contractsOp].map((token) => (
        <WalletTokenBalance
          alias={token.__alias}
          key={`${token.chainId}:${token.address}`}
          chainId={Number(token.chainId) as unknown as ChainId}
          state={state}
          updateWallet={_updateWallet}
          token={state.tokens[token.chainId][token.address]}
          account={account}
        >
          <Price
            token={token.address}
            chainId={Number(token.chainId) as ChainId}
            resolver={token.priceResolver}
            updateToken={_updateToken}
          />
          <Apy
            address={token.address}
            chainId={Number(token.chainId) as ChainId}
            resolver={token.apyResolver}
            updateToken={_updateToken}
          />
        </WalletTokenBalance>
      ))}
    </div>
  );
};

export default Portfolio;
