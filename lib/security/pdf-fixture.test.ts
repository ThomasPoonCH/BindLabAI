import { readFile } from "node:fs/promises";
import { describe, it, expect } from "vitest";
import { POST } from "../../app/api/ai/pdf-extract/route";
let address = 50;
async function upload(file: string) { const body = new FormData(); body.set("file", new File([await readFile(`test/beta/${file}`)],file,{type:"application/pdf"})); return POST(new Request("http://localhost:3003/api/ai/pdf-extract",{method:"POST",headers:{"X-Forwarded-For":`198.51.100.${address++}`},body})); }
describe("real synthetic PDF parsing", () => {
  it("extracts a ReportLab table without the Node Buffer xref failure", async () => { const response = await upload("synthetic-table.pdf"); expect(response.status).toBe(200); const body = await response.json(); expect(body.text).toContain("Fictional Alpha"); expect(body.text).toContain("100 mg / 1 mmol"); expect(body.scanned).toBe(false); });
  it("recognizes an image-only PDF without inventing text", async () => { const response = await upload("synthetic-scanned.pdf"); expect(response.status).toBe(200); const body = await response.json(); expect(body.scanned).toBe(true); expect(body.text).toBe(""); });
  it("rejects malformed PDF bytes", async () => { const response = await upload("malformed.pdf"); expect(response.status).toBe(422); });
});
