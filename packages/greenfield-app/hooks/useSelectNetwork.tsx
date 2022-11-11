import { ChainId } from "@popcorn/utils";
import { useEffect, useState } from "react";

export default function useSelectNetwork(availableNetworks: ChainId[]): [ChainId[], (chainId: ChainId) => void, (chainId: ChainId) => void] {
	const [selectedNetworks, selectNetworks] = useState<ChainId[]>(availableNetworks)

	// reset when all chains get deselected
	useEffect(() => {
		if (selectedNetworks.length === 0) selectNetworks(availableNetworks)
	}, [selectedNetworks, availableNetworks])

	function selectNetwork(chainId: ChainId): void {
		let newSelectedNetworks;
		if (selectedNetworks.length === availableNetworks.length) {
			newSelectedNetworks = [chainId]
		} else if (selectedNetworks.includes(chainId)) {
			newSelectedNetworks = selectedNetworks.filter(chain => chain !== chainId)
		} else {
			newSelectedNetworks = [...selectedNetworks, chainId]
		}
		selectNetworks(newSelectedNetworks)
	}

	function mobileSelectNetwork(chainId: ChainId | "ALL"): void {
		if (chainId === "ALL") {
			selectNetworks(availableNetworks)
		} else {
			selectNetworks([chainId])
		}
	}

	return [selectedNetworks, selectNetwork, mobileSelectNetwork]
}