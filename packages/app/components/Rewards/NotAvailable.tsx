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
      className={`flex flex-col w-full h-116 md:h-128 max-h-screen justify-center items-center bg-gray-50 border-gray-200 border rounded-3xl px-8 shadow-custom ${additionalStyles}`}
    >
      <img src="/images/emptyPopcorn.svg" className="w-52 md:w-auto md:h-1/2 " />
      <p className="text-center mt-12 font-semibold text-3xl text-gray-900">{title}</p>
      <p className="text-center mt-1 text-gray-900">{body}</p>
    </div>
  );
};
