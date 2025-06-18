import * as XLSX from "xlsx";
import { token_set_ratio } from "fuzzball";

function cleanString(str) {
  return str.replace(/[^\w\s]/g, "").toLowerCase(); // Remove punctuation, make lowercase
}

export function compareExcelFilesFuzzy(
  file1Buffer,
  file2Buffer,
  threshold = 85
) {
  const wb1 = XLSX.read(file1Buffer, { type: "buffer" });
  const wb2 = XLSX.read(file2Buffer, { type: "buffer" });

  const ws1 = wb1.Sheets[wb1.SheetNames[0]];
  const ws2 = wb2.Sheets[wb2.SheetNames[0]];

  const data1 = XLSX.utils.sheet_to_json(ws1, { header: 1 });
  const data2 = XLSX.utils.sheet_to_json(ws2, { header: 1 });

  const matched = [];
  const unmatched = [];

  for (const row1 of data1) {
    const cell1 = (row1[0] || "").toString().trim();
    if (!cell1) continue;

    const cleanedCell1 = cleanString(cell1);

    let bestMatch = null;
    let bestScore = 0;

    for (const row2 of data2) {
      const cell2 = (row2[0] || "").toString().trim();
      const cleanedCell2 = cleanString(cell2);
      const score = token_set_ratio(cleanedCell1, cleanedCell2);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = row2;
      }
    }

    if (bestScore >= threshold) {
      matched.push({
        row1,
        bestMatch,
        score: bestScore,
      });
    } else {
      unmatched.push(row1);
    }
  }
  

  return { matched, unmatched, data1, data2 };
}

export function loadExcelFileData(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  return data;
}
