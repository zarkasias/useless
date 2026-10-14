import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "achievement-assets";

const PUBLIC_DIR = path.resolve("public");

const SOURCE_DIRS = [
  "achievement_icons/webp",
  "achievement_icons/collection",
  "achievement_icons/streak",
  "game_icons/achievements",
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function collectWebpFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectWebpFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".webp")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function uploadFile(filePath) {
  const relativePath = path
    .relative(PUBLIC_DIR, filePath)
    .split(path.sep)
    .join("/");

  const fileBuffer = await fs.readFile(filePath);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(relativePath, fileBuffer, {
      contentType: "image/webp",
      upsert: false,
      cacheControl: "31536000",
    });

  if (error) {
    if (error.message.toLowerCase().includes("already exists")) {
      console.log(`SKIP  ${relativePath}`);
      return;
    }

    throw new Error(`${relativePath}: ${error.message}`);
  }

  console.log(`UPLOAD ${relativePath}`);
}

async function collectRootWebpFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  return entries
    .filter(
      (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".webp"),
    )
    .map((entry) => path.join(dir, entry.name));
}

async function main() {
  const files = [];

  for (const sourceDir of SOURCE_DIRS) {
    const absoluteDir = path.join(PUBLIC_DIR, sourceDir);

    try {
      files.push(
        ...(await collectRootWebpFiles(
          path.join(PUBLIC_DIR, "achievement_icons"),
        )),
      );
    } catch (error) {
      console.error(`Could not read ${sourceDir}`);
      throw error;
    }
  }

  console.log(`Found ${files.length} WebP files`);
  console.log(`Uploading to bucket: ${BUCKET}\n`);

  for (const file of files) {
    await uploadFile(file);
  }

  console.log("\nUpload complete.");
}

main().catch((error) => {
  console.error("\nUpload failed:");
  console.error(error);
  process.exit(1);
});
