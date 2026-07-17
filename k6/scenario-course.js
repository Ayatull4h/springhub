import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 30 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const loginPayload = JSON.stringify({
    email: `user${__VU}@test.com`,
    password: 'testpassword123',
  });

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, { 'login success': (r) => r.status === 200 });

  // Complete course
  const progressPayload = JSON.stringify({
    courseId: 'course-1',
    courseSlug: 'spring-conservation',
    completedModules: 5,
    totalModules: 5,
  });

  const progressRes = http.put(`${BASE_URL}/api/courses/progress`, progressPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(progressRes, {
    'course completed': (r) => r.status === 200,
    'points awarded': (r) => {
      const body = JSON.parse(r.body);
      return body.pointsAwarded === 25 || body.pointsAwarded === 0;
    },
  });

  sleep(2);
}
