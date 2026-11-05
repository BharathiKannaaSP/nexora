# Media service: private S3 files, CloudFront delivery

`services/media-service` (port 4006) stores every image and document in one
private S3 bucket and serves them through CloudFront signed URLs. Users never
upload through Node: media-service signs a short-lived S3 URL, the browser
`PUT`s the file straight to S3, and media-service then checks the real file
before keeping it.

**Every URL is a CloudFront signed URL.** There are no plain CloudFront URLs,
even for files meant to be visible to everyone; "public" is a decision the
owning service makes, not a place in the bucket.

media-service doesn't know who may see a file. It only knows who uploaded it,
because the key says so. The service that owns the record (onboarding for an
organization request) stores the key and decides who gets a URL.

| What | Where |
| --- | --- |
| Bucket | `nexora-media-service`, `ap-southeast-2` (Sydney) |
| CloudFront | `https://d3f6ke7m208pnn.cloudfront.net`, every path signed |
| IAM user (local dev) | `nexora-media-service`, AWS profile `nexora-dev` |
| Bucket basics (encryption, versioning, CORS) | [s3-file-uploads-setup.md](s3-file-uploads-setup.md) |
| Organization request submit | [../../onboarding/create-organization-request.md](../../onboarding/create-organization-request.md) |

## Flow

```mermaid
sequenceDiagram
    participant B as Admin app (browser)
    participant M as media-service (via gateway)
    participant S as S3
    participant O as Owning service (e.g. onboarding)
    participant C as CloudFront

    B->>M: POST /media/uploads (purpose, name, type, size)
    M-->>B: presigned PUT for tmp/..., 5 min, Content-Type signed
    B->>S: PUT the file
    B->>M: POST /media/uploads/complete (key)
    M->>S: real size (HeadObject), real type (first bytes), move
    M-->>B: { key: private/uploads/{userId}/{purpose}/..., contentType, sizeBytes }
    B->>O: submit the form with those details
    O->>O: key is this user's, for this purpose → save
    Note over B,C: Viewing: a signed URL from media-service, then
    B->>C: GET signed URL
    C->>S: read through Origin Access Control
```

## Key layout

| Prefix | Meaning |
| --- | --- |
| `tmp/{userId}/{purpose}/{uuid}.{ext}` | Uploaded, not checked yet. Expires after 1 day (lifecycle rule) |
| `private/uploads/{userId}/{purpose}/{uuid}.{ext}` | Checked. Stays here for good, whether or not a record uses it |

The server picks every key; the user's file name is never part of it. The
owning service checks a key with `parseUploadKey` from
`@nexora/schemas/media/upload`, which returns `{ userId, purpose }`, or null
for anything that isn't a checked upload.

Purposes and their rules (`UPLOAD_RULES`):

| Purpose | Types | Max | Kind |
| --- | --- | --- | --- |
| `user-avatar` | PNG, JPEG, WebP | 2 MB | image |
| `org-logo` | PNG, JPEG, WebP | 2 MB | image |
| `org-document` | PDF, DOCX, DOC, PNG, JPEG, WebP | 5 MB | document |
| `product-image` | PNG, JPEG, WebP | 5 MB | image |

Images are stored `inline` with `Cache-Control: max-age=300, s-maxage=86400`;
documents `attachment` with `private, no-store`. Caching images at the edge
is safe: CloudFront checks the signature before it looks in its cache.

## Endpoints

| Route | Caller | Does |
| --- | --- | --- |
| `POST /api/v1/media/uploads` | Browser | Presigned PUT to `tmp/`, Content-Type signed |
| `POST /api/v1/media/uploads/complete` | Browser | Check size and type, move to `private/uploads/{userId}/{purpose}/`, return the details |
| `GET /api/v1/media/uploads/url?key=` | Browser | Signed URL for one of the user's own files |
| `POST /api/v1/media/uploads/delete` | Browser | Delete one of the user's own files (only before a record uses it) |
| `POST /internal/v1/files/url` | Services | Signed URL for any checked file, optional download name |
| `POST /internal/v1/files/urls` | Services | Signed URLs for up to 100 files |
| `POST /internal/v1/files/delete` | Services | Delete a checked file |

