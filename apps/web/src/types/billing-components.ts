// Account dropdown types
export interface User {
  name: string;
  email: string;
  image?: string | null;
}

export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
}

export interface AccountDropdownProps {
  user: User;
  onUpgradeClick: () => void;
}

export interface UserDisplayData {
  name: string;
  email: string;
  image: string | null;
  initials: string;
}

// Payment button types
export interface PaymentButtonProps {
  username: string;
  apiKey?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
  className?: string;
}

// Pricing dialog types
export interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade?: () => void;
}

// Payment modal types
export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientUsername: string;
  amount?: number;
}
