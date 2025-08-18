# Profile Routes Implementation Todo

## Backend Changes

### 1. Add GitHub username lookup to profiles router

- [ ] Add `getProfileByGithubUsername` endpoint that finds user by GitHub username
- [ ] Query the account table to get userId from GitHub accountId
- [ ] Join with user, userProfile, and userReputation tables
- [ ] Handle case where GitHub username doesn't exist

### 2. Add GitHub data integration endpoints

- [ ] Add `getGithubData` endpoint that uses the GitHub driver
- [ ] Fetch user details, contributions, and recent PRs from GitHub API
- [ ] Cache GitHub data with TTL (like the driver already does)
- [ ] Add error handling for GitHub API rate limits

### 3. Update existing profile endpoints

- [ ] Include GitHub username in profile responses
- [ ] Add GitHub account linking status to profile data

## Frontend Changes

### 4. Create profile page components

- [ ] Create `ProfilePage` component for `/profile/[username]`
- [ ] Create `MyProfilePage` component for `/me` (redirects to own profile)
- [ ] Add profile header with avatar, name, GitHub link
- [ ] Add bio, location, skills, and social links section
- [ ] Add reputation and stats section
- [ ] Add GitHub activity section (contributions graph, recent PRs)

### 5. Add profile routes

- [ ] Create `/me` route that redirects to `/profile/[current-user-github-username]`
- [ ] Create `/profile/[username]` dynamic route
- [ ] Add loading and error states for profile pages
- [ ] Handle case where profile doesn't exist (404)

### 6. Update navigation and links

- [ ] Add profile links to LINKS constants
- [ ] Add "View Profile" option to user menu dropdown
- [ ] Update sidebar navigation to include profile link

## GitHub Integration

### 7. Set up GitHub driver

- [ ] Install and configure the GitHub driver in the server
- [ ] Add GitHub API token to environment variables
- [ ] Create GitHub service wrapper for the driver

### 8. Add GitHub username sync

- [ ] Add logic to automatically set githubUsername from GitHub OAuth login
- [ ] Update user profile when they log in via GitHub
- [ ] Handle username changes on GitHub

### 9. Add GitHub data features

- [ ] Show GitHub contribution graph on profile
- [ ] Display recent pull requests and repos
- [ ] Add GitHub stats (followers, public repos, etc.)
- [ ] Show GitHub profile link and social info

## Database Updates

### 10. Ensure GitHub username is properly stored

- [ ] Check that GitHub OAuth login saves username to account table
- [ ] Add migration if needed to populate missing GitHub usernames
- [ ] Add unique constraint on githubUsername in userProfile table

## Testing & Polish

### 11. Test profile functionality

- [ ] Test viewing own profile via `/me`
- [ ] Test viewing other users' profiles via `/profile/[username]`
- [ ] Test GitHub data loading and caching
- [ ] Test error cases (user not found, GitHub API errors)

### 12. Add profile SEO and metadata

- [ ] Add proper meta tags for profile pages
- [ ] Add Open Graph tags with user info
- [ ] Add structured data for user profiles

## Nice to Have

### 13. Profile editing

- [ ] Add profile edit page
- [ ] Allow users to update bio, skills, social links
- [ ] Add profile photo upload capability

### 14. Social features

- [ ] Add follow/unfollow functionality
- [ ] Show mutual connections
- [ ] Add profile sharing features
