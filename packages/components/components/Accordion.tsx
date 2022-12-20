import { createContext, useCallback, useContext, useMemo, useState, ReactNode, FC } from "react";
import Image from "next/image";
import classnames from "classnames";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (context === undefined) {
    throw new Error("useAccordionContext must be used within a AccordionContext");
  }
  return context;
}

export enum AccordionVariant {
  Default = "default",
}

const AccordionContext = createContext({ expanded: "", variant: "", toggle: (value: string) => {} });

const Accordion = ({ children, defaultExpanded, variant = AccordionVariant.Default }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = useCallback(
    (value: string) => {
      setExpanded(() => {
        if (expanded !== value) return value;
        return "";
      });
    },
    [expanded, setExpanded],
  );

  const value = useMemo(() => ({ expanded, toggle, variant }), [expanded, toggle, variant]);

  return (
    <AccordionContext.Provider value={value}>
      <div>{children}</div>
    </AccordionContext.Provider>
  );
};

interface AccordionItemProps {
  children: ReactNode;
  value: string;
  title?: JSX.Element;
  toggleText: JSX.Element;
  extraClasses?: string;
}

const AccordionItem: FC<AccordionItemProps> = ({ children, value, toggleText, title }) => {
  const { expanded, toggle, variant } = useAccordionContext();
  const open = expanded === value;

  return (
    <div
      className={classnames("rounded-3xl border mb-10", {
        "border-warmGray border-opacity-80 bg-warmGray bg-opacity-25": variant === AccordionVariant.Default,
      })}
    >
      <button
        onClick={() => toggle(value)}
        className="w-full py-8 px-6"
        aria-controls={`accordion-${value}-header`}
        aria-expanded={open}
        id={`accordion-${value}`}
      >
        <div className="flex justify-between items-center w-full">
          {toggleText}
          <ChevronDownIcon className={classnames("w-4 h-4", { "transform rotate-180": open })} />
        </div>
        <div>{title}</div>
      </button>
      <div
        className={`px-6 pb-8 ${open ? "block" : "hidden"}`}
        aria-hidden={!open}
        id={`accordion-${value}-item`}
        aria-labelledby={`accordion-${value}`}
      >
        {children}
      </div>
    </div>
  );
};

const AccordionIcon: FC<{ icon: string; size: number }> = ({ icon, size }) => {
  return <Image src={icon} width={size} height={size} alt="icon" />;
};

Accordion.Item = AccordionItem;
Accordion.Icon = AccordionIcon;

export { Accordion };
