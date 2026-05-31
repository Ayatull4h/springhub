import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 70 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Login first
  const loginPayload = JSON.stringify({
    email: `user${__VU}@test.com`,
    password: 'testpassword123',
  });

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, { 'login success': (r) => r.status === 200 });

  // Submit report
  const formData = {
    form_slug: 'spring_monitoring',
    location_lat: '-7.5',
    location_lng: '110.0',
    water_condition: 'good',
    notes: 'Test report from load test',
    _submit_time: String(Date.now() - 10000),
  };

  const submitRes = http.post(`${BASE_URL}/api/reports`, JSON.stringify(formData), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(submitRes, {
    'report submitted': (r) => r.status === 200 || r.status === 429,
  });

  sleep(3);
}
