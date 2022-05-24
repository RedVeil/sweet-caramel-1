import { fromRpcSig } from "ethereumjs-util";
import { BigNumber, Contract } from "ethers";
import { Address } from "./types";

export enum permitTypes {
  AMOUNT = 1,
  ALLOWED = 2,
}

interface SignatureReturn {
  v: number;
  r: Buffer;
  s: Buffer;
  deadline: BigNumber;
  value?: BigNumber;
  nonce?: BigNumber;
}

export default async function getSignature(
  library: any,
  permitType: permitTypes,
  owner: Address,
  spender: Address,
  tokenContract: Contract,
  chainId: number,
  value: BigNumber,
): Promise<SignatureReturn> {
  const block = await library.getBlock("latest");
  const hour = 60 * 60;
  const deadline = block.timestamp + hour;

  const Permit =
    permitType === permitTypes.ALLOWED
      ? [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ]
      : [
          { name: "holder", type: "address" },
          { name: "spender", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "allowed", type: "bool" },
        ];

  const nonce = await tokenContract.nonces(owner);
  const name = await tokenContract.name();
  const version = name === "USD Coin" ? "2" : "1"; // Avoiding extra call

  const message = permitTypes.ALLOWED
    ? {
        owner,
        spender,
        value,
        deadline,
        nonce,
      }
    : {
        holder: owner,
        spender,
        nonce,
        expiry: deadline,
        allowed: true,
      };

  const getTypedData = {
    types: { Permit },
    domain: {
      name,
      version,
      chainId,
      verifyingContract: tokenContract.address,
    },
    message,
  };

  const signature = await library
    .getSigner()
    ._signTypedData(getTypedData.domain, getTypedData.types, getTypedData.message);
  const { v, r, s } = fromRpcSig(signature);

  return { v, r, s, deadline, value, nonce };
}
