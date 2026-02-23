#!/usr/bin/env node
/* eslint-disable no-console, no-underscore-dangle */
/**
 * Figma Node Inspector — fetch node layers from Figma API
 * Usage: node scripts/figma-node-inspector.js [node-id]
 * Example: node scripts/figma-node-inspector.js 6198-366251
 * Requires: .env with FIGMA_ACCESS_TOKEN
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  try {
    const envPath = resolve(root, '.env');
    const content = readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    });
    return env;
  } catch {
    return {};
  }
}

function nodeIdToApiFormat(id) {
  return String(id).replace(/-/g, ':');
}

function printLayers(node, indent = 0) {
  if (!node) return;
  const pad = '  '.repeat(indent);
  const type = node.type || 'unknown';
  const name = node.name || '(unnamed)';
  const id = node.id || '';
  const visible = node.visible !== false;
  const children = node.children || [];
  console.log(`${pad}${type}: "${name}" ${id ? `[${id}]` : ''} ${visible ? '' : '(hidden)'}`);
  if (node.absoluteBoundingBox) {
    const { x, y, width, height } = node.absoluteBoundingBox;
    console.log(`${pad}  bounds: ${width}×${height} @ (${x}, ${y})`);
  }
  if (node.fills && node.fills.length > 0) {
    node.fills.forEach((f, i) => {
      if (f.type === 'SOLID' && f.color) {
        const { r, g, b, a = 1 } = f.color;
        const hex = `#${[r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`;
        console.log(`${pad}  fill[${i}]: ${hex} (a: ${a})`);
      }
    });
  }
  if (node.strokes && node.strokes.length > 0) {
    node.strokes.forEach((s, i) => {
      if (s.type === 'SOLID' && s.color) {
        const { r, g, b } = s.color;
        const hex = `#${[r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`;
        console.log(`${pad}  stroke[${i}]: ${hex}`);
      }
    });
  }
  if (node.cornerRadius) console.log(`${pad}  cornerRadius: ${node.cornerRadius}`);
  if (node.effects && node.effects.length > 0) {
    node.effects.forEach((e, i) => {
      if (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') {
        console.log(`${pad}  effect[${i}]: ${e.type} ${e.radius}px ${e.offset?.x ?? 0} ${e.offset?.y ?? 0}`);
      }
    });
  }
  children.forEach((child) => printLayers(child, indent + 1));
}

const FILE_KEY = 'mcJuQTxJdWsL0dMmqaecpn';
const DEFAULT_NODE_ID = '6198-366251';

const env = loadEnv();
const token = env.FIGMA_ACCESS_TOKEN;
const nodeId = process.argv[2] || DEFAULT_NODE_ID;
const apiNodeId = nodeIdToApiFormat(nodeId);

if (!token) {
  console.error('Missing FIGMA_ACCESS_TOKEN in .env');
  process.exit(1);
}

const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(apiNodeId)}&depth=10`;

console.log(`Fetching node ${nodeId} (${apiNodeId}) from Figma...\n`);

try {
  const res = await fetch(url, {
    headers: { 'X-Figma-Token': token },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Figma API error ${res.status}: ${text}`);
    process.exit(1);
  }

  const data = await res.json();
  const nodes = data.nodes || {};
  const node = nodes[apiNodeId];

  if (!node) {
    console.error('Node not found:', nodeId);
    console.log('Raw response:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const doc = node.document;
  console.log('=== Layers ===\n');
  printLayers(doc);

  console.log('\n=== Raw JSON (full node) ===');
  console.log(JSON.stringify(doc, null, 2));
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
