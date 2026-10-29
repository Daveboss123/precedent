/** Turn a chosen photo into a small square JPEG before it leaves the browser. */

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const CANVAS_SIZE = 640;
const MAX_DATA_URL_LENGTH = 260_000;

async function loadPhoto(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // Safari can refuse some formats here; the image element below is wider.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('That photo could not be read.'));
      image.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function itemImageFromFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose a photo file.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('That photo is too large. Choose one under 15 MB.');
  }

  const source = await loadPhoto(file);
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser could not prepare the photo.');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const inset = 40;
  const scale = Math.min(
    (CANVAS_SIZE - inset * 2) / source.width,
    (CANVAS_SIZE - inset * 2) / source.height,
  );
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  context.drawImage(
    source,
    Math.round((CANVAS_SIZE - width) / 2),
    Math.round((CANVAS_SIZE - height) / 2),
    width,
    height,
  );
  if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
    source.close();
  }

  let quality = 0.84;
  let data = canvas.toDataURL('image/jpeg', quality);
  while (data.length > MAX_DATA_URL_LENGTH && quality > 0.5) {
    quality -= 0.08;
    data = canvas.toDataURL('image/jpeg', quality);
  }

  if (data.length > MAX_DATA_URL_LENGTH) {
    throw new Error('That photo is still too large. Try a smaller one.');
  }

  return data;
}
