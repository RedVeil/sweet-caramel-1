import getNamedAccounts from "@popcorn/hardhat/lib/utils/getNamedAccounts";
import { ChainId } from "@popcorn/utils";
import { getTokenMetadataOverride } from "contractMetadataOverride";

interface TokenIconProps {
  token: string;
  fullsize?: boolean;
}
const namedAccounts = getNamedAccounts();

const TokenMetadataOverride = getTokenMetadataOverride();

export default function TokenIcon({ token, fullsize = false }: TokenIconProps): JSX.Element {
  switch (token) {
    case "Arrakis USDC/POP LP":
    case "SushiSwap LP Token":
      return (
        <div className="flex flex-row flex-shrink-0 flex-grow-0">
          <img
            src={TokenMetadataOverride[ChainId.Polygon][namedAccounts?.usdc?.polygon]?.icon}
            alt="usdc"
            className={`w-10 h-10 `}
          />
          <img
            src={TokenMetadataOverride[ChainId.Polygon][namedAccounts?.pop?.polygon]?.icon}
            alt="pop"
            className={`w-10 h-10 -ml-3`}
          />
        </div>
      );
    case "Butter (v2)":
      return (
        <img
          src={TokenMetadataOverride[ChainId.Ethereum][namedAccounts?.butter?.mainnet]?.icon}
          alt="butter"
          className="w-5 md:w-7 h-3 md:h-4 "
        />
      );
    case "3X":
      return <img src="/images/tokens/threeX.svg" alt="3x" className="w-10 h-10" />;
    case "Popcorn":
    default:
      return (
        <img
          src={TokenMetadataOverride[ChainId.Polygon][namedAccounts?.pop?.polygon]?.icon}
          alt="pop"
          className={`w-10 h-10`}
        />
      );
  }
}
