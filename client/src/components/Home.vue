<template>
  <main class="home">
    <h1>Home</h1>
    <h2>Recent</h2>
    <ul class="_run-list">
      <li v-for="run in recentRunList">
        <router-link class="_thumbnail" :to="{ name: 'edit', params: { username: run.owner ? run.owner.profile.username : '', shortId: run.shortId } }"></router-link>
        <div v-if="run.owner">
          by <router-link :to="{ name: 'profile', params: { username: run.owner.profile.username } }">{{ run.owner.profile.displayName }}</router-link>
        </div>
      </li>
    </ul>
  </main>
</template>

<script>
export default {
  data() {
    return {
      topRunList: null,
      recentRunList: null
    };
  },
  created() {
    fetch('/api/runs/top')
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Could not fetch top runs');
        }
      })
      .then((topRunList) => {
        this.topRunList = topRunList;
      });

    fetch('/api/runs/recent')
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Could not fetch recent runs');
        }
      })
      .then((recentRunList) => {
        this.recentRunList = recentRunList;
      });
  }
};
</script>

<style lang="less">
@import 'common/colors';

.home {
  color: white;

  a {
    text-decoration: none;
    color: @accent5Color;
    opacity: .75;

    &:hover {
      opacity: 1;
    }
  }

  ._run-list {
    margin: 0;
    padding: 0;
    list-style-type: none;
    display: flex;
    margin: 0 -.5rem;

    > li {
      margin: 0 .5rem;

      > ._thumbnail {
        display: inline-block;
        width: 320px;
        height: 180px;
        border: 1px solid #888;
        background: #666;
      }
    }
  }
}
</style>
