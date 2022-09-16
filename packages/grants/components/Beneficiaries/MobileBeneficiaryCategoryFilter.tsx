import React from 'react'
import PopUpModal from '../Modal/PopUpModal';
import WheelPicker, { PickerData } from "react-simple-wheel-picker";

interface Props {
  categories: PickerData[];
  visible: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  selectedItem: PickerData;
  switchFilter: (item: PickerData) => void;
}

export const MobileBeneficiaryCategoryFilter: React.FC<Props> = (props) => {
  const { categories, visible, onClose, selectedItem, switchFilter } = props;
  const [selectedCategory, setSelectedCategory] = React.useState<PickerData>(selectedItem);

  const handleOnChange = (value: PickerData) => {
    setSelectedCategory(value);
  };

  return (
    <PopUpModal visible={visible} onClosePopUpModal={() => {
      switchFilter(selectedCategory);
      onClose(false);
    }}>
      {selectedItem.id && (
        <>
          <p className=" text-black mb-3">Categories</p>
          <div className="wheelPicker">
            <WheelPicker
              data={categories}
              onChange={(newValue: PickerData) => handleOnChange(newValue)}
              height={200}
              titleText="Enter value same as aria-label"
              itemHeight={30}
              selectedID={selectedItem.id}
              color="#e5e7eb"
              activeColor="#111827"
              backgroundColor="#fff"
            />
          </div>
        </>
      )}
    </PopUpModal>
  )
}
