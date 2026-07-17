import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const pages = ['/', '/faq', '/help', '/privacy', '/terms', '/sign-in', '/join'];

  for (const page of pages) {
    const res = http.get(`${BASE_URL}${page}`);
    check(res, {
      'page loads': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });
    sleep(1);
  }

  // API calls
  const apiRes1 = http.get(`${BASE_URL}/api/forms`);
  check(apiRes1, { 'forms API': (r) => r.status === 200 });

  const apiRes2 = http.get(`${BASE_URL}/api/leaderboard`);
  check(apiRes2, { 'leaderboard API': (r) => r.status === 200 });

  const apiRes3 = http.get(`${BASE_URL}/api/point-rules`);
  check(apiRes3, { 'point-rules API': (r) => r.status === 200 });

  sleep(2);
}
