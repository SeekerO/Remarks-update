import ExcelJS from 'exceljs';
import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";
import * as mammoth from "mammoth";
import { FileItem } from "./page";

export const wordToPDF = async (item: FileItem) => {
  const arrayBuffer = await item.file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value;

  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;

  pdf.setFontSize(12);
  const lines = pdf.splitTextToSize(text, maxWidth);

  let y = margin;
  const lineHeight = 7;

  lines.forEach((line: string) => {
    if (y > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += lineHeight;
  });

  return pdf.output("blob");
};

export const pdfToWord = async (item: FileItem) => {
  const arrayBuffer = await item.file.arrayBuffer();
  const extractedText = await extractTextFromPDF(arrayBuffer);

  const textBlob = new Blob([extractedText], { type: "text/plain" });
  return textBlob;
};

export const excelToPDF = async (item: FileItem) => {
  const arrayBuffer = await item.file.arrayBuffer();

  // Use ExcelJS instead of XLSX
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const pdf = new jsPDF();
  let firstSheet = true;

  workbook.eachSheet((worksheet) => {
    if (!firstSheet) pdf.addPage();
    firstSheet = false;

    const sheetName = worksheet.name;
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(sheetName, 14, 15);

    // Convert worksheet to 2D array
    const data: any[][] = [];
    worksheet.eachRow((row, rowNumber) => {
      const rowData: any[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        rowData.push(cell.value);
      });
      data.push(rowData);
    });

    if (data.length === 0) return;

    let y = 25;
    const lineHeight = 7;
    const maxCols = Math.max(...data.map((row) => row.length));
    const colWidth = Math.min(
      40,
      (pdf.internal.pageSize.getWidth() - 28) / maxCols
    );

    data.forEach((row, rowIndex) => {
      if (y > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        y = 15;
      }

      let x = 14;

      if (rowIndex === 0) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
      } else {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
      }

      row.forEach((cell) => {
        const cellText =
          cell !== null && cell !== undefined ? String(cell) : "";
        const truncatedText =
          cellText.length > 30 ? cellText.substring(0, 27) + "..." : cellText;
        pdf.text(truncatedText, x, y);
        x += colWidth;
      });
      y += lineHeight;
    });
  });

  return pdf.output("blob");
};

export const pdfToExcel = async (item: FileItem) => {
  const arrayBuffer = await item.file.arrayBuffer();
  const extractedText = await extractTextFromPDF(arrayBuffer);

  const lines = extractedText.split("\n").filter((line: string) => line.trim());

  // Use ExcelJS instead of XLSX
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Extracted Text");

  // Add each line as a row
  lines.forEach((line: string) => {
    worksheet.addRow([line]);
  });

  // Generate Excel file as buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export const imagesToPDF = async (fileItems: FileItem[]) => {
  const pdfDoc = await PDFDocument.create();

  for (const item of fileItems) {
    const arrayBuffer = await item.file.arrayBuffer();
    let image;

    if (item.file.type === "image/png") {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      image = await pdfDoc.embedJpg(arrayBuffer);
    }

    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 40;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    let width = image.width;
    let height = image.height;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = width * ratio;
      height = height * ratio;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const x = (pageWidth - width) / 2;
    const y = (pageHeight - height) / 2;

    page.drawImage(image, { x, y, width, height });
  }

  const pdfBytes: any = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};

export const htmlToPDF = async (item: FileItem) => {
  const htmlContent = await item.file.text();
  const pdf = new jsPDF();

  return new Promise<Blob>((resolve, reject) => {
    pdf.html(htmlContent, {
      callback: (doc) => {
        try {
          const pdfBlob = doc.output("blob");
          resolve(pdfBlob);
        } catch (error) {
          reject(error);
        }
      },
      x: 10,
      y: 10,
      width: 180,
      windowWidth: 800,
    });
  });
};

export const combinePDFs = async (fileItems: FileItem[]) => {
  const mergedPdf = await PDFDocument.create();

  for (const item of fileItems) {
    const arrayBuffer = await item.file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const pdfBytes: any = await mergedPdf.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
};

export const extractTextFromPDF = async (
  arrayBuffer: ArrayBuffer
): Promise<string> => {
  if (!(window as any).pdfjsLib) {
    throw new Error("PDF.js library not loaded");
  }

  const loadingTask = (window as any).pdfjsLib.getDocument({
    data: arrayBuffer,
  });
  const pdf = await loadingTask.promise;
  const textContent: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(" ");
    textContent.push(pageText);
  }

  return textContent.join("\n\n");
};
