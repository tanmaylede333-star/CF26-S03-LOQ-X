import { runTestSuite } from './src/engine/engineTest';
import { runSecurityTestSuite } from './src/engine/securityTest';

const engineResult = runTestSuite();
const securityResult = runSecurityTestSuite();

const totalFailed = engineResult.failed + securityResult.failed;
const totalPassed = engineResult.passed + securityResult.passed;

console.log(`\n==================================================`);
console.log(`GRAND TOTAL: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log(`==================================================\n`);

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
