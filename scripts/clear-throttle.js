const { execSync } = require('child_process');

try {
  execSync(
    "docker exec otantist-redis redis-cli EVAL \"local keys=redis.call('KEYS','throttle:*') for i=1,#keys do redis.call('DEL',keys[i]) end return #keys\" 0",
    { stdio: 'inherit' }
  );
} catch {
  console.log('Could not clear Redis throttle keys (Redis may not be running)');
}
