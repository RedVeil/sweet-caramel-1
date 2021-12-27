interface TokenIconProps {
  token: string;
}

export default function TokenIcon({ token }: TokenIconProps): JSX.Element {
  switch (token) {
    case 'POP':
      return (
        <div className="flex items-center rounded-full bg-white border border-gray-300 w-12 h-12">
          <img
            src="/images/icons/popLogo.png"
            alt="pop"
            className="w-7 h-7 ml-2.5"
          />
        </div>
      );
    case 'POP/ETH LP':
      return (
        <div className="flex flex-row">
          <div className="flex items-center rounded-full bg-white border border-gray-300 w-12 h-12">
            <img
              src="/images/icons/ethLogo.png"
              alt="eth"
              className="w-4 h-7 mx-auto"
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
