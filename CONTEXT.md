# jeredleisey.com

Jered Leisey's personal website: a portfolio of his work, a blog, and a personal profile that he uses in place of social media.

## Language

### Work on the site

**Project**:
An interactive, working piece of software that a person uses on the site, such as the Jev prompt tester. A Project is not an article about software.
_Avoid_: Demo, tool, playground, writeup

**Run**:
One call that a User makes from a Project to a paid model API. Each Run has a cost to Jered.
_Avoid_: Request, call, query

### Access

**User**:
A person who has signed in to the site with a Google or GitHub account. One person with the same verified email on both providers is one User.
_Avoid_: Account, member, visitor

**Visitor**:
A person who reads the site without signing in.
_Avoid_: Guest, anonymous user

**Admin**:
The one User whose email matches the configured admin email. The Admin has all access, and nobody can grant or remove the Admin through the site.
_Avoid_: Owner, superuser

**Permission**:
The right to open one protected Project.
_Avoid_: Grant, scope, access right

**Role**:
A named set of Permissions that the Admin assigns to Users.
_Avoid_: Group, team

**Access Request**:
A User's request for the Permission to one Project. It is pending, approved, or declined.
_Avoid_: Invite, application
