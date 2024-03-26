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
  extension: string;
  size: number;
  buffer: Buffer;
};

type ExtractResponse = {
  fields: { [key: string]: string };
  files: { [key: string]: File };
};

/**
 * Declare files property, so can be accessed by consumers.
 *
 */
declare module "koa" {
  interface Request {
    files: { [key: string]: File };
  }
}

/**
 * Middleware to handle files upload.
 * Executed on 'multipart/form-data' content-type headers.
 *
 * @param {string | string[]} fieldNames Only filters provided fieldnames.
 * @return {Middleware}
 */
function multipart(fieldNames: string | string[]): Middleware {
  const filteredNames =
    typeof fieldNames === "string" ? [fieldNames] : fieldNames;

  return async (ctx: Context, next: Next) => {
    const contentTypeHeader = ctx.request.headers["content-type"];
    if (!contentTypeHeader?.startsWith("multipart/form-data")) {
      return next();
    }

    const { files, fields } = await extract(ctx.req, filteredNames);

    ctx.request.body = fields;
    ctx.request.files = files;

    await next();
  };
}

/**
 * Extract form-data request body using busboy.
 *
 * @param { IncomingMessage } req Koa Context Req object
 * @param { string[] } fieldNames Filtered field names
 * @return { Promise<ExtractResponse> } Extraction of fields and files
 */
function extract(
  req: IncomingMessage,
  fieldNames: string[]
): Promise<ExtractResponse> {
  return new Promise((resolve, reject) => {
    const bb = busboy({
      headers: req.headers,
      limits: { fileSize: 10 * 1024 * 1024 },
    });

    const fields: { [key: string]: string } = {};
    const files: { [key: string]: File } = {};
    const fileWrites: Promise<void>[] = [];

    // Note: os.tmpdir() points to an in-memory file system on GCF
    // Thus, any files in it must fit in the instance's memory.
    const tmpdir = os.tmpdir();

    bb.on("field", (key, value) => {
      if (fieldNames.length && fieldNames.includes(key)) {
        fields[key] = value;
      }
    });

    bb.on("file", (fieldName, stream, metadata) => {
      if (!(fieldNames.length && fieldNames.includes(fieldName))) {
        return;
      }

      const { filename, encoding, mimeType } = metadata;
      const splittedName = filename.split(".");
      const extension = splittedName.pop() as string;
      const originalName = splittedName.join(".");

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

              files[fieldName] = {
                fieldName,
                originalName,
                encoding,
                extension,
                mimeType,
                buffer,
                size,
              };

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

export default multipart;
