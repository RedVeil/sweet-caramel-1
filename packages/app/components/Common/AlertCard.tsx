import TextLink from "./TextLink";

export interface AlertCardLink {
  text: string;
  url: string;
  openInNewTab?: boolean;
}

interface AlertCardProps {
  title: string;
  icon: JSX.Element;
  text: string;
  links: AlertCardLink[];
}

export default function AlertCard({ title, text, icon, links }: AlertCardProps): JSX.Element {
  return (
    <div className="bg-white border border-gray-200 shadow-custom rounded-lg flex flex-row px-4 py-4">
      <div>{icon}</div>
      <div className="ml-2 space-y-1">
        <p className="font-bold">{title}</p>
        <p className="text-gray-500">{text}</p>
        <div className="flex flex-row space-x-4">
          {links.map((link) => (
            <TextLink
              text={link.text}
              url={link.url}
              showArrow={false}
              outsideLink={true}
              openInNewTab={link.openInNewTab}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
