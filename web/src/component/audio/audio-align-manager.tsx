import React, { Component, useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import {
  setPyodideReferenceAudio,
  setPyodideAnnotations,
  getRefAudioDirectoryName,
  getCurrentOTWPosition,
} from "../../pyodide/pyodide-manager";
import JSZip from "jszip";
import { WaveformVisualizer } from "./vis/audio-waveform";
import { readAudioSamples } from "../../pyodide/pyodide-data-helper";
import { downsampleAudio } from "./vis/audio-downsampler";

var audioPlaybackElement: HTMLAudioElement | null;

const N_VIS_SAMPLES = 2000;

export const AudioAlignmentManager = () => {
  const [isRefPreviewing, setIsRefPreviewing] = useState<Boolean>(false);
  const [refAudioBufferURL, setRefAudioBufferURL] = useState<string>(); // for Pyodide / OTW
  const [refAudioSamples, setRefAudioSamples] = useState<Float32Array>(); // raw samples for viz
  const [refAudioLength, setRefAudioLength] = useState<number>(0); // for viz

  const [annotationData, setAnnotationData] = useState<number[] | null>(null);

  const [playbackPos, setPlaybackPos] = useState<number | null>(null);
  const [OTWPos, setOTWPos] = useState<number>(0);

  // Handle uploading new reference audio file
  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files != null) {
      if (e.target.files[0]) {
        const audioURL = URL.createObjectURL(e.target.files[0]);

        // zip it up and send it to Pyodide
        const zip = new JSZip();
        const audioDir: any = zip.folder(getRefAudioDirectoryName());
        audioDir.file("user_uploaded_reference.wav", e.target.files[0]);
        zip.generateAsync({ type: "blob" }).then(async (fileBlob: Blob) => {
          console.log("sending compressed file data to Pyodide");
          setPyodideReferenceAudio(URL.createObjectURL(fileBlob));
        });

        // store url for previewing
        setRefAudioBufferURL(audioURL);

        // store samples for visualization
        await readAudioSamples(audioURL).then(samples => {
          let extractedSamples = downsampleAudio(samples, N_VIS_SAMPLES);
          setRefAudioSamples(extractedSamples);
          setRefAudioLength(samples.length);
          console.log("received and decimated sample data");
        });
      }
    }
  };

  // Reference audio previewing
  useEffect(() => {
    if (audioPlaybackElement) {
      audioPlaybackElement.pause();
      audioPlaybackElement = null;
      setIsRefPreviewing(false);
    }
    if (refAudioBufferURL) {
      audioPlaybackElement = new Audio(refAudioBufferURL);
      audioPlaybackElement.onended = () => {
        setIsRefPreviewing(false);
      };
    }
  }, [refAudioBufferURL]);

  const handlePreviewButtonClick = () => {
    if (audioPlaybackElement != null) {
      if (isRefPreviewing === false) {
        audioPlaybackElement.play();
        setIsRefPreviewing(true);
      } else {
        audioPlaybackElement.pause();
        audioPlaybackElement.currentTime = 0;
        setIsRefPreviewing(false);
      }
    } else {
      console.warn("tried to play reference audio but none uploaded");
    }
  };

  useInterval(() => {
    setPlaybackPos(
      audioPlaybackElement && isRefPreviewing
        ? audioPlaybackElement.currentTime / audioPlaybackElement.duration
        : null,
    );

    setOTWPos(getCurrentOTWPosition());
  }, 50);

  // Handle annotation file upload
  const uploadAnnotation = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("uploaded annotation file");
    if (e.target.files != null) {
      console.log("trying to read annotation file");

      // Extract data from CSV
      const reader = new FileReader();
      reader.onload = (fileContents: ProgressEvent<FileReader>) => {
        if (fileContents.target && typeof fileContents.target.result == "string") {
          console.log("read annotation file");
          const extractedData = fileContents.target.result.split("\n").map(Number);
          setAnnotationData(extractedData);
          setPyodideAnnotations(extractedData);
        }
      };

      reader.readAsText(e.target.files[0]);
    }
  };

  return (
    <div className='mb-3'>
      <p className='mb-2'>Upload a .wav reference audio file:</p>
      <input
        className='form-control w-50 mx-auto mb-3'
        type='file'
        accept='.wav, .wave'
        onChange={uploadFile}
      />

      <p className='mb-2'>Upload a .csv annotation file (optional)</p>
      <input
        className='form-control w-50 mx-auto mb-3'
        type='file'
        accept='.csv'
        onChange={uploadAnnotation}
      />

      <div className='my-3'>
        <WaveformVisualizer
          sampleData={refAudioSamples ? refAudioSamples : null}
          originalLength={refAudioLength}
          currentPlaybackPos={playbackPos}
          currentOTWPos={OTWPos}
          windowSize={300}
          markers={annotationData}
        />
        {refAudioBufferURL != null ? (
          <div>
            <Button variant='secondary' className='m-3' onClick={handlePreviewButtonClick}>
              {isRefPreviewing ? "stop preview" : "play preview"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// utility React hook to make something happen on an interval
function useInterval(callback: () => void, delay: number) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    function tick() {
      const callback = savedCallback.current;
      callback && callback();
    }

    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
