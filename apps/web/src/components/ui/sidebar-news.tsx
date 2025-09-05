'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import type * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import Link from '@/components/ui/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn, getCookie, setCookie } from '@/lib/utils';
import { trpc } from '@/utils/trpc';

export interface NewsArticle {
  href: string;
  title: string;
  summary: string;
  image: string;
}

const OFFSET_FACTOR = 4;
const SCALE_FACTOR = 0.03;
const OPACITY_FACTOR = 0.1;

const NEWS_COOKIE_NAME = 'dismissed-news';

function generateNewsHash(articles: NewsArticle[]): string {
  return articles
    .map((article) => article.href)
    .sort()
    .join(',');
}

export function News() {
  const {
    data: articles = [],
    isLoading,
    error,
  } = useQuery({
    ...trpc.news.getNews.queryOptions(),
  });
  const [dismissedNews, setDismissedNews] = useState<string[]>([]);
  const [dismissedLoading, setDismissedLoading] = useState(true);

  const cards = articles.filter(
    ({ href }: NewsArticle) => !dismissedNews.includes(href)
  );
  const cardCount = cards.length;
  const [showCompleted, setShowCompleted] = useState(cardCount > 0);

  useEffect(() => {
    if (articles.length === 0) {
      setDismissedLoading(false);
      return;
    }

    const currentHash = generateNewsHash(articles);
    const cookieValue = getCookie(NEWS_COOKIE_NAME);

    if (cookieValue) {
      try {
        const { hash, dismissed } = JSON.parse(cookieValue);
        if (hash === currentHash) {
          setDismissedNews(dismissed);
        } else {
          setDismissedNews([]);
          setCookie(
            NEWS_COOKIE_NAME,
            JSON.stringify({ hash: currentHash, dismissed: [] }),
            30
          );
        }
      } catch {
        setDismissedNews([]);
        setCookie(
          NEWS_COOKIE_NAME,
          JSON.stringify({ hash: currentHash, dismissed: [] }),
          30
        );
      }
    } else {
      setCookie(
        NEWS_COOKIE_NAME,
        JSON.stringify({ hash: currentHash, dismissed: [] }),
        30
      );
    }

    setDismissedLoading(false);
  }, [articles]);

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    if (cardCount === 0) {
      timeout = setTimeout(() => setShowCompleted(false), 2700);
    }
    return () => clearTimeout(timeout);
  }, [cardCount]);

  const handleDismiss = useCallback(
    (href: string) => {
      const newDismissed = [href, ...dismissedNews.slice(0, 50)];
      setDismissedNews(newDismissed);

      if (articles.length > 0) {
        const currentHash = generateNewsHash(articles);
        setCookie(
          NEWS_COOKIE_NAME,
          JSON.stringify({ hash: currentHash, dismissed: newDismissed }),
          30
        );
      }
    },
    [dismissedNews, articles]
  );

  if (isLoading || dismissedLoading) {
    return (
      <div className="p-3 text-center text-muted-foreground text-sm">
        Loading news...
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-3 text-center text-red-500 text-sm">
        Failed to load news
      </div>
    );
  }
  if (articles.length > 0 && cards.length === 0) {
    return (
      <div className="p-3 text-center text-muted-foreground text-sm">
        No new articles found
      </div>
    );
  }

  return cards.length || showCompleted ? (
    <div
      className="group overflow-hidden px-3 pt-8 pb-3"
      data-active={cardCount !== 0}
    >
      <div className="relative size-full">
        {cards
          .toReversed()
          .map(({ href, title, summary, image }: NewsArticle, idx: number) => (
            <div
              aria-hidden={idx !== cardCount - 1}
              className={cn(
                'absolute top-0 left-0 size-full scale-[var(--scale)] transition-[opacity,transform] duration-200',
                cardCount - idx > 3
                  ? [
                      'opacity-0 sm:group-hover:translate-y-[var(--y)] sm:group-hover:opacity-[var(--opacity)]',
                      'sm:group-has-[*[data-dragging=true]]:translate-y-[var(--y)] sm:group-has-[*[data-dragging=true]]:opacity-[var(--opacity)]',
                    ]
                  : 'translate-y-[var(--y)] opacity-[var(--opacity)]'
              )}
              key={href}
              style={
                {
                  '--y': `-${(cardCount - (idx + 1)) * OFFSET_FACTOR}%`,
                  '--scale': 1 - (cardCount - (idx + 1)) * SCALE_FACTOR,
                  '--opacity':
                    cardCount - (idx + 1) >= 6
                      ? 0
                      : 1 - (cardCount - (idx + 1)) * OPACITY_FACTOR,
                } as React.CSSProperties
              }
            >
              <NewsCard
                active={idx === cardCount - 1}
                description={summary}
                hideContent={cardCount - idx > 2}
                href={href}
                image={image}
                onDismiss={() => handleDismiss(href)}
                title={title}
              />
            </div>
          ))}
        <div aria-hidden className="pointer-events-none invisible">
          <NewsCard description="Description" title="Title" />
        </div>
        {showCompleted && !cardCount && (
          <div
            className="absolute inset-0 flex size-full animate-slide-up-fade flex-col items-center justify-center gap-3 [animation-duration:1s]"
            style={{ '--offset': '10px' } as React.CSSProperties}
          >
            <div className="absolute inset-0 animate-fade-in rounded-lg border border-neutral-300 [animation-delay:2.3s] [animation-direction:reverse] [animation-duration:0.2s]" />
            <AnimatedLogo className="w-1/3" />
            <span className="animate-fade-in font-medium text-muted-foreground text-xs [animation-delay:2.3s] [animation-direction:reverse] [animation-duration:0.2s]">
              You&apos;re all caught up!
            </span>
          </div>
        )}
      </div>
    </div>
  ) : null;
}

