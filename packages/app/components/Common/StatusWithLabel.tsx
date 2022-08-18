import { InfoIconWithTooltip } from "components/InfoIconWithTooltip";

interface InfoIconProps {
  id: string;
  title: string;
  content: string;
}

interface StatusWithLabelProps {
  content: string;
  label: string | React.ReactElement;
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
    <div className="flex flex-col">
      {infoIconProps ? (
        <span className="flex flex-row items-center">
          <p className="text-primaryLight">{label}</p>
          <InfoIconWithTooltip
            classExtras="h-5 w-5 mt-0 ml-2"
            id={infoIconProps.id}
            title={infoIconProps.title}
            content={infoIconProps.content}
          />
        </span>
      ) : (
        <p className="text-primaryLight">{label}</p>
      )}
      {content == "Coming Soon" ? (
        <p className={`md:mt-1 text-primary text-2xl md:text-3xl leading-6 md:leading-8`}>{content}</p>
      ) : (
        <p className={`md:mt-1 text-primary text-2xl md:text-3xl leading-6 md:leading-8`}>
          {content.split(" ")[0]} <span className=" text-tokenTextGray text-xl"> {content.split(" ")[1]}</span>
        </p>
      )}
    </div>
  );
}
