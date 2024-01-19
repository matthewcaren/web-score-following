import { logDirectoryContents, deleteDirectory, unpackArchive } from "./pyodide-data-helper";

// the global pyodide instance. Make it any to avoid type checking
let pyodide: any = undefined;

// true when loading has been started.
let loading = false;

let alignBufferScript: string;

let REF_AUDIO_FILEPATH = "./refaudio/";

let current_otw_pos = 0;

// this gives us a way of accessing the pyodide loader (which was set in index.html, accessed via a <script> tag
declare global {
  interface Window {
    pyodideLoader: any;
  }
}

/** Initialize python, which can take a while.
 * Return true when fully initialized, or false if init is still in progress.
 */
export const initPython = async () => {
  let refLength = -1;

  // only load once, and never again.
  if (!loading) {
    loading = true;
    console.log("initPython");
    let tmp = await window.pyodideLoader();

    await tmp.loadPackage("numpy");
    tmp.runPython("import numpy as np");

    // load python script that processes live audio buffer
    alignBufferScript = await (await fetch("./python/otw-align-buffer.py")).text();

    // load libaudio and audio files into the python instance
    await tmp.runPythonAsync(`
      from pyodide.http import pyfetch
      response = await pyfetch("./python/libaudio_rt.zip")
      await response.unpack_archive()

      # response = await pyfetch("./wav/test-audio.zip")
      # await response.unpack_archive()
    `);

    tmp.runPython(await (await fetch("./python/otw-setup.py")).text());

    // make reference audio directory
    tmp.FS.mkdir(REF_AUDIO_FILEPATH);

    logDirectoryContents(tmp, ".");

    // only set pyodide when it is fully done loading and ready to go
    pyodide = tmp;
  }

  return { isPyodide: !!pyodide, refLength: refLength };
};

export const passBufferToPython = (buffer: Float32Array) => {
  if (pyodide) {
    pyodide.globals.set("samples_jsproxy", buffer);

    let result = pyodide.runPython(alignBufferScript);
    current_otw_pos = result;
    return result;
  }

  throw new Error("cannot accept live audio with no active pyodide/OTW instance");
};

export const resetPython = async () => {
  if (pyodide) {
    pyodide.runPython(await (await fetch("./python/otw-reset.py")).text());
  } else {
    console.warn("failed to reset; there is no OTW / Pyodide instance");
  }

  current_otw_pos = 0;
};

// Set reference audio (unpacks from zipped file), returns filepath
export const setPyodideReferenceAudio = async (referenceAudioURL: string) => {
  if (!pyodide) {
    console.warn("failed to set reference audio; there is no OTW / Pyodide instance");
  } else {
    deleteDirectory(pyodide, REF_AUDIO_FILEPATH);

    console.log("validating uploaded ref audio...");

    // handle cases where user uploads weird stuff
    let uploadedWAVs = await unpackArchive(
      pyodide,
      REF_AUDIO_FILEPATH,
      referenceAudioURL,
      "zip",
      ["wav", "wave", "WAV"],
    );

    if (uploadedWAVs.length == 0) {
      alert(
        "The ZIP file you uploaded does not contain a .wav file. Please upload a zip file containing a single .wav file.",
      );
    } else if (uploadedWAVs.length > 1) {
      alert(
        "The ZIP file you uploaded contains more than one .wav file. Please upload a zip file containing a single .wav file.",
      );
    } else {
      // received a ZIP with one .wav file
      let userWAVFilename = uploadedWAVs[0];

      await pyodide.runPythonAsync(`
        REF_FILEPATH = "${REF_AUDIO_FILEPATH + userWAVFilename}"
      `);

      let refSize = pyodide.runPython(await (await fetch("./python/otw-set-ref.py")).text());
      console.log("ref features length:", refSize);

      return REF_AUDIO_FILEPATH + userWAVFilename;
    }

    console.log("unzipped into", logDirectoryContents(pyodide, REF_AUDIO_FILEPATH));

    console.log("couldn't extract a .wav file from the uploaded zip.");
  }

  return null;
};

// Set reference markers (from user-uploaded CSV) in Pyodide scope
export const setPyodideAnnotations = async (markers: number[]) => {
  if (!pyodide) {
    console.warn(
      "failed to set failed to set reference audio; there is no OTW / Pyodide instance",
    );
  } else {
    pyodide.globals.set("reference_annotations", markers);

    await pyodide.runPythonAsync(`
    annotations = [a for a in reference_annotations]
  `);
  }
};

export const getCurrentOTWPosition = () => {
  return current_otw_pos;
};

export const getRefAudioDirectoryName = () => {
  return REF_AUDIO_FILEPATH;
};
