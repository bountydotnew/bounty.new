'use client';

import React from 'react';
import { Button } from '@bounty/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@bounty/ui/components/card';

export function DesignBounties() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Design Bounties</CardTitle>
        <CardDescription>Bounties for design work on Paper & Figma</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Design bounties coming soon...
          </p>
          <Button>Submit Design</Button>
        </div>
      </CardContent>
    </Card>
  );
}
