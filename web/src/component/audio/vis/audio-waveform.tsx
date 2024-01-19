import React, { useEffect, useRef } from "react";
import { MaybeFloat32Array } from "../audio-datatypes";

let WIDTH = 600;
let HEIGHT = 100;
let AUDIO_SAMPLE_RATE = 44100;

interface Props {
  sampleData: MaybeFloat32Array; // raw samples
  originalLength: number;
  currentPlaybackPos: number | null; // playback position (0-1)
  currentOTWPos: number; // OTW position (0-1)
  windowSize: number | null; // in samples
  markers: number[] | null; // in seconds
}

export const WaveformVisualizer = (props: Props) => {
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const nowbarCanvasRef = useRef<HTMLCanvasElement>(null);

  // WAVEFORM + MARKERS
  useEffect(() => {
    const waveformCanvas = waveformCanvasRef.current;

    if (waveformCanvas) {
      let context = waveformCanvas.getContext("2d")!;

      if (props.sampleData == null) {
        context.clearRect(0, 0, WIDTH, HEIGHT);
        context.fillStyle = "#dddddd";
        context.beginPath();
        context.fillRect(0, 0, WIDTH, HEIGHT);

        context.fillStyle = "#444444";
        context.font = "14px sans-serif";
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.fillText("no reference audio uploaded", WIDTH / 2, HEIGHT / 2);
      } else {
        // windowing calculations (all in "downsampled" coordinates)
        var startVizSample: number;
        var endVizSample: number;
        var vizSliceWidth: number;
        const downsampledLength = props.sampleData.length;

        if (props.windowSize) {
          var scrollFocus: number | null =
            props.currentOTWPos != 0 ? props.currentOTWPos : props.currentPlaybackPos;

          if (scrollFocus) {
            let currentFocusPosInSamples = Math.floor(scrollFocus * downsampledLength);

            startVizSample =
              Math.floor(currentFocusPosInSamples / props.windowSize) * props.windowSize;
          } else {
            startVizSample = 0;
          }
          endVizSample = startVizSample + props.windowSize;
          vizSliceWidth = WIDTH / props.windowSize;
        } else {
          startVizSample = 0;
          endVizSample = downsampledLength;
          vizSliceWidth = WIDTH / downsampledLength;
        }

        context.lineWidth = 1;
        context.strokeStyle = "#000000";
        context.clearRect(0, 0, WIDTH, HEIGHT);
        context.beginPath();
        context.moveTo(0, HEIGHT / 2);

        let x = 0;
        for (const sample of Array.from(
          props.sampleData.slice(startVizSample, endVizSample),
        )) {
          let pos_y = (sample * HEIGHT) / 2 + HEIGHT / 2;
          context.lineTo(x, pos_y);
          x += vizSliceWidth;
        }
        context.lineTo(x, HEIGHT / 2);
        context.stroke();

        // MARKERS
        if (props.markers != null) {
          for (const marker of props.markers) {
            context.lineWidth = 4;
            context.strokeStyle = "#00DDAA";
            context.beginPath();
            if (props.windowSize == null) {
              const xpos = (marker / props.originalLength) * WIDTH;
              context.moveTo(xpos, HEIGHT / 4);
              context.lineTo(xpos, (HEIGHT * 3) / 4);
            } else {
              const downsamplingRatio = props.originalLength / downsampledLength;
              if (
                marker * AUDIO_SAMPLE_RATE >= startVizSample * downsamplingRatio &&
                marker * AUDIO_SAMPLE_RATE < endVizSample * downsamplingRatio
              ) {
                const xpos =
                  (((marker / downsamplingRatio) * AUDIO_SAMPLE_RATE - startVizSample) /
                    props.windowSize) *
                  WIDTH;
                context.moveTo(xpos, HEIGHT / 4);
                context.lineTo(xpos, (HEIGHT * 3) / 4);
              }
            }

            context.stroke();
          }
        }
      }
    }
  }, [props.currentPlaybackPos, props.currentOTWPos, props.sampleData, props.markers]);

  // PLAYBACK BAR
  useEffect(() => {
    const playBarCanvas = nowbarCanvasRef.current;

    if (playBarCanvas) {
      let context = playBarCanvas.getContext("2d")!;
      context.clearRect(0, 0, WIDTH, HEIGHT);

      if (props.sampleData) {
        // Draw playback line
        if (props.currentPlaybackPos) {
          let x: number;
          if (props.windowSize) {
            x = Math.floor(
              (((props.currentPlaybackPos * props.sampleData.length) % props.windowSize) /
                props.windowSize) *
                WIDTH,
            );
          } else {
            x = Math.floor(props.currentPlaybackPos * WIDTH);
          }

          context.lineWidth = 2;
          context.strokeStyle = "#dd0000";
          context.beginPath();
          context.moveTo(x, 0);
          context.lineTo(x, HEIGHT);
          context.stroke();
        }

        // Draw OTW line
        if (props.currentOTWPos) {
          let x: number;
          if (props.windowSize) {
            x = Math.floor(
              (((props.currentOTWPos * props.sampleData.length) % props.windowSize) /
                props.windowSize) *
                WIDTH,
            );
          } else {
            x = Math.floor(props.currentOTWPos * WIDTH);
          }

          context.lineWidth = 2;
          context.strokeStyle = "#0000dd";
          context.beginPath();
          context.moveTo(x, 0);
          context.lineTo(x, HEIGHT);
          context.stroke();
        }
      } else {
        // no playback position; don't draw playback bar
        context.clearRect(0, 0, WIDTH, HEIGHT);
      }
    }
  }, [props.currentPlaybackPos, props.currentOTWPos]);

  return (
    <div className='layered-canvas-wrapper mx-auto' style={{ width: WIDTH, height: HEIGHT }}>
      <canvas width={WIDTH} height={HEIGHT} ref={waveformCanvasRef} />
      <canvas width={WIDTH} height={HEIGHT} ref={nowbarCanvasRef} />
    </div>
  );
};
