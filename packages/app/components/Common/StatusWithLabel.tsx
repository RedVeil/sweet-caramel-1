interface StatusWithLabelProps {
  content: string;
  label: string;
  green?: boolean;
}

export default function StatusWithLabel({ content, label, green = false }: StatusWithLabelProps): JSX.Element {
  return (
    <div className="flex flex-col">
      <p className="text-gray-500 font-light uppercase">{label}</p>
      <p className={`md:text-2xl font-semibold md:mt-1 ${green ? "text-green-600" : "text-gray-900"}`}>{content}</p>
    </div>
  );
}
