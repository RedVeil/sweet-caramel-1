import React from 'react'
import PopUpModal from '../Modal/PopUpModal';
import WheelPicker, { PickerData } from "react-simple-wheel-picker";

interface Props {
  filterList: { id: string, value: string }[];
  visible: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  // selectedItem: string | { name: string; link: string };
  // switchFilter: (item: string | { [key: string]: string }) => void;
  // position: string;
  // width: string;
}

export const MobileBeneficiaryCategoryFilter: React.FC<Props> = ({ filterList, onClose, visible }) => {
  const handleOnChange = (value: PickerData) => {
    console.log(value);
  };

  return (
    <div className="absolute left-0">
      <PopUpModal visible={false} onClosePopUpModal={() => onClose(false)}>
        <div>
          <p className=" text-black mb-3">Categories</p>
          <div className="wheelPicker">
            <WheelPicker
              data={filterList}
              onChange={handleOnChange}
              height={200}
              titleText="Enter value same as aria-label"
              itemHeight={30}
              selectedID={filterList[0].id}
              color="#e5e7eb"
              activeColor="#111827"
              backgroundColor="#fff"
            />
          </div>
        </div>
      </PopUpModal>
    </div>
  )
}
