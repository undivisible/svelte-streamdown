const rtlPattern = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC\u10800-\u10FFF]/;
const ltrPattern = /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/;

export const detectTextDirection = (value: string): "ltr" | "rtl" => {
  for (const character of value) {
    if (rtlPattern.test(character)) {
      return "rtl";
    }
    if (ltrPattern.test(character)) {
      return "ltr";
    }
  }
  return "ltr";
};
