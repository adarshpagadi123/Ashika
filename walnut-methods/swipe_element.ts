import type { WalnutAndroidContext } from './walnut';
// ^ import the type matching your context: WalnutWebContext | WalnutApiContext
//   | WalnutIosContext | WalnutAndroidContext | WalnutBaseContext (for shared)

/** @walnut_method
 * name: Swipe Element
 * description: Swipe the element at XPath ${xpath} in direction ${direction}
 * actionType: custom_swipe_element
 * context: android
 * needsLocator: true
 * category: Android Gestures
 */
export async function swipeElement(ctx: WalnutAndroidContext) {
  const xpath = ctx.args[0];
  const direction = ctx.args[1];
  const supportedDirections = [
    'LEFT_TO_RIGHT',
    'RIGHT_TO_LEFT',
    'TOP_TO_BOTTOM',
    'BOTTOM_TO_TOP',
  ];

  if (!xpath) {
    throw new Error('Swipe Element failed: xpath is required.');
  }
  if (!supportedDirections.includes(direction)) {
    throw new Error(
      'Swipe Element failed: unsupported direction "' +
        direction +
        '". Use LEFT_TO_RIGHT, RIGHT_TO_LEFT, TOP_TO_BOTTOM, or BOTTOM_TO_TOP.'
    );
  }

  try {
    const timeoutMs = 10000;
    const pollIntervalMs = 250;
    const deadline = Date.now() + timeoutMs;
    let visible = false;

    while (Date.now() < deadline) {
      visible = await ctx.isVisibleBy({ xpath });
      if (visible) break;
      await ctx.wait(pollIntervalMs);
    }

    if (!visible) {
      throw new Error('element was not visible before the 10000 ms timeout');
    }

    const boundsText = await ctx.getAttributeBy({ xpath }, 'bounds');
    if (!boundsText) {
      throw new Error('the target element did not expose Android bounds');
    }

    const boundsMatch = String(boundsText).match(
      /^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$/
    );
    if (!boundsMatch) {
      throw new Error('unable to parse Android element bounds: ' + boundsText);
    }

    const left = Number(boundsMatch[1]);
    const top = Number(boundsMatch[2]);
    const right = Number(boundsMatch[3]);
    const bottom = Number(boundsMatch[4]);
    const width = right - left;
    const height = bottom - top;

    if (width <= 0 || height <= 0) {
      throw new Error('the target element has invalid bounds: ' + boundsText);
    }

    const centerX = left + width / 2;
    const centerY = top + height / 2;
    let startX = centerX;
    let startY = centerY;
    let endX = centerX;
    let endY = centerY;

    switch (direction) {
      case 'LEFT_TO_RIGHT':
        startX = left;
        endX = right;
        break;
      case 'RIGHT_TO_LEFT':
        startX = right;
        endX = left;
        break;
      case 'TOP_TO_BOTTOM':
        startY = top;
        endY = bottom;
        break;
      case 'BOTTOM_TO_TOP':
        startY = bottom;
        endY = top;
        break;
    }

    await ctx.callTool('mobile: dragGesture', {
      xpath,
      startX: Math.round(startX),
      startY: Math.round(startY),
      endX: Math.round(endX),
      endY: Math.round(endY),
    });
    ctx.log(
      'Swipe Element completed: ' +
        direction +
        ' from (' +
        Math.round(startX) +
        ', ' +
        Math.round(startY) +
        ') to (' +
        Math.round(endX) +
        ', ' +
        Math.round(endY) +
        ').'
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.warn('Swipe Element failed for "' + xpath + '": ' + message);
    throw new Error('Swipe Element failed: ' + message);
  }
}
