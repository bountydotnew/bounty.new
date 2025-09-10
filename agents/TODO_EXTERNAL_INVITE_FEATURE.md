# TODO: External User Invite Feature

## Feature Request
Add the ability to send invites to users who don't have accounts yet via email.

## Implementation Details
- Create email templates for invite notifications
- Set up email service integration
- Add user registration flow that honors the pre-set access level
- Store pending invites in database
- Handle invite token validation and expiration
- Notify admins when invites are accepted

## Technical Notes
- API endpoint `inviteExternalUser` is already created but only validates email uniqueness
- Email sending logic needs to be implemented
- Consider using existing notification system or separate email service
- Need to handle the flow: invite email → user clicks link → registration → automatic access level assignment

## Related Files
- `/packages/api/src/routers/user.ts` - API endpoint exists
- `/apps/web/src/components/admin/external-invite-modal.tsx` - UI component ready
- Email templates directory (to be created)
- Registration flow (to be modified)
