const axios = require('axios');
const dotenv = require('dotenv');
const readline = require('readline');

dotenv.config();

const apiEmail = process.env['CLOUDFLARE_EMAIL'];
const apiKey = process.env['CLOUDFLARE_API_KEY'];
const zoneId = process.env['CLOUDFLARE_ZONE_ID'];

const apiUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`;

const headers = {
  'X-Auth-Key': apiKey,
  'X-Auth-Email': apiEmail,
  'Content-Type': 'application/json',
};

const rl = readline.createInterface({
  output: process.stdout,
  input: process.stdin,
});

(async () => {
  try {
    const { data } = await axios.get(apiUrl, { headers });
    const records = data.result;

    console.log('Existing DNS Records:');
    records.forEach((record: any, index: any) => {
      console.log(`${index + 1}: ${record.name} - ${record.type} - ${record.content} (ID: ${record.id})`);
    });

    rl.question('Choose an action (create/update/delete): ', async (action: any) => {
      if (!['create', 'update', 'delete'].includes(action)) {
        console.error('Invalid action. Exiting.');
        rl.close();
        return;
      }

      if (action === 'create') {
        rl.question('Enter domain name: ', async (name: any) => {
          rl.question('Enter IP address: ', async (content: any) => {
            const response = await axios.post(apiUrl, {
              type: 'A', name, content, ttl: 120,
            }, { headers });
            console.log('Record created:', response.data);
            rl.close();
          });
        });
      } else {
        rl.question('Enter the number of the record to modify: ', async (num: any) => {
          const record = records[parseInt(num) - 1];
          if (!record) {
            console.error('Invalid record selection. Exiting.');
            rl.close();
            return;
          }
          
          if (action === 'update') {
            rl.question('Enter new IP address: ', async (newContent: any) => {
              const response = await axios.put(`${apiUrl}/${record.id}`, {
                type: record.type, name: record.name,
                content: newContent,
                ttl: 120,
              }, { headers });
              console.log('Record updated:', response.data);
              rl.close();
            });
          } else if (action === 'delete') {
            const response = await axios.delete(`${apiUrl}/${record.id}`, { headers });
            console.log('Record deleted:', response.data);
            rl.close();
          }
        });
      }
    });
  } catch (error: any) {
    console.error('Error:', error.response ? error.response.data : error.message);
    rl.close();
  }
})();
