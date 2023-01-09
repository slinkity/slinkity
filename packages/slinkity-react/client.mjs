import React from 'react';
import ReactDOM from 'react-dom';

export default function client({ Component, target, props, isClientOnly }) {
  const element = React.createElement(Component, props);
  if (isClientOnly) {
    ReactDOM.render(element, target);
  } else {
    ReactDOM.hydrate(element, target);
  }
}
