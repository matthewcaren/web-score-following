import * as React from 'react';
import { initPython } from './pyodide-manager';

type status = 'loading' | 'ready';

export const PyodideComponent = () => {
  const [status, setStatus] = React.useState<status>('loading');
  const [refLen, setRefLen] = React.useState(0);

  React.useEffect(() => {
    const load = async () => {
      const {isPyodide, refLength} = await initPython();
      if (isPyodide) setStatus('ready');
      setRefLen(refLength)
    };
    load();
  }, []);


  return (
    <div>
      <p>{`Pyodide status: ${status}`}</p>
    </div>
  );
};
