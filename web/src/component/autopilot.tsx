import * as React from "react";
import { AudioWrapper } from "./audio/audio-wrapper";

export const Autopilot = () => {
  const [source, setSource] = React.useState("none");
  const setNewAudioSource = (event: React.MouseEvent<HTMLElement>, src: string) => {
    setSource(src);
  };

  return (
    <>
      <p className='h3'>autopilot</p>
      <div className='d-flex justify-content-around w-75 p-1 border border-dark'>
        <div className='w-100 p-3 m-2 bg-white'>
          <div className='d-flex justify-content-around'></div>
          <AudioWrapper />
        </div>
      </div>
    </>
  );
};
