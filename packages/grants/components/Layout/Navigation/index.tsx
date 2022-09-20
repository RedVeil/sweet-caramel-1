import { Web3Provider } from "@ethersproject/providers";
import { Menu } from "@headlessui/react";
import { DocumentAddIcon } from "@heroicons/react/outline";
import { ChevronDownIcon } from "@heroicons/react/solid";
import { useWeb3React } from "@web3-react/core";
import BeneficiaryOptions from "components/Beneficiaries/BeneficiaryOptions";
import Button from "components/CommonComponents/Button";
import ConnectWalletButtons from "components/CommonComponents/ConnectWalletButtons";
import { connectors } from "context/Web3/connectors";
import Link from "next/link";
import router from "next/router";
import { useState } from "react";

const Navigation = () => {
  const [menuVisible, toggleMenu] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<{ name: string; link: string }>({ name: "", link: "" });
  const filterList = [
    { name: "Beneficiary Applications", link: "/applications" },
    // { name: "Reported Beneficiaries", link: "/beneficiaries" },
    // { name: "Grant Rounds", link: "/grants" },
  ];

  const switchFilter = (filter: { name: string; link: string }) => {
    setSelectedFilter(filter);
    router.push(filter.link);
  };
  const context = useWeb3React<Web3Provider>();
  const { account, activate, active, deactivate } = context;

  return (
    <div className="flex justify-between items-center w-full">
      <Link href="/" passHref>
        <a>
          <img src="/images/popLogo.svg" alt="Logo" className="w-10 h-10" />
        </a>
      </Link>
      <div className="flex items-center space-x-4 md:space-x-10">
        <Menu>
          <Menu.Button className="cursor-pointer hidden lg:flex relative flex-shrink-0">
            <p className="text-gray-500 hover:text-gray-900  font-semibold">Vote Now</p>
            <ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
            <BeneficiaryOptions
              options={filterList}
              switchFilter={switchFilter}
              position="absolute top-10 left-1/2 transform -translate-x-1/2 z-20"
              width="w-60"
              selectedItem={selectedFilter}
            />
          </Menu.Button>
        </Menu>
        <Link href="/beneficiaries" passHref>
          <a className="text-gray-500 hover:text-gray-900  font-semibold hidden lg:block flex-shrink-0">
            Eligible Beneficiaries
          </a>
        </Link>
        <Link href="/apply" passHref>
          <a>
            <Button variant="secondary" className="md:w-44 py-3 px-8 md:px-0">
              <span className="hidden md:inline">Create Proposal</span>
              <DocumentAddIcon className="text-white md:hidden w-6 h-6" />
            </Button>
          </a>
        </Link>
        <ConnectWalletButtons
          connected={account ? true : false}
          connectWallet={() => activate(connectors.Injected)}
          disconnectWallet={deactivate}
        />
        {/* <button
            className="lg:hidden text-gray-500 w-5 h-5 relative focus:outline-none bg-white"
            onClick={() => toggleMenu(!menuVisible)}
          >
            <div className="block w-5 absolute">
              <span
                aria-hidden="true"
                className={`block absolute h-0.5 w-5 bg-current transform transition duration-500 ease-in-out ${menuVisible ? "rotate-45" : "-translate-y-1.5"
                  }`}
              ></span>
              <span
                aria-hidden="true"
                className={`block absolute h-0.5 w-5 bg-current transform transition duration-500 ease-in-out ${menuVisible ? "opacity-0" : "opacity-100"
                  }`}
              ></span>
              <span
                aria-hidden="true"
                className={`block absolute h-0.5 w-5 bg-current transform transition duration-500 ease-in-out ${menuVisible ? "-rotate-45" : "translate-y-1.5"
                  }`}
              ></span>
            </div>
          </button> */}
      </div>
    </div>
  );
};

export default Navigation;
