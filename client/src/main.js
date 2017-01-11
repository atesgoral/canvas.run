// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'

function containsNode(parent, node) {
  let needle = node;

  while (needle) {
    if (needle === parent) {
      return true;
    }

    needle = needle.parentNode;
  }

  return false;
}

Vue.directive('deep-blur', {
  bind: function (el, binding) {
    function onBlur(event) {
      if (!containsNode(el, event.relatedTarget)) {
        binding.value();
      }
    }

    el.addEventListener('blur', onBlur, true);
  }
});

/* eslint-disable no-new */
new Vue({
  el: 'body',
  render: h => h(App)
})
