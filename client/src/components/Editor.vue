<template>
  <body>
    <header>
      <h1><a href="/">CanvasRun</a></h1>
      <span v-if="run">
        <button type="button" class="_tool" title="Ctrl + Enter" v-bind:class="isRunning ? '-accent-1' : '-accent-3'" v-on:click="toggleAnimation">{{ isRunning ? 'Stop' : 'Start' }}</button>
        <action-button class="_tool -accent-3" v-if="!run.shortId" v-bind:action="save" v-bind:disabled="!run.isDirty">Save</action-button>
        <!--button type="button" class="_tool -accent-2" v-on:click="showSettings">Settings</button-->
        <action-button class="_tool -accent-3" v-if="session.user &amp;&amp; run.owner &amp;&amp; session.user.id === run.owner.id" v-bind:action="update" v-bind:disabled="!run.isDirty">Update</action-button>
        <action-button class="_tool -accent-3 -anon" v-if="!session.user &amp;&amp; !run.owner &amp;&amp; run.owningSession === session.id" v-bind:action="update" v-bind:disabled="!run.isDirty">Update</action-button>
        <span class="_gap"></span>
        <action-button class="_tool -accent-4" v-if="runLikes" v-bind:action="toggleLike" v-bind:disabled="!session.user">{{ runLikes.isLikedByUser ? 'Unlike' : 'Like' }} ({{ runLikes.likeCount }})</action-button>
        <action-button class="_tool -accent-4" v-if="run.shortId" v-bind:action="fork">Fork</action-button>
        <span class="_gap"></span>
        <button type="button" class="_tool -accent-2" v-on:click="toggleLayout">Toggle Layout</button>
      </span>
      <span class="_right-aligned" v-if="!isLoading">
        <button type="button" class="_profile" v-on:click="profileDropdown.toggle" v-deep-blur="profileDropdown.close" v-if="session.user">
          <span class="_picture" v-bind:style="{ backgroundImage: `url(${session.user.profile.pictureUrl})` }"></span>
          <span class="_display-name">{{ session.user.profile.displayName }}</span>
          <dropdown class="_profile-dropdown" v-if="profileDropdown.isOpen" v-bind:dropdown="profileDropdown">
            <button type="button" class="-accent-2" v-on:click.stop="showProfile">Update Profile</button>
            <button type="button" class="-accent-1" v-on:click="signOut">Sign out</button>
          </dropdown>
        </button>
        <button type="button" class="_tool -accent-3" v-on:click="signIn" v-if="!session.user">Sign in</button>
      </span>
    </header>
    <status v-bind:status="status"></status>
    <main v-bind:class="{ '-horizontal-split': settings.isLayoutHorizontal }">
      <editor-pane
        ref="editorPane"
        v-bind:style="{ flexBasis: settings.splitterPercentage + '%' }"
        v-bind:source="editorSource"
        v-on:sourceUpdate="handleEditorSourceUpdate"
        v-on:syntaxError="handleEditorSyntaxError"></editor-pane>
      <splitter
        v-bind:is-horizontal="settings.isLayoutHorizontal"
        v-on:drag="handleSplitterDrag"></splitter>
      <output-pane
        v-bind:layoutChangeCnt="layoutChangeCnt"
        v-bind:rendererSource="rendererSource"
        v-bind:rendererState="rendererState"
        v-bind:error="error"></output-pane>
      <!-- error element -->
    </main>
    <sign-in-popup v-if="signInPopup.isOpen" v-bind:popup="signInPopup"></sign-in-popup>
    <profile-popup v-if="profilePopup.isOpen" v-bind:popup="profilePopup" v-bind:user="session.user" v-on:signOut="signOut"></profile-popup>
    <!--settings-popup v-if="settingsPopup.isOpen" v-bind:popup="settingsPopup" v-bind:settings="settings"></settings-popup-->
  </body>
</template>

<script>
import { mapState, mapMutations } from 'vuex';

import debounce from '../debounce'
import ActionButton from './common/ActionButton'
import Dropdown from './common/Dropdown'
import Popup from './common/Popup'
import Status from './common/Status'
import EditorPane from './EditorPane'
import Splitter from './Splitter'
import OutputPane from './OutputPane'
import SignInPopup from './SignInPopup'
import ProfilePopup from './ProfilePopup'
import SettingsPopup from './SettingsPopup'