function NewsCard({
  title,
  description,
  image,
  onDismiss,
  hideContent,
  href,
  active,
}: {
  title: string;
  description: string;
  image?: string;
  onDismiss?: () => void;
  hideContent?: boolean;
  href?: string;
  active?: boolean;
}) {
  const isMobile = useIsMobile();

  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    start: number;
    delta: number;
    startTime: number;
    maxDelta: number;
  }>({
    start: 0,
    delta: 0,
    startTime: 0,
    maxDelta: 0,
  });
  const animation = useRef<Animation | null>(null);
  const [dragging, setDragging] = useState(false);

  const onDragMove = (e: PointerEvent) => {
    if (!ref.current) {
      return;
    }
    const { clientX } = e;
    const dx = clientX - drag.current.start;
    drag.current.delta = dx;
    drag.current.maxDelta = Math.max(drag.current.maxDelta, Math.abs(dx));
    ref.current.style.setProperty('--dx', dx.toString());
  };

  const dismiss = () => {
    if (!ref.current) {
      return;
    }

    const cardWidth = ref.current.getBoundingClientRect().width;
    const translateX = Math.sign(drag.current.delta) * cardWidth;

    // Dismiss card
    animation.current = ref.current.animate(
      { opacity: 0, transform: `translateX(${translateX}px)` },
      { duration: 150, easing: 'ease-in-out', fill: 'forwards' }
    );
    animation.current.onfinish = () => onDismiss?.();
  };

  const stopDragging = (cancelled: boolean) => {
    if (!ref.current) {
      return;
    }
    unbindListeners();
    setDragging(false);

    const dx = drag.current.delta;
    if (Math.abs(dx) > ref.current.clientWidth / (cancelled ? 2 : 3)) {
      dismiss();
      return;
    }

    // Animate back to original position
    animation.current = ref.current.animate(
      { transform: 'translateX(0)' },
      { duration: 150, easing: 'ease-in-out' }
    );
    animation.current.onfinish = () =>
      ref.current?.style.setProperty('--dx', '0');

    drag.current = { start: 0, delta: 0, startTime: 0, maxDelta: 0 };
  };

  const onDragEnd = () => stopDragging(false);
  const onDragCancel = () => stopDragging(true);

  const onPointerDown = (e: React.PointerEvent) => {
    if (
      !(active && ref.current) ||
      animation.current?.playState === 'running'
    ) {
      return;
    }

    bindListeners();
    setDragging(true);
    drag.current.start = e.clientX;
    drag.current.startTime = Date.now();
    drag.current.delta = 0;
    ref.current.style.setProperty('--w', ref.current.clientWidth.toString());
  };

  const onClick = () => {
    if (!ref.current) {
      return;
    }
    if (
      isMobile &&
      drag.current.maxDelta < ref.current.clientWidth / 10 &&
      (!drag.current.startTime || Date.now() - drag.current.startTime < 250)
    ) {
      // Touch user didn't drag far or for long, open the link
      window.open(href, '_blank');
    }
  };

  const bindListeners = () => {
    document.addEventListener('pointermove', onDragMove);
    document.addEventListener('pointerup', onDragEnd);
    document.addEventListener('pointercancel', onDragCancel);
  };

  const unbindListeners = () => {
    document.removeEventListener('pointermove', onDragMove);
    document.removeEventListener('pointerup', onDragEnd);
    document.removeEventListener('pointercancel', onDragCancel);
  };

  return (
    <Card
      className={cn(
        'relative select-none gap-2 p-3 text-[0.8125rem]',
        'translate-x-[calc(var(--dx)*1px)] rotate-[calc(var(--dx)*0.05deg)] opacity-[calc(1-max(var(--dx),-1*var(--dx))/var(--w)/2)]',
        'transition-shadow data-[dragging=true]:shadow-md'
      )}
      data-dragging={dragging}
      onClick={onClick}
      onPointerDown={onPointerDown}
      ref={ref}
    >
      <div className={cn(hideContent && 'invisible')}>
        <div className="flex flex-col gap-1">
          <span className="line-clamp-1 font-medium text-foreground">
            {title}
          </span>
          <p className="line-clamp-2 h-10 text-muted-foreground leading-5">
            {description}
          </p>
        </div>
        <div className="relative mt-3 aspect-[16/9] w-full shrink-0 overflow-hidden rounded border bg-muted">
          {image && (
            <Image
              alt=""
              className="rounded object-cover object-center"
              draggable={false}
              fill
              sizes="10vw"
              src={image}
            />
          )}
        </div>
        <div
          className={cn(
            'h-0 overflow-hidden opacity-0 transition-[height,opacity] duration-200',
            'sm:group-has-[*[data-dragging=true]]:h-7 sm:group-has-[*[data-dragging=true]]:opacity-100 sm:group-hover:group-data-[active=true]:h-7 sm:group-hover:group-data-[active=true]:opacity-100'
          )}
        >
          <div className="flex items-center justify-between pt-3 text-xs">
            <Link
              className="font-medium text-muted-foreground transition-colors duration-75 hover:text-foreground"
              href={href || 'https://dub.co'}
              target="_blank"
            >
              Read more
            </Link>
            <button
              className="text-muted-foreground transition-colors duration-75 hover:text-foreground"
              onClick={dismiss}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AnimatedLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="text-muted-foreground"
      fill="none"
      viewBox="0 0 48 21"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        clipRule="evenodd"
        d="M12 1H15V12.9332C15.0001 12.9465 15.0002 12.9598 15.0003 12.9731C15.0003 12.982 15.0003 12.991 15.0003 13C15.0003 13.0223 15.0002 13.0445 15 13.0668V20H12V18.7455C10.8662 19.5362 9.48733 20 8.00016 20C4.13408 20 1 16.866 1 13C1 9.13401 4.13408 6 8.00016 6C9.48733 6 10.8662 6.46375 12 7.25452V1ZM8 16.9998C10.2091 16.9998 12 15.209 12 12.9999C12 10.7908 10.2091 9 8 9C5.79086 9 4 10.7908 4 12.9999C4 15.209 5.79086 16.9998 8 16.9998Z"
        fillRule="evenodd"
        stroke="currentColor"
        strokeDasharray="63"
        strokeLinecap="round"
      >
        <animate
          attributeName="stroke-dashoffset"
          dur="2500ms"
          fill="freeze"
          values="63;0;0;0;63"
        />
      </path>
      <path
        clipRule="evenodd"
        d="M17 6H20V13V13C20 14.0608 20.4215 15.0782 21.1716 15.8283C21.9217 16.5784 22.9391 16.9998 24 16.9998C25.0609 16.9998 26.0783 16.5784 26.8284 15.8283C27.5785 15.0782 28 14.0608 28 13C28 13 28 13 28 13V6H31V13H31.0003C31.0003 13.9192 30.8192 14.8295 30.4675 15.6788C30.1157 16.5281 29.6 17.2997 28.95 17.9497C28.3 18.5997 27.5283 19.1154 26.679 19.4671C25.8297 19.8189 24.9194 20 24.0002 20C23.0809 20 22.1706 19.8189 21.3213 19.4671C20.472 19.1154 19.7003 18.5997 19.0503 17.9497C18.4003 17.2997 17.8846 16.5281 17.5329 15.6788C17.1811 14.8295 17 13.9192 17 13V13V6Z"
        fillRule="evenodd"
        stroke="currentColor"
        strokeDasharray="69"
        strokeLinecap="round"
      >
        <animate
          attributeName="stroke-dashoffset"
          dur="2500ms"
          fill="freeze"
          values="69;0;0;0;69"
        />
      </path>
      <path
        clipRule="evenodd"
        d="M33 1H36V7.25474C37.1339 6.46383 38.5128 6 40.0002 6C43.8662 6 47.0003 9.13401 47.0003 13C47.0003 16.866 43.8662 20 40.0002 20C36.1341 20 33 16.866 33 13V1ZM40 16.9998C42.2091 16.9998 44 15.209 44 12.9999C44 10.7908 42.2091 9 40 9C37.7909 9 36 10.7908 36 12.9999C36 15.209 37.7909 16.9998 40 16.9998Z"
        fillRule="evenodd"
        stroke="currentColor"
        strokeDasharray="60"
        strokeLinecap="round"
      >
        <animate
          attributeName="stroke-dashoffset"
          dur="2500ms"
          fill="freeze"
          values="-60;0;0;0;-60"
        />
      </path>
    </svg>
  );
}
