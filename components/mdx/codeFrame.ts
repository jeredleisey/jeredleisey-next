// The classes of the frame and the header of a code container. The Code Block and the Code Group
// both use them, so that the two cannot drift apart. not-prose stops every typography rule of
// the prose classes inside the frame.
export const FRAME_CLASSES =
  'not-prose my-6 overflow-hidden rounded-xl border border-my-stone/50 bg-my-parchment dark:border-my-stone/15 dark:bg-my-cream/[0.04]';

// The header is 44px high in both. The Code Group adds nothing to this string, so its height
// cannot differ from the height of a Code Block.
export const HEADER_CLASSES =
  'flex h-11 items-center border-b border-my-stone/50 px-5 font-sans text-[13px] text-my-walnut dark:border-my-stone/15 dark:text-my-stone';