The gateway proxies `/api/v1/media/*` behind `authenticate` and never
forwards `/internal/*`. Internal routes trust the caller to have checked
access first.

## Code

| File | Contents |
| --- | --- |
| [upload.ts](../../../packages/schemas/src/media/upload.ts) | Purposes, rules, extensions, `parseUploadKey`, request schemas |
| [media.ts](../../../packages/shared/src/types/media.ts) | Response types |
| [media-service.ts](../../../services/media-service/src/modules/media-service.ts) | Sign, complete, sign URLs, delete |
| [cloudfront.ts](../../../services/media-service/src/lib/cloudfront.ts) | `signCloudFrontUrl`, `windowedExpiry` |
| [s3-client.ts](../../../services/media-service/src/lib/s3-client.ts) | `requestChecksumCalculation: "WHEN_REQUIRED"` (needed for presigned PUTs) |
| [media-env.ts](../../../services/media-service/src/config/media-env.ts) | Env schema |

Signed URLs use `windowedExpiry`: the expiry is rounded up to the next
5-minute window plus one, so a URL lives 5 to 10 minutes and stays the same
within a window. That lets the browser cache images.

Without `CLOUDFRONT_KEY_PAIR_ID` and `CLOUDFRONT_PRIVATE_KEY`, media-service
falls back to S3 presigned GETs, which is enough for local work.

## Environment

`services/media-service/.env` (git-ignored):

```bash
NODE_ENV=development
PORT=4006
CLIENT_ORIGINS=http://localhost:3001
INTERNAL_SERVICE_SECRET=<same 32+ char secret as the gateway>

AWS_REGION=ap-southeast-2
S3_BUCKET=nexora-media-service
S3_UPLOAD_URL_TTL_SECONDS=300
AWS_PROFILE=nexora-dev        # locally; set nothing on ECS/EC2/EKS (role)

CLOUDFRONT_URL=https://d3f6ke7m208pnn.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=K...
CLOUDFRONT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
DOWNLOAD_URL_TTL_SECONDS=300
```

Also set: `MEDIA_SERVICE_URL=http://localhost:4006` in the gateway, and
`MEDIA_UPLOAD_ORIGIN` / `MEDIA_CDN_ORIGIN` in `apps/admin/.env` for the CSP.

In production, load `CLOUDFRONT_PRIVATE_KEY` from Secrets Manager or SSM.
Anyone with it can sign URLs to every file.

## AWS setup

### CloudFront

- **Origin:** `nexora-media-service.s3.ap-southeast-2.amazonaws.com` with
  Origin Access Control, signing requests.
- **Key pair:** a public key in CloudFront, in key group `nexora-media-private`.
  Its ID is `CLOUDFRONT_KEY_PAIR_ID`.
- **One behavior, the default (`*`):**

| Setting | Value |
| --- | --- |
| Restrict viewer access | **Yes**, trusted key group `nexora-media-private` |
| Viewer protocol | Redirect HTTP to HTTPS |
| Allowed methods | GET, HEAD |
| Cache policy | Custom: honour origin `Cache-Control` (min TTL 0), query string `response-content-disposition` in the cache key |

Without `response-content-disposition` in the cache key, downloads don't keep
their original file names (tested: they come back `inline`).

### Bucket policy

Next to the guard-rails from the S3 guide (HTTPS only, signature age):

```json
{
  "Sid": "AllowCloudFrontRead",
  "Effect": "Allow",
  "Principal": { "Service": "cloudfront.amazonaws.com" },
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::nexora-media-service/private/*",
  "Condition": {
    "StringEquals": {
      "AWS:SourceArn": "arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<DISTRIBUTION_ID>"
    }
  }
}
```

`tmp/*` is left out: unchecked files can't be read, even with a signature.

