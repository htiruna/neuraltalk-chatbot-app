import React, { FC } from 'react';

import Spinner from '../Spinner';

const Loading: FC = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-transparent">
      <Spinner className="text-black" size="2em" />
    </div>
  );
};

export default Loading;
