# Release checklist

Run this by hand on production before you call a release done. Browser tests come after the relaunch (#20). Until then, this list is the check.

Use a private browser window, so no old session is in the way.

## Before the deploy

- [ ] CI passed on the commit you deploy.
- [ ] If the release changes `drizzle/`, run the migration against production first (see `docs/deployment.md`).

## Pages

- [ ] `https://jeredleisey.com` shows the home page with the feed. `https://www.jeredleisey.com` redirects to it.
- [ ] Open one Post, one Update, and the Jev Project from the feed.
- [ ] On a wide screen, the feed panel closes to the rail and opens again with the circle.
- [ ] On a phone, the feed sheet opens and closes with a tap and with a drag.
- [ ] Light mode and dark mode both look right.

## Sign-in and access

- [ ] Sign in with Google. Sign out.
- [ ] Sign in with GitHub. Sign out.
- [ ] With a second account that is not the Admin: open Jev, and send an Access Request.
- [ ] The Admin email gets the notification for that request.
- [ ] As the Admin, approve the request in `/admin/requests`.
- [ ] With the second account: Jev opens. Do one Run. The result shows its cost.
- [ ] As the Admin, the Run shows in the admin panel with its cost.

## After the deploy

- [ ] Vercel shows no runtime errors for the new deployment.
- [ ] Vercel Web Analytics records the visits from this check.
