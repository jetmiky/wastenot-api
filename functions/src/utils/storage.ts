import { getStorage } from "firebase-admin/storage";

type DirectoryPath = "badges" | "delivers" | "pickups" | "products" | "misc";

/**
 * Handle buffer file upload to Firebase Storage.
 *
 * @param { DirectoryPath } path  Path relative to root storage.
 * @param { string } filename     Desired name of file uploaded, includes ext.
 * @param { string } contentType  Content type of file, ie. image/png.
 * @param { Buffer } data         Buffer data of file.
 * @return { Promise<string> }    Returns public URL of uploaded file.
 */
export async function upload(
  path: DirectoryPath,
  filename: string,
  contentType: string,
  data: Buffer
): Promise<string> {
  const bucket = getStorage().bucket().file(`${path}/${filename}`);
  await bucket.save(data, { contentType });

  return bucket.publicUrl();
}

/**
 * Get public URL of file in Storage.
 *
 * @param { DirectoryPath } path         Path relative to root storage.
 * @param { string } filename     Name of file, includes ext.
 * @return { Promise<string> }    Returns public URL of file.
 */
export async function getSignedUrl(
  path: DirectoryPath,
  filename: string
): Promise<string> {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);

  const bucket = getStorage().bucket().file(`${path}/${filename}`);
  const response = await bucket.getSignedUrl({ action: "read", expires });

  return response[0];
}

export default { upload, getSignedUrl };
