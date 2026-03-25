import ExcelJS from "exceljs";
import { token_set_ratio } from "fuzzball";


function cleanString(str) {
  if (!str) return "";
  return str
    .replace(/[^\w\s]/g, " ") // Replace punctuation with a space (don't just delete it)
    .replace(/\s+/g, " ")      // Collapse multiple spaces/newlines into one single space
    .trim()                    // Remove leading/trailing whitespace
    .toLowerCase();
}

export async function compareExcelFilesFuzzy(
  file1Buffer,
  file2Buffer,
  threshold = 85
) {
  // Use ExcelJS instead of XLSX (secure alternative)
  const wb1 = new ExcelJS.Workbook();
  const wb2 = new ExcelJS.Workbook();

  await wb1.xlsx.load(file1Buffer);
  await wb2.xlsx.load(file2Buffer);

  const ws1 = wb1.worksheets[0];
  const ws2 = wb2.worksheets[0];

  // Convert worksheets to 2D arrays
  const data1 = [];
  ws1.eachRow((row) => {
    const rowData = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      rowData.push(cell.value);
    });
    data1.push(rowData);
  });

  const data2 = [];
  ws2.eachRow((row) => {
    const rowData = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      rowData.push(cell.value);
    });
    data2.push(rowData);
  });

  console.log(data1);
  console.log(data2);

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

// export async function loadExcelFileData(fileBuffer) {
//   // Use ExcelJS instead of XLSX (secure alternative)
//   const workbook = new ExcelJS.Workbook();
//   await workbook.xlsx.load(fileBuffer);

//   const worksheet = workbook.worksheets[0];

//   // Convert worksheet to 2D array
//   const data = [];
//   worksheet.eachRow((row) => {
//     const rowData = [];
//     row.eachCell({ includeEmpty: true }, (cell) => {
//       rowData.push(cell.value);
//     });
//     data.push(rowData);
//   });

//   return data;
// }


// export async function compareExcelFilesFuzzyOptimized(
//   file1Buffer,
//   file2Buffer,
//   threshold = 85
// ) {
//   // Use ExcelJS instead of XLSX (secure alternative)
//   const wb1 = new ExcelJS.Workbook();
//   const wb2 = new ExcelJS.Workbook();

//   await wb1.xlsx.load(file1Buffer);
//   await wb2.xlsx.load(file2Buffer);

//   const ws1 = wb1.worksheets[0];
//   const ws2 = wb2.worksheets[0];

//   // Convert worksheets to 2D arrays
//   const data1 = [];
//   ws1.eachRow((row) => {
//     const rowData = [];
//     row.eachCell({ includeEmpty: true }, (cell) => {
//       rowData.push(cell.value);
//     });
//     data1.push(rowData);
//   });

//   const data2 = [];
//   ws2.eachRow((row) => {
//     const rowData = [];
//     row.eachCell({ includeEmpty: true }, (cell) => {
//       rowData.push(cell.value);
//     });
//     data2.push(rowData);
//   });

//   // Pre-process the larger dataset into a Map or similar structure
//   // For simplicity, we'll assume data2 is the lookup list
//   const data2Map = new Map();
//   for (const row2 of data2) {
//     const cell2 = (row2[0] || "").toString().trim();
//     if (!data2Map.has(cell2)) {
//       data2Map.set(cell2, row2);
//     }
//   }

//   const data2Keys = Array.from(data2Map.keys()).map(key => ({
//     key,
//     cleanedKey: cleanString(key)
//   }));

//   const matched = [];
//   const unmatched = [];

//   for (const row1 of data1) {
//     const cell1 = (row1[0] || "").toString().trim();
//     if (!cell1) continue;

//     const cleanedCell1 = cleanString(cell1);

//     let bestMatch = null;
//     let bestScore = 0;

//     // Iterate through the pre-processed keys, which is still a loop
//     // But the key is that we can introduce optimizations here (like early exit)
//     for (const { key, cleanedKey } of data2Keys) {
//       const score = token_set_ratio(cleanedCell1, cleanedKey);

//       if (score > bestScore) {
//         bestScore = score;
//         bestMatch = data2Map.get(key);
//       }
//     }

//     if (bestScore >= threshold) {
//       matched.push({
//         row1,
//         bestMatch,
//         score: bestScore,
//       });
//     } else {
//       unmatched.push(row1);
//     }
//   }

//   return { matched, unmatched, data1, data2 };
// }
