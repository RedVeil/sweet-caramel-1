interface FakeInputFieldProps {
  inputValue: string | number;
  children: React.ReactElement | React.ReactComponentElement<any>;
}

export default function FakeInputField({ inputValue, children }: FakeInputFieldProps): JSX.Element {
  return (
    <div className="flex flex-row justify-between w-full pl-5 py-3 border border-gray-200 rounded-md font-semibold bg-gray-50 text-gray-500 focus:text-gray-800">
      <p className="mt-1">{inputValue}</p>
      <div className="mr-3">{children}</div>
    </div>
  );
}
