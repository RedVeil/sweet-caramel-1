import { Dispatch } from "react";

interface TokenInputToggleProps {
  state: [Boolean, Dispatch<boolean>];
  labels: [string, string];
}

enum InteractionType {
  Deposit,
  Withdraw,
}

const TokenInputToggle: React.FC<TokenInputToggleProps> = ({ state, labels }) => {
  const [visible, toggle] = state;
  return (
    <div className="flex flex-row">
      <div
        className={`w-1/2 ${
          visible ? "border-b border-gray-400 cursor-pointer group hover:border-gray-600" : "border-b-2 border-blue-600"
        }`}
        onClick={(e) => toggle(false)}
      >
        <p
          className={`text-center leading-none text-base mb-4 mt-2 ${
            visible ? "text-gray-400 group-hover:text-gray-600 font-semibold" : "text-blue-600 font-semibold"
          }`}
        >
          {labels[0]}
        </p>
      </div>
      <div
        className={`w-1/2 ${
          visible ? "border-b-2 border-blue-600" : "border-b border-gray-400 cursor-pointer group hover:border-gray-600"
        }`}
        onClick={(e) => toggle(true)}
      >
        <p
          className={`text-center leading-none text-base mb-4 mt-2 ${
            visible ? "text-blue-600 font-semibold" : "text-gray-400 group-hover:text-gray-600 font-semibold"
          }`}
        >
          {labels[1]}
        </p>
      </div>
    </div>
  );
};
export default TokenInputToggle;
