import { BigNumberish } from "@setprotocol/set-protocol-v2/node_modules/ethers";
import { parseEther } from "ethers/lib/utils";
import { getNamedAccountsByChainId } from "../../utils/getNamedAccounts";
import { Configuration } from "./Configuration";
import { ZERO } from "./utils/constants";

const { yD3, y3Eur, crvD3, crv3Eur, setTokenCreator, setBasicIssuanceModule, setStreamingFeeModule, daoAgentV2 } =
  getNamedAccountsByChainId(1);

export const DefaultConfiguration: Configuration = {
  targetNAV: parseEther("10000"),
  manager: daoAgentV2,
  tokenName: "3X",
  tokenSymbol: "3X",
  core: {
    SetTokenCreator: {
      address: setTokenCreator,
    },
    modules: {
      BasicIssuanceModule: {
        address: setBasicIssuanceModule,
      },
      StreamingFeeModule: {
        address: setStreamingFeeModule,
        config: {
          feeRecipient: daoAgentV2,
          maxStreamingFeePercentage: parseEther(".05") as BigNumberish,
          streamingFeePercentage: parseEther(".005") as BigNumberish,
          lastStreamingFeeTimestamp: ZERO as BigNumberish,
        },
      },
    },
  },
  components: {
    ycrvD3: {
      ratio: 50,
      address: yD3,
      oracle: crvD3,
      amount: parseEther("4902.65268"),
    },
    ycrvEur3: {
      ratio: 50,
      address: y3Eur,
      oracle: crv3Eur,
      amount: parseEther("4385.025094"),
    },
  },
};
