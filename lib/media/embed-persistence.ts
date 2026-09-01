export type ExternalEmbedPersistenceDependencies<TStoredFile> = {
  findStoredFile: () => Promise<TStoredFile | null>;
  createStoredFile: () => Promise<TStoredFile>;
  recoverStoredFile: () => Promise<TStoredFile | null>;
  persistMedia: (storedFile: TStoredFile) => Promise<void>;
  compensateStoredFile: (storedFile: TStoredFile) => Promise<void>;
  isUniqueConflict: (error: unknown) => boolean;
};

/**
 * Coordinates the two existing media stores without pretending they share a
 * transaction. Stable IDs make retries idempotent; a newly-created inventory
 * row is compensated when the website document cannot be persisted.
 */
export async function persistExternalEmbedRecord<TStoredFile>(
  dependencies: ExternalEmbedPersistenceDependencies<TStoredFile>,
) {
  let storedFile = await dependencies.findStoredFile();
  let storedFileCreated = false;

  if (!storedFile) {
    try {
      storedFile = await dependencies.createStoredFile();
      storedFileCreated = true;
    } catch (error) {
      if (!dependencies.isUniqueConflict(error)) throw error;
      storedFile = await dependencies.recoverStoredFile();
      if (!storedFile) throw error;
    }
  }

  try {
    await dependencies.persistMedia(storedFile);
  } catch (error) {
    if (storedFileCreated) {
      await dependencies.compensateStoredFile(storedFile).catch(() => undefined);
    }
    throw error;
  }

  return { storedFile, storedFileCreated };
}
