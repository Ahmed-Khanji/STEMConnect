const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Client PUTs the file body to this URL (Content-Type must match what was signed)
async function presignedPutUrl(key, contentType, expiresInSeconds = 900) {
  const cmd = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, cmd, { expiresIn: expiresInSeconds });
}

// Client downloads directly using temporary signed GET URL.
async function presignedGetUrl(key, expiresInSeconds = 900) {
  const cmd = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(s3, cmd, { expiresIn: expiresInSeconds });
}

// Client can call DELETE directly using temporary signed URL.
async function presignedDeleteUrl(key, expiresInSeconds = 900) {
  const cmd = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(s3, cmd, { expiresIn: expiresInSeconds });
}

// List all objects in the bucket (handles pagination).
async function listAllBucketFiles(prefix = "") {
  const files = [];
  let continuationToken;

  do {
    // List objects in the bucket (prefix used to filter the files according to their key)
    const page = await s3.send(new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: prefix, // prefix e.g. courses/<courseId>/ or projects/<projectId>/
      ContinuationToken: continuationToken,
    }));

    // Push the files to the files array
    for (const item of page.Contents || []) {
      files.push({
        key: item.Key,
        size: item.Size,
      });
    }

    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);

  return files;
}

module.exports = {
  presignedPutUrl,
  presignedGetUrl,
  presignedDeleteUrl,
  listAllBucketFiles,
};