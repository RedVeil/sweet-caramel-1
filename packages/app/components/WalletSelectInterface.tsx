import { supportedWallets, walletMap, walletToLogo } from "context/Web3/connectors";

export default function walletSelectInterface(setSelectedWallet: (wallet: number) => void, deactivate: () => void) {
  return (
    <div className="flex bg-white flex-row flex-wrap h-full md:h-min-content md:w-128 w-3/4 items-center rounded-4xl">
      {supportedWallets.map((wallet) => {
        return (
          <div
            onClick={() => setSelectedWallet(wallet)}
            className="p-2 w-full last:border-none border-b-2 border-gray-100 md:w-1/2 md:h-48 p-3 h-min-content flex flex-row md:flex-col items-center justify-start md:justify-around cursor-pointer md:hover:bg-gray-100 md:p-10"
          >
            <img src={walletToLogo[wallet]} className="w-12 h-12" />
            <p className="font-medium text-xl md:text-2xl md:ml-0 ml-4 mt-1 md:mt-0">{walletMap[wallet]}</p>
          </div>
        );
      })}
    </div>
  );
}
