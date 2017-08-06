import fs from 'fs';
export default JSON.parse(fs.readFileSync(`./src/config/${process.env.SITE}.json`, 'utf8'));