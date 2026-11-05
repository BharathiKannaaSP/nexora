# AWS: S3 media storage and CloudFront delivery

The single reference for everything Nexora runs on AWS: one private S3
bucket, one CloudFront distribution, one IAM identity, and the
`services/media-service` code that uses them.

| What | Value |
| --- | --- |
| Region | `ap-southeast-2` (Sydney) |
| Bucket | `nexora-media-service` |
| CloudFront | `https://d3f6ke7m208pnn.cloudfront.net`, every path signed |
| CloudFront key group | `nexora-media-private` |
| IAM identity (local dev) | IAM user `nexora-media-service`, AWS profile `nexora-dev` |
| Service | `services/media-service`, port 4006 |

## Contents

1. [Architecture](#1-architecture)
2. [Rules](#2-rules)
3. [Upload flow](#3-upload-flow)
4. [Key layout and file rules](#4-key-layout-and-file-rules)
5. [HTTP API](#5-http-api)
6. [AWS setup](#6-aws-setup)
7. [Environment](#7-environment)
8. [Code map](#8-code-map)
9. [Showing files in the admin app](#9-showing-files-in-the-admin-app)
10. [Testing and troubleshooting](#10-testing-and-troubleshooting)

## 1. Architecture

```mermaid
flowchart LR
    B[Admin app<br/>browser] -->|JSON: sign / complete / url| G[api-gateway<br/>authenticate]
    G -->|/api/v1/media/*<br/>x-user-id + secret| M[media-service]
    O[Owning service<br/>e.g. onboarding] -->|/internal/v1/files/*<br/>secret only| M
    M -->|presign PUT, HeadObject,<br/>CopyObject, DeleteObject| S[(S3 bucket<br/>private)]
    B -->|PUT file bytes<br/>presigned URL| S
    B -->|GET signed URL| C[CloudFront]
    C -->|Origin Access Control| S
```

- **File bytes never pass through Node.** media-service signs a short-lived
  S3 URL; the browser `PUT`s straight to S3; media-service then checks the
  real file before keeping it.
- **The bucket is fully private.** All four Block Public Access settings are
  on and ACLs are disabled. Files are read only through CloudFront signed URLs
  (or S3 presigned GETs as a local fallback).
- **Every URL is signed.** There are no plain CloudFront URLs, even for
  images everyone may see. "Public" is a decision the owning service makes,
  not a place in the bucket.
- **media-service doesn't know who may see a file.** It only knows who
  uploaded it, because the key says so. The service that owns the record
  (onboarding, for an organization request) stores the key and decides who
  gets a URL, through media-service's internal routes.
- **Only media-service holds AWS permissions.** The browser and the other
  services never see an AWS credential.

## 2. Rules

Follow these when touching uploads, the bucket, or anything that shows a
file.

**Keys and validation**

- The server picks every key (`{uuid}.{ext}`). The user's file name is never
  part of a key; keep it in the owning service's database.
- Purpose and owner are part of the key, so `complete` and owning services
  can trust them without a lookup table. Owning services check a key with
  `parseUploadKey` before saving it.
- Upload rules live in one place, `UPLOAD_RULES` in
  `@nexora/schemas/media/upload`. The admin app checks them for instant
  feedback; only media-service's check counts.
- `complete` re-checks the real size (`HeadObject`) and the real type (first
  bytes, via `file-type`), never the file name or the browser's claim.
- No SVG uploads: SVG can carry scripts.

**URLs**

- Upload URLs live 5 minutes and sign the exact `Content-Type`; the browser
  must send exactly the `headers` returned by `/uploads`.
- Never store a signed URL. Store the key, sign on each request.
- Sign download links on click, not on page load.
- Never put signed URLs inside `"use cache"` (`cacheComponents` is on in the
  admin app): one user's URL would be served to others, and after expiry.

**AWS**

- Never pass AWS keys in code. The SDK's default chain finds `AWS_PROFILE`
  locally and the task/instance role in AWS.
- No AWS variable ever starts with `NEXT_PUBLIC_`.
- AWS keys and the CloudFront private key live only in git-ignored `.env`
  files locally and in Secrets Manager / SSM in production. `*.pem` is
  git-ignored; anyone with the private key can sign URLs to every file.
- Keep the IAM policy limited to `tmp/*` and `private/*`, never `s3:*`.
- Don't add `ACL` parameters to S3 calls: ACLs are disabled on purpose.
- Keep all `@aws-sdk/*` packages on the same version. Never install the v2
  `aws-sdk` package.
- Keep bucket CORS origins in sync with `CLIENT_ORIGINS`, exact origins only.

## 3. Upload flow

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

The browser helper is `uploadFile(file, purpose)` in
`apps/admin/lib/media/upload-file.ts`: it calls `createUpload`, `PUT`s the
bytes with the returned headers, then calls `completeUpload`.

A file that fails `complete` (too large, wrong type) is deleted from `tmp/`
immediately. A file uploaded but never completed expires from `tmp/` after a
day.

## 4. Key layout and file rules

| Prefix | Meaning |
| --- | --- |
| `tmp/{userId}/{purpose}/{uuid}.{ext}` | Uploaded, not checked yet. Expires after 1 day (lifecycle rule). CloudFront cannot read it |
| `private/uploads/{userId}/{purpose}/{uuid}.{ext}` | Checked. Stays for good, whether or not a record uses it |

`UPLOAD_RULES`:

| Purpose | Types | Max | Kind |
| --- | --- | --- | --- |
| `user-avatar` | PNG, JPEG, WebP | 2 MB | image |
| `org-logo` | PNG, JPEG, WebP | 2 MB | image |
| `org-document` | PDF, DOCX, DOC, PNG, JPEG, WebP | 5 MB | document |
| `product-image` | PNG, JPEG, WebP | 5 MB | image |

| Kind | Stored with |
| --- | --- |
| image | `Content-Disposition: inline`, `Cache-Control: max-age=300, s-maxage=86400` |
| document | `Content-Disposition: attachment`, `Cache-Control: private, no-store` |

Caching images at the edge is safe: CloudFront checks the signature before it
looks in its cache.

## 5. HTTP API

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
forwards `/internal/*`. Both routers run `verifyGateway` (the shared
`INTERNAL_SERVICE_SECRET`). Internal routes trust the caller to have checked
access first.

Error codes: `MEDIA.UNSUPPORTED_TYPE`, `MEDIA.FILE_TOO_LARGE`,
`MEDIA.UPLOAD_NOT_FOUND`, plus the shared `UNAUTHORIZED` / `FORBIDDEN`.

**Signed URL lifetime.** Signing uses `windowedExpiry`: the expiry is rounded
up to the next 5-minute window plus one, so a URL lives 5 to 10 minutes and
stays identical within a window. That lets the browser cache images. Without
`CLOUDFRONT_KEY_PAIR_ID` and `CLOUDFRONT_PRIVATE_KEY`, media-service falls
back to S3 presigned GETs, which is enough for local work.

## 6. AWS setup

### 6.1 Bucket

| Setting | Value |
| --- | --- |
| Bucket type | General purpose |
| Object Ownership | Bucket owner enforced (ACLs disabled); required by OAC |
| Block Public Access | All four on |
| Default encryption | SSE-S3 (AES256) |
| SSE-C | Disabled |
| Versioning | Enabled |
| Object Lock | Off |

```bash
aws s3api create-bucket \
  --bucket nexora-media-service \
  --region ap-southeast-2 \
  --create-bucket-configuration LocationConstraint=ap-southeast-2

aws s3api put-bucket-versioning \
  --bucket nexora-media-service \
  --versioning-configuration Status=Enabled
```

**CORS** (Permissions → Cross-origin resource sharing). The browser `PUT`s to
the S3 origin, which differs from the admin app's:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3001"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type", "content-length", "x-amz-*"],
    "ExposeHeaders": ["ETag", "x-amz-version-id"],
    "MaxAgeSeconds": 3000
  }
]
```

Add each deployed admin origin exactly (scheme, host and port), never `*`.

**Bucket policy.** HTTPS only, no presigned signatures older than 10 minutes
(even if a longer URL is signed by mistake), and CloudFront may read only
`private/*`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::nexora-media-service",
        "arn:aws:s3:::nexora-media-service/*"
      ],
      "Condition": { "Bool": { "aws:SecureTransport": "false" } }
    },
    {
      "Sid": "DenyOldPresignedSignatures",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::nexora-media-service/*",
      "Condition": { "NumericGreaterThan": { "s3:signatureAge": "600000" } }
    },
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
  ]
}
```

`tmp/*` is left out of the CloudFront statement: unchecked files can't be
read, even with a signature.

**Lifecycle rules** (Management → Create lifecycle rule):

| Rule | Prefix | Action |
| --- | --- | --- |
| Clean unchecked uploads | `tmp/` | Expire after 1 day |
| Abort stuck multipart uploads | whole bucket | After 7 days |

**No expiry rule on `private/uploads/`.** Submitted files live there, and an
expiry rule would delete them. Files uploaded but never submitted stay until
a clean-up job (not built yet) deletes keys no record points to.

### 6.2 IAM

Policy on the `nexora-media-service` identity:

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

- `GetObject` covers `HeadObject`; `CopyObject` needs `GetObject` on the
  source and `PutObject` on the target.
- `s3:ListBucket` doesn't list anything here. Without it, S3 answers 403
  instead of 404 for a missing object, and `complete` on an expired upload
  returns 500 instead of `MEDIA.UPLOAD_NOT_FOUND`.
- No CloudFront permissions are needed: signing uses the private key only.

| Environment | Identity | Credentials |
| --- | --- | --- |
| Local dev | IAM user `nexora-media-service` | `AWS_PROFILE=nexora-dev` in `services/media-service/.env` |
| ECS | Task role with the policy | Automatic, set no AWS variables |
| EC2 | Instance profile role | Automatic |
| EKS | Pod Identity or IRSA role | Automatic |

Rotate IAM user keys every 90 days. Keep CloudTrail management events on to
see who changed the bucket or the policy.

### 6.3 CloudFront

- **Origin:** `nexora-media-service.s3.ap-southeast-2.amazonaws.com` (the REST
  endpoint, not the website endpoint) with Origin Access Control, "Sign
  requests". Use OAC, not the legacy OAI.
- **Key pair:** generate an RSA key pair, upload the public key to CloudFront,
  and put it in key group `nexora-media-private`. Its ID is
  `CLOUDFRONT_KEY_PAIR_ID`; the private key is `CLOUDFRONT_PRIVATE_KEY`.

  ```bash
  openssl genrsa -out aws_cloudfront_private_key.pem 2048
  openssl rsa -pubout -in aws_cloudfront_private_key.pem -out aws_cloudfront_public_key.pem
  ```

- **One behavior, the default (`*`):**

| Setting | Value |
| --- | --- |
| Restrict viewer access | **Yes**, trusted key group `nexora-media-private` |
| Viewer protocol | Redirect HTTP to HTTPS |
| Allowed methods | GET, HEAD |
| Cache policy | Custom: honour origin `Cache-Control` (min TTL 0), query string `response-content-disposition` in the cache key |

Without `response-content-disposition` in the cache key, downloads don't keep
their original file names (they come back `inline`).

## 7. Environment

`services/media-service/.env` (git-ignored), validated by
`src/config/media-env.ts`:

```bash
NODE_ENV=development
PORT=4006
CLIENT_ORIGINS=http://localhost:3001
INTERNAL_SERVICE_SECRET=<same 32+ char secret as the gateway>

AWS_REGION=ap-southeast-2
S3_BUCKET=nexora-media-service
S3_UPLOAD_URL_TTL_SECONDS=300          # 60–600
AWS_PROFILE=nexora-dev                 # locally only; nothing on ECS/EC2/EKS

CLOUDFRONT_URL=https://d3f6ke7m208pnn.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=K...            # set both or neither
CLOUDFRONT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
DOWNLOAD_URL_TTL_SECONDS=300           # 60–600
```

| File | Variable | Why |
| --- | --- | --- |
| `services/api-gateway/.env` | `MEDIA_SERVICE_URL=http://localhost:4006` | Proxy target |
| `apps/admin/.env` | `MEDIA_UPLOAD_ORIGIN=https://nexora-media-service.s3.ap-southeast-2.amazonaws.com` | CSP `connect-src` for the browser `PUT` |
| `apps/admin/.env` | `MEDIA_CDN_ORIGIN=https://d3f6ke7m208pnn.cloudfront.net` | CSP `img-src` for images |

None of the admin values are secrets.

## 8. Code map

| File | Contents |
| --- | --- |
| [packages/schemas/src/media/upload.ts](../packages/schemas/src/media/upload.ts) | Purposes, `UPLOAD_RULES`, extensions, `parseUploadKey`, request schemas |
| [packages/shared/src/types/media.ts](../packages/shared/src/types/media.ts) | Response types |
| [media-service.ts](../services/media-service/src/modules/media-service.ts) | Sign, complete, sign URLs, delete |
| [media-controller.ts](../services/media-service/src/modules/media-controller.ts) | Request parsing and responses |
| [media-routes.ts](../services/media-service/src/modules/media-routes.ts) / [media-internal-routes.ts](../services/media-service/src/modules/media-internal-routes.ts) | Public and internal routers |
| [cloudfront.ts](../services/media-service/src/lib/cloudfront.ts) | `signCloudFrontUrl`, `windowedExpiry` |
| [s3-client.ts](../services/media-service/src/lib/s3-client.ts) | `requestChecksumCalculation: "WHEN_REQUIRED"` |
| [media-env.ts](../services/media-service/src/config/media-env.ts) | Env schema |
| [apps/admin/lib/media/upload-file.ts](../apps/admin/lib/media/upload-file.ts) | Browser upload helper |
| [apps/admin/lib/api/media/](../apps/admin/lib/api/media/) | Server actions for the four public routes |

`requestChecksumCalculation: "WHEN_REQUIRED"` matters: by default the SDK
signs a CRC32 checksum into presigned PUTs, computed over an empty body, so
the browser's real upload fails with `SignatureDoesNotMatch` / `BadDigest`.

## 9. Showing files in the admin app

The app never builds a file URL and never signs anything. It shows the URL an
API gives it.

- **Images:** a plain `<img>` or `<Image unoptimized>`, never the optimized
  `next/image`. The optimizer fetches on the server and caches by URL, and
  the signed query string changes every window.
- **Documents:** a link, signed with the original file name so the download
  keeps it. Sign on click.
- **Expiry:** URLs live 5 to 10 minutes. An image already on screen stays;
  every navigation signs new URLs. On long-lived screens, call
  `router.refresh()` from `<img onError>`.
- **Before submit:** preview with `URL.createObjectURL(file)` (`blob:` is in
  the CSP).
- **CSP** (`apps/admin/next.config.ts`): `MEDIA_UPLOAD_ORIGIN` in
  `connect-src`, `MEDIA_CDN_ORIGIN` in `img-src`. Add the CloudFront domain to
  `frame-src` if PDFs are ever previewed in an `<iframe>`.

## 10. Testing and troubleshooting

Quick checks:

```bash
aws sts get-caller-identity --profile nexora-dev
curl -X PUT -H "Content-Type: image/png" --upload-file ./logo.png "<presigned-url>"
```

| Check | Expected |
| --- | --- |
| Upload PUT, then `complete` (PNG, PDF) | 200; key under `private/uploads/{userId}/{purpose}/`, sniffed type and size returned |
| PUT with a different `Content-Type` than signed | S3 `SignatureDoesNotMatch` |
| Text file renamed `.png` | `MEDIA.UNSUPPORTED_TYPE`, upload deleted |
| `complete` with another user's key | 403 |
| Internal route without the shared secret | 403 |
| Signed URL through CloudFront | 200, same bytes, `inline`, image cache headers |
| Same URL without the signature | `MissingKey` |
| Raw S3 URL of any object | 403 |

| Symptom | Cause |
| --- | --- |
| `403 SignatureDoesNotMatch` on the PUT | Different `Content-Type` or extra headers; send exactly `headers` from `/uploads` |
| `400`/`403` on PUT with `x-amz-checksum-*` in the URL | `requestChecksumCalculation` missing from the S3 client |
| CORS error on the PUT | Bucket CORS doesn't list the admin origin exactly, including port |
| CSP error on the PUT or an image | `MEDIA_UPLOAD_ORIGIN` / `MEDIA_CDN_ORIGIN` missing in `apps/admin/.env` |
| `AccessDenied` on every S3 call | Wrong `S3_BUCKET` / `AWS_REGION`, or the IAM policy names another bucket |
| `ExpiredToken` / URL dies early | Signed with expired SSO or role credentials; re-sign |
| 500 instead of `MEDIA.UPLOAD_NOT_FOUND` | IAM identity lacks `s3:ListBucket` |
| Signed URL returns `AccessDenied` from S3 | `private/*` missing from the CloudFront statement, or the file doesn't exist |
| Signed URL returns `MissingKey` / `InvalidKey` | Wrong `CLOUDFRONT_KEY_PAIR_ID`, or that key isn't in the behavior's key group |
| Download comes back `inline` | `response-content-disposition` missing from the cache key |
| Image works, then breaks after a few minutes | The URL expired; see section 9 |
| `400` from `/_next/image` | Optimized `next/image`; add `unoptimized` |
| `AccessControlListNotSupported` | Code sends an `ACL` parameter; remove it |
