interface AvatarProps {
  className?: string;
  children: React.ReactNode;
}

export function Avatar({ className = '', children }: AvatarProps) {
  return (
    <div className={`relative flex size-8 shrink-0 overflow-hidden rounded-full ${className}`}>
      {children}
    </div>
  );
}

interface AvatarImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function AvatarImage({ src, alt, className = '' }: AvatarImageProps) {
  if (!src) return null;
  
  return (
    <img
      src={src}
      alt={alt}
      className={`aspect-square size-full object-cover ${className}`}
    />
  );
}

interface AvatarFallbackProps {
  className?: string;
  children: React.ReactNode;
}

export function AvatarFallback({ className = '', children }: AvatarFallbackProps) {
  return (
    <div className={`flex size-full items-center justify-center rounded-full bg-muted text-muted-foreground ${className}`}>
      {children}
    </div>
  );
}
