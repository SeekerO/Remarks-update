import moment from "moment";

const convertExcelTimestamp = (serial: number): string => {
  if (serial == null || isNaN(serial) || serial < 1) return ""; // Ensure invalid dates return empty
  return moment("1899-12-30").add(serial, "days").format("YYYY-MM-DD");
};

export default convertExcelTimestamp;
