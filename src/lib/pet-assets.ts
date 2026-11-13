/** Share preparation across requests; failures remain retryable. No speculative loads. */
export function createPetAssetCache(prepare: (src: string) => Promise<void>) {
  const pending = new Map<string, Promise<void>>();
  return {
    load(src: string): Promise<void> {
      const existing = pending.get(src);
      if (existing) return existing;
      const task = Promise.resolve().then(() => prepare(src)).catch(error => {
        pending.delete(src);
        throw error;
      });
      pending.set(src, task);
      return task;
    },
  };
}

/** Call from effects, never during rendering. Decode before replacing the visible src. */
export function preparePetImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    const finish = (error?: unknown) => {
      image.onload = null;
      image.onerror = null;
      if (error) reject(error);
      else resolve();
    };
    image.onload = () => { image.decode().then(() => finish(), finish); };
    image.onerror = () => finish(new Error(`Unable to load pet image: ${src}`));
    image.src = src;
  });
}
