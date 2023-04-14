import { IObjectStore } from "./interface.ts";

export function createStubObjectStore(): IObjectStore {
  return {
    upload: (_) => Promise.resolve({ ok: true, uploadFilePath: "foo/bar" }),
    uploadJson: (_) => Promise.resolve({ ok: true, uploadFilePath: "foo/bar" }),
    download: (_) => Promise.resolve("foo/bar"),
    downloadFromObjectStore: (_) => Promise.resolve("foo/bar"),
    downloadFromUrl: (_) => Promise.resolve("foo/bar"),
  };
}
