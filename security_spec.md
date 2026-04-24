# Security Spec: SSB Pro

## Data Invariants
1. Students must have a parentId pointing to a valid User.
2. Only Admins can modify Coach and Schedule data.
3. Coaches can only assess students if they are assigned to that category (simplified: Coaches can assess all for now, but rules will protect it).
4. Parents can only read data of their own children (Student, Attendance, Assessment, Payment).
5. Admins have full access.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoofing**: Attempt to create a student with a `parentId` that is not the requester's UID (unless Admin).
2. **Role Escalation**: Attempt to update one's own `role` field in the `users` collection.
3. **Ghost Field**: Attempt to add `isVerified: true` to a Student document.
4. **ID Poisoning**: Attempt to use a 2MB string as a Document ID for a Coach.
5. **Unauthorized Assessment**: A User with role `parent` attempting to create an Assessment.
6. **Payment Manipulation**: A Student/Parent attempting to mark a Payment as `lunas`.
7. **Orphaned Student**: Attempting to create a Student without a parentId.
8. **PII Leak**: A Coach attempting to read a Parent's private contact info (if stored separately).
9. **Terminal State Bypass**: Attempting to change a Payment status from `lunas` back to `belum` (unless Admin).
10. **Shadow Attendance**: A Parent attempting to mark their child's attendance.
11. **Massive Payload**: Attempting to upload a 5MB String into the `notes` field of an Assessment.
12. **Future Record**: Attempting to create an Announcement with a `createdAt` in the year 2099.

## Firestore Rules Draft
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() { return request.auth != null; }
    function isValidId(id) { return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$'); }
    function getUserData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
    function isAdmin() { return isSignedIn() && getUserData().role == 'admin'; }
    function isCoach() { return isSignedIn() && getUserData().role == 'coach'; }
    function isParent() { return isSignedIn() && getUserData().role == 'parent'; }

    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.auth.uid == userId && request.resource.data.role == 'parent';
      allow update: if isAdmin() || (isSignedIn() && request.auth.uid == userId && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']));
    }

    match /students/{studentId} {
      allow read: if isAdmin() || isCoach() || (isParent() && resource.data.parentId == request.auth.uid);
      allow write: if isAdmin();
    }

    // ... additional rules will be refined in firestore.rules
  }
}
```
