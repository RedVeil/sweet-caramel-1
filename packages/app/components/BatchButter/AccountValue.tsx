import { BigNumber } from '@ethersproject/bignumber';
import { parseEther } from '@ethersproject/units';
import { formatAndRoundBigNumber } from '@popcorn/utils';

interface AccountValueProps {
  hysiBalance: BigNumber;
  hysiPrice: BigNumber;
}

const AccountValue: React.FC<AccountValueProps> = ({
  hysiBalance,
  hysiPrice,
}) => {
  return (
    <div className="w-1/2 bg-primaryLight rounded-lg px-5 py-6">
      <img
        src="/images/treeRow.svg"
        alt="treeRow"
        className="mx-auto mb-4"
      ></img>
      <div className="bg-white rounded-lg shadow-sm p-5">
        <h2 className="font-semibold text-base text-gray-900 mb-4">
          Your connected Wallet
        </h2>
        <div className="flex flex-row w-full items-center">
          <div className="w-5/12">
            <p className="font-semibold text-sm text-gray-700 mb-1">
              HYSI Balance
            </p>
            <div className="rounded-md bg-gray-50 border border-gray-200 p-2">
              <div className="flex flex-row justify-between">
                <p>
                  {hysiBalance ? formatAndRoundBigNumber(hysiBalance) : '-'}
                </p>
                <p className="text-gray-700">Token</p>
              </div>
            </div>
          </div>
          <div className="w-2/12">
            <div className="flex mt-5 mx-auto w-10 h-10 rounded-full border border-gray-200 items-center">
              <img
                src="/images/waveEqual.svg"
                alt="waveEqual"
                className="mx-auto "
              ></img>
            </div>
          </div>
          <div className="w-5/12">
            <p className="font-semibold text-sm text-gray-700 mb-1">
              USD Balance
            </p>
            <div className="rounded-md bg-gray-50 border border-gray-200 p-2">
              <div className="flex flex-row justify-between">
                <p>
                  {hysiPrice && hysiBalance
                    ? formatAndRoundBigNumber(
                        hysiBalance.mul(hysiPrice).div(parseEther('1')),
                      )
                    : '-'}
                </p>
                <p className="text-gray-700">USD</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AccountValue;
