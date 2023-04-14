import { Static, T } from "./deps.ts";

export const ObjectStoreConnectionSchema = T.Readonly(T.Object({
  credentials: T.Readonly(T.Object({
    accessKeyId: T.Required(T.Readonly(T.String())),
    secretAccessKey: T.Required(T.Readonly(T.String())),
    sessionToken: T.ReadonlyOptional(T.String()),
  })),
  bucket: T.ReadonlyOptional(T.String()),
  endpoint: T.Required(T.Readonly(T.String())),
  region: T.Readonly(T.String()),
}));

export const ObjectStoreOptionsSchema = T.Object({
  connection: ObjectStoreConnectionSchema,
  keyPrefix: T.ReadonlyOptional(T.String()),
});

export type ObjectStoreOptions = Static<typeof ObjectStoreOptionsSchema>;
