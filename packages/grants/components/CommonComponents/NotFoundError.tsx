import React from "react";

interface NotFoundErrorProps {
  image: string;
  title: string;
  children: React.ReactNode;
}
const NotFoundError: React.FC<NotFoundErrorProps> = ({ image, title, children }) => {
  return (
    <div className="bg-white border border-customLightGray rounded-lg p-6 md:py-20 md:px-10 flex flex-col justify-center md:items-center text-left md:text-center">
      <img src={image} alt="Not Found Error" className="mb-6 w-20 md:w-auto" />
      <h2 className=" text-black font-normal text-3xl mb-2 leading-[110%]">{title}</h2>
      {children}
    </div>
  );
};

export default NotFoundError;
