import { runTestSuite } from './src/engine/engineTest';

const result = runTestSuite();
if (result.failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
