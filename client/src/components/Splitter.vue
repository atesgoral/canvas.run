<template>
  <div class="splitter" v-bind:class="{ '-horizontal': isHorizontal }">
    <div class="_handle" v-on:mousedown="startDrag($event)"></div>
  </div>
</template>

<script>
const minPaneSize = 100;

export default {
  props: {
    isHorizontal: Boolean
  },
  methods: {
    startDrag(event) {
      const isHorizontal = this.isHorizontal;
      const splitterEl = this.$el;
      const splitterHandleEl = event.target;
      const mainEl = splitterEl.parentNode;
      const splitterBounds = splitterEl.getBoundingClientRect();
      const splitterHandleBounds = splitterHandleEl.getBoundingClientRect();
      const mainBounds = mainEl.getBoundingClientRect();

      let splitterDrag = {
        handleOrigin: isHorizontal
          ? splitterHandleBounds.left
          : splitterHandleBounds.top,
        start: isHorizontal
          ? event.clientX
          : event.clientY
      };

      function getOffset(event) {
        const current = isHorizontal
          ? event.clientX
          : event.clientY;

        const offset = current - splitterDrag.start;

        if (isHorizontal) {
          return Math.min(
            Math.max(
              splitterBounds.left + offset,
              mainBounds.left + minPaneSize
            ),
            mainBounds.right - splitterBounds.width - minPaneSize
          ) - splitterBounds.left;
        } else {
          return Math.min(
            Math.max(
              splitterBounds.top + offset,
              mainBounds.top + minPaneSize
            ),
            mainBounds.bottom - minPaneSize
          ) - splitterBounds.top;
        }
      }

      const emitDrag = (offset) => {
        this.$emit('drag', offset);
      };

      function continueDrag(event) {
        if (splitterDrag) {
          event.preventDefault();

          const offset = getOffset(event);

          if (isHorizontal) {
            splitterHandleEl.style.marginLeft = offset + 'px';
          } else {
            splitterHandleEl.style.marginTop = offset + 'px';
          }
        }
      }

      function endDrag(event) {
        if (splitterDrag) {
          window.removeEventListener('mouseup', endDrag);
          window.removeEventListener('mousemove', continueDrag);

          emitDrag(getOffset(event));

          if (isHorizontal) {
            splitterHandleEl.style.marginLeft = 0;
          } else {
            splitterHandleEl.style.marginTop = 0;
          }

          splitterDrag = null;
        }
      }

      window.addEventListener('mousemove', continueDrag);
      window.addEventListener('mouseup', endDrag);
    }
  }
}
</script>

<style lang="less">
@import "../colors";

@splitterSize: 13px;

.splitter {
  position: relative;
  z-index: 10;
  flex: 0 0 @splitterSize;
  background: @panelBgColor;
  height: @splitterSize;
  user-select: none;

  > ._handle {
    position: absolute;
    height: @splitterSize;
    background: @splitterHandleBgColor;
    left: 0;
    right: 0;
    cursor: ns-resize;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    user-select: none;

    &:after {
      content: '';
      position: absolute;
      left: 5px;
      right: 5px;
      height: 3px;
      border-radius: 1.5px;
      background: transparent;
      transition: background 250ms;
    }

    &:hover {
      &:after {
        background: @accent2Color;
      }
    }
  }

  &.-horizontal {
    height: auto;
    width: @splitterSize;

    > ._handle {
      height: auto;
      width: @splitterSize;
      top: 0;
      bottom: 0;
      cursor: ew-resize;
      flex-direction: column;

      &:after {
        left: auto;
        right: auto;
        height: auto;
        top: 5px;
        bottom: 5px;
        width: 3px;
      }
    }
  }
}
</style>
