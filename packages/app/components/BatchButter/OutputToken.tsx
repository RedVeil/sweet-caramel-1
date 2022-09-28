import { TokenMetadata } from "@popcorn/utils/types";
import { Dispatch } from "react";
import PseudoRadioButton from "./PseudoRadioButton";
import Image from "next/image";

interface OutputTokenProps {
  outputToken: TokenMetadata[];
  selectToken: Dispatch<TokenMetadata>;
  selectedToken: TokenMetadata;
}

const OutputToken: React.FC<OutputTokenProps> = ({ outputToken, selectToken, selectedToken }) => {
  return (
    <div className="flex gap-4 flex-wrap">
      {outputToken.map((token) => (
        <div key={token.key}>
          <PseudoRadioButton
            label={
              <div className="flex items-center h-full">
                <span className="w-5 h-5 relative mr-2 flex-shrink-0">
                  <Image
                    src={`/images/tokens/${token.img}`}
                    alt={token.key}
                    layout="fill"
                    objectFit="contain"
                    priority={true}
                  />
                </span>{token.name}
              </div>
            }
            activeClass="border-3 border-customBrown"
            isActive={selectedToken === token}
            handleClick={() => {
              selectToken(token);
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default OutputToken;
