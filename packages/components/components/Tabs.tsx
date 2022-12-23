import { Dispatch, FC } from "react";

export interface TabsProps {
  available: string[];
  active: [string[], Dispatch<string[]>];
}

export const Tabs: FC<TabsProps> = ({ available, active }) => {
  const [activeTabs, setActiveTabs] = active;

  return (
    <div className="flex space-x-4">
      <button
        className={`flex items-center justify-center rounded-3xl py-3 px-5 text-base leading-6 font-normal border
            ${
              activeTabs.length === available.length
                ? "border-primaryLight bg-primaryLight text-white"
                : "bg-white border-[#d7d7d799]"
            }`}
        onClick={() => setActiveTabs(available)}
      >
        All
      </button>
      {available.map((tab) => (
        <button
          className={`flex items-center justify-center rounded-3xl py-3 px-5 text-base leading-6 font-normal border
            ${
              activeTabs.length !== available.length && activeTabs.includes(tab)
                ? "border-primaryLight bg-primaryLight text-white"
                : "bg-white border-[#d7d7d799]"
            }`}
          onClick={() => setActiveTabs([tab])}
          key={tab}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
