import { readFileSync, createWriteStream } from 'fs';

const data = JSON.parse(readFileSync('./control_server_memory_profile.json'));

const headings = ['t', 'rss', 'heapTotal', 'heapUsed', 'external', 'arrayBuffers'];

const ws = createWriteStream('./control_server_memory_profile.csv');
ws.write(headings.join(',') + '\n');

for (const { t, rss, heapTotal, heapUsed, external, arrayBuffers } of data) {
  if(t == null) continue;
  ws.write(`${t},${rss},${heapTotal},${heapUsed},${external},${arrayBuffers}\n`);
}

ws.close();
