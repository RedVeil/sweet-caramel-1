import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/outline";
import React, { useEffect, useState } from "react";

interface PaginationProps {
  onUpdatePage: Function;
  sliceAmount: number;
  lengthOfData: number;
  currentIndex: number;
}
const Pagination: React.FC<PaginationProps> = ({ onUpdatePage, sliceAmount, lengthOfData, currentIndex }) => {
  const [noOfPages, setNoOfPages] = useState<number>(1);

  useEffect(() => {
    setNoOfPages(lengthOfData % sliceAmount);
  }, []);

  const updateSlicePosition = (index: number) => {
    onUpdatePage(index * sliceAmount);
  };

  return (
    <>
      <div className="flex justify-between">
        <div
          className="w-7 h-7 rounded-full border border-black flex justify-center items-center"
          onClick={() => updateSlicePosition(currentIndex)}
        >
          <ChevronLeftIcon className=" text-black w-4" />
        </div>

        <div className="flex gap-6">
          {[...Array(noOfPages)].map((e, i) => (
            <p
              key={i}
              onClick={() => updateSlicePosition(i)}
              role="button"
              className={currentIndex == i ? "text-black" : "text-primary"}
            >
              {i + 1}
            </p>
          ))}
        </div>
        <div
          className="w-7 h-7 rounded-full border border-black flex justify-center items-center"
          onClick={() => updateSlicePosition(currentIndex)}
        >
          <ChevronRightIcon className=" text-black w-4" />
        </div>
      </div>
    </>
  );
};

export default Pagination;
