/* eslint-disable @typescript-eslint/no-explicit-any */

import * as XLSX from "xlsx";
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

  // Create a simple text document
  // For a real .docx, you'd need the 'docx' library
  const textBlob = new Blob([extractedText], { type: "text/plain" });
  return textBlob;
};

export const excelToPDF = async (item: FileItem) => {
  const arrayBuffer = await item.file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const pdf = new jsPDF();

  let firstSheet = true;

  workbook.SheetNames.forEach((sheetName) => {
    if (!firstSheet) pdf.addPage();
    firstSheet = false;

    pdf.setFontSize(16);
    pdf.setFont("", "bold");
    pdf.text(sheetName, 14, 15);

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

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

      // Bold header row
      if (rowIndex === 0) {
        pdf.setFont("", "bold");
        pdf.setFontSize(10);
      } else {
        pdf.setFont("", "normal");
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

  // Split text into lines and create a basic spreadsheet
  const lines = extractedText.split("\n").filter((line: string) => line.trim());
  const data = lines.map((line: string) => [line]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Extracted Text");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], {
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

    // Scale image to fit A4 page while maintaining aspect ratio
    const pageWidth = 595; // A4 width in points
    const pageHeight = 842; // A4 height in points
    const margin = 40;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    let width = image.width;
    let height = image.height;

    // Scale down if needed
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
  // @ts-expect-error - type mismatch due to third-party lib
  if (!window.pdfjsLib) {
    throw new Error("PDF.js library not loaded");
  }

  // @ts-expect-error - type mismatch due to third-party lib
  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
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
