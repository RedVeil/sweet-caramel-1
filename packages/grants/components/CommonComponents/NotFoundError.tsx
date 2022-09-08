import React from "react";

interface NotFoundErrorProps {
  image: string;
  title: string;
  children: React.ReactNode;
}
const NotFoundError: React.FC<NotFoundErrorProps> = ({ image, title, children }) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-3xl py-20 px-10 shadow-custom flex flex-col justify-center items-center text-center">
      <img src={image} alt="Not Found Error" className="mb-20" />
      <h2 className=" text-gray-900 font-semibold text-3xl mb-3">{title}</h2>
      {children}
    </div>
  );
};

export default NotFoundError;
