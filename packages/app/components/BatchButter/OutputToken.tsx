import { useState } from 'react';
import PseudoRadioButton from './PseudoRadioButton';

interface OutputTokenProps {
  outputToken: string[];
  selectOutputToken: Function;
}

const OutputToken: React.FC<OutputTokenProps> = ({
  outputToken,
  selectOutputToken,
}) => {
  const [selectedToken, selectToken] = useState<string>('3CRV');

  return (
    <div className="flex justify-center">
      <div className="flex flex-row items-center space-x-4 justify-start">
        {outputToken.map((token) => (
          <PseudoRadioButton
            key={token}
            label={token}
            isActive={selectedToken === token}
            handleClick={() => {
              selectToken(token);
              selectOutputToken(token);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default OutputToken;
