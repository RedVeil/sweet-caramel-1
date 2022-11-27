import { Networth, Price } from "../components";
import { useNamedAccounts } from "../hooks";
import { NextPage } from "next";
import { useReducer } from "react";
import { DefaultState, reducer, reset, updateToken, updateWallet } from "../reducers/portfolio";
import { useAccount } from "wagmi";
import { ChainId } from "@popcorn/utils";
import { useFeatures } from "@popcorn/components/hooks";
import useLog from "../hooks/utils/useLog";
import Token from "../components/Token";
import { BalanceValue } from "../components/BalanceValue";
import { Apy } from "../components/Apy";
import { Erc20, Escrow } from "../pop";

export const Portfolio: NextPage = () => {
  const {
    features: { portfolio: visible },
  } = useFeatures();

  const [state, dispatch] = useReducer(reducer, DefaultState);

  const { address: account } = useAccount({ onDisconnect: () => dispatch(reset()) });
  //const account = "0x28dc239fbf64abebc847d889d68c3f1dd18f72a8";


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
  const allContracts = [
    ...contractsEth,
    ...contractsPoly,
    ...contractsBnb,
    ...contractsArbitrum,
    ...contractsOp,
  ].flatMap((network) => network);

  useLog({ state }, [state])
  //  const { sum, add, loading, count } = useSum2({
  //    expected:
  //      allContracts.length,
  //  });
  //
  //  useLog({ sum2Out: { sum, loading, count }, length: allContracts.length });

  return (
    <div className={visible ? "" : "hidden"}>
      <Networth account={account} state={{ ...state }} allContracts={allContracts.flatMap((network, index) => allContracts[index].address)} expected={allContracts.length} />

      <br />

      {allContracts.map((token) => (
        <Token
          alias={token.__alias}
          key={`${token.chainId}:${token.address}`}
          chainId={Number(token.chainId) as unknown as ChainId}
          updateToken={(token) => {
            dispatch(updateToken(token));
          }}
          state={{ ...state }}
          address={token.address}
        >

          <Erc20.BalanceOf
            account={account}
            address={token.address}
            chainId={token.chainId}
          />

          <Escrow.BalanceOf
            account={account}
            address={token.address}
            chainId={token.chainId}
          />

          <Price
            address={token.address}
            chainId={token.chainId}
            state={{ ...state }}
            updateToken={(token) => dispatch(updateToken(token))}
          />

          <BalanceValue
            account={account}
            address={token.address}
            chainId={token.chainId}
            state={{ ...state }}
            updateWallet={(token) => {
              dispatch(updateWallet(token));
              //token?.balanceValue?.data?.value &&
              //add({ key: `${token.chainId}:${account}:${token.token}`, amount: token?.balanceValue?.data?.value });
            }}
          />
          <Apy
            address={token.address}
            chainId={token.chainId}
            state={{ ...state }}
            updateToken={(token) => dispatch(updateToken(token))}
          />

        </Token>
      ))}
    </div>
  );
};

export default Portfolio;
