import { beforeEach, describe, expect, it, vi } from "vitest";

const { parsePdf } = vi.hoisted(() => ({ parsePdf: vi.fn() }));
vi.mock("pdf-parse", () => ({ default: parsePdf }));

import { POST } from "@/app/api/ai/pdf-extract/route";

let address = 1;
function upload(content: string, name = "document.pdf", type = "application/pdf", headers: HeadersInit = {}) {
  const form = new FormData();
  form.set("file", new File([content], name, { type }));
  address += 1;
  return new Request("http://localhost:3003/api/ai/pdf-extract", {
    method: "POST",
    headers: { "X-Forwarded-For": `192.0.2.${address}`, ...headers },
    body: form,
  });
}

beforeEach(() => parsePdf.mockReset());

describe("PDF upload route", () => {
  it("accepts a valid PDF and sanitizes a path-like filename", async () => {
    parsePdf.mockResolvedValue({ numpages: 1, text: "selectable chemistry text" });
    const response = await POST(upload("%PDF-1.7\n%%EOF", "../../private.pdf"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.fileName).toBe("_.._private.pdf");
    expect(body.text).toBe("selectable chemistry text");
  });

  it("rejects a non-PDF renamed to .pdf before parsing", async () => {
    const response = await POST(upload("not really a pdf"));
    expect(response.status).toBe(415);
    expect(parsePdf).not.toHaveBeenCalled();
  });

  it("requires both the PDF extension and MIME type", async () => {
    expect((await POST(upload("%PDF-1.7", "document.txt"))).status).toBe(415);
    expect((await POST(upload("%PDF-1.7", "document.pdf", "text/plain"))).status).toBe(415);
  });

  it("rejects an oversized declared multipart body before parsing", async () => {
    const response = await POST(upload("%PDF-1.7", "document.pdf", "application/pdf", { "Content-Length": String(9 * 1024 * 1024) }));
    expect(response.status).toBe(413);
    expect(parsePdf).not.toHaveBeenCalled();
  });

  it("rejects too many pages", async () => {
    parsePdf.mockResolvedValue({ numpages: 31, text: "text" });
    expect((await POST(upload("%PDF-1.7"))).status).toBe(413);
  });

  it("returns safe errors for encrypted and malformed PDFs", async () => {
    parsePdf.mockRejectedValueOnce(new Error("Password required for encrypted document"));
    const encrypted = await POST(upload("%PDF-1.7"));
    expect(encrypted.status).toBe(422);
    expect((await encrypted.json()).error.code).toBe("PDF_ENCRYPTED");

    parsePdf.mockRejectedValueOnce(new Error("private parser path /internal/source.ts"));
    const malformed = await POST(upload("%PDF-1.7"));
    const malformedBody = await malformed.json();
    expect(malformed.status).toBe(422);
    expect(JSON.stringify(malformedBody)).not.toContain("/internal/source.ts");
  });
});
