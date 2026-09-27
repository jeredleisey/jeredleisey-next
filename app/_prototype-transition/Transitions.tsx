// PROTOTYPE (feed panel). Throwaway. Not for main.
// The home page content fades out, and a reading page rises in. The class names are in globals.css.
import { ViewTransition } from 'react';

export function HomeTransition({ children }: { children: React.ReactElement }) {
  return (
    <ViewTransition enter={{ default: 'feed-in' }} exit={{ default: 'feed-out' }} default="none">
      {children}
    </ViewTransition>
  );
}

export function ReadingTransition({ children }: { children: React.ReactElement }) {
  return (
    <ViewTransition enter={{ default: 'page-in' }} exit={{ default: 'page-out' }} default="none">
      {children}
    </ViewTransition>
  );
}
