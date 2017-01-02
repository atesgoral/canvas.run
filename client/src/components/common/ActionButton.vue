<template>
  <button type="button" class="action-button" v-on:click="perform" v-bind:disabled="disabled || isPending">
    <slot></slot>
  </button>
</template>

<script>
export default {
  props: {
    action: Function,
    disabled: Boolean
  },
  data() {
    return {
      isPending: false
    };
  },
  methods: {
    perform() {
      this.isPending = true;

      this.action()
        .then(() => {
          this.isPending = false;
        })
        .catch((error) => {
          this.isPending = false;
          throw error;
        });
    }
  }
};
</script>
