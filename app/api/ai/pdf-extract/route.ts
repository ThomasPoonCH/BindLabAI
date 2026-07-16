import { NextResponse } from "next/server";
import pdf from "pdf-parse";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
// Keep the model context focused enough for a fast interactive draft. The
// original PDF remains represented by the uploaded filename and user review.
const MAX_TEXT_CHARS = 24_000;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.type !== "application/pdf") {
      return NextResponse.json({ ok: false, error: { code: "INVALID_PDF", message: "Please upload a PDF file." } }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ ok: false, error: { code: "PDF_TOO_LARGE", message: "PDF files must be 15 MB or smaller." } }, { status: 413 });
    }
    const parsed = await pdf(Buffer.from(await file.arrayBuffer()));
    const text = parsed.text.trim().slice(0, MAX_TEXT_CHARS);
    if (!text) {
      return NextResponse.json({ ok: true, fileName: file.name, pageCount: parsed.numpages, text: "", scanned: true, pdfData: Buffer.from(await file.arrayBuffer()).toString("base64") });
    }
    return NextResponse.json({ ok: true, fileName: file.name, pageCount: parsed.numpages, text, scanned: false, pdfData: Buffer.from(await file.arrayBuffer()).toString("base64"), truncated: parsed.text.length > MAX_TEXT_CHARS });
  } catch {
    return NextResponse.json({ ok: false, error: { code: "PDF_READ_ERROR", message: "BindLab could not read this PDF. Try an accessible text-based PDF." } }, { status: 422 });
  }
}
