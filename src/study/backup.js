import { Capacitor } from '@capacitor/core';

export async function exportBackup(data) {
  const name = `study-progress-${new Date().toISOString().slice(0, 10)}.json`;
  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'), import('@capacitor/share'),
    ]);
    const { uri } = await Filesystem.writeFile({
      path: name, data, directory: Directory.Cache, encoding: Encoding.UTF8,
    });
    await Share.share({ title: 'revision backup', files: [uri] });
    return;
  }
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  // Allow the browser to start reading the blob before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
