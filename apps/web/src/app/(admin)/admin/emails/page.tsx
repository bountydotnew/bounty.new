'use client';

import { Button } from '@bounty/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bounty/ui/components/card';
import { Input } from '@bounty/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bounty/ui/components/select';
import { Textarea } from '@bounty/ui/components/textarea';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { AdminHeader } from '@/components/admin';
import { trpc } from '@/utils/trpc';
import {
  sendTestEmailAction,
  subscribeAudienceAction,
  unsubscribeAudienceAction,
} from './actions';

type Template = 'none' | 'alpha';
type FromKey = 'notifications' | 'support' | 'marketing' | 'general';
type AudienceKey = 'marketing';

export default function AdminEmailsPage() {
  const constants = useQuery(trpc.emails.constants.queryOptions());
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('Test Subject');
  const [html, setHtml] = useState('<p>Hello from bounty.new</p>');
  const [template, setTemplate] = useState<Template>('none');
  const [fromKey, setFromKey] = useState<FromKey>('notifications');
  const [audienceKey, setAudienceKey] = useState<AudienceKey>('marketing');
  const [subEmail, setSubEmail] = useState('');

  const [sending, setSending] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);

  const fromKeys = useMemo(
    () => Object.keys(constants.data?.from || {}),
    [constants.data]
  );
  const audienceKeys = useMemo(
    () => Object.keys(constants.data?.audiences || {}),
    [constants.data]
  );

  return (
    <div className="space-y-6">
      <AdminHeader
        description="Send test emails and manage audiences"
        title="Emails"
      />

      <Card className="border border-neutral-800 bg-[#222222]">
        <CardHeader>
          <CardTitle className="font-medium text-neutral-300 text-sm">
            Send Test Email
          </CardTitle>
          <CardDescription className="text-neutral-500 text-xs">
            Quickly send an email to verify configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4">
            <Input
              className="border-neutral-800 bg-neutral-900"
              onChange={(e) => setTo(e.target.value)}
              placeholder="to@example.com,comma,separated"
              value={to}
            />
            <Select
              onValueChange={(value) => setFromKey(value as FromKey)}
              value={fromKey}
            >
              <SelectTrigger className="border-neutral-800 bg-[#222222]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fromKeys.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="border-neutral-800 bg-neutral-900"
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              value={subject}
            />
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-4">
            <Select
              onValueChange={(v) => setTemplate(v as Template)}
              value={template}
            >
              <SelectTrigger className="border-neutral-800 bg-[#222222]">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template</SelectItem>
                <SelectItem value="alpha">AlphaAccessGranted</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              className="border-neutral-800 bg-neutral-900"
              onChange={(e) => setHtml(e.target.value)}
              rows={6}
              value={html}
            />
          </div>
          <div className="mt-3 flex items-center justify-end">
            <Button
              disabled={sending}
              onClick={async () => {
                const recipients = to
                  .split(',')
                  .map((v) => v.trim())
                  .filter(Boolean);
                if 
                (recipients.length === 0){
                  return;
                }
                setSending(true);
                try {
                  await sendTestEmailAction({
                    to: recipients,
                    subject,
                    fromKey,
                    html,
                    text: undefined,
                    template,
                  });
                } catch (error) {
                  console.error('Failed to send test email:', error);
                } finally {
                  setSending(false);
                }
              }}
            >
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-neutral-800 bg-[#222222]">
        <CardHeader>
          <CardTitle className="font-medium text-neutral-300 text-sm">
            Manage Audience
          </CardTitle>
          <CardDescription className="text-neutral-500 text-xs">
            Subscribe or unsubscribe a test email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4">
            <Input
              className="border-neutral-800 bg-neutral-900"
              onChange={(e) => setSubEmail(e.target.value)}
              placeholder="email@example.com"
              value={subEmail}
            />
            <Select
              onValueChange={(value) => setAudienceKey(value as AudienceKey)}
              value={audienceKey}
            >
              <SelectTrigger className="border-neutral-800 bg-[#222222]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {audienceKeys.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button
                disabled={subscribing}
                onClick={async () => {
                  setSubscribing(true);
                  try {
                    await subscribeAudienceAction({
                      email: subEmail,
                      audienceKey,
                    });
                  } catch (error) {
                    console.error('Failed to subscribe audience:', error);
                  } finally {
                    setSubscribing(false);
                  }
                }}
              >
                {subscribing ? 'Subscribing...' : 'Subscribe'}
              </Button>
              <Button
                disabled={unsubscribing}
                onClick={async () => {
                  setUnsubscribing(true);
                  try {
                    await unsubscribeAudienceAction({
                      email: subEmail,
                      audienceKey,
                    });
                  } catch (error) {
                    console.error('Failed to unsubscribe audience:', error);
                  } finally {
                    setUnsubscribing(false);
                  }
                }}
                variant="outline"
              >
                {unsubscribing ? 'Unsubscribing...' : 'Unsubscribe'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
