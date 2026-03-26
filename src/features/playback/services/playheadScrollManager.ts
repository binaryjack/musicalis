/**
 * 3-State Playhead Scroll Manager
 * Implements sophisticated DAW-style scroll behavior for playback
 *
 * STATE 1: Playhead moves freely from left edge to center
 * STATE 2: Playhead locked at center, viewport scrolls right
 * STATE 3: Viewport reaches end, playhead continues to right edge
 */

export interface ScrollState {
  state: 1 | 2 | 3;
  scrollPosition: number;
  visualPlayheadPosition: number;
}

export class PlayheadScrollManager {
  /**
   * Calculate horizontal scroll state and position
   */
  static getScrollStateHorizontal(
    playheadXPosition: number,
    contentWidth: number,
    viewportWidth: number,
    centerOffset: number = 0.5 // 0.5 = 50%, 0.45 = 45%, etc.
  ): ScrollState {
    const centerThreshold = viewportWidth * centerOffset;
    const rightThreshold = contentWidth - (viewportWidth * centerOffset);

    // STATE 1: Playhead moves freely, no scroll
    if (playheadXPosition < centerThreshold) {
      return {
        state: 1,
        scrollPosition: 0,
        visualPlayheadPosition: playheadXPosition,
      };
    }

    // STATE 3: Content at end, playhead continues right
    if (playheadXPosition > rightThreshold) {
      const maxScroll = Math.max(0, contentWidth - viewportWidth);
      return {
        state: 3,
        scrollPosition: maxScroll,
        visualPlayheadPosition: playheadXPosition - maxScroll,
      };
    }

    // STATE 2: Playhead locked at center, viewport scrolls
    return {
      state: 2,
      scrollPosition: playheadXPosition - centerThreshold,
      visualPlayheadPosition: centerThreshold,
    };
  }

  /**
   * Calculate vertical scroll state and position for staves
   */
  static getScrollStateVertical(
    playheadYPosition: number,
    contentHeight: number,
    viewportHeight: number,
    centerOffset: number = 0.5
  ): ScrollState {
    const centerThreshold = viewportHeight * centerOffset;
    const bottomThreshold = contentHeight - (viewportHeight * centerOffset);

    // STATE 1: Playhead moves freely, no scroll
    if (playheadYPosition < centerThreshold) {
      return {
        state: 1,
        scrollPosition: 0,
        visualPlayheadPosition: playheadYPosition,
      };
    }

    // STATE 3: Content at bottom, playhead continues down
    if (playheadYPosition > bottomThreshold) {
      const maxScroll = Math.max(0, contentHeight - viewportHeight);
      return {
        state: 3,
        scrollPosition: maxScroll,
        visualPlayheadPosition: playheadYPosition - maxScroll,
      };
    }

    // STATE 2: Playhead locked at center, viewport scrolls
    return {
      state: 2,
      scrollPosition: playheadYPosition - centerThreshold,
      visualPlayheadPosition: centerThreshold,
    };
  }

  /**
   * Calculate both scroll states and visual positions
   */
  static getScrollStatesBoth(
    playheadXPosition: number,
    playheadYPosition: number,
    contentWidth: number,
    contentHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    centerOffsetX: number = 0.5,
    centerOffsetY: number = 0.5
  ) {
    const horizontal = this.getScrollStateHorizontal(
      playheadXPosition,
      contentWidth,
      viewportWidth,
      centerOffsetX
    );

    const vertical = this.getScrollStateVertical(
      playheadYPosition,
      contentHeight,
      viewportHeight,
      centerOffsetY
    );

    return {
      x: horizontal.scrollPosition,
      y: vertical.scrollPosition,
      state: {
        horizontal: horizontal.state,
        vertical: vertical.state,
      },
      visualPlayheadX: horizontal.visualPlayheadPosition,
      visualPlayheadY: vertical.visualPlayheadPosition,
    };
  }

  /**
   * Clamp scroll position to valid range
   */
  static clampScrollPosition(position: number, contentSize: number, viewportSize: number): number {
    const maxScroll = Math.max(0, contentSize - viewportSize);
    return Math.max(0, Math.min(position, maxScroll));
  }
}
