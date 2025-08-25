import * as XLSX from "xlsx";
import { token_set_ratio } from "fuzzball";


function cleanString(str) {
  return str.replace(/[^\w\s]/g, "").toLowerCase();
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

  console.log(data1)
  console.log(data2)

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



export function compareExcelFilesFuzzyOptimized(
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

  // Pre-process the larger dataset into a Map or similar structure
  // For simplicity, we'll assume data2 is the lookup list
  const data2Map = new Map();
  for (const row2 of data2) {
    const cell2 = (row2[0] || "").toString().trim();
    if (!data2Map.has(cell2)) {
      data2Map.set(cell2, row2);
    }
  }

  const data2Keys = Array.from(data2Map.keys()).map(key => ({
    key,
    cleanedKey: cleanString(key)
  }));

  const matched = [];
  const unmatched = [];

  for (const row1 of data1) {
    const cell1 = (row1[0] || "").toString().trim();
    if (!cell1) continue;

    const cleanedCell1 = cleanString(cell1);

    let bestMatch = null;
    let bestScore = 0;

    // Iterate through the pre-processed keys, which is still a loop
    // But the key is that we can introduce optimizations here (like early exit)
    for (const { key, cleanedKey } of data2Keys) {
      const score = token_set_ratio(cleanedCell1, cleanedKey);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = data2Map.get(key);
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