import {
  basename,
  FileWriter,
  GetObjectCommand,
  join,
  JSONArray,
  JSONObject,
  MediaType,
  PutObjectCommand,
  QuackError,
  S3Client,
} from "./deps.ts";
import { ObjectStoreOptions } from "./schema.ts";

export type DownloadRequest = {
  bucket?: string;
  key: string;
};

export interface BaseUploadRequest {
  /** May be omitted if the {@linkcode ObjectStore} was initialized with a bucket value. */
  readonly bucket?: string;
  /** The object store file key to use. If not provided a key will be generated. */
  readonly key?: string;
}

export interface UploadRequest extends BaseUploadRequest {
  readonly localFile: URL;
  readonly mediaType?: string;
}

export interface UploadJSONRequest extends BaseUploadRequest {
  readonly fileName: string;
  readonly data: JSONArray | JSONObject;
}

export type UploadResponse = { readonly ok: false; readonly error: QuackError } | {
  readonly ok: true;
  readonly uploadFilePath: string;
};

export class ObjectStore {
  readonly keyPrefix;
  readonly bucket;
  readonly endpoint;
  readonly s3Client;

  constructor(options: ObjectStoreOptions) {
    this.keyPrefix = options.keyPrefix ?? "";
    this.bucket = options.connection.bucket;
    this.endpoint = options.connection.endpoint;
    this.s3Client = new S3Client({
      credentials: options.connection.credentials,
      endpoint: options.connection.endpoint,
      region: options.connection.region,
    });
  }

  /** Upload a file to the object store based on the given {@linkcode uploadRequest}. Returns the fully qualified upload url. */
  async upload(uploadRequest: UploadRequest) {
    const key = uploadRequest.key
      ? join(this.keyPrefix, uploadRequest.key)
      : join(this.keyPrefix, crypto.randomUUID(), basename(uploadRequest.localFile.pathname));
    const bucket = this.#checkBucket(uploadRequest.bucket);
    const mediaType = uploadRequest.mediaType ?? MediaType.fromPath(uploadRequest.localFile)?.type;

    const data = await Deno.readTextFile(uploadRequest.localFile);
    return await this.#upload(bucket, key, data, mediaType);
  }

  /** Upload raw JSON data to the object store. Returns the fully qualified upload url. */
  async uploadJSON(uploadRequest: UploadJSONRequest) {
    let Key = join(this.keyPrefix, uploadRequest.fileName);
    if (!Key.endsWith(".json")) {
      Key += ".json";
    }

    return await this.#upload(Key, JSON.stringify(uploadRequest.data), "application/json");
  }

  async download(downloadRequest: DownloadRequest) {
    const Bucket = this.#checkBucket(downloadRequest.bucket);
    if (!downloadRequest.key) {
      throw new QuackError("key value must be provided");
    }
    const Key = downloadRequest.key;
    const fileName = basename(Key);

    const res = await this.s3Client.send(
      new GetObjectCommand({
        Bucket,
        Key,
      }),
    );

    if (res.Body == null || !(res.Body instanceof ReadableStream)) {
      throw new QuackError(`Could not download data from object store for key ${Key}`);
    }
    const body = res.Body;

    const outputFilePath = await FileWriter.withTempFile(async (f) => {
      await body.pipeTo(f.writable);
    }, { suffix: `-${fileName}` });

    return outputFilePath;
  }

  async #upload(Bucket: string, Key: string, data: string, ContentType?: string) {
    const res = await this.s3Client.send(
      new PutObjectCommand({
        Bucket,
        Key,
        Body: data,
        ContentType,
      }),
    );

    // TODO(@curtislarson): More checks here
    if (res.ETag == null) {
      return {
        ok: false as const,
        error: new QuackError(`Unable to retrieve ETag from upload response`),
      };
    }

    const uploadFilePath = new URL(join(Bucket, Key), this.endpoint).href;

    return {
      ok: true as const,
      data: uploadFilePath,
    };
  }

  #checkBucket(bucket?: string) {
    const Bucket = bucket ?? this.bucket;
    if (!Bucket) {
      throw new QuackError("Bucket must be provided in either ObjectStore constructor or request parameter.");
    }
    return Bucket;
  }
}
