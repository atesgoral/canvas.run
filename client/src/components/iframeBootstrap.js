export default () => {
  window.notifyParent = (type, data) => {
    parent.postMessage({ type, data }, '*');
  };

  window.onMessage = (e) => {
    if (e.data.type === 'RUNTIME') {
      eval(`(${e.data.data})()`);
    }
  };

  addEventListener('message', (e) => {
    onMessage(e);
  });

  notifyParent('IFRAME_READY');
}
