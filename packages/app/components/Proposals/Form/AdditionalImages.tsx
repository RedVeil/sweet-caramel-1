import { FormStepProps } from 'pages/proposals/propose';
import React from 'react';
import inputExists from 'utils/isValidInput';
import ControlledTextInput from './ControlledTextInput';
import { DisplayImage } from './DisplayFiles';
import IpfsUpload from './IpfsUpload';
import ActionButtons from './IpfsUploadActionButtons';

const AdditionalImages: React.FC<FormStepProps> = ({
  form,
  navigation,
  visible,
}) => {
  const [formData, setFormData] = form;

  function updateAdditionalImages(additionalImages) {
    setFormData({
      ...formData,
      files: {
        ...formData.files,
        additionalImages: additionalImages.map((image) => {
          return { image: image, description: '' };
        }),
      },
    });
  }

  function updateImageDescription(description: string, index: number): void {
    const stateCopy = { ...formData };
    stateCopy.files.additionalImages[index].description = description;
    setFormData(stateCopy);
  }

  function clearLocalState(): void {
    setFormData({
      ...formData,
      files: { ...formData.files, additionalImages: [] },
    });
  }

  function isFilled(): boolean {
    return (
      formData?.files?.additionalImages?.length > 0 &&
      formData?.files?.additionalImages.every(
        (image) => image.image !== '' && image.description !== '',
      )
    );
  }

  return (
    visible && (
      <>
        <IpfsUpload
          stepName={`${navigation.currentStep} - Upload Additional Images`}
          localState={formData?.files?.additionalImages?.map(
            (image) => image.image,
          )}
          setLocalState={updateAdditionalImages}
          fileDescription={'Additional Images'}
          fileInstructions={
            'The ideal image size and aspect ratio are 1200px X 675px and 16:9, respectively.'
          }
          fileType={'image/*'}
          numMaxFiles={4}
          maxFileSizeMB={5}
        />

        <div className="mt-8 mx-auto">
          {formData?.files?.additionalImages?.map((image, i) => (
            <div className="mb-4">
              <DisplayImage localState={image.image} />
              <div className="mx-auto mt-2 w-80">
                <p>Image {i + 1} Description</p>
                <ControlledTextInput
                  inputValue={image.description}
                  id={`description ${i}`}
                  placeholder={`Description for Image ${i + 1}`}
                  errorMessage="Image description cannot be blank."
                  updateInput={updateImageDescription}
                  inputIndex={i}
                  isValid={inputExists}
                />
              </div>
            </div>
          ))}
          {isFilled() && (
            <ActionButtons
              clearLocalState={clearLocalState}
              navigation={navigation}
            />
          )}
        </div>
      </>
    )
  );
};
export default AdditionalImages;
