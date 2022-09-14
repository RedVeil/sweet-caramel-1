import { fromRpcSig } from "ethereumjs-util";
import { BigNumber, constants, Contract, ethers } from "ethers";
import { Address, SignatureDetails } from "./types";

export enum permitTypes {
  AMOUNT = 1,
  ALLOWED = 2,
}

export function getZapSignature(
  sig: SignatureDetails,
  tokenKey: string,
): {
  v: [number, number];
  r: [string, string];
  s: [string, string];
  nonce: [BigNumber, BigNumber];
  deadline: [BigNumber, BigNumber];
} {
  switch (tokenKey) {
    case "dai":
      return {
        v: [sig.v, 0],
        r: [sig.r, sig.r],
        s: [sig.s, sig.s],
        nonce: [sig.nonce, constants.Zero],
        deadline: [sig.deadline, constants.Zero],
      };
    case "usdc":
      return {
        v: [0, sig.v],
        r: [sig.r, sig.r],
        s: [sig.s, sig.s],
        nonce: [constants.Zero, sig.nonce],
        deadline: [constants.Zero, sig.deadline],
      };
    default:
      return null;
  }
}

export default async function getSignature(
  library: any,
  signerOrProvider: any,
  permitType: permitTypes,
  owner: Address,
  spender: Address,
  tokenContract: Contract,
  chainId: number,
  value: BigNumber,
): Promise<SignatureDetails> {
  const block = await library.getBlock("latest");
  const hour = 60 * 60;
  const deadline = block.timestamp + hour;

  const Permit =
    permitType === permitTypes.AMOUNT
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

  const message =
    permitType === permitTypes.AMOUNT
      ? {
          owner,
          spender,
          value: ethers.constants.MaxUint256,
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
  console.log({ getTypedData });

  const signature = await signerOrProvider._signTypedData(
    getTypedData.domain,
    getTypedData.types,
    getTypedData.message,
  );
  const { v, r, s } = fromRpcSig(signature);

  return { v, r, s, deadline, value, nonce };
}
