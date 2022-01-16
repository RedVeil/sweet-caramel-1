import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { getNamedAccountsByChainId } from '../../../hardhat/lib/utils/getNamedAccounts';

interface GetPopMenuProps {
  chainId: number;
}

function getPopAddress(chainId: number): string {
  const { pop } = getNamedAccountsByChainId(chainId);
  return pop;
}

function getPoolLink(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'https://app.uniswap.org/#/swap?inputCurrency=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&outputCurrency=0xd0cd466b34a24fcb2f87676278af2005ca8a78c4';
    case 137:
      return 'https://app.sushi.com/swap?inputCurrency=0x2791bca1f2de4661ed88a30c99a7a9449aa84174&outputCurrency=0xc5b57e9a1e7914fda753a88f24e5703e617ee50c';
    default:
      return 'https://app.uniswap.org/#/swap?inputCurrency=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&outputCurrency=0xd0cd466b34a24fcb2f87676278af2005ca8a78c4';
  }
}

const GetPopMenu: React.FC<GetPopMenuProps> = ({ chainId }) => {
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
      <Menu.Items className="absolute top-14 -right-4 w-44 bg-white rounded-2xl shadow-md border-gray-200 border focus:outline-none">
        <Menu.Item>
          {({ active }) => (
            <a
              className={`${
                active ? 'bg-gray-100' : 'bg-white'
              } group text-center px-2 pt-4 pb-2 block w-full h-14 cursor-pointer rounded-t-2xl border-b border-gray-200`}
              href={getPoolLink(chainId)}
              target="_blank"
            >
              <p
                className={`text-lg  ${
                  active ? 'font-semibold' : 'font-medium'
                }`}
              >
                Buy POP
              </p>
            </a>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <div
              className={`${
                active ? 'bg-gray-100' : 'bg-white'
              } group text-center px-2 pt-4 w-full h-14 cursor-pointer rounded-b-2xl`}
              onClick={async () =>
                await window.ethereum.request({
                  method: 'wallet_watchAsset',
                  params: {
                    type: 'ERC20',
                    options: {
                      address: getPopAddress(chainId),
                      symbol: 'POP',
                      decimals: 18,
                      image:
                        'https://popcorn.network/images/icons/pop_64x64.png',
                    },
                  },
                })
              }
            >
              <p
                className={`text-lg  ${
                  active ? 'font-semibold' : 'font-medium'
                }`}
              >
                Add to Wallet
              </p>
            </div>
          )}
        </Menu.Item>
      </Menu.Items>
    </Transition>
  );
};

export default GetPopMenu;
