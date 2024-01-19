import React, { Component } from "react";
import { OscilloscopeVisualizer } from "./vis/audio-oscilloscope";
import { AudioBuffer } from "./audio-datatypes";
import { passBufferToPython, resetPython } from "../../pyodide/pyodide-manager";
import { StatusMonitor } from "../status-monitor";
import Button from "react-bootstrap/Button";

let audioContext: AudioContext;
let source: MediaStreamAudioSourceNode;
let analyser: AnalyserNode;
let audioBuf: AudioBuffer; // AudioBuffer is a Float32Array wrapper
let audioRequestIntervalID: ReturnType<typeof setInterval>;
const audioAnalysisRate = 84; // in ms, this is hop size 3686 @ 44.1k input
const BUFFER_SIZE = 2 * 8192; // 2*size (samples) of each audio buffer request

let lastSampleCountTime: number;
let samplesSoFar: number;

interface Props {
  liveAudioStream: MediaStream;
}

export const AudioInputManager = (props: Props) => {
  const [audioData, setAudioData] = React.useState(new AudioBuffer(0));
  const [refPos, setPos] = React.useState(0);
  const [audioFrameRate, setAudioFrameRate] = React.useState(10);

  const [runningOTW, setRunningOTW] = React.useState(false);
  const [otwStatus, setOTWStatus] = React.useState("ready");

  // start audio requests
  React.useEffect(() => {
    audioContext = new window.AudioContext({ sampleRate: 44100 });
    console.log("sample rate: " + audioContext.sampleRate);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = BUFFER_SIZE;
    source = audioContext.createMediaStreamSource(props.liveAudioStream);
    source.connect(analyser);
    audioRequestIntervalID = setInterval(updateAudioPassive, audioAnalysisRate);

    lastSampleCountTime = Date.now();
    samplesSoFar = 1;

    return () => {
      clearInterval(audioRequestIntervalID);
      analyser.disconnect();
      source.disconnect();
    };
  }, []);

  // update display without sending audio input stream to OTW
  const updateAudioPassive = () => {
    audioBuf = new AudioBuffer(analyser.frequencyBinCount);
    analyser.getFloatTimeDomainData(audioBuf.dataArray);

    setAudioData(audioBuf);
    samplesSoFar += 1;

    // keep track of audio FPS
    if (Date.now() - lastSampleCountTime > 1000) {
      setAudioFrameRate(samplesSoFar);
      samplesSoFar = 1;
      lastSampleCountTime = Date.now();
    }
  };

  // update display and send audio input stream to OTW
  const updateAudioActive = () => {
    audioBuf = new AudioBuffer(analyser.frequencyBinCount);
    analyser.getFloatTimeDomainData(audioBuf.dataArray);
    let now = audioContext.currentTime;

    let newPosition = passBufferToPython(audioBuf.dataArray);
    setPos(newPosition);

    // send to Pyodide!
    setAudioData(audioBuf);
    samplesSoFar += 1;

    // keep track of audio FPS
    if (Date.now() - lastSampleCountTime > 1000) {
      setAudioFrameRate(samplesSoFar);
      samplesSoFar = 1;
      lastSampleCountTime = Date.now();
    }
  };

  const toggleOTW = () => {
    clearInterval(audioRequestIntervalID);
    if (runningOTW) {
      audioRequestIntervalID = setInterval(updateAudioPassive, audioAnalysisRate);
      setOTWStatus("paused");
    } else {
      audioRequestIntervalID = setInterval(updateAudioActive, audioAnalysisRate);
      setOTWStatus("active");
    }
    setRunningOTW(!runningOTW);
  };

  const resetOTW = async () => {
    if (runningOTW) {
      clearInterval(audioRequestIntervalID);
      audioRequestIntervalID = setInterval(updateAudioPassive, audioAnalysisRate);

      setOTWStatus("paused");
      setRunningOTW(false);
    }

    resetPython();
    setPos(0);
    setOTWStatus("ready");
  };

  return (
    <div>
      <div className='d-flex flex-row flex-fill mb-4 align-items-center'>
        <div className='p-2 m-1 bg-dark'>
          <OscilloscopeVisualizer data={audioData.dataArray} />
        </div>
        <div className='p-2 m-1 flex-fill'>
          <p className='h3 font-weight-bold my-0'>OTW</p>
          <p className='text-secondary small mb-2'>status: {otwStatus}</p>
          <Button variant='danger' className='mx-1' onClick={toggleOTW}>
            {runningOTW ? "pause piece" : "start piece"}
          </Button>
          <Button variant='dark' className='mx-1' onClick={resetOTW}>
            reset
          </Button>
        </div>
      </div>
      <StatusMonitor
        label={"piece progress: " + (refPos * 100).toFixed(1) + "%"}
        val={refPos * 100}
        color='danger'
      />
      <StatusMonitor
        label={"audio FPS: " + audioFrameRate}
        val={audioFrameRate}
        color='dark'
      />
    </div>
  );
};
