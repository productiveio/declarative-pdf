// eslint-disable-next-line @typescript-eslint/no-var-requires
const { execSync } = require('child_process');

try {
  // Try to import canvas
  require('canvas');

  // console.log('Canvas is compiled against the current Node.js version');
} catch (error) {
  if (
    error.message.includes('was compiled against a different Node.js version')
  ) {
    console.log(
      'Canvas is compiled against a different Node.js version. Rebuilding...'
    );
    execSync('npm rebuild canvas', { stdio: 'inherit' });
  } else if (error.message.includes('Cannot find module')) {
    console.log('Skipping canvas check. Module not found.');
  } else {
    throw error;
  }
}
