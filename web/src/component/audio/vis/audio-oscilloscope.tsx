import React, { Component } from "react";

interface Props {
  data: Float32Array;
}

export const OscilloscopeVisualizer = (props: Props) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const canvas = canvasRef.current;

  if (canvas) {
    const height = canvas.height;
    const width = canvas.width;
    const context = canvas.getContext("2d")!;
    let x = 0;
    const sliceWidth = (width * 1.0) / props.data.length;

    context.lineWidth = 2;
    context.strokeStyle = "#ffffff";
    context.clearRect(0, 0, width, height);

    context.beginPath();
    context.moveTo(0, height / 2);
    for (const item of Array.from(props.data)) {
      const y = (item * height) / 2 + height / 2;
      context.lineTo(x, y);
      x += sliceWidth;
    }
    context.lineTo(x, height / 2);
    context.stroke();
  }

  return <canvas width='300' height='150' ref={canvasRef} />;
};
