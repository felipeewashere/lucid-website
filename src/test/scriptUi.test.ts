import { describe, expect, it } from "vitest";
import example from "./scriptUiExample.json";
import { featureLabels, parseScriptUi } from "@/lib/scriptUi";

describe("scriptUi", () => {
  it("accepts the documented example and counts controls", () => {
    const r = parseScriptUi(example);
    expect(r.errors).toEqual([]);
    expect(r.ui!.tabs).toHaveLength(2);
    expect(r.ui!.tabs[1].pages[0].name).toBe("Settings"); // shorthand tab becomes one page
    expect(featureLabels(r.ui!)).toEqual(["Enabled", "FOV", "Target part", "Reset", "Team check", "Include NPCs", "Accent"]);
  });

  it("reports readable errors", () => {
    const r = parseScriptUi({ tabs: [{ name: "A", pages: [{ name: "P", left: [{ title: "G", items: [{ t: "toggle", label: "x" }, { t: "nope" }] }] }] }] });
    expect(r.ui).toBeNull();
    expect(r.errors.join(" ")).toContain("unknown");
  });

  it("rejects duplicate ids", () => {
    const item = { t: "toggle", id: "a", label: "A" };
    const r = parseScriptUi({ tabs: [{ name: "T", left: [{ title: "G", items: [item, item] }] }] });
    expect(r.ui).toBeNull();
  });
});
