import { ERC20, ERC20__factory } from '../../hardhat/typechain';
import { Address } from './types';

export const getERC20Contract = async (
  stakedTokenAddress: Address,
  library: any,
): Promise<ERC20> => {
  const contract: ERC20 = await ERC20__factory.connect(
    stakedTokenAddress,
    library,
  );
  return contract;
};
