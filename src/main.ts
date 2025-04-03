const axios = require('axios');
const dotenv = require('dotenv');
const readline = require('readline');

dotenv.config();

const API_EMAIL = process.env['CLOUDFLARE_EMAIL'];
const API_KEY = process.env['CLOUDFLARE_API_KEY'];
const ZONE_ID = process.env['CLOUDFLARE_ZONE_ID'];

const API_URL = `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`;

const HEADERS = {
  'X-Auth-Key': API_KEY,
  'X-Auth-Email': API_EMAIL,
  'Content-Type': 'application/json',
};

const rl = readline.createInterface({
  output: process.stdout,
  input: process.stdin,
});

const args = process.argv.slice(2);

function showHelp(exitCode) {
  console.log('Usage:');
  console.log('  script help  -> Show this help');
  console.log('  script list  -> List all DNS records');
  console.log('  script create <domain> <ip> [proxied]  -> Create a new DNS record');
  console.log('  script update <index> <ip> [proxied]  -> Update an existing DNS record');
  console.log('  script delete <index>  -> Delete a DNS record');

  if (exitCode !== undefined) process.exit(exitCode);
}

async function listRecords() {
  const { data } = await axios.get(API_URL, { headers: HEADERS });
  const records = data.result;

  console.log('Existing DNS Records:');
  records.forEach((record, index) => {
    console.log(`${index + 1}: ${record.name} - ${record.type} - ${record.content} (Proxied: ${record.proxied}, ID: ${record.id})`);
  });

  return records;
}

async function confirmAction(oldRecord, newRecord) {
  return new Promise((resolve) => {
    const isExclusion = !(newRecord && newRecord.name);

    !isExclusion ? console.log('\nConfirm the changes:') : console.log('\nConfirm the EXCLUSION:');

    if (Object.keys(oldRecord).length > 0)
    console.log(`Old Data -> ${oldRecord.name} - ${oldRecord.type} - ${oldRecord.content} (Proxied: ${oldRecord.proxied})`);
    if (!isExclusion)
    console.log(`New Data -> ${newRecord.name} - ${newRecord.type} - ${newRecord.content} (Proxied: ${newRecord.proxied})`);

    rl.question('Do you want to proceed? (yes/no): ', (answer) => {
      resolve(answer.toLowerCase() === 'yes');
    });

  });
}

async function createRecord(domain, ip, proxied = false) {
  const newRecord = { type: 'A', name: domain, content: ip, ttl: 120, proxied };

  if (await confirmAction({}, newRecord)) {
    const response = await axios.post(API_URL, newRecord, { headers: HEADERS });

    console.log('Record created:', response.data);
  } else {
    console.log('Operation canceled.');
  }
}

async function updateRecord(recordId, oldRecord, newIp, proxied) {
  const updatedRecord = { name: oldRecord.name, type: oldRecord.type, content: newIp, ttl: 120, proxied };

  if (await confirmAction(oldRecord, updatedRecord)) {
    const response = await axios.put(`${API_URL}/${recordId}`, updatedRecord, { headers: HEADERS });

    console.log('Record updated:', response.data);
  } else {
    console.log('Operation canceled.');
  }
}

async function deleteRecord(recordId, record) {
  if (await confirmAction(record, {})) {
    const response = await axios.delete(`${API_URL}/${recordId}`, { headers: HEADERS });

    console.log('Record deleted:', response.data);
  } else {
    console.log('Operation canceled.');
  }
}

async function main() {
  if (args.length === 0) {
    showHelp(0);
  }

  const command = args[0];

  if (command === 'help') {
    showHelp(0);
  } else if (command === 'list') {
    await listRecords();
    process.exit(0);
  } else {
    const records = await listRecords();
    
    if (command === 'create' && args.length >= 3) {
      const ip = args[2];
      const domain = args[1];
      const proxied = args[3] === 'true';

      await createRecord(domain, ip, proxied);

    } else if (command === 'update' && args.length >= 3) {
      const index = parseInt(args[1], 10) - 1;

      if (!records[index]) {
        console.error('Invalid index. Exiting.');
        process.exit(1);
      }

      const newIp = args[2];
      const proxied = args[3] === 'true' ? true : args[3] === 'false' ? false : records[index].proxied;

      await updateRecord(records[index].id, records[index], newIp, proxied);
    } else if (command === 'delete' && args.length >= 2) {
      const index = parseInt(args[1], 10) - 1;

      if (!records[index]) {
        console.error('Invalid index. Exiting.');
        process.exit(1);
      }

      await deleteRecord(records[index].id, records[index]);
    }

    process.exit(0);
  }
}

main().catch(error => {
  console.error('Error:', error.response ? error.response.data : error.message);
  process.exit(1);
});
