import { ChevronDownIcon } from "@heroicons/react/outline";
import PseudoRadioButton from "@popcorn/app/components/BatchButter/PseudoRadioButton";
import { ChainId, networkLogos, networkMap } from "@popcorn/utils"
import Image from "next/image";
import { useState } from "react";
import { MobilePopupSelect } from "./MobilePopupSelect";

interface SelectNetworkProps {
	supportedNetworks: ChainId[];
	selectedNetworks: ChainId[];
	selectNetwork: (chainId: ChainId) => void;
	mobileSelectNetwork: (chainId: ChainId | "ALL") => void;
}

export default function SelectNetwork({ supportedNetworks, selectedNetworks, selectNetwork, mobileSelectNetwork }: SelectNetworkProps): JSX.Element {
	const [openFilter, setOpenFilter] = useState(false);
	const [categoryFilter, setCategoryFilter] = useState<{ id: string; value: string }>({ id: "1", value: "All" });
	const switchFilter = (value: { id: any; value: any }) => {
		mobileSelectNetwork(value.id);
		setCategoryFilter(value)
	};
	const networkCategories = supportedNetworks.map(network => {
		return {
			id: network,
			value: <div className="flex space-x-4">
				<Image src={networkLogos[network]} alt={ChainId[network]} height="24px" width="24px" objectFit="contain" />
				<p className="text-secondaryDark">{networkMap[network]}</p>
			</div>
		}
	});
	return (
		<>
			<div className="hidden md:flex flex-row items-center space-x-2 mb-8">
				{supportedNetworks.map(network =>
					<PseudoRadioButton key={network} label={<Image src={networkLogos[network]} alt={ChainId[network]} height="24px" width="24px" objectFit="contain" />} handleClick={() => selectNetwork(network)} isActive={selectedNetworks.includes(network)} activeClass="bg-warmGray" extraClasses="h-14 w-18 border border-customLightGray rounded-3xl text-primary flex justify-center items-center" />
				)}
			</div>

			<div className="block md:hidden my-10">
				<button
					onClick={(e) => {
						e.preventDefault();
						setOpenFilter(true);
					}}
					className="w-full py-3 px-5 flex flex-row items-center justify-between mt-1 space-x-1 rounded-4xl border border-gray-300"
				>
					<div className="flex items-center">
						{supportedNetworks.map(network =>
							<div className="-ml-2 flex items-center" key={network}>
								<Image src={networkLogos[network]} alt={ChainId[network]} height="32px" width="32px" objectFit="contain" />
							</div>
						)}
					</div>
					<ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
				</button>
			</div>
			<div className="no-select-dot absolute left-0">
				<MobilePopupSelect
					categories={[{ id: "ALL", value: "All" }, ...networkCategories]}
					visible={openFilter}
					onClose={setOpenFilter}
					selectedItem={categoryFilter}
					switchFilter={switchFilter}
					title="Network filters"
				/>
			</div>
		</>
	)
}