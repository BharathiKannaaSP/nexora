import { S3Client } from "@aws-sdk/client-s3"
import { env } from "../config/media-env"

export const s3 = new S3Client({
  region: env.AWS_REGION,
  // By default the SDK signs a checksum into presigned PUTs, computed over an
  // empty body, so the browser's real upload fails with SignatureDoesNotMatch.
  requestChecksumCalculation: "WHEN_REQUIRED",
})
