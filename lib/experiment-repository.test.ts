import { afterEach, expect, it, vi } from "vitest";
import { saveExperiment } from "./experiment-repository";
import { buildDeterministicTextDraft } from "./ai/partial-draft";
afterEach(() => vi.unstubAllGlobals());
it("saves independent records and updates only the requested record", () => {
  let stored = "[]"; vi.stubGlobal("localStorage", { getItem: () => stored, setItem: (_: string, value: string) => { stored = value; } });
  const a = buildDeterministicTextDraft("DMF"); const b = buildDeterministicTextDraft("DIPEA");
  saveExperiment(a); saveExperiment(b); saveExperiment({ ...a, title: "Edited" });
  const records = JSON.parse(stored); expect(records).toHaveLength(2); expect(records.find((r: {experimentId: string}) => r.experimentId === b.experimentId).title).toBe(b.title);
});
it("does not overwrite corrupt storage", () => {
  const setItem = vi.fn(); vi.stubGlobal("localStorage", { getItem: () => "broken", setItem });
  expect(() => saveExperiment(buildDeterministicTextDraft("DMF"))).toThrow("not been saved"); expect(setItem).not.toHaveBeenCalled();
});
it("reports quota errors", () => {
  vi.stubGlobal("localStorage", { getItem: () => "[]", setItem: () => { throw new Error("quota"); } });
  expect(() => saveExperiment(buildDeterministicTextDraft("DMF"))).toThrow("not been saved");
});

it("rejects a stale record version without overwriting a newer save", () => {
  let stored="[]"; vi.stubGlobal("localStorage",{getItem:()=>stored,setItem:(_:string,value:string)=>{stored=value;}});
  const original=saveExperiment(buildDeterministicTextDraft("DMF"));
  const newer=saveExperiment({...original,title:"Newer"},original.storageRevision);
  expect(()=>saveExperiment({...original,title:"Stale"},original.storageRevision)).toThrow("another tab");
  expect(JSON.parse(stored)[0].title).toBe(newer.title);
});
it("imports backups as new copies without replacing original IDs", async () => {
  const {importExperiments}=await import("./experiment-repository"); let stored="[]"; vi.stubGlobal("localStorage",{getItem:()=>stored,setItem:(_:string,value:string)=>{stored=value;}});
  const original=saveExperiment(buildDeterministicTextDraft("DMF")); const [copy]=await importExperiments([original]); expect(copy.experimentId).not.toBe(original.experimentId); expect(JSON.parse(stored)).toHaveLength(2);
});
