import { getStorage } from "firebase-admin/storage";

type DirectoryPath = "badges" | "delivers" | "pickups" | "products" | "misc";

/**
 * Handle buffer file upload to Firebase Storage.
 *
 * @param { DirectoryPath } path  Path relative to root storage.
 * @param { string } filename     Desired name of file uploaded, includes ext.
 * @param { string } contentType  Content type of file, ie. image/png.
 * @param { Buffer } data         Buffer data of file.
 * @param { boolean } makePublic  Make the file accessible by public.
 * @return { Promise<string> }    Returns public URL of uploaded file.
 */
export async function upload(
  path: DirectoryPath,
  filename: string,
  contentType: string,
  data: Buffer,
  makePublic?: boolean
): Promise<string> {
  const file = getStorage().bucket().file(`${path}/${filename}`);
  await file.save(data, { contentType });

  if (makePublic) await file.makePublic();

  return file.publicUrl();
}

/**
 * Get signed URL of file in Storage.
 *
 * @param { string } filepath Relative path of file to root, includes ext.
 * @return { Promise<string> } Returns signed URL of file.
 */
export async function getSignedUrl(filepath: string): Promise<string> {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);

  const bucket = getStorage().bucket().file(filepath);
  const response = await bucket.getSignedUrl({ action: "read", expires });

  return response[0];
}

export default { upload, getSignedUrl };
