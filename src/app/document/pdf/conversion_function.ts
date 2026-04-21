import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFDocument } from "pdf-lib";
import * as mammoth from "mammoth";
import { FileItem } from "./page";
import { addLog } from "@/lib/firebase/firebase.actions.firestore/logsFirestore";

interface LogUser {
  displayName: string | null;
  email: string | null;
}

export const Logger = async (user: LogUser | null, mode: string) => {
  if (!user) return;
  await addLog({
    userName: user.displayName ?? "Unknown",
    userEmail: user.email ?? "unknown@email.com",
    function: `download_by_${mode}`,
    urlPath: "/Documents/Pdf",
  });
};

// ─────────────────────────────────────────────
// WORD → PDF
// mammoth converts .docx → HTML (preserves
// headings, bold, tables, lists), then
// html2canvas renders it page-by-page into jsPDF
// ─────────────────────────────────────────────
export const wordToPDF = async (item: FileItem): Promise<Blob> => {
  const arrayBuffer = await item.file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  return new Promise<Blob>((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument!;
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8"/>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt; line-height: 1.6; color: #000;
          padding: 60px 70px; width: 794px; background: white;
        }
        h1 { font-size: 20pt; font-weight: bold; margin: 16px 0 8px; }
        h2 { font-size: 16pt; font-weight: bold; margin: 14px 0 6px; }
        h3 { font-size: 13pt; font-weight: bold; margin: 12px 0 4px; }
        p  { margin-bottom: 8px; }
        ul, ol { margin: 8px 0 8px 24px; }
        li { margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
        th, td { border: 1px solid #555; padding: 5px 8px; text-align: left; vertical-align: top; }
        th { background-color: #e8e8e8; font-weight: bold; }
        strong, b { font-weight: bold; }
        em, i { font-style: italic; }
        u { text-decoration: underline; }
        img { max-width: 100%; height: auto; }
      </style></head><body>${html}</body></html>
    `);
    iframeDoc.close();

    iframe.onload = async () => {
      try {
        const { default: html2canvas } = await import("html2canvas");
        const body = iframeDoc.body;
        const totalHeight = body.scrollHeight;
        const pageW = 794,
          pageH = 1123;
        const pdf = new jsPDF({
          unit: "px",
          format: [pageW, pageH],
          orientation: "portrait",
        });
        let pageTop = 0,
          firstPage = true;

        while (pageTop < totalHeight) {
          const canvas = await html2canvas(body, {
            scale: 2,
            useCORS: true,
            windowWidth: pageW,
            y: pageTop,
            height: Math.min(pageH, totalHeight - pageTop),
            scrollY: -pageTop,
            backgroundColor: "#ffffff",
          });
          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          if (!firstPage) pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, 0, pageW, canvas.height / 2);
          firstPage = false;
          pageTop += pageH;
        }

        document.body.removeChild(iframe);
        resolve(pdf.output("blob"));
      } catch (err) {
        document.body.removeChild(iframe);
        reject(err);
      }
    };
  });
};

// ─────────────────────────────────────────────
// PDF → WORD
// PDF.js extracts text preserving row structure,
// docx library builds a proper .docx file
// ─────────────────────────────────────────────
export const pdfToWord = async (item: FileItem): Promise<Blob> => {
  const arrayBuffer = await item.file.arrayBuffer();
  const extractedText = await extractTextFromPDF(arrayBuffer);
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } =
    await import("docx");

  const paragraphs = extractedText
    .split("\n")
    .map((line) => line.trim())
    .map((line) => {
      if (line === "--- Page Break ---") {
        return new Paragraph({ pageBreakBefore: true, children: [] });
      }
      const isHeading =
        line.length > 3 && line.length < 80 && line === line.toUpperCase();
      return new Paragraph({
        heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
        children: [new TextRun({ text: line, size: isHeading ? 28 : 24 })],
        spacing: { after: 160 },
      });
    });

  const doc = new Document({ sections: [{ children: paragraphs }] });
  return await Packer.toBlob(doc);
};

// ─────────────────────────────────────────────
// EXCEL → PDF
// jsPDF-AutoTable renders proper styled tables
// ─────────────────────────────────────────────
export const excelToPDF = async (item: FileItem): Promise<Blob> => {
  const arrayBuffer = await item.file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let firstSheet = true;

  workbook.eachSheet((worksheet) => {
    if (!firstSheet) pdf.addPage();
    firstSheet = false;

    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 30, 30);
    pdf.text(worksheet.name, 14, 12);

    const allRows: string[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const rowData: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        let val = "";
        if (cell.value !== null && cell.value !== undefined) {
          if (
            typeof cell.value === "object" &&
            "result" in (cell.value as object)
          ) {
            val = String((cell.value as any).result ?? "");
          } else if (cell.value instanceof Date) {
            val = cell.value.toLocaleDateString();
          } else {
            val = String(cell.value);
          }
        }
        rowData.push(val);
      });
      allRows.push(rowData);
    });

    if (allRows.length === 0) return;

    autoTable(pdf, {
      head: [allRows[0]],
      body: allRows.slice(1),
      startY: 18,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: [67, 56, 202],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      margin: { top: 18, left: 14, right: 14 },
    });
  });

  return pdf.output("blob");
};

// ─────────────────────────────────────────────
// PDF → EXCEL
// Groups text by Y position (rows), X position
// (columns) for table-like structure detection
// ─────────────────────────────────────────────
export const pdfToExcel = async (item: FileItem): Promise<Blob> => {
  const arrayBuffer = await item.file.arrayBuffer();

  if (!(window as any).pdfjsLib) throw new Error("PDF.js library not loaded");
  const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer })
    .promise;

  const workbook = new ExcelJS.Workbook();

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const worksheet = workbook.addWorksheet(`Page ${pageNum}`);

    // Group items by rounded Y value → rows
    const rowMap = new Map<number, { x: number; str: string }[]>();
    content.items.forEach((item: any) => {
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      if (!rowMap.has(y)) rowMap.set(y, []);
      rowMap.get(y)!.push({ x, str: item.str });
    });

    const sortedRows = [...rowMap.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, cols]) => cols.sort((a, b) => a.x - b.x).map((c) => c.str));

    sortedRows.forEach((row, i) => {
      const wsRow = worksheet.addRow(row);
      if (i === 0) wsRow.font = { bold: true };
    });

    // Auto-fit columns
    worksheet.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        maxLen = Math.max(maxLen, String(cell.value ?? "").length + 2);
      });
      col.width = Math.min(maxLen, 50);
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

// ─────────────────────────────────────────────
// IMAGES → PDF
// ─────────────────────────────────────────────
export const imagesToPDF = async (fileItems: FileItem[]): Promise<Blob> => {
  const pdfDoc = await PDFDocument.create();

  for (const item of fileItems) {
    const arrayBuffer = await item.file.arrayBuffer();
    const image =
      item.file.type === "image/png"
        ? await pdfDoc.embedPng(arrayBuffer)
        : await pdfDoc.embedJpg(arrayBuffer);

    const pageW = 595,
      pageH = 842,
      margin = 40;
    const maxW = pageW - margin * 2,
      maxH = pageH - margin * 2;
    let { width, height } = image;

    if (width > maxW || height > maxH) {
      const ratio = Math.min(maxW / width, maxH / height);
      width *= ratio;
      height *= ratio;
    }

    const page = pdfDoc.addPage([pageW, pageH]);
    page.drawImage(image, {
      x: (pageW - width) / 2,
      y: (pageH - height) / 2,
      width,
      height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
};

// ─────────────────────────────────────────────
// HTML → PDF (renders via html2canvas)
// ─────────────────────────────────────────────
export const htmlToPDF = async (item: FileItem): Promise<Blob> => {
  const htmlContent = await item.file.text();

  return new Promise<Blob>((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument!;
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    iframe.onload = async () => {
      try {
        const { default: html2canvas } = await import("html2canvas");
        const body = iframeDoc.body;
        const totalHeight = body.scrollHeight;
        const pageW = 794,
          pageH = 1123;
        const pdf = new jsPDF({ unit: "px", format: [pageW, pageH] });
        let pageTop = 0,
          firstPage = true;

        while (pageTop < totalHeight) {
          const canvas = await html2canvas(body, {
            scale: 2,
            useCORS: true,
            windowWidth: pageW,
            y: pageTop,
            height: Math.min(pageH, totalHeight - pageTop),
            scrollY: -pageTop,
            backgroundColor: "#ffffff",
          });
          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          if (!firstPage) pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, 0, pageW, canvas.height / 2);
          firstPage = false;
          pageTop += pageH;
        }

        document.body.removeChild(iframe);
        resolve(pdf.output("blob"));
      } catch (err) {
        document.body.removeChild(iframe);
        reject(err);
      }
    };
  });
};

// ─────────────────────────────────────────────
// COMBINE PDFs
// ─────────────────────────────────────────────
export const combinePDFs = async (fileItems: FileItem[]): Promise<Blob> => {
  const mergedPdf = await PDFDocument.create();

  for (const item of fileItems) {
    const arrayBuffer = await item.file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const pdfBytes = await mergedPdf.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
};

// ─────────────────────────────────────────────
// HELPER: Extract text preserving row/col layout
// ─────────────────────────────────────────────
export const extractTextFromPDF = async (
  arrayBuffer: ArrayBuffer,
): Promise<string> => {
  if (!(window as any).pdfjsLib) throw new Error("PDF.js library not loaded");

  const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer })
    .promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const rowMap = new Map<number, string[]>();
    content.items.forEach((item: any) => {
      const y = Math.round(item.transform[5]);
      if (!rowMap.has(y)) rowMap.set(y, []);
      rowMap.get(y)!.push(item.str);
    });

    const rows = [...rowMap.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, cols]) => cols.join("\t"));

    pages.push(rows.join("\n"));
  }

  return pages.join("\n\n--- Page Break ---\n\n");
};
