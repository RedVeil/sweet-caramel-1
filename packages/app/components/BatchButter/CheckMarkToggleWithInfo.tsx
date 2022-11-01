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
  image?: JSX.Element;
}) {
  return (
    <div className="flex flex-row items-center mt-3">
      <label className={`flex flex-row items-center  group ${disabled ? "cursor-default" : "cursor-pointer"}`}>
        <input
          type="checkbox"
          className="mr-2 rounded-sm border-customLightGray focus:ring-primary checked:text-primary checked:bg-primary checked:border-primary focus:outline-none"
          checked={value}
          onChange={onChange}
          disabled={disabled}
        />
        <p
          className={`text-base leading-6 ${disabled ? "text-customLightGray" : "text-primaryDark group-hover:text-text-primaryDark"
            }`}
        >
          {label}
        </p>
      </label>
      <div>
        <InfoIconWithModal title={infoTitle} image={image} size="w-5 h-5">
          <p>{infoText}</p>
        </InfoIconWithModal>
      </div>
    </div>
  );
}
