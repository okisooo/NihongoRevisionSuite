import { realpath } from 'node:fs/promises';
import process from 'node:process';

// Capacitor replaces its public directory, which would remove an output junction.
if (process.platform === 'win32' && !/^s:[\\/]/i.test(await realpath(process.cwd()))) {
  throw new Error('Run the full iOS sync in a project copy on S: or on the cloud Mac. See docs/IOS.md.');
}
