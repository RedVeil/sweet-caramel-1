import { ChainId, connectors } from "context/Web3/connector";

export default async function activateRPCNetwork(
  activate: (connector: any) => Promise<void>,
  chainID: ChainId,
): Promise<void> {
  activate(connectors.Network(chainID ? chainID : Number(process.env.CHAIN_ID)));
}
