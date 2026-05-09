import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { generateTimestampedFilename } from '../../utils/file';

export class StorageService {
  private static readonly UPLOAD_DIR = 'uploads';

  /**
   * Uploads a file to the storage.
   * @param file The file to upload (Blob/File)
   * @param userId The user ID from JWT
   * @param modelName The target entity name
   * @param isPublic Whether the file should be stored in the common folder
   * @returns Object containing file_path and file_size
   */
  static async upload(file: File, userId: string, modelName: string, isPublic: boolean = false) {
    const filename = generateTimestampedFilename(file.name);
    // Use 'common' if public, otherwise use userId
    const parentFolder = isPublic ? 'common' : userId;
    
    // Path relative to the UPLOAD_DIR
    const relativePath = join(parentFolder, modelName, filename);
    // Absolute path on the server
    const absolutePath = join(process.cwd(), this.UPLOAD_DIR, relativePath);
    // Directory path to ensure it exists
    const directory = join(process.cwd(), this.UPLOAD_DIR, parentFolder, modelName);

    // Ensure directory exists recursively
    mkdirSync(directory, { recursive: true });

    // Write file using Bun.write for maximum efficiency
    const bytes = await file.arrayBuffer();
    await Bun.write(absolutePath, bytes);

    return {
      file_path: relativePath.replace(/\\/g, '/'), // Ensure forward slashes for URLs
      file_size: file.size,
    };
  }
}
