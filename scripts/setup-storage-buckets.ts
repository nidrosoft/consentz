import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BUCKETS = [
  { name: "evidence", public: false, fileSizeLimit: 52_428_800, allowedMimeTypes: ["application/pdf", "image/png", "image/jpeg", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"] },
  { name: "policies", public: false, fileSizeLimit: 20_971_520, allowedMimeTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] },
  { name: "training", public: false, fileSizeLimit: 20_971_520, allowedMimeTypes: ["application/pdf", "image/png", "image/jpeg"] },
  { name: "reports", public: false, fileSizeLimit: 52_428_800, allowedMimeTypes: ["application/pdf"] },
  { name: "avatars", public: true, fileSizeLimit: 5_242_880, allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"] },
];

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  for (const bucket of BUCKETS) {
    const { data: existing } = await supabase.storage.getBucket(bucket.name);
    if (existing) {
      console.log(`Bucket "${bucket.name}" already exists — updating...`);
      await supabase.storage.updateBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      });
    } else {
      console.log(`Creating bucket "${bucket.name}"...`);
      const { error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      });
      if (error) {
        console.error(`  Failed: ${error.message}`);
      } else {
        console.log(`  Created.`);
      }
    }
  }
  console.log("Done.");
}

main().catch(console.error);
