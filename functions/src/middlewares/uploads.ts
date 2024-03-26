import busboy = require("busboy");
import os = require("os");
import fs = require("fs");
import path = require("path");
import { Middleware, Context, Next } from "koa";
import { IncomingMessage } from "http";

type File = {
  fieldName: string;
  originalName: string;
  encoding: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
};

type ExtractResponse = {
  fields: { [key: string]: string };
  files: File[];
};

/**
 * Declare files property, so can be accessed by consumers.
 *
 */
declare module "koa" {
  interface Request {
    files?: File[];
  }
}

/**
 * Middleware to handle files upload.
 * Executed on 'multipart/form-data' content-type headers.
 *
 * @return {Middleware}
 */
function uploads(): Middleware {
  return async (ctx: Context, next: Next) => {
    const contentTypeHeader = ctx.request.headers["content-type"];
    if (!contentTypeHeader?.startsWith("multipart/form-data")) {
      return next();
    }

    const { files, fields } = await extract(ctx.req);

    ctx.request.body = fields;
    ctx.request.files = files;

    await next();
  };
}

/**
 * Extract form-data request body using busboy.
 *
 * @param { IncomingMessage } req Koa Context Req object
 * @return { Promise<ExtractResponse> } Extraction of fields and files
 */
function extract(req: IncomingMessage): Promise<ExtractResponse> {
  return new Promise((resolve, reject) => {
    const bb = busboy({
      headers: req.headers,
      limits: { fileSize: 10 * 1024 * 1024 },
    });

    const fields: { [key: string]: string } = {};
    const files: File[] = [];
    const fileWrites: Promise<void>[] = [];

    // Note: os.tmpdir() points to an in-memory file system on GCF
    // Thus, any files in it must fit in the instance's memory.
    const tmpdir = os.tmpdir();

    bb.on("field", (key, value) => {
      fields[key] = value;
    });

    bb.on("file", (fieldName, stream, metadata) => {
      const { filename, encoding, mimeType } = metadata;
      const filepath = path.join(tmpdir, filename);

      const writeStream = fs.createWriteStream(filepath);
      stream.pipe(writeStream);

      fileWrites.push(
        new Promise((resolve, reject) => {
          stream.on("end", () => writeStream.end());

          writeStream.on("finish", () => {
            fs.readFile(filepath, (err, buffer) => {
              const size = Buffer.byteLength(buffer);

              if (err) return reject(err);

              files.push({
                fieldName,
                originalName: filename,
                encoding,
                mimeType,
                buffer,
                size,
              });

              fs.unlinkSync(filepath);
              resolve();
            });
          });

          writeStream.on("error", reject);
        })
      );
    });

    bb.on("close", async () => {
      await Promise.all(fileWrites);
      resolve({ fields, files });
    });

    bb.on("error", reject);
    bb.on("partsLimit", () => reject(new Error("LIMIT_PART_COUNT")));
    bb.on("filesLimit", () => reject(new Error("LIMIT_FILE_COUNT")));
    bb.on("fieldsLimit", () => reject(new Error("LIMIT_FIELD_COUNT")));

    if (req.rawBody) {
      bb.end(req.rawBody);
    } else {
      req.pipe(bb);
    }
  });
}

export default uploads;