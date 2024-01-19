import * as React from 'react';

interface Props {
  source: string;
}

export const InputStatusReadout = (props: Props) => {
  return (
    <p className='my-auto m-2'>
      <b>Current input:</b> {props.source}
    </p>
  );
};
