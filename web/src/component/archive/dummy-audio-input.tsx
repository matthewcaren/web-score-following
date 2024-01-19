import * as React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';

interface Props {
  source: string;
  ClickHandler: (event: React.MouseEvent<HTMLElement>, val: string) => void;
}

export const AudioInput = (props: Props) => {
  return (
    <Dropdown className='m-2'>
      <Dropdown.Toggle variant='warning' id='dropdown-basic'>
        change source
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item onClick={e => props.ClickHandler(e, 'built-in')}>
          built-in microphone
        </Dropdown.Item>
        <Dropdown.Item onClick={e => props.ClickHandler(e, 'external')}>
          external source
        </Dropdown.Item>
        <Dropdown.Item onClick={e => props.ClickHandler(e, 'BT')}>
          bluetooth stream
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};
