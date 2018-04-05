import React from 'react';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function Never() {
  // Throws a promise that resolves after some arbitrarily large
  // number of seconds. The idea is that this component will never
  // resolve. It's always wrapped by a Timeout.
  throw delay(10000);
}

function Delay({ms}) {
  return (
    <React.Timeout ms={ms}>
      {didTimeout => {
        if (didTimeout) {
          // Once ms has elapsed, render null. This allows the rest of the
          // tree to resume rendering.
          return null;
        }
        return <Never />;
      }}
    </React.Timeout>
  );
}

export default Delay;
