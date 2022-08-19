import getNamedAccounts from "@popcorn/hardhat/lib/utils/getNamedAccounts";
import { ChainId } from "@popcorn/utils";
import { getTokenMetadataOverride } from "contractMetadataOverride";

interface TokenIconProps {
  token: string;
  fullsize?: boolean;
  imageSize?: string;
}
const namedAccounts = getNamedAccounts();

const TokenMetadataOverride = getTokenMetadataOverride();

export default function TokenIcon({ token, fullsize = false, imageSize }: TokenIconProps): JSX.Element {
  switch (token) {
    case "Arrakis USDC/POP LP":
    case "Sushi USDC/POP LP":
      return (
        <div className="flex flex-row flex-shrink-0 flex-grow-0">
          <img src="/images/tokens/usdc.webp" alt="usdc" className={imageSize ? imageSize : "w-10 h-10"} />
          <img
            src={TokenMetadataOverride[ChainId.Polygon][namedAccounts?.pop?.polygon]?.icon}
            alt="pop"
            className={`${imageSize ? imageSize : "w-10 h-10"} -ml-3`}
          />
        </div>
      );
    case "Butter (V2)":
      return <img src="/images/icons/BTR.svg" alt="butter" className={imageSize ? imageSize : "w-10 h-10"} />;
    case "3X":
      return <img src="/images/tokens/3X.svg" alt="3x" className="w-10 h-10" />;
    case "Popcorn":
    default:
      return (
        <img
          src={TokenMetadataOverride[ChainId.Polygon][namedAccounts?.pop?.polygon]?.icon}
          alt="pop"
          className={imageSize ? imageSize : "w-10 h-10"}
        />
      );
  }
}
