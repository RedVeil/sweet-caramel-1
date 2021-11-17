export interface CardInfoSegmentProps {
  title: string;
  info: string;
}

export default function CardInfoSegment({
  title,
  info,
}: CardInfoSegmentProps): JSX.Element {
  return (
    <div className="">
      <p className="text-gray-700 text-lg">{title}</p>
      <p className="text-gray-800 text-lg font-medium">{info}</p>
    </div>
  );
}
