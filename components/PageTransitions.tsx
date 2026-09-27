/// <reference types="react/canary" />
import { ViewTransition } from 'react';

// Navigation between the home page and a reading page: the home page content fades out
// fast, and the reading page rises in. The feed panel does not take part. It moves with
// its own CSS transitions. The classes are in app/globals.css.
export function HomeTransition({ children }: { children: React.ReactElement }) {
  return (
    <ViewTransition enter={{ default: 'home-in' }} exit={{ default: 'home-out' }} default="none">
      {children}
    </ViewTransition>
  );
}

export function ReadingTransition({ children }: { children: React.ReactElement }) {
  return (
    <ViewTransition enter={{ default: 'reading-in' }} exit={{ default: 'reading-out' }} default="none">
      {children}
    </ViewTransition>
  );
}
