import { BookmarksContent } from './page-client';
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bookmarks — bounty',
  description: `Save bounties and come back when you're ready to solve them`,
};

export default function BookmarksPage() {
  return (
    <BookmarksContent />
  );
}
