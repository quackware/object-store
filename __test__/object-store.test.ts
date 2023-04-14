import { load } from "https://deno.land/std@0.183.0/dotenv/mod.ts";
import { ObjectStore } from "../mod.ts";
import { assertEquals, assertRejects, isCi } from "./deps.ts";

Deno.test("ObjectStore", async (t) => {
  await t.step("bucket not provided throws an error", async () => {
    const store = new ObjectStore({
      connection: {
        bucket: "",
        credentials: {
          accessKeyId: "",
          secretAccessKey: "",
        },
        endpoint: "",
        region: "auto",
      },
    });

    const p = store.upload({ localFile: new URL("./object-store.test.ts", import.meta.url) });
    await assertRejects(() => p);
  });
});

Deno.test("ObjectStore Integration", { ignore: isCi() }, async (t) => {
  await load({ envPath: new URL("../.env", import.meta.url).pathname, export: true });

  await t.step("test upload", async () => {
    const uploader = new ObjectStore({
      connection: {
        bucket: Deno.env.get("BUCKET"),
        credentials: {
          accessKeyId: Deno.env.get("ACCESS_KEY_ID")!,
          secretAccessKey: Deno.env.get("SECRET_ACCESS_KEY")!,
        },
        endpoint: Deno.env.get("ENDPOINT")!,
        region: "auto",
      },
    });

    const f = await Deno.makeTempFile();
    await Deno.writeTextFile(f, "Hello world");

    const res = await uploader.upload({
      localFile: new URL(`file://${f}`),
      mediaType: "text/plain",
    });

    assertEquals(res.ok, true);
  });
});
