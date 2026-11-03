// Verification tokens travel through the outbox encrypted: auth-service
// encrypts and email-service decrypts, so both must agree on the format
// `<version>.<iv>.<authTag>.<ciphertext>`.
export const TOKEN_ENCRYPTION_ALGORITHM = "aes-256-gcm"
export const TOKEN_ENCRYPTION_VERSION = "v1"
export const TOKEN_ENCRYPTION_IV_BYTES = 12
export const TOKEN_ENCRYPTION_AUTH_TAG_BYTES = 16
