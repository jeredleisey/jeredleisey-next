---
status: accepted
---

# RBAC lives in the site's own tables, not in a Better Auth plugin

Better Auth handles sign-in, sessions, and linked accounts. It does not hold Roles or Permissions. The site stores them in its own tables (role, role_permission, user_role, access_request, run), because the Admin must create Roles and assign Permissions at run time, and no Better Auth plugin fits that model.

## Considered Options

- **Better Auth `admin` plugin.** Its roles and permissions are defined in code. The Admin could not create a Role from the admin panel without a deploy.
- **Better Auth `organization` plugin.** It allows roles created at run time, but only inside organizations. The site has no organizations, so every User would sit in one invented organization.

## Consequences

- The Admin is not a Role. One configured email is the Admin, so nobody can grant or remove the Admin through the site.
- A change of auth library does not touch access data. Only the link from a User id to the auth library's user table changes.
