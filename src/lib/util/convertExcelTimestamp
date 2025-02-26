import moment from "moment";

const convertExcelTimestamp = (serial: number): string => {
  if (!serial || isNaN(serial)) return "Invalid Date";
  return moment("1899-12-30").add(serial, "days").format("YYYY-MM-DD");
};
export default convertExcelTimestamp;
