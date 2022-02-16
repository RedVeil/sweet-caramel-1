import React from "react";

export const NotAvailable: React.FC<{ title: string; body: string; visible?: boolean }> = ({
  title,
  body,
  visible,
}) => {
  if (visible === false) {
    return <></>;
  }
  return (
    <div className="border-1 border-gray-200 rounded-5xl w-full h-full flex flex-col justify-center items-center bg-gray-50">
      <img src="/images/emptyPopcorn.svg" className="h-1/2 w-1/2" />
      <p className="mt-12 font-semibold text-2xl text-gray-900">{title}</p>
      <p className="mt-1 text-gray-900">{body}</p>
    </div>
  );
};
