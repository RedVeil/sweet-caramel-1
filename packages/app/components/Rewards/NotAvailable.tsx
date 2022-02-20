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
    <div
      className={`w-full h-full flex flex-col justify-center items-center bg-gray-50 border-1 rounded-5xl md:h-full min-h-128 md:min-h-auto h-11/12 max-h-screen md:max-h-autoborder-1 border-gray-200 rounded-5xl ${additionalStyles}`}
    >
      <img src="/images/emptyPopcorn.svg" className="h-auto md:h-1/2 w-1/2" />
      <p className="mt-12 font-semibold text-2xl text-gray-900">{title}</p>
      <p className="mt-1 text-gray-900">{body}</p>
    </div>
  );
};
