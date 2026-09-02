const MAX_OUTPUT_BYTES = 700 * 1024;
const MAX_DIMENSION = 1200;
const MIN_QUALITY = 0.55;

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The selected image could not be read.'));
    img.src = dataUrl;
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('The selected image could not be read.'));
    };
    reader.onerror = () => reject(new Error('The selected image could not be read.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts uploaded raster images to a compact WebP data URL before they are
 * placed in JSON requests. This prevents large base64 payloads from reaching
 * the Netlify function request-body limit while keeping good visual quality.
 * Small SVG files are preserved because rasterizing them can remove vector
 * quality/transparency characteristics.
 */
export async function prepareUploadedImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file.');
  }

  if (file.type === 'image/svg+xml') {
    if (file.size > MAX_OUTPUT_BYTES) {
      throw new Error('SVG image is too large. Please use an SVG under 700KB.');
    }
    return readAsDataUrl(file);
  }

  const source = await readAsDataUrl(file);
  const img = await loadImage(source);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
  const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not prepare the image.');

  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.82;
  let output = canvas.toDataURL('image/webp', quality);

  while (output.length * 0.75 > MAX_OUTPUT_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - 0.07);
    output = canvas.toDataURL('image/webp', quality);
  }

  if (output.length * 0.75 > MAX_OUTPUT_BYTES) {
    throw new Error('Image could not be compressed below 700KB. Please choose a smaller image.');
  }

  return output;
}
