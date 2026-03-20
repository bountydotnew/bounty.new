import { track as sdkTrack } from '@databuddy/sdk';

export type TrackProps = Record<
  string,
  string | number | boolean | null | undefined
>;

export async function track(eventName: string, properties?: TrackProps) {
  await sdkTrack(eventName, properties ?? {});
}

export async function trackButtonClick(
  props: {
    button_text?: string;
    button_id?: string;
    location?: string;
  } & TrackProps = {}
) {
  await track('button_click', props);
}

export async function trackPageView(
  screen_name: string,
  props: TrackProps = {}
) {
  await track('screen_view', { screen_name, screen_class: 'React', ...props });
}

export function createTracker(base: TrackProps = {}) {
  const event = async (name: string, props?: TrackProps) =>
    track(name, { ...base, ...(props ?? {}) });

  const buttonClick = async (
    props: {
      button_text?: string;
      button_id?: string;
      location?: string;
    } & TrackProps = {}
  ) => event('button_click', props);

  const screenView = async (screen_name: string, props: TrackProps = {}) =>
    event('screen_view', { screen_name, screen_class: 'React', ...props });

  return { event, buttonClick, screenView } as const;
}
