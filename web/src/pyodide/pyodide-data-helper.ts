import JSZip from "jszip";

// Utility functions for Pyodide/Emscripten FS management

/**
 * Logs contents of directory to console (non-recursive).
 *
 * @param pyodideTarget - target Pyodide instance
 * @param path - path to directory in Pyodide
 */
export const logDirectoryContents = (pyodideTarget: any, path: string) => {
  console.log(`contents of '${path}' directory:`, pyodideTarget.FS.readdir(path));
};

/**
 * Recursively deletes a directory and all of its contents.
 *
 * @param pyodideTarget - target Pyodide instance
 * @param path - path to directory in Pyodide to delete
 */
export const deleteDirectory = (pyodideTarget: any, path: string) => {
  pyodideTarget.FS.readdir(path).forEach((file: string) => {
    if (file != "." && file != "..") {
      let curPath = path.endsWith("/") ? path + file : path + "/" + file;
      let { mode, timestamp } = pyodideTarget.FS.lookupPath(curPath).node; // get mode bitmask for directory check

      // recurse
      if (pyodideTarget.FS.isDir(mode)) {
        deleteDirectory(pyodideTarget, curPath);
      } else {
        pyodideTarget.FS.unlink(curPath);
      }
    }
  });
  pyodideTarget.FS.rmdir(path);
};

/**
 * Reads a file from the Pyodide filesystem.
 *
 * @param pyodideTarget - target Pyodide instance
 * @param path - filepath to target file in Pyodide
 * @returns - binary contents of file
 */
export const readFile = (pyodideTarget: any, path: string) => {
  return pyodideTarget.FS.readFile(path, { encoding: "binary" });
};

/**
 * Uploads a file to the Pyodide filesystem.
 *
 * WARNING: if a directory already exists with name destinationDir, its contents will be deleted.
 *
 * @param pyodideTarget
 * @param file
 * @param destinationDir
 * @param filename
 */
export const uploadFile = (
  pyodideTarget: any,
  file: File,
  destinationDir: string,
  filename: string,
) => {
  // zip file to send to Pyodide
  const zip = new JSZip();
  const audioDir: any = zip.folder(destinationDir);
  audioDir.file(filename, file);
  zip.generateAsync({ type: "blob" }).then(async (content: Blob) => {
    deleteDirectory(pyodideTarget, destinationDir);
    unpackArchive(pyodideTarget, destinationDir, URL.createObjectURL(content), ".zip");
  });
};

/**
 * Unpacks an archive into the Pyodide filesystem and returns paths to files of desired filetype(s).
 *
 * @param pyodideTarget - target Pyodide instance
 * @param destinationPath - Pyodide directory to unpack archive into
 * @param archiveURL - URL to archive
 * @param archiveType - archive type: 'zip', 'bztar', 'gztar', 'tar', 'wheel'
 * @param targetArchiveFiletypes - filetype extensions to extract from archive (case insensitive)
 * @returns - array of filepaths to all files matching target types
 */
export const unpackArchive = async (
  pyodideTarget: any,
  destinationPath: string,
  archiveURL: string,
  archiveType: string = "zip",
  targetArchiveFiletypes: string[] = [],
) => {
  let archiveResponse = await fetch(archiveURL);
  let archiveBinary = await archiveResponse.arrayBuffer();
  pyodideTarget.unpackArchive(archiveBinary, archiveType);

  if (targetArchiveFiletypes.length != 0) {
    // find files that match target filetype
    let targetedFiles = pyodideTarget.FS.readdir(destinationPath).filter((filename: string) =>
      targetArchiveFiletypes.some((extension: string) =>
        filename.toLowerCase().endsWith(extension.toLowerCase()),
      ),
    );

    if (targetedFiles.length == 0) {
      // warn about potentially unexpected empty return array when no matches
      console.warn(
        `The referenced archive does not contain any files with extension(s) ${targetArchiveFiletypes.join(
          ",",
        )}. The archive has been unpacked into the destination but no filepaths will be returned.`,
      );
      return [];
    } else {
      return targetedFiles;
    }
  }

  return pyodideTarget.FS.readdir(destinationPath);
};

// ## AUDIO-SPECIFIC UTILITIES ##

/**
 * Read audio samples data from a file fetched from a url (i.e. user-uploaded audio)
 *
 * @param url - url to file
 * @param channel - audio channel to read (0) by default
 * @param sampleRate - 44.1k by default
 * @returns - Float32Array of audio samples
 */
export const readAudioSamples = async (
  url: string,
  channel: number = 0,
  sampleRate: number = 44100,
) => {
  let audioData = await fetch(url).then(r => r.arrayBuffer());
  let audioCtx = new AudioContext({ sampleRate: sampleRate });
  // audio is resampled to given sample rate
  let decodedData = await audioCtx.decodeAudioData(audioData);
  console.log({
    "length": decodedData.length,
    "duration": decodedData.duration,
    "sample rate": decodedData.sampleRate,
    "channels": decodedData.numberOfChannels}
  );
  return decodedData.getChannelData(channel);
};
