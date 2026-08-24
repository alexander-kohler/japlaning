/** Resize & compress a photo for stamp storage (JPEG base64). */
export async function compressStampImage(
	file: File,
	options: { maxEdge?: number; quality?: number } = {}
): Promise<{ mime: string; data: string }> {
	const maxEdge = options.maxEdge ?? 1280;
	const quality = options.quality ?? 0.72;

	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
	const width = Math.max(1, Math.round(bitmap.width * scale));
	const height = Math.max(1, Math.round(bitmap.height * scale));

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		bitmap.close();
		throw new Error('Could not prepare image canvas');
	}
	ctx.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();

	const blob = await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(result) => {
				if (result) resolve(result);
				else reject(new Error('Image compression failed'));
			},
			'image/jpeg',
			quality
		);
	});

	const buffer = await blob.arrayBuffer();
	const bytes = new Uint8Array(buffer);
	let binary = '';
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}

	return { mime: 'image/jpeg', data: btoa(binary) };
}