### IAM user `nexora-media-service`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": [
        "arn:aws:s3:::nexora-media-service/tmp/*",
        "arn:aws:s3:::nexora-media-service/private/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::nexora-media-service"
    }
  ]
}
```

`s3:ListBucket` doesn't list anything here. Without it, S3 answers 403 instead
of 404 for a missing object, and `complete` on an expired upload returns 500
instead of `MEDIA.UPLOAD_NOT_FOUND`. No CloudFront permissions are needed:
signing uses the private key only.

### Lifecycle rules

| Rule | Prefix | Action |
| --- | --- | --- |
| Clean unchecked uploads | `tmp/` | Expire after 1 day |
| Abort stuck multipart uploads | whole bucket | After 7 days |

**No rule on `private/uploads/`.** Submitted files live there too, and an
expiry rule would delete them. Files uploaded but never submitted stay until
a clean-up job (not built) deletes keys no record points to.

## Showing files in the app

The app never builds a file URL and never signs anything. It shows the URL an
API gives it.

- **Render images** with a plain `<img>` or `<Image unoptimized>`, never the
  optimized `next/image`: the optimizer fetches on the server and caches by
  URL, and the signed query string changes every window.
- **Documents:** a link, signed with the original file name so the download
  keeps it. Sign on click rather than on page load: a URL signed when the
  page loaded may have expired.
- **Don't put signed URLs inside `"use cache"`.** `cacheComponents` is on in
  the admin app; a cached page would hand one user's URL to others, and keep
  it after it expires.
- **Expiry:** URLs live 5 to 10 minutes. An image already on screen stays;
  every navigation signs new URLs. On long-lived screens, `router.refresh()`
  from an `<img onError>`.
- **Before submit:** preview with `URL.createObjectURL(file)` (`blob:` is in
  the CSP).

The admin CSP (`apps/admin/next.config.ts`) adds `MEDIA_UPLOAD_ORIGIN` to
`connect-src` (the browser `PUT`) and `MEDIA_CDN_ORIGIN` to `img-src`. Add the
CloudFront domain to `frame-src` too if PDFs are previewed in an `<iframe>`.

## Tested

| Check | Result |
| --- | --- |
| Upload PUT, then `complete` (PNG, PDF) | 200; key under `private/uploads/{userId}/{purpose}/`, sniffed type and size returned |
| PUT with a different `Content-Type` than signed | S3 `SignatureDoesNotMatch` |
| Text file renamed `.png` | `MEDIA.UNSUPPORTED_TYPE`, upload deleted |
| `complete` with another user's key | 403 |
| Internal route without the shared secret | 403 |
| Signed URL through CloudFront | 200, same bytes, `inline`, image cache headers |
| Same URL without the signature | `MissingKey` |
| Signed with a file name | Still `inline`: needs the cache-policy change above |

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `403 SignatureDoesNotMatch` on the PUT | The browser sent a different `Content-Type` or extra signed headers; send exactly `headers` from `/uploads` |
| CORS error on the PUT | Bucket CORS doesn't list the admin origin exactly |
| CSP error on the PUT or an image | `MEDIA_UPLOAD_ORIGIN` / `MEDIA_CDN_ORIGIN` missing in `apps/admin/.env` |
| `AccessDenied` on every S3 call | Wrong `S3_BUCKET` or `AWS_REGION`, or the IAM policy names another bucket |
| 500 instead of `MEDIA.UPLOAD_NOT_FOUND` | IAM user lacks `s3:ListBucket` |
| Signed URL returns `AccessDenied` from S3 | `private/*` missing from the bucket policy's CloudFront statement, or the file doesn't exist |
| Signed URL returns `MissingKey` / `InvalidKey` | Wrong `CLOUDFRONT_KEY_PAIR_ID`, or that key isn't in the behavior's key group |
| Image works, then breaks after a few minutes | The URL expired; see "Showing files in the app" |
| `400` from `/_next/image` | Rendered with optimized `next/image`; add `unoptimized` |
