import { ChevronDownIcon } from "@heroicons/react/outline";
import PseudoRadioButton from "@popcorn/app/components/BatchButter/PseudoRadioButton";
import { ChainId, networkLogos, networkMap } from "@popcorn/utils";
import Image from "next/image";
import { useState } from "react";
import { Chain, chainId } from "wagmi";
import { MobilePopupSelect } from "./MobilePopupSelect";

interface NetworkFilterProps {
	supportedNetworks: ChainId[];
	selectedNetworks: ChainId[];
	selectNetwork: (chainId: ChainId) => void;
}

export default function NetworkFilter({
	supportedNetworks,
	selectedNetworks,
	selectNetwork,
}: NetworkFilterProps): JSX.Element {
	const [openFilter, setOpenFilter] = useState(false);
	const [categoryFilter, setCategoryFilter] = useState<{ id: ChainId; value: JSX.Element }>({
		id: ChainId.ALL, value: <div className="flex space-x-4">
			<Image src={networkLogos[ChainId.ALL]} alt={ChainId[ChainId.ALL]} height="24px" width="24px" objectFit="contain" />
			<p className="text-secondaryDark">{networkMap[ChainId.ALL]}</p>
		</div>
	});
	const switchFilter = (value: { id: any; value: any }) => {
		selectNetwork(value.id);
		setCategoryFilter(value);
	};
	const [activeNetwork, setActiveNetwork] = useState(ChainId.ALL)

	const setActiveAndSelectedNetwork = (chainId: ChainId) => {
		setActiveNetwork(chainId)
		selectNetwork(chainId)
	}
	const networkCategories = supportedNetworks.map((network) => {
		return {
			id: network,
			value: (
				<div className="flex space-x-4">
					<Image src={networkLogos[network]} alt={ChainId[network]} height="24px" width="24px" objectFit="contain" />
					<p className="text-secondaryDark">{networkMap[network]}</p>
				</div>
			),
		};
	});
	return (
		<>
			<div className="hidden md:flex flex-row items-center space-x-2 mb-8">
				{supportedNetworks.map((network) => (
					<PseudoRadioButton
						key={network}
						label={
							<Image
								src={networkLogos[network]}
								alt={ChainId[network]}
								height="24px"
								width="24px"
								objectFit="contain"
							/>
						}
						handleClick={() => setActiveAndSelectedNetwork(network)}
						isActive={activeNetwork == network}
						extraClasses="h-12 w-18 border border-customLightGray rounded-3xl text-primary flex justify-center items-center"
					/>
				))}
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
						{categoryFilter.value}
					</div>
					<ChevronDownIcon className="w-5 h-5" aria-hidden="true" />
				</button>
			</div>
			<div className="no-select-dot absolute left-0">
				<MobilePopupSelect
					categories={networkCategories}
					visible={openFilter}
					onClose={setOpenFilter}
					selectedItem={categoryFilter}
					switchFilter={switchFilter}
					title="Network filters"
				/>
			</div>
		</>
	);
}