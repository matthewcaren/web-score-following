import React, { Component } from "react";
import { AudioInputManager } from "./audio-input-manager";
import { AudioAlignmentManager } from "./audio-align-manager";
import { Button, Spinner } from "react-bootstrap";

import { initPython } from "../../pyodide/pyodide-manager";

type pyodideStatus = "loading" | "ready";

export const AudioWrapper = () => {
  const [liveAudioStream, setLiveAudioStream] = React.useState<MediaStream>();
  const [status, setStatus] = React.useState<pyodideStatus>("loading");

  // Pyodide audio preprocessing / setup
  React.useEffect(() => {
    const load = async () => {
      const { isPyodide } = await initPython();
      if (isPyodide) setStatus("ready");
    };
    load();
  }, []);

  // Connect to browser microphone audio stream
  const getMicrophone = async () => {
    const audio = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    setLiveAudioStream(audio);
  };

  const stopMicrophone = () => {
    liveAudioStream!.getTracks().forEach(track => track.stop());
    setLiveAudioStream(undefined);
  };

  const toggleMicrophone = () => {
    if (liveAudioStream) {
      stopMicrophone();
    } else {
      getMicrophone();
    }
  };

  return (
    <div className='p-3'>
      <div className='controls'>
        {status == "ready" ? (
          <div className='w-100 mx-auto mb-3'>
            <AudioAlignmentManager />
            <hr className='hr my-4' />
            <Button variant={liveAudioStream ? "dark" : "danger"} onClick={toggleMicrophone}>
              {liveAudioStream ? "stop autopilot system" : "enable autopilot system"}
            </Button>
          </div>
        ) : (
          <div>
            <p className='text-secondary'>
              <Spinner as='span' animation='grow' size='sm' role='status' aria-hidden='true' />
              {"  "}
              loading pyodide...
            </p>
          </div>
        )}
      </div>
      {liveAudioStream ? <AudioInputManager liveAudioStream={liveAudioStream} /> : ""}
    </div>
  );
};
