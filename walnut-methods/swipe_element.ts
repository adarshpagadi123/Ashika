import type { WalnutAndroidContext } from './walnut';
// ^ import the type matching your context: WalnutWebContext | WalnutApiContext
//   | WalnutIosContext | WalnutAndroidContext | WalnutBaseContext (for shared)

/** @walnut_method
 * name: Swipe Element
 * description: Swipe the linked element in direction ${direction}
 * actionType: custom_swipe_element
 * context: android
 * needsLocator: true
 * category: Android Gestures
 */
export async function swipeElement(ctx: WalnutAndroidContext) {
  const direction = ctx.args[0];
  const supportedDirections = [
    'LEFT_TO_RIGHT',
    'RIGHT_TO_LEFT',
    'TOP_TO_BOTTOM',
    'BOTTOM_TO_TOP',
  ];

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
      visible = await ctx.isVisible();
      if (visible) break;
      await ctx.wait(pollIntervalMs);
    }

    if (!visible) {
      throw new Error('linked element was not visible before the 10000 ms timeout');
    }

    const boundsText = await ctx.getAttribute('bounds');
    if (!boundsText) {
      throw new Error('the linked element did not expose Android bounds');
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
      throw new Error('the linked element has invalid bounds: ' + boundsText);
    }

    // Bounds are read to confirm a valid, visible target. The Android swipe
    // helper uses the linked object's bounds and does not accept coordinates.
    ctx.log('Swiping linked element ' + width + 'x' + height + ' pixels.');
    await ctx.swipe(direction);
    ctx.log('Swipe Element completed: ' + direction + '.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.warn('Swipe Element failed for the linked object: ' + message);
    throw new Error('Swipe Element failed: ' + message);
  }
}
