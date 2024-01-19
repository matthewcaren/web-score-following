import * as React from "react";
import ProgressBar from "react-bootstrap/ProgressBar";

interface Props {
  val: number;
  label: string;
  color: string;
}

export const StatusMonitor = (props: Props) => {
  return (
    <div className='d-flex w-100 my-2'>
      <div className='w-25'>
        <p className='my-auto'>{props.label}</p>
      </div>
      <div className='w-75 my-auto'>
        <ProgressBar variant={props.color} now={props.val} />
      </div>
    </div>
  );
};
