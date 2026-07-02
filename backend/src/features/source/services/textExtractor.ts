import pdfParse from "pdf-parse";
import mammoth from "mammoth";

// Simple utility to extract text from file buffers
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    let targetMimeType = (mimeType || "").toLowerCase().trim();

    // Override application/octet-stream by sniffing magic bytes
    if (targetMimeType === "application/octet-stream") {
      if (buffer.length >= 4 && buffer.toString("utf-8", 0, 4) === "%PDF") {
        targetMimeType = "application/pdf";
      } else if (
        buffer.length >= 4 &&
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b &&
        buffer[2] === 0x03 &&
        buffer[3] === 0x04
      ) {
        // Zip archive (docx)
        targetMimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else {
        // Default fallback to plain text for unstructured octet streams
        targetMimeType = "text/plain";
      }
    }

    switch (targetMimeType) {
      case "text/plain":
      case "text/markdown":
        return buffer.toString("utf-8");
      case "application/pdf": {
        try {
          const data = await pdfParse(buffer);
          return data.text || "";
        } catch (error: any) {
          console.warn("pdf-parse failed, falling back to pdf2json:", error.message);
          return new Promise<string>((resolve, reject) => {
            const fs = require('fs');
            const os = require('os');
            const path = require('path');
            const PDFParser = require('pdf2json');
            
            const tempFile = path.join(os.tmpdir(), `pdf_extract_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);
            fs.writeFileSync(tempFile, buffer);
            
            const pdfParser = new PDFParser(null, 1);
            
            pdfParser.on("pdfParser_dataError", (errData: any) => {
              try { fs.unlinkSync(tempFile); } catch (e) {}
              reject(new Error(errData.parserError));
            });
            
            pdfParser.on("pdfParser_dataReady", () => {
              try { fs.unlinkSync(tempFile); } catch (e) {}
              resolve(pdfParser.getRawTextContent() || "");
            });
            
            try {
              pdfParser.loadPDF(tempFile);
            } catch (loadError) {
              try { fs.unlinkSync(tempFile); } catch (e) {}
              reject(loadError);
            }
          });
        }
      }
      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        const result = await mammoth.extractRawText({ buffer });
        return result.value || "";
      }
      default:
        return "";
    }
  } catch (error) {
    console.error("Text extraction error:", error);
    return "";
  }
}
