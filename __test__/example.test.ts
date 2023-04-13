import { assertExists } from "./deps.ts";

Deno.test("An example of the package", async (t) => {
  await t.step("import mod.ts", async () => {
    const mod = await import("../mod.ts");
    assertExists(mod);
  });
});
