import { InfoIconWithTooltip } from "components/InfoIconWithTooltip";

interface InfoIconProps {
  id: string;
  title: string;
  content: string;
}

interface StatusWithLabelProps {
  content: string;
  label: string;
  infoIconProps?: InfoIconProps;
  green?: boolean;
}

export default function StatusWithLabel({
  content,
  label,
  green = false,
  infoIconProps = null,
}: StatusWithLabelProps): JSX.Element {
  return (
    <div className="flex flex-col items-center">
      {infoIconProps ? (
        <span className="flex flex-row items-center">
          <p className="text-gray-500 font-light uppercase">{label}</p>
          <InfoIconWithTooltip
            classExtras="h-7 w-7 mt-0 ml-5"
            id={infoIconProps.id}
            title={infoIconProps.title}
            content={infoIconProps.content}
          />
        </span>
      ) : (
        <p className="text-gray-500 font-light uppercase">{label}</p>
      )}
      <p className={`md:text-2xl font-semibold md:mt-1 ${green ? "text-green-600" : "text-gray-900"}`}>{content}</p>
    </div>
  );
}
