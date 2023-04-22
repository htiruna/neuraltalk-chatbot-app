import React, { FC } from 'react';

import Spinner from '../Spinner';

const Loading: FC = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-transparent">
      <Spinner className="text-white" size="2em" />
    </div>
  );
};

export default Loading;
