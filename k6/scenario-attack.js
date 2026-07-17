import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Simulate brute force attack
  const payload = JSON.stringify({
    email: 'admin@springhub.id',
    password: 'wrongpassword123',
  });

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'rate limited': (r) => r.status === 429 || r.status === 401,
    'not 500': (r) => r.status !== 500,
  });

  // Simulate spam report submission
  const spamPayload = {
    form_slug: 'spring_monitoring',
    location_lat: '0',
    location_lng: '0',
    _submit_time: String(Date.now()),
    _website: '', // honeypot check
  };

  const spamRes = http.post(`${BASE_URL}/api/reports`, JSON.stringify(spamPayload), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(spamRes, { 'not crashing': (r) => r.status !== 500 });

  sleep(0.5);
}
