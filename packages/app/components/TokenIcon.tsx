interface TokenIconProps {
  token: string;
}

export default function TokenIcon({ token }: TokenIconProps): JSX.Element {
  switch (token) {
    case 'Popcorn':
      return (
        <div className="flex items-center rounded-full bg-white border border-gray-300 w-12 h-12 flex-shrink-0 flex-grow-0">
          <img
            src="/images/icons/popLogo.png"
            alt="pop"
            className="w-7 h-7 ml-2.5"
          />
        </div>
      );
    case 'G-UNI USDC/POP LP':
      return (
        <div className="flex flex-row flex-shrink-0 flex-grow-0">
          <div className="flex items-center rounded-full bg-white border border-gray-300 w-12 h-12">
            <img
              src="/images/tokens/usdc.webp"
              alt="eth"
              className="w-7 h-7 mx-auto"
            />
          </div>
          <div className="flex items-center rounded-full bg-white border border-gray-300 w-12 h-12 -ml-3">
            <img
              src="/images/icons/popLogo.png"
              alt="pop"
              className="w-7 h-7 ml-2.5"
            />
          </div>
        </div>
      );
    case 'SushiSwap LP Token':
      return (
        <div className="flex flex-row flex-shrink-0 flex-grow-0">
          <div className="flex items-center rounded-full bg-white border border-gray-300 w-12 h-12">
            <img
              src="/images/tokens/usdc.webp"
              alt="eth"
              className="w-7 h-7 mx-auto"
            />
          </div>
          <div className="flex items-center rounded-full bg-white border border-gray-300 w-12 h-12 -ml-3">
            <img
              src="/images/icons/popLogo.png"
              alt="pop"
              className="w-7 h-7 ml-2.5"
            />
          </div>
        </div>
      );
    case 'Butter':
      return (
        <div className="flex items-center rounded-full bg-white border border-gray-300 w-12 h-12">
          <img
            src="/images/icons/butterLogo.png"
            alt="butter"
            className="w-7 h-4 mx-auto"
          />
        </div>
      );
    default:
      return (
        <div className="flex items-center rounded-full bg-white border border-gray-300 w-12 h-12">
          <img
            src="/images/icons/popLogo.png"
            alt="pop"
            className="w-7 h-7 ml-2.5"
          />
        </div>
      );
  }
}
