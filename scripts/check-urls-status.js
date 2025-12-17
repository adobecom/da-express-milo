#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultInput = path.resolve(
  __dirname,
  '../express/code/blocks/github-package-comparator/adobecom_urls.txt',
);
const defaultOutput = path.resolve(
  __dirname,
  '../express/code/blocks/github-package-comparator/adobecom_urls_status.txt',
);

const args = process.argv.slice(2);
const inputArgIndex = args.indexOf('--input');
const outputArgIndex = args.indexOf('--output');

const inputPath = inputArgIndex !== -1 && args[inputArgIndex + 1]
  ? path.resolve(process.cwd(), args[inputArgIndex + 1])
  : defaultInput;
const outputPath = outputArgIndex !== -1 && args[outputArgIndex + 1]
  ? path.resolve(process.cwd(), args[outputArgIndex + 1])
  : defaultOutput;

async function readUrls(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function fetchStatus(url) {
  const timeout = 10000;
  const headers = { 'User-Agent': 'milo-url-checker' };
  try {
    const res = await axios.request({
      method: 'head',
      url,
      timeout,
      headers,
      validateStatus: () => true,
      maxRedirects: 0,
    });
    return res.status;
  } catch {
    try {
      const res = await axios.request({
        method: 'get',
        url,
        timeout,
        headers,
        validateStatus: () => true,
        maxRedirects: 0,
      });
      return res.status;
    } catch (err) {
      return err?.response?.status ?? 'error';
    }
  }
}

async function run() {
  console.log(`Reading URLs from ${inputPath}`);
  const urls = await readUrls(inputPath);
  console.log(`Found ${urls.length} URLs, checking...`);

  const concurrency = 10;
  const results = [];
  let index = 0;

  async function worker() {
    while (index < urls.length) {
      const current = index;
      index += 1;
      const url = urls[current];
      const status = await fetchStatus(url);
      results[current] = `${url} - ${status}`;
      console.log(results[current]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, worker);
  await Promise.all(workers);

  await fs.writeFile(outputPath, results.join('\n'), 'utf8');
  console.log(`Done. Wrote statuses to ${outputPath}`);
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
