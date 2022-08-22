import { InfoIconWithModal } from "components/InfoIconWithModal";
import { ChangeEventHandler } from "react";

export function CheckMarkToggleWithInfo({
  disabled = false,
  value,
  infoText,
  infoTitle,
  label,
  onChange,
  image,
}: {
  disabled?: boolean;
  value: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  infoTitle: string;
  infoText: string;
  label: string;
  image?: React.ReactElement;
}) {
  return (
    <div className="flex flex-row items-center mt-2">
      <label className={`flex flex-row items-center  group ${disabled ? "cursor-default" : "cursor-pointer"}`}>
        <input type="checkbox" className="mr-2 rounded-sm" checked={value} onChange={onChange} disabled={disabled} />
        <p
          className={`text-base mt-0.5 leading-none ${
            disabled ? "text-gray-400" : "text-gray-600 group-hover:text-blue-700"
          }`}
        >
          {label}
        </p>
      </label>
      <div className="mb-1">
        <InfoIconWithModal title={infoTitle} image={image}>
          <p>{infoText}</p>
        </InfoIconWithModal>
      </div>
    </div>
  );
}
