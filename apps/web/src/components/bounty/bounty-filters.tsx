'use client';

import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { AutocompleteDropdown } from '@bounty/ui/components/autocomplete';
import { Input } from '@bounty/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bounty/ui/components/select';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { trpc } from '@/utils/trpc';
import { Button } from '@bounty/ui/components/button';

interface Creator {
  id: string;
  name: string | null;
  handle: string | null;
  image: string | null;
}

export function BountyFilters() {
  const [searchQuery, setSearchQuery] = useQueryState('search', parseAsString);
  const [creatorId, setCreatorId] = useQueryState('creatorId', parseAsString);
  const [sortBy, setSortBy] = useQueryState(
    'sortBy',
    parseAsString.withDefault('created_at')
  );
  const [sortOrder, setSortOrder] = useQueryState(
    'sortOrder',
    parseAsString.withDefault('desc')
  );

  const [creatorSearchQuery, setCreatorSearchQuery] = useState('');
  const [creatorDropdownOpen, setCreatorDropdownOpen] = useState(false);
  const creatorInputRef = useRef<HTMLInputElement>(null);

  // Debounced search for creators
  const [debouncedCreatorQuery, setDebouncedCreatorQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCreatorQuery(creatorSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [creatorSearchQuery]);

  // Fetch creators - only search if query is at least 1 character
  const creatorsQuery = useQuery({
    ...trpc.user.searchCreators.queryOptions({ query: debouncedCreatorQuery }),
    enabled: debouncedCreatorQuery.length >= 1,
  });

  const creators = useMemo(
    () => creatorsQuery.data?.data || [],
    [creatorsQuery.data?.data]
  );

  // Get selected creator info
  const selectedCreator = useMemo(() => {
    if (!creatorId) return null;
    // Try to find in current results first
    const found = creators.find((c) => c.id === creatorId);
    if (found) return found;
    // Otherwise return a placeholder
    return { id: creatorId, name: null, handle: null, image: null };
  }, [creatorId, creators]);

  const handleCreatorSelect = useCallback(
    (creator: Creator) => {
      setCreatorId(creator.id);
      setCreatorSearchQuery('');
      setCreatorDropdownOpen(false);
    },
    [setCreatorId]
  );

  const handleClearCreator = useCallback(() => {
    setCreatorId(null);
    setCreatorSearchQuery('');
  }, [setCreatorId]);

  // Debounced title search - update URL after user stops typing
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchQuery !== searchQuery) {
        setSearchQuery(localSearchQuery || null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchQuery, searchQuery, setSearchQuery]);

  const prevSearchQueryRef = useRef(searchQuery);
  if (searchQuery !== prevSearchQueryRef.current) {
    prevSearchQueryRef.current = searchQuery;
    setLocalSearchQuery(searchQuery || '');
  }

  const handleSortChange = useCallback(
    (value: string) => {
      const [by, order] = value.split('::');
      setSortBy(by);
      setSortOrder(order);
    },
    [setSortBy, setSortOrder]
  );

  const sortValue = `${sortBy}::${sortOrder}`;

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex flex-wrap items-center gap-3">
        {/* Title Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            className="pl-9 border-border-subtle bg-surface-1 text-foreground placeholder:text-text-muted"
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            placeholder="Search bounties..."
            value={localSearchQuery}
          />
        </div>

        {/* Creator Search */}
        <div className="relative min-w-[200px]">
          <div className="relative">
            <Input
              ref={creatorInputRef}
              className="pr-8 border-border-subtle bg-surface-1 text-foreground placeholder:text-text-muted"
              onChange={(e) => {
                setCreatorSearchQuery(e.target.value);
                setCreatorDropdownOpen(true);
              }}
              onFocus={() => {
                if (creatorSearchQuery.length > 0) {
                  setCreatorDropdownOpen(true);
                }
              }}
              placeholder={
                selectedCreator
                  ? selectedCreator.name || selectedCreator.handle || 'Creator'
                  : 'Creator: All'
              }
              value={creatorSearchQuery}
            />
            {selectedCreator && !creatorSearchQuery && (
              <div className="absolute right-8 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                <Avatar className="h-4 w-4">
                  {selectedCreator.image && (
                    <AvatarImage
                      src={selectedCreator.image}
                      alt={selectedCreator.name || ''}
                    />
                  )}
                  <AvatarFacehash
                    name={
                      selectedCreator.name ||
                      selectedCreator.handle ||
                      selectedCreator.id
                    }
                    size={16}
                  />
                </Avatar>
              </div>
            )}
            {selectedCreator && !creatorSearchQuery && (
              <Button
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-surface-3"
                onClick={handleClearCreator}
                size="sm"
                type="button"
                variant="link"
              >
                <X className="h-3 w-3 text-text-muted" />
              </Button>
            )}
          </div>
          <AutocompleteDropdown
            className="border-border-subtle bg-surface-1"
            getKey={(c) => c.id}
            items={creators}
            loading={creatorsQuery.isLoading}
            onSelect={handleCreatorSelect}
            open={creatorDropdownOpen && creatorSearchQuery.length >= 1}
            renderItem={(creator) => (
              <div className="flex items-center gap-2">
                <Avatar className="h-4 w-4 shrink-0">
                  {creator.image && (
                    <AvatarImage src={creator.image} alt={creator.name || ''} />
                  )}
                  <AvatarFacehash
                    name={creator.name || creator.handle || creator.id}
                    size={16}
                  />
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm text-foreground">
                    {creator.name || creator.handle || 'Unknown'}
                  </span>
                  {creator.handle && creator.name && (
                    <span className="text-xs text-text-muted">
                      {creator.handle}
                    </span>
                  )}
                </div>
              </div>
            )}
            skeletonCount={3}
          />
        </div>

        {/* Sort Dropdown */}
        <Select
          onValueChange={(v) => v && handleSortChange(v)}
          value={sortValue}
        >
          <SelectTrigger className="w-[180px] border-border-subtle bg-surface-1 text-foreground">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent className="border-border-subtle bg-surface-1">
            <SelectItem value="created_at::desc">Newest</SelectItem>
            <SelectItem value="created_at::asc">Oldest</SelectItem>
            <SelectItem value="amount::desc">Price: High to Low</SelectItem>
            <SelectItem value="amount::asc">Price: Low to High</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
