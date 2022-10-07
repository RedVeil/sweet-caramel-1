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
import { useRouter } from "next/router";
import { useState } from "react";
import NavbarLink from "./NavbarLink";

const DesktopMenu = () => {
  const [selectedFilter, setSelectedFilter] = useState<{ name: string; link: string }>({ name: "", link: "" });
  const router = useRouter();
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
    <div className="flex justify-between items-center w-full h-full">
      <Link href="/" passHref>
        <a>
          <img src="/images/popLogo.svg" alt="Logo" className="w-10 h-10" />
        </a>
      </Link>
      <div className="flex items-center space-x-4 md:space-x-10">
        <NavbarLink label="Popcorn Grants" url="/" isActive={router.pathname === "/"} />
        <Menu>
          <Menu.Button className="cursor-pointer hidden lg:flex relative flex-shrink-0 items-center">
            <p className="text-primary hover:text-black font-normal text-lg">Vote Now</p>
            <ChevronDownIcon className="w-6 h-6 text-primary" aria-hidden="true" />
            <BeneficiaryOptions
              options={filterList}
              switchFilter={switchFilter}
              position="absolute top-10 left-1/2 transform -translate-x-1/2 z-20"
              width="w-60"
              borderRadius="rounded-3xl"
              borderRadiusFirstLast="first:rounded-t-3xl last:rounded-b-3xl"
              selectedItem={selectedFilter}
            />
          </Menu.Button>
        </Menu>
        <NavbarLink
          label="Eligible Beneficiaries"
          url="/beneficiaries"
          isActive={router.pathname === "/beneficiaries"}
        />
        <Link href="/apply" passHref>
          <a>
            <Button variant="secondary" className="md:w-44 py-3 px-0">
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
      </div>
    </div>
  );
};

export default DesktopMenu;
