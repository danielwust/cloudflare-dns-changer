const axios = require('axios');
const dotenv = require('dotenv');
const readline = require('readline');

dotenv.config();

const { CF_EMAIL, CF_API_KEY, CF_ZONE_ID } = process.env;
const API_URL = `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records`;
const HEADERS = { 'X-Auth-Key': CF_API_KEY, 'X-Auth-Email': CF_EMAIL, 'Content-Type': 'application/json' };

const rl = readline.createInterface({ output: process.stdout, input: process.stdin });
const args = process.argv.slice(2);

const showHelp = (exitCode) => {
  console.log('Usage:');
  console.log('  node . help  -> Show this help');
  console.log('  node . list  -> List all DNS records');
  console.log('  node . create <domain> <ip> [proxied]  -> Create a new DNS record');
  console.log('  node . delete <index>  -> Delete a DNS record');
  console.log('  node . update <index> <ip> [proxied]  -> Update an existing DNS record');
  console.log('  node . update-auto <index>  -> Update an existing DNS record with current local IP');

  if (exitCode !== undefined) process.exit(exitCode);
};

const listRecords = async () => {
  const { data } = await axios.get(API_URL, { headers: HEADERS });
  const records = data.result;

  console.log('Existing DNS Records:');
  records.forEach(
    (record, index) => console.log(
      `${index + 1}: ${record.name} - ${record.type} - ${record.content} (Proxied: ${record.proxied}, ID: ${record.id})`
    )
  );

  return records;
};

const confirmAction = async (oldRecord, newRecord) => {
  return new Promise((resolve) => {
    const isExclusion = !(newRecord && newRecord.name);

    !isExclusion ? console.log('\nConfirm the changes:') : console.log('\nConfirm the EXCLUSION:');

    if (Object.keys(oldRecord).length > 0)
    console.log(`Old Data -> ${oldRecord.name} - ${oldRecord.type} - ${oldRecord.content} (Proxied: ${oldRecord.proxied})`);
    if (!isExclusion)
    console.log(`New Data -> ${newRecord.name} - ${newRecord.type} - ${newRecord.content} (Proxied: ${newRecord.proxied})`);

    rl.question('Do you want to proceed? (yes/no | y/n): ', (answer) => {
      const validation = answer.toString().toLowerCase() === 'yes' || answer.toString().toLowerCase() === 'y';

      if (!validation) console.log('Operation canceled.');
      resolve(validation);
    });

  });
};

const createRecord = async (domain, ip, proxied = false) => {
  const newRecord = { type: 'A', name: domain, content: ip, ttl: 120, proxied };
  const confirmation = await confirmAction({}, newRecord);

  if (confirmation) console.log('Record created:', (
    await axios.post(API_URL, newRecord, { headers: HEADERS })).data
  );
};

const updateRecord = async (recordId, oldRecord, newIp, proxied) => {
  const updatedRecord = { name: oldRecord.name, type: oldRecord.type, content: newIp, ttl: 120, proxied };
  const confirmation = await confirmAction(oldRecord, updatedRecord);

  if (confirmation) console.log('Record updated:', (
    await axios.put(`${API_URL}/${recordId}`, updatedRecord, { headers: HEADERS })).data
  );
};

const deleteRecord = async (recordId, record) => {
  const confirmation = await confirmAction(record, {});

  if (confirmation) console.log('Record deleted:', (
    await axios.delete(`${API_URL}/${recordId}`, { headers: HEADERS })).data
  );
};

const getPublicIP = async () => {
  try {
    const response = await axios.get("https://1.0.0.1/cdn-cgi/trace");
    const data = response.data.split("\n").reduce((acc, line) => {
      const [key, value] = line.split("=");
      if (key && value) acc[key] = value;
      return acc;
    }, {});
    return data.ip;
  } catch (error: any) {
    console.error("Failed to fetch public IP:", error && error.message);
    process.exit(1);
  }
};

const main = async () => {
  if (args.length === 0 || args[0] === 'help') return showHelp(0);
  if (args[0] === 'list') return await listRecords().then(() => process.exit(0));

  const records = await listRecords();
  const index = parseInt(args[1], 10) - 1;

  if (['update', 'delete', 'update-auto'].includes(args[0]) && !records[index]) {
    console.error('Invalid index. Exiting.');
    return process.exit(1);
  }

  if (args[0] === 'create' && args.length >= 3) await createRecord(args[1], args[2], args[3] === 'true');
  else if (args[0] === 'delete' && args.length >= 2) await deleteRecord(records[index].id, records[index]);
  else if (args[0] === 'update-auto' && args.length >= 2) await updateRecord(records[index].id, records[index], await getPublicIP(), records[index].proxied);
  else if (args[0] === 'update' && args.length >= 3) await updateRecord(records[index].id, records[index], args[2], args[3] === 'true' ? true : args[3] === 'false' ? false : records[index].proxied);

  process.exit(0);
};

main().catch(error => {
  console.error('Error:', error.response ? error.response.data : error.message);
  process.exit(1);
});
