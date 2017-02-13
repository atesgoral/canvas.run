<template>
  <router-view></router-view>
</template>

<script>
import { mapActions, mapMutations } from 'vuex';

export default {
  methods: {
    ...mapActions([
      'fetchSession'
    ]),
    ...mapMutations([
      'updateSettings'
    ]),
    loadSettings() {
      try {
        const settings = JSON.parse(localStorage.getItem('settings'));
        this.updateSettings(settings);
      } catch (e) {}
    }
  },
  created() {
    this.loadSettings();
    this.fetchSession();
  }
};
</script>
