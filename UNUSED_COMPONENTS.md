# Unused Components Report

This file contains a list of components that appear to be unused (not imported or referenced) in the codebase.

## Confirmed Unused Components

### UI Components
- `/apps/web/src/components/ui/pinging-dot-chart.tsx` - Chart component not used anywhere
- `/apps/web/src/components/ui/kibo-ui/video-player/index.tsx` - Video player component not used

### Form Components
- `/apps/web/src/components/sign-up-form.tsx` - Sign up form component not used
- `/apps/web/src/components/sign-in-form.tsx` - Sign in form component not used

### Navigation/Menu Components
- `/apps/web/src/components/user-menu.tsx` - User menu component not used

### Example/Demo Components
- `/apps/web/src/components/examples/access-gate-examples.tsx` - Example component for access gates, likely for documentation

## Analysis Notes

- The search was performed by checking if component names (both kebab-case and PascalCase variants) appear in any files other than their own definition file
- Components that only appear in their own file and nowhere else are considered unused
- Some components might be used dynamically or through other patterns not caught by this analysis

## Recommendations

1. **Remove unused components** if they are truly no longer needed
2. **Verify dynamic usage** - Some components might be loaded dynamically via strings or other patterns
3. **Check for future usage** - Some components might be prepared for upcoming features
4. **Keep example components** - The access-gate-examples.tsx might be used for documentation purposes

## Note

This analysis was performed via grep search. Components might still be used if they are:
- Imported via dynamic imports with string paths
- Referenced in configuration files
- Used in ways that don't follow typical import patterns
- Exported from index files and re-used elsewhere

Double-check each component before removal to ensure it's truly unused.