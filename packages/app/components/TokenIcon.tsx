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
            className="w-8 h-8 mx-auto"
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
              className="w-3 h-5 mx-auto"
            />
          </div>
          <div className="flex items-center rounded-full bg-white border border-gray-300 w-12 h-12 -ml-3">
            <img
              src="/images/icons/popLogo.png"
              alt="pop"
              className="w-8 h-8 mx-auto"
            />
          </div>
        </div>
      );
    case 'BUTTER':
      return (
        <div className="flex items-center rounded-full bg-white border border-gray-300 w-12 h-12">
          <img
            src="/images/icons/butterLogo.png"
            alt="butter"
            className="w-8 h-8 mx-auto"
          />
        </div>
      );
    default:
      return (
        <div className="flex items-center rounded-full bg-white border border-gray-300 w-12 h-12">
          <img
            src="/images/icons/popLogo.png"
            alt="butter"
            className="w-8 h-8 mx-auto"
          />
        </div>
      );
  }
}
