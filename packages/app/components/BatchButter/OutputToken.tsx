import { TokenMetadata } from "@popcorn/utils/types";
import { Dispatch } from "react";
import PseudoRadioButton from "./PseudoRadioButton";

interface OutputTokenProps {
  outputToken: TokenMetadata[];
  selectToken: Dispatch<TokenMetadata>;
  selectedToken: TokenMetadata;
}

const OutputToken: React.FC<OutputTokenProps> = ({ outputToken, selectToken, selectedToken }) => {
  return (
    <div className="flex justify-center">
      <div className="flex flex-row flex-wrap justify-evenly content-between h-28 md:h-full md:items-center md:space-x-4 md:justify-start ">
        {outputToken.map((token) => (
          <PseudoRadioButton
            key={token.key}
            label={token.name}
            isActive={selectedToken === token}
            handleClick={() => {
              selectToken(token);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default OutputToken;
