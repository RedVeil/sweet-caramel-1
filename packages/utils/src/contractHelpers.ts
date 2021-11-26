import { Address } from "./types";
import { ERC20, ERC20__factory, StakingRewards } from '../../hardhat/typechain';

export const getERC20Contract = async (stakedTokenAddress: Address, library: any): Promise<ERC20> => {
    const contract: ERC20 = await ERC20__factory.connect(
        stakedTokenAddress,
        library,
    );
    return contract;
}