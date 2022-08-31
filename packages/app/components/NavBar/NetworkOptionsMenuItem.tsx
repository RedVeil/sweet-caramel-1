import { Menu } from "@headlessui/react";
import { ChainId, networkLogos, networkMap } from "@popcorn/utils";
import React from "react";
import Image from "next/image";

interface NetworkOptionsMenuItemProps {
  chainId: ChainId;
  currentChainId: number;
  switchNetwork: (chainId: number) => void;
  last?: boolean;
}

const NetworkOptionsMenuItem: React.FC<NetworkOptionsMenuItemProps> = ({
  chainId,
  switchNetwork,
  currentChainId,
  last,
  ...props
}) => {
  return (
    <Menu.Item>
      {({ active }) => (
        <div
          className={`${active ? "bg-gray-100" : "bg-white"
            } group rounded-md items-center px-2 py-2 my-0 text-sm flex flex-row justify-center gap-5 w-full h-12 cursor-pointer ${last ? "rounded-b-3xl " : ""
            }`}
          onClick={() => switchNetwork(chainId)}
        >
          <div className="w-4.5 h-4 object-contain ml-3">
            <div className="w-4 h-4 relative">
              <Image
                src={networkLogos[chainId]}
                alt={`${networkMap[chainId]}-logo`}
                layout="fill" // required
                objectFit="contain"
                priority={true}
              />
            </div>
          </div>
          <div className={`w-18 text-lg  ${active ? "font-medium" : ""}`}>{networkMap[chainId]}</div>
          {currentChainId === chainId ? (
            <div className="mr-3 h-2 w-2 shadow-md rounded-2xl bg-green-400"></div>
          ) : (
            <div className="mr-3 h-2 w-2 rounded-2xl"></div>
          )}
        </div>
      )}
    </Menu.Item>
  );
};

export default NetworkOptionsMenuItem;
