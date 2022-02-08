import { connectors } from "context/Web3/connectors";

export default function activateRPCNetwork(activate: Function, chainID): void {
  activate(connectors.Network(chainID ? chainID : Number(process.env.CHAIN_ID)));
}
