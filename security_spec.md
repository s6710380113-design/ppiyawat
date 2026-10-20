# Security Specification & Data Invariants

## 1. System Invariants
- **Identity Integrity**: Normal members cannot elevate themselves to 'moderator' or 'admin' or alter their status to unban themselves.
- **Bootstrapped Admin**: `s6710380113@pkru.ac.th` possesses administrative privileges to moderate content, configure global site settings, and oversee accounts.
- **Author Ownership**: Resources can only be created by signed-in users matching `authorId == request.auth.uid`. Edits or deletions can only be performed by the author or an admin/moderator.
- **Favorites Isolation**: Favorite bookmarks can only be read, created, or deleted by the bookmark owner (`userId == request.auth.uid`).
- **Reports Confidentiality**: Reports can be filed by any signed-in user, but only administrators and moderators can list and review community reports.
- **Audit Logging**: Moderation logs can only be created by administrators or moderators.
- **Global Settings Control**: Global configuration (announcements, category lists) can only be modified by admins. Read access is public so all visitors see categories and announcements.
- **Temporal & Boundary Guards**: IDs cannot exceed 128 characters and strings adhere to explicit maximum lengths.

## 2. The Dirty Dozen Payloads (Attacks that Must Be Rejected)
1. **Self-Escalation**: User attempting to register with `role: "admin"`.
2. **Ghost Field Injection**: Adding `isSuperAdmin: true` or malicious shadow flags to `users` document.
3. **Impersonation in Resources**: User submitting a resource with `authorId` belonging to another user.
4. **Unauthorized Update of Foreign Resource**: User B attempting to update or delete User A's resource.
5. **Arbitrary Status Override**: Non-admin attempting to mark another user's status as `suspended`.
6. **Denial of Wallet (Giant String in ID)**: Document path with 50,000 character junk string.
7. **Malformed Resource Payload**: Resource missing required fields or having negative views/likes.
8. **Unauthorized Favorite Read**: User attempting to read another user's private favorites collection.
9. **Fake Favorite Spoofing**: Inserting a favorite document with a `userId` belonging to someone else.
10. **Report Sniffing**: Non-moderator querying all reports in the `/reports` collection.
11. **Settings Vandalism**: Non-admin updating `/settings/global` to overwrite categories or site title.
12. **Moderation Log Forgery**: Non-admin writing fake records into `/moderationLogs`.

## 3. Test Coverage Matrix
All 12 attacks are enforced at the Firestore Security Rules level with default-deny, role lookups, and explicit field/action validations.
