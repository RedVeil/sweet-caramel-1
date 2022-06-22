import { ChainId } from "./connectors";
import { ContractAddresses } from "./types";

export default function getTokenOnNetwork(address: string, chainId: number, contractAddresses: ContractAddresses) {
  switch (chainId) {
    case ChainId.Polygon:
      return getTokenOnPolygon(address, contractAddresses);
    case ChainId.Ethereum:
    default:
      return getTokenOnEthereum(address, contractAddresses);
  }
}

function getTokenOnPolygon(address: string, contractAddresses: ContractAddresses) {
  switch (address) {
    case contractAddresses.pop.toLowerCase():
      return "https://app.sushi.com/swap?inputCurrency=0x2791bca1f2de4661ed88a30c99a7a9449aa84174&outputCurrency=0xC5B57e9a1E7914FDA753A88f24E5703e617Ee50c";
    case contractAddresses.popUsdcLp.toLowerCase():
      return "https://beta.arrakis.finance/#/vaults/0x6dE0500211bc3140409B345Fa1a5289cb77Af1e4/add";
    default:
      return "";
  }
}

function getTokenOnEthereum(address: string, contractAddresses: ContractAddresses) {
  switch (address) {
    case contractAddresses.pop.toLowerCase():
      return "https://app.uniswap.org/#/swap?inputCurrency=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&outputCurrency=0xD0Cd466b34A24fcB2f87676278AF2005Ca8A78c4&chain=mainnet";
    case contractAddresses.popUsdcLp.toLowerCase():
      return "https://beta.arrakis.finance/#/vaults/0xBBA11b41407dF8793A89b44ee4b50AfAD4508555/add";
    default:
      return "";
  }
}
