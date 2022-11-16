import useProxyFilter from "hooks/useProxyFilter";
import { useContractWrite, usePrepareContractWrite } from "wagmi";
import { useRpcProvider } from "@popcorn/app/hooks/useRpcProvider";
import { useNetwork } from "wagmi";
// import { Contract, BigNumber, ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { Contract, BigNumber, ethers } from "ethers";

const PROXY_FACTORY_ADDRESS = "0xD5bFeBDce5c91413E41cc7B24C8402c59A344f7c";

const PROXY_FACTORY_ABI = [
  {
    constant: false,
    inputs: [],
    name: "build",
    outputs: [{ name: "proxy", type: "address" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "sender", type: "address" },
      { indexed: true, name: "owner", type: "address" },
      { indexed: false, name: "proxy", type: "address" },
      { indexed: false, name: "cache", type: "address" },
    ],
    name: "Created",
    type: "event",
  },
];

export type TargetsArray = [string, Contract][];
export type TargetArgs = (string | BigNumber | number | string[][])[];

export class ProxyMultiCall {
  proxyAddress: string;
  targets: {
    [key: string]: Contract;
  };
  payload: [string, string][];

  constructor({ proxyAddress, targets }: { proxyAddress: string; targets: TargetsArray }) {
    this.payload = [];
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
      address: "0xD5bFeBDce5c91413E41cc7B24C8402c59A344f7c",
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

  async submit(provider: ethers.providers.Provider) {
    // return this.targets["__proxy"].execute(
    //   this.targets["__multicall"].interface.encodeFunctionData("aggregate", [this.payload]),
    //   provider,
    // );
    return this.targets["__multicall"].interface.encodeFunctionData("aggregate", [this.payload]);
  }

  reset() {
    this.payload = [];
    return this;
  }
}

export default function Proxy(): JSX.Element {
  const { chain } = useNetwork();

  console.log(chain);
  // console.log(chain.name);
  // console.log(chain.id);

  const { config } = usePrepareContractWrite({
    addressOrName: PROXY_FACTORY_ADDRESS,
    contractInterface: PROXY_FACTORY_ABI,
    functionName: "build()",
  });

  const { data, isSuccess, write, isLoading } = useContractWrite(config);

  const provider = useRpcProvider(1337);

  // 0x690B9A9E9aa1C9dB991C7721a92d351Db4FaC990
  // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 mm
  const proxyAddress = useProxyFilter("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", provider);
  console.log(proxyAddress);

  // const abi = "add abis here";
  // const tx = new ProxyMultiCall({
  //   proxyAddress: "0xD5bFeBDce5c91413E41cc7B24C8402c59A344f7c",
  //   targets: [["usdc", new Contract("0xD5bFeBDce5c91413E41cc7B24C8402c59A344f7c", PROXY_FACTORY_ABI)]],
  // });
  // console.log("tx", tx);

  // tx.push("usdc", "transferFrom", [
  //   "0xD5bFeBDce5c91413E41cc7B24C8402c59A344f7c",
  //   "0xD5bFeBDce5c91413E41cc7B24C8402c59A344f7c",
  //   parseEther("100"),
  // ]);
  // tx.submit(provider).then(console.log);

  return (
    <div>
      <button disabled={!write} onClick={() => write?.()}>
        Feed
      </button>
      {isLoading && <div>Check Wallet</div>}
      {isSuccess && <div>Transaction: {JSON.stringify(data)}</div>}
    </div>
  );
}
