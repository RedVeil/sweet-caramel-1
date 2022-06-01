import { Dispatch } from "react";

interface TermsAndConditionsProps {
  isDisabled: boolean;
  termsAccepted: boolean;
  setTermsAccepted: Dispatch<boolean>;
  showLockTerms?: boolean;
}

const TermsAndConditions = ({
  isDisabled,
  termsAccepted,
  setTermsAccepted,
  showLockTerms = false,
}: TermsAndConditionsProps) => {
  return (
    <div>
      <div className="relative flex items-start pb-10 pr-2">
        <div className="flex items-center h-5 pt-2">
          {isDisabled ? (
            <input
              type="checkbox"
              disabled
              className="ml-1 mr-4 focus:ring-gray-500 h-5 w-5 text-gray-600 border-gray-300 rounded"
              readOnly
            />
          ) : (
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={() => {
                setTermsAccepted(!termsAccepted);
              }}
              className="ml-1 mr-4 focus:ring-blue-500 h-5 w-5 text-blue-600 border-gray-300 rounded"
            />
          )}
        </div>
        <div className="ml-2">
          <p className={`text-lg font-semibold ${isDisabled ? "text-gray-300" : "text-gray-900"} pb-2`}>
            Accept reward terms and conditions:
          </p>
          <ul className="list-inside">
            {showLockTerms && (
              <li className={`text-lg pb-2 ${isDisabled ? "text-gray-300" : "text-gray-600"}`}>
                Your staked tokens will be locked for a period of 12 weeks. You will be unable to access your tokens
                during this period.
              </li>
            )}
            <li className={`text-lg ${isDisabled ? "text-gray-300" : "text-gray-600"}`}>
              Your staked tokens must be re-staked or withdrawn after the 3-month lock time expires or they will be
              subjected to a penalty of 1% per epoch week that they are not re-staked.
            </li>
            <li className={`text-lg ${isDisabled ? "text-gray-300" : "text-gray-600"}`}>
              After rewards are earned and claimed, 10% is immediately transferred, and the rest of the earned amount is
              unlocked linearly over the following 365 day period.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
export default TermsAndConditions;