export default {
  components: {
    ActionButton,
    Dropdown,
    Status,
    EditorPane,
    Splitter,
    OutputPane,
    SignInPopup,
    ProfilePopup,
    SettingsPopup
  },
  computed: {
    ...mapState([
      'settings',
      'session'
    ])
  },
  data() {
    return {
      profileDropdown: new Dropdown.Model(),
      signInPopup: new Popup.Model(),
      profilePopup: new Popup.Model(),
      settingsPopup: new Popup.Model(),
      isLoading: true,
      status: new Status.Model(),
      layoutChangeCnt: 0,
      run: null,
      runLikes: null,
      isRunning: false,
      editorSource: null,
      rendererSource: null,
      rendererState: {},
      error: null
    }
  },
  watch: {
    $route: function () {
      if (this.$route.params.shortId !== this.run.shortId) {
        this.fetchRun();
      }
    }
  },
  mounted() {
    window.addEventListener('resize', debounce(() => {
      this.resetState();
      this.notifyLayoutChange();
    }, 250));

    // @todo remove when unmounted ie. go to profile
    window.addEventListener('message', (event) => {
      switch (event.data.type) {
      case 'SIGNED_IN':
        const user = event.data.user;

        this.updateSession({ user }); // @todo return entire session?
        this.status.success('Signed in').dismiss();

        if (!user.profile.username) {
          this.showProfile();
        }

        this.updateRunLikes();

        break;
      case 'RUNTIME_ERROR':
        //this.error = 'Runtime error';
        this.status.error('Runtime error').dismiss();
        this.stop();
        break;
      case 'COMPILATION_ERROR':
        //this.error = 'Compilation error';
        this.status.error('Compilation error').dismiss();
        this.stop();
        break;
      }
    });

    // of still loading when mounted
    this.status.pending('Initializing');

    // @todo do this in created
    this.fetchRun()
      .then(() => {
        this.isLoading = false;
        this.status.close();

        this.start();
      })
      .catch((error) => {
        this.run = { source: '' }; // @todo or don't set at all?
        this.isLoading = false;
        console.error(error.message);
        this.status.error('Error during initialization').dismiss();
      });
  },
  methods: {
    fetchRun() {
      const shortId = this.$route.params.shortId;
      const revision = this.$route.params.revision;

      let url = '/api/runs/';

      if (shortId) {
        url += shortId;

        if (revision) {
          url += `/${revision}`;
        }
      } else {
        url += 'default';
      }

      return fetch(url, { credentials: 'same-origin' })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            switch (response.status) {
            case 404:
              throw new Error('Run not found');
            default:
              throw new Error('Could not fetch run');
            }
          }
        })
        .then((run) => {
          if (run.owner && run.owner.profile.username !== this.$route.params.username) {
            this.$router.replace({
              name: 'edit',
              params: { username: run.owner.profile.username, shortId: this.$route.params.shortId }
            });
          }

          this.run = run;
          this.editorSource = run.source;
          this.updateRunLikes();
        });
    },
    updateRunLikes() {
      // if (this.run.shortId) {
      //   return fetch(`/api/runs/${this.run.shortId}/likes`, { credentials: 'same-origin' })
      //     .then((response) => {
      //       if (!response.ok) {
      //         throw new Error('Likes fetch failed');
      //       }
      //
      //       return response.json();
      //     })
      //     .then((runLikes) => {
      //       this.runLikes = runLikes;
      //     })
      //     .catch((error) => {
      //       this.runLikes = null;
      //       this.status.error('Could not fetch likes').dismiss();
      //     });
      // } else {
      //   this.runLikes = null;
      // }
    },
    toggleAnimation() {
      if (this.isRunning) {
        this.stop();
      } else {
        this.start();
      }
    },
    start() {
      // @todo immediately retrieve source in editor?
      this.rendererSource = this.run.source;
      this.resetState();
      this.error = null;
      this.isRunning = true;
    },
    stop() {
      this.rendererSource = null;
      this.resetState();
      this.isRunning = false;
      //this.error = null;
    },
    save() {
      this.status.pending('Saving');

      const body = new FormData();
      body.append('source', this.run.source);

      const options = {
        method: 'POST',
        body,
        credentials: 'same-origin'
      };

      return fetch('/api/runs', options)
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            console.error(response.status);
            throw new Error('Saving failed');
          }
        })
        .then((run) => {
          this.$router.push({
            name: 'edit',
            params: {
              username: run.owner && run.owner.profile.username || '',
              shortId: run.shortId
            }
          });
          this.run = run;
          this.status.success('Saved').dismiss();
          this.updateRunLikes();
        })
        .catch((error) => {
          console.error(error);
          this.status.error('Saving failed').dismiss();
        });
    },
    update() {
      this.status.pending('Updating');

      const body = new FormData();
      body.append('shortId', this.run.shortId);
      body.append('source', this.run.source);

      const options = {
        method: 'POST',
        body,
        credentials: 'same-origin'
      };

      return fetch('/api/runs', options)
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            console.error(response.status);
            throw new Error('Updating failed');
          }
        })
        .then((run) => {
          this.run = run;
          this.status.success('Updated').dismiss();
          this.updateRunLikes();
        })
        .catch((error) => {
          console.error(error);
          this.status.error('Updating failed').dismiss();
        });
    },
    toggleLike() {
      return !this.runLikes.isLikedByUser
        ? this.like()
        : this.unlike();
    },
    like() {
      this.status.pending('Liking');

      const options = {
        method: 'POST',
        credentials: 'same-origin'
      };

      return fetch(`/api/runs/${this.run.shortId}/like`, options)
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            console.error(response.status);
            throw new Error('Liking failed');
          }
        })
        .then((runLikes) => {
          this.runLikes = runLikes;
          this.status.success('Liked').dismiss();
        })
        .catch((error) => {
          console.error(error);
          this.status.error('Liking failed').dismiss();
        });
    },
    unlike() {
      this.status.pending('Unliking');

      const options = {
        method: 'POST',
        credentials: 'same-origin'
      };

      return fetch(`/api/runs/${this.run.shortId}/unlike`, options)
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            console.error(response.status);
            throw new Error('Unliking failed');
          }
        })
        .then((runLikes) => {
          this.runLikes = runLikes;
          this.status.success('Unliked').dismiss();
        })
        .catch((error) => {
          console.error(error);
          this.status.error('Unliking failed').dismiss();
        });
    },
    fork() {
      this.status.pending('Forking');

      const body = new FormData();
      body.append('shortId', this.run.shortId);
      body.append('source', this.run.source);
      body.append('isForking', true);

      const options = {
        method: 'POST',
        body,
        credentials: 'same-origin'
      };

      return fetch('/api/runs', options)
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            console.error(response.status);
            throw new Error('Forking failed');
          }
        })
        .then((run) => {
          this.$router.push({
            name: 'edit',
            params: {
              username: run.owner && run.owner.profile.username || '',
              shortId: run.shortId
            }
          });
          this.run = run;
          this.status.success('Forked').dismiss();
          this.updateRunLikes();
        })
        .catch((error) => {
          console.error(error);
          this.status.error('Forking failed').dismiss();
        });
    },
    resetState() {
      this.rendererState = {};
    },
    notifyLayoutChange() {
      window.setTimeout(() => {
        this.layoutChangeCnt++;
      }, 1);
    },
    toggleLayout() {
      this.updateSettings({ isLayoutHorizontal: !this.settings.isLayoutHorizontal });
      this.saveSettings();
      this.resetState();
      this.notifyLayoutChange();
    },
    signIn() {
      this.signInPopup.open();
    },
    signOut() {
      this.status.pending('Signing out');

      fetch('/auth/signOut', { method: 'POST', credentials: 'same-origin' })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Error signing out');
          }
        })
        .then(() => {
          this.updateSession({ user: null });
          this.status.success('Signed out').dismiss();
          this.updateRunLikes();
        })
        .catch((error) => {
          console.error(error);
          this.status.error('Error while signing out').dismiss();
        });
    },
    showProfile() {
      this.profilePopup.open();
    },
    showSettings() {
      this.settingsPopup.open();
    },
    handleSplitterDrag(offset) {
      const mainEl = this.$el.querySelector('main');
      const editorPaneEl = this.$refs.editorPane.$el;
      const mainBounds = mainEl.getBoundingClientRect();
      const editorBounds = editorPaneEl.getBoundingClientRect();

      const splitterPercentage = this.settings.isLayoutHorizontal
        ? (editorBounds.width + offset) / mainBounds.width * 100
        : (editorBounds.height + offset) / mainBounds.height * 100;

      this.updateSettings({ splitterPercentage });
      this.saveSettings();

      this.resetState();
      this.notifyLayoutChange();
    },
    handleEditorSourceUpdate(source) {
      if (source !== this.run.source) {
        this.run.isDirty = true;
        this.run.source = source;
        this.stop();
      }
      // @todo only when auto-start is enabled
      // this.rendererSource = source;
      // this.error = null;
    },
    handleEditorSyntaxError() {
      this.rendererSource = null;
      this.error = 'Syntax error';
      //this.status.error('Syntax error').dismiss();
    },
    ...mapMutations([
      'updateSettings',
      'updateSession'
    ]),
    saveSettings() {
      localStorage.setItem('settings', JSON.stringify(this.settings));
    }
  }
}
</script>

