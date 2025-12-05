export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = new Set<string>([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
]);

export function uploadFileCancelable(
  file: File,
  onProgress: (p: number) => void,
): { promise: Promise<{ url: string }>; cancel: () => void } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      promise: Promise.reject(new Error('File exceeds size limit')),
      cancel: () => {},
    };
  }
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      promise: Promise.reject(new Error('Unsupported file type')),
      cancel: () => {},
    };
  }
  let canceled = false;
  let timer: any;
  const promise = new Promise<{ url: string }>((resolve, reject) => {
    let p = 0;
    const step = Math.min(15 + Math.random() * 25, 40);
    timer = setInterval(() => {
      if (canceled) {
        clearInterval(timer);
        reject(new Error('Upload canceled'));
        return;
      }
      p = Math.min(100, p + step);
      onProgress(Math.round(p));
      if (p >= 100) {
        clearInterval(timer);
        try {
          const url = URL.createObjectURL(file);
          resolve({ url });
        } catch (e) {
          reject(new Error('Preview failed'));
        }
      }
    }, 200);
  });
  const cancel = () => {
    canceled = true;
    if (timer) clearInterval(timer);
  };
  return { promise, cancel };
}

export function uploadFile(file: File, onProgress: (p: number) => void): Promise<{ url: string }> {
  return uploadFileCancelable(file, onProgress).promise;
}
