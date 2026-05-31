const { Client } = require("pg");
const url = "postgresql://postgres.bhelvywlvwlqmvyblwmn:jagasemesta001@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";
const c = new Client({ connectionString: url, connectionTimeoutMillis: 10000 });
c.connect().then(() => { console.log("CONNECTED"); c.end(); process.exit(0); }).catch(e => { console.log("FAIL:", e.code, e.message); process.exit(1); });
