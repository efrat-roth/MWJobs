import axios from 'axios';

async function main() {
  const secret = process.env.CLEANUP_SECRET;
  if(!secret) throw new Error('Missing CLEANUP_SECRET');
  const url = 'http://localhost:3000/api/cleanup';
  const res = await axios.post(url, {}, { headers: { 'X-CLEANUP-SECRET': secret }});
  console.log(res.data);
}

main().catch(err=>{
  console.error(err);
  process.exit(1);
});
