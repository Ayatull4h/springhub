import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const payload = JSON.stringify({
    amountIdr: 50000,
    donorName: 'Load Tester',
    donorEmail: `tester${__VU}@test.com`,
    tierId: 'silver',
  });

  const res = http.post(`${BASE_URL}/api/donations/invoice`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'invoice created': (r) => r.status === 200 || r.status === 429,
  });

  sleep(2);
}
