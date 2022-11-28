import { parseEther } from "ethers/lib/utils";
import { Contract, BigNumber, ethers } from "ethers";

type TargetsArray = [string, Contract][];
type TargetArgs = (string | BigNumber | number | string[][])[];

export class ProxyMultiCall {
  proxyAddress: string;
  targets: {
    [key: string]: Contract;
  };
  payload: [string, string][] = [];

  constructor({
    proxyAddress,
    targets,
    multicallAddress,
  }: {
    proxyAddress: string;
    targets: TargetsArray;
    multicallAddress?: string;
  }) {
    this.targets = targets.reduce(
      (targets, _target) => ({ ...targets, [_target[0]]: _target[1], [_target[1].address]: _target[1] }),
      {},
    );
    this.addTarget({
      alias: "__proxy",
      address: proxyAddress,
      abi: ["function execute(address _target, bytes memory _data) public payable returns (bytes memory response)"],
    });

    this.addTarget({
      alias: "__multicall",
      address: multicallAddress || "0xcA11bde05977b3631167028862bE2a173976CA11",
      abi: [
        "function aggregate((address, bytes)[] calls) public view returns (uint256 blockNumber, bytes[] returnData)",
      ],
    });
  }

  addTarget({ alias, abi, address }) {
    this.targets[alias] = new Contract(address, abi);
    this.targets[address] = new Contract(address, abi);
    return this;
  }

  push(alias: string, fn: string, args: TargetArgs) {
    const address = this.targets[alias].address;
    this.payload.push([address, this.targets[alias].interface.encodeFunctionData(fn, args)]);
    return this;
  }

  aggregate() {
    return this.payload;
  }

  // return bytecode
  submit() {
    return this.targets["__multicall"].interface.encodeFunctionData("aggregate", [this.payload]);
  }

  reset() {
    this.payload = [];
    return this;
  }
}
