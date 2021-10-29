interface ClaimableInfoProps {
  earned: number;
}
export default function ClaimableInfo({ earned }): JSX.Element {
  return (
    <div className="bg-white rounded-md shadow w-1/3 mr-4 px-4 py-4">
      <div className="flex flex-row items-center justify-between">
        <p className="text-gray-600">Earned</p>
        {/* <div>
          <InfoIconWithModal title="Info" />
        </div> */}
      </div>
      <h3 className="text-xl font-medium text-gray-800">
        {earned && earned.toLocaleString()} POP
      </h3>
    </div>
  );
}
