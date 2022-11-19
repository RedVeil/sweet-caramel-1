import { Networth } from "components/portfolio/Networth";
import Price from "components/portfolio/Price";
import { WalletTokenBalance } from "components/portfolio/WalletTokenBalance";
import { useNamedAccounts } from "hooks/portfolio/useNamedAccounts";
import { NextPage } from "next";
import { useCallback, useReducer } from "react";
import { DefaultState, reducer, reset, updateToken, updateWallet } from "reducers/portfolio";
import { useAccount } from "wagmi";
import { ChainId } from "../../utils/src/connectors";
import { updateNetworth } from "../reducers/portfolio";
import { useFeatures } from "../../app/hooks/useFeatures";

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
    "dai",
    "usdc",
    "butter",
    "butterStaking",
    "xenStaking",
    "popUsdcArrakisVaultStaking",
    "rewardsEscrow",
  ]);

  const contractsPoly = useNamedAccounts("137", [
    "pop",
    "popStaking",
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

      {[...contractsEth, ...contractsPoly, ...contractsArbitrum, ...contractsBnb, ...contractsOp].map((token) => (
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
            resolver={token?.priceResolver}
            updateToken={_updateToken}
          />
        </WalletTokenBalance>
      ))}
    </div>
  );
};

export default Portfolio;