<style lang="less">
@import "common/colors";
@import "common/button";

@headerHeight: 40px;
@aceGutterSize: 50px;

@logoVPadding: 10px;
@logoHPadding: @aceGutterSize;
@logoHeight: @headerHeight - @logoVPadding * 2;
@logoAspectRatio: 291 / 40;

body {
  font-family: 'Varela Round', sans-serif;
  font-size: 100%;
  margin: 0;
  padding: 0;
  background: @bodyBgColor;
}
header {
  display: flex;
  align-items: baseline;
  height: @headerHeight;
  background: @panelBgColor;
  color: @panelContentColor;

  > h1 {
    display: inline;
    margin: 0;
    padding-left: @logoHPadding;
    padding-right: @headerHeight;
    height: @headerHeight;
    line-height: @headerHeight;
    font-size: 1rem;

    a {
      cursor: pointer;
      text-indent: -9999px;
      display: inline-block;
      height: @logoHeight;
      width: @logoHeight * @logoAspectRatio;
      vertical-align: middle;
      background: url(/static/logo.png) 0 0 no-repeat;
      background-size: contain;
      opacity: .75;

      &:focus {
        outline: none;
        opacity: 1;
      }

      &:enabled:hover {
        opacity: 1;
      }
    }

    &:after {
      content: 'Alpha';
      display: inline-block;
      text-transform: lowercase;
      color: @accent1Color;
      font-size: .75rem;
      vertical-align: top;
      transform: rotate(-10deg);
      padding-left: .25rem;
    }
  }

  ._tool {
    .button();

    height: @headerHeight;
    line-height: @headerHeight;
    padding: 0 5px;
    font-size: 12/16rem;
    margin-right: 4px;
    position: relative;
    overflow: hidden;
    text-transform: uppercase;

    &:after {
      content: '';
      position: absolute;
      left: 5px;
      right: 5px;
      height: 3px;
      border-radius: 1.5px;
      bottom: -3px;
      transition: bottom 100ms;
    }

    &:focus {
      color: @buttonHoverContentColor;
    }

    &:enabled {
      &:hover {
        &:after {
          bottom: 6px;
        }
      }

      &:active {
        &:after {
          bottom: 8px;
        }
      }
    }

    &.-accent-1:after { background: @buttonHoverAccent1Color; }
    &.-accent-2:after { background: @buttonHoverAccent2Color; }
    &.-accent-3:after { background: @buttonHoverAccent3Color; }
    &.-accent-4:after { background: @buttonHoverAccent4Color; }
    &.-accent-5:after { background: @buttonHoverAccent5Color; }
  }

  ._gap {
    display: inline-block;
    width: 1rem;
  }

  ._right-aligned {
    flex-grow: 1;
    text-align: right;
    margin-right: @aceGutterSize;

    > ._profile {
      .button();

      padding-left: 0;
      padding-right: 0;
      font-size: 1rem;
      position: relative;

      ._picture {
        display: inline-block;
        vertical-align: middle;
        width: @headerHeight - 10px;
        height: @headerHeight - 10px;
        background-color: @panelImagePlaceholderColor;
        border-radius: (@headerHeight - 10px) / 2;

        background-repeat: no-repeat;
        background-position: 50% 50%;
        background-size: cover;
      }

      ._display-name {
        display: inline-block;
        margin-left: 5px;
        font-size: 0.75rem;
      }

      &:focus {
        color: @buttonHoverContentColor;
      }

      > ._profile-dropdown {
        top: @headerHeight - 5px;
        left: 0;
        margin-left: -1rem;
        margin-right: -1rem;
        right: 0;

        button {
          position: relative;
          overflow: hidden;

          &:after {
            content: '';
            position: absolute;
            top: 5px;
            bottom: 5px;
            width: 3px;
            border-radius: 1.5px;
            left: -3px;
            transition: left 100ms;
          }

          &:focus {
            color: @buttonHoverContentColor;
          }

          &:enabled {
            &:hover {
              &:after {
                left: 6px;
              }
            }

            &:active {
              &:after {
                left: 8px;
              }
            }
          }

          &.-accent-1:after { background: @buttonHoverAccent1Color; }
          &.-accent-2:after { background: @buttonHoverAccent2Color; }
          &.-accent-3:after { background: @buttonHoverAccent3Color; }
          &.-accent-4:after { background: @buttonHoverAccent4Color; }
          &.-accent-5:after { background: @buttonHoverAccent5Color; }
        }
      }
    }

    > ._tool {
      margin-left: 4px;
      margin-right: 0;
    }
  }
}
body > .status {
  position: absolute;
  z-index: 20;
  top: 80px;
  left: 50%;
}
main {
  position: absolute;
  top: @headerHeight;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;

  &.-horizontal-split {
    flex-direction: row;
  }
}
</style>
