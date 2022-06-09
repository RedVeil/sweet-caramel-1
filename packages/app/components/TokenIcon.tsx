interface TokenIconProps {
  token: string;
  fullsize?: boolean;
}

export default function TokenIcon({ token, fullsize = false }: TokenIconProps): JSX.Element {
  switch (token) {
    case "G-UNI USDC/POP LP":
    case "SushiSwap LP Token":
      return (
        <div className="flex flex-row flex-shrink-0 flex-grow-0">
          <div
            className={`flex items-center rounded-full bg-white border border-gray-300  ${
              fullsize ? "w-12 h-12" : "w-6 h-6 md:w-12 md:h-12"
            }`}
          >
            <img
              src="/images/tokens/usdc.webp"
              alt="eth"
              className={`${fullsize ? "w-7 h-7" : "w-3 h-3 md:w-7 md:h-7"} mx-auto`}
            />
          </div>
          <div
            className={`flex items-center rounded-full bg-white border border-gray-300 -ml-3  ${
              fullsize ? "w-12 h-12" : "w-6 h-6 md:w-12 md:h-12"
            }`}
          >
            <img
              src="/images/icons/popLogo.png"
              alt="pop"
              className={`${fullsize ? "w-7 h-7" : "w-3 h-3 md:w-7 md:h-7"} mx-auto md:ml-2.5`}
            />
          </div>
        </div>
      );
    case "Butter V2":
      return (
        <div
          className={`flex items-center rounded-full bg-white border border-gray-300  ${
            fullsize ? "w-12 h-12" : "w-6 h-6 md:w-12 md:h-12"
          }`}
        >
          <img src="/images/icons/butterLogo.png" alt="butter" className="w-5 md:w-7 h-3 md:h-4 mx-auto" />
        </div>
      );
    case "Popcorn":
    default:
      return (
        <div
          className={`flex items-center rounded-full bg-white border border-gray-300 flex-shrink-0 flex-grow-0  ${
            fullsize ? "w-12 h-12" : "w-6 h-6 md:w-12 md:h-12"
          }`}
        >
          <img
            src="/images/icons/popLogo.png"
            alt="pop"
            className={`${fullsize ? "w-7 h-7" : "w-3 h-3 md:w-7 md:h-7"} mx-auto md:ml-2.5`}
          />
        </div>
      );
  }
}
