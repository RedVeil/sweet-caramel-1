import { Menu, Transition } from "@headlessui/react";
import getTokenOnNetwork from "@popcorn/utils/src/getTokenOnNetwork";
import useWeb3 from "hooks/useWeb3";
import { Fragment } from "react";

interface GetPopMenuProps {}

const GetPopMenu: React.FC<GetPopMenuProps> = () => {
  const { wallet, contractAddresses, chainId } = useWeb3();
  const metaMaskConnected = wallet?.label === "MetaMask";

  return (
    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items className="absolute top-14 -right-5 w-44 bg-white rounded-3xl border-gray-200 border focus:outline-none">
        <Menu.Item>
          {({ active }) => (
            <a
              className={`${active ? "bg-warmGray text-black font-medium" : "bg-white text-primary "} ${
                metaMaskConnected ? "rounded-t-3xl border-b" : "rounded-3xl"
              } group text-center px-2 pt-4 pb-2 block w-full h-14 cursor-pointer  border-gray-200`}
              href={`${getTokenOnNetwork(contractAddresses.pop, chainId, contractAddresses)}`}
              target="_blank"
            >
              <p className={`text-left text-lg px-6 ${active ? "font-medium" : ""}`}>Buy POP</p>
            </a>
          )}
        </Menu.Item>
        {metaMaskConnected && (
          <Menu.Item>
            {({ active }) => (
              <div
                className={`${
                  active ? "bg-gray-100" : "bg-white"
                } group px-2 pt-4 w-full h-14 cursor-pointer rounded-b-3xl`}
                onClick={async () =>
                  await window.ethereum.request({
                    method: "wallet_watchAsset",
                    params: {
                      type: "ERC20",
                      options: {
                        address: contractAddresses.pop,
                        symbol: "POP",
                        decimals: 18,
                        image: "https://popcorn.network/images/icons/pop_64x64.png",
                      },
                    },
                  })
                }
              >
                <p className={`text-left text-lg px-6 ${active ? "font-medium" : ""}`}>Add to Wallet</p>
              </div>
            )}
          </Menu.Item>
        )}
      </Menu.Items>
    </Transition>
  );
};

export default GetPopMenu;
