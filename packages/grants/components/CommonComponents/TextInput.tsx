import React, { useState } from "react";

interface TextInputProps {
  type?: string;
  inputValue: string;
  id: string;
  name: string;
  placeholder?: string;
  inputDescription?: string;
  isValid?: (input: string) => boolean;
  formKey: string;
  className?: string;
  errorMsg?: string;
  updateInput: (value: string, formKey: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({
  type = "text",
  inputValue,
  id,
  name,
  placeholder,
  updateInput,
  isValid,
  inputDescription,
  formKey,
  className,
}) => {
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const checkInputError = () => {
    if (isDirty) {
      if (isValid) {
        return isValid(inputValue);
      }
      return true;
    }
    return true;
  };

  const focusStyle = checkInputError()
    ? "focus:ring-primary focus:border-primary border-gray-300"
    : "border-customRed focus:ring-customRed focus:border-customRed";

  return (
    <>
      {type == "textarea" ? (
        <textarea
          name={name}
          id={id}
          rows={3}
          className={`${className} mt-1 block w-full sm:text-sm rounded py-3 ${focusStyle}`}
          value={inputValue}
          onChange={(e) => {
            if (!isDirty) setIsDirty(true);
            updateInput(e.target.value, formKey);
          }}
        />
      ) : (
        <input
          type={type}
          name={name}
          id={id}
          placeholder={placeholder}
          className={`${className} mt-1 block w-full sm:text-sm rounded py-3 ${focusStyle}`}
          value={inputValue}
          onChange={(e) => {
            if (!isDirty) setIsDirty(true);
            updateInput(e.target.value, formKey);
          }}
        />
      )}
      <p className="mt-2 text-sm text-secondaryDark leading-4">{inputDescription}</p>
    </>
  );
};

export default TextInput;
