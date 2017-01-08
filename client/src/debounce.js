export default (fn, duration) => {
  let timeout = null;

  return () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(fn, duration);
  };
};
