// `data` of media-service responses.

/** POST /media/uploads */
export interface CreateUploadResponseData {
  /** tmp/ key; send it to POST /media/uploads/complete after the PUT. */
  key: string
  /** Presigned S3 URL the browser PUTs the file to, valid for `expiresInSeconds`. */
  url: string
  method: "PUT"
  /** Signed into `url`; the upload must send exactly these. */
  headers: Record<string, string>
  expiresInSeconds: number
}

/** POST /media/uploads/complete */
export interface CompleteUploadResponseData {
  /**
   * private/uploads/{userId}/{purpose}/... key: send it with the form. It
   * expires after a day unless a record attaches it.
   */
  key: string
  /** As found in the file, not as the browser claimed. */
  contentType: string
  sizeBytes: number
  purpose: string
}

export interface FileUrlResponseData {
  /** CloudFront signed URL. */
  url: string
  /** Fetch a new URL before this runs out. */
  expiresInSeconds: number
}

/** internal /files/urls */
export interface FileUrlsResponseData {
  urls: Record<string, FileUrlResponseData>
}

/** POST /media/uploads/delete, internal /files/delete */
export interface ObjectKeyResponseData {
  objectKey: string
}
