export const formatStakedAmount = (num: number): string => {
  if (num < 1 && num > 0) {
    return num.toLocaleString(undefined, { minimumFractionDigits: 6 });
  } else {
    return num.toLocaleString();
  }
};
