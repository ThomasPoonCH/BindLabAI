import { NextResponse } from "next/server";
import pdf from "pdf-parse";
import { publicError, rejectUntrustedOrigin, requestId } from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_FILE_BYTES + 64 * 1024;
const MAX_PAGES = 30;
// Keep the model context focused enough for a fast interactive draft. The
// original PDF remains represented by the uploaded filename and user review.
const MAX_TEXT_CHARS = 24_000;
const PDF_PROCESSING_TIMEOUT_MS = 10_000;
const MAX_CONCURRENT_PDF_JOBS = 2;
let activePdfJobs = 0;

function looksLikePdf(buffer: Buffer) {
  // ISO 32000 readers permit leading bytes before the header, but the header
  // must occur near the start. This rejects common renamed-file attacks.
  return buffer.subarray(0, Math.min(buffer.length, 1024)).includes(Buffer.from("%PDF-"));
}

function parseWithTimeout(buffer: Buffer) {
  return Promise.race([
    pdf(buffer),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("PDF_PROCESSING_TIMEOUT")), PDF_PROCESSING_TIMEOUT_MS)),
  ]);
}

export async function POST(request: Request) {
  const id = requestId();
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;
  try {
    const limit = await rateLimit(request, { prefix: "pdf-extract", limit: 6, windowSeconds: 60 });
    if (!limit.configured && process.env.NODE_ENV === "production") return publicError(503, "RATE_LIMIT_NOT_CONFIGURED", "PDF processing is temporarily unavailable.", id);
    if (!limit.allowed) {
      const response = publicError(429, "RATE_LIMITED", "Too many PDF requests. Please wait and try again.", id);
      response.headers.set("Retry-After", String(limit.retryAfterSeconds));
      return response;
    }
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data")) return publicError(415, "UNSUPPORTED_MEDIA_TYPE", "Upload the PDF using multipart form data.", id);
    const declaredSize = Number(request.headers.get("content-length") ?? 0);
    if (declaredSize > MAX_MULTIPART_BYTES) return publicError(413, "PDF_TOO_LARGE", "PDF files must be 8 MB or smaller.", id);
    if (activePdfJobs >= MAX_CONCURRENT_PDF_JOBS) return publicError(429, "PDF_BUSY", "PDF processing is busy. Please wait and try again.", id);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.type.toLowerCase() !== "application/pdf" || !/\.pdf$/i.test(file.name)) {
      return publicError(415, "INVALID_PDF", "Please upload a PDF file.", id);
    }
    if (file.size > MAX_FILE_BYTES) {
      return publicError(413, "PDF_TOO_LARGE", "PDF files must be 8 MB or smaller.", id);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!looksLikePdf(buffer)) return publicError(415, "INVALID_PDF", "The uploaded file is not a valid PDF.", id);
    activePdfJobs += 1;
    try {
      const parsed = await parseWithTimeout(buffer);
      if (!Number.isInteger(parsed.numpages) || parsed.numpages < 1) return publicError(422, "PDF_EMPTY", "The PDF contains no readable pages.", id);
      if (parsed.numpages > MAX_PAGES) return publicError(413, "PDF_TOO_MANY_PAGES", "PDF files must contain 30 pages or fewer.", id);
      const text = parsed.text.trim().slice(0, MAX_TEXT_CHARS);
      const safeName = file.name.replace(/[^\w.\- ()]/g, "_").replace(/^\.+/, "").slice(0, 120) || "uploaded.pdf";
      if (!text) {
        return NextResponse.json({ ok: true, fileName: safeName, pageCount: parsed.numpages, text: "", scanned: true, pdfData: buffer.toString("base64") }, { headers: { "Cache-Control": "no-store, private" } });
      }
      return NextResponse.json({ ok: true, fileName: safeName, pageCount: parsed.numpages, text, scanned: false, pdfData: buffer.toString("base64"), truncated: parsed.text.length > MAX_TEXT_CHARS }, { headers: { "Cache-Control": "no-store, private" } });
    } finally {
      activePdfJobs -= 1;
    }
  } catch (error) {
    const category = error instanceof Error ? error.message : "";
    if (/password|encrypted/i.test(category)) return publicError(422, "PDF_ENCRYPTED", "Encrypted PDFs are not supported. Upload an unencrypted copy.", id);
    if (category === "PDF_PROCESSING_TIMEOUT") return publicError(504, "PDF_TIMEOUT", "PDF processing took too long. Try a smaller PDF.", id);
    return publicError(422, "PDF_READ_ERROR", "BindLab could not read this PDF. Try an accessible PDF.", id);
  }
}
