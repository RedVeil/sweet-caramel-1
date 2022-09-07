import React from "react";

export const NotAvailable: React.FC<{ title: string; body: string; visible?: boolean; additionalStyles?: string }> = ({
  title,
  body,
  visible,
  additionalStyles,
}) => {
  if (visible === false) {
    return <></>;
  }
  return (
    <div className="rounded-lg bg-customLightGray h-40 md:h-104 flex flex-col justify-center px-8 mt-10">
      <h1 className=" text-black text-3xl md:text-6xl w-56 md:w-64 leading-7 md:leading-11">{title}</h1>
      <p className="text-primaryDark mt-4 leading-6">{body}</p>
    </div>
  );
};
