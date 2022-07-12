import { connectors } from "context/Web3/connectors";

export default async function activateRPCNetwork(
  activate: (connector: any) => Promise<void>,
  chainID: number,
): Promise<void> {
  activate(connectors.Network(chainID ? chainID : Number(process.env.CHAIN_ID)));
}
