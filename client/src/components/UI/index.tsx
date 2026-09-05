import React from 'react';
import { DESIGN_SYSTEM } from '../constants/designSystem';

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'base' | 'large';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'base', isLoading = false, children, ...props }, ref) => {
    const sizeMap = {
      small: DESIGN_SYSTEM.sizes.buttonSmall,
      base: DESIGN_SYSTEM.sizes.buttonBase,
      large: DESIGN_SYSTEM.sizes.buttonLarge,
    };

    const variantStyles = {
      primary: {
        backgroundColor: DESIGN_SYSTEM.colors.primary,
        color: DESIGN_SYSTEM.colors.textPrimary,
      },
      secondary: {
        backgroundColor: DESIGN_SYSTEM.colors.inputs,
        color: DESIGN_SYSTEM.colors.textSecondary,
        border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
      },
      danger: {
        backgroundColor: DESIGN_SYSTEM.colors.error,
        color: DESIGN_SYSTEM.colors.textPrimary,
      },
      ghost: {
        backgroundColor: 'transparent',
        color: DESIGN_SYSTEM.colors.textSecondary,
        border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
      },
    };

    return (
      <button
        ref={ref}
        style={{
          height: sizeMap[size],
          padding: `0 ${DESIGN_SYSTEM.spacing.md}`,
          borderRadius: DESIGN_SYSTEM.borderRadius.md,
          fontSize: DESIGN_SYSTEM.typography.base,
          fontWeight: DESIGN_SYSTEM.typography.semibold,
          border: 'none',
          cursor: props.disabled || isLoading ? 'not-allowed' : 'pointer',
          transition: DESIGN_SYSTEM.transitions.fast,
          outline: 'none',
          opacity: props.disabled || isLoading ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: DESIGN_SYSTEM.spacing.sm,
          ...variantStyles[variant],
        }}
        onMouseEnter={(e) => {
          if (!props.disabled && !isLoading) {
            const btn = e.currentTarget;
            if (variant === 'primary') btn.style.backgroundColor = DESIGN_SYSTEM.colors.primaryHover;
            else if (variant === 'secondary' || variant === 'ghost') btn.style.borderColor = '#3a3a3a';
          }
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget;
          if (variant === 'primary') btn.style.backgroundColor = DESIGN_SYSTEM.colors.primary;
          else if (variant === 'secondary') btn.style.borderColor = DESIGN_SYSTEM.colors.border;
        }}
        disabled={props.disabled || isLoading}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <input
    ref={ref}
    style={{
      height: DESIGN_SYSTEM.sizes.inputHeight,
      padding: `0 ${DESIGN_SYSTEM.spacing.sm}`,
      fontSize: DESIGN_SYSTEM.typography.base,
      backgroundColor: DESIGN_SYSTEM.colors.inputs,
      border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
      borderRadius: DESIGN_SYSTEM.borderRadius.md,
      color: DESIGN_SYSTEM.colors.textPrimary,
      outline: 'none',
      transition: DESIGN_SYSTEM.transitions.fast,
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      ...props.style,
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.primary;
      e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0, 85, 255, 0.1)`;
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border;
      e.currentTarget.style.boxShadow = 'none';
    }}
    {...props}
  />
));

Input.displayName = 'Input';

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>((props, ref) => (
  <select
    ref={ref}
    style={{
      height: DESIGN_SYSTEM.sizes.inputHeight,
      padding: `0 ${DESIGN_SYSTEM.spacing.sm}`,
      fontSize: DESIGN_SYSTEM.typography.base,
      backgroundColor: DESIGN_SYSTEM.colors.inputs,
      border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
      borderRadius: DESIGN_SYSTEM.borderRadius.md,
      color: DESIGN_SYSTEM.colors.textPrimary,
      outline: 'none',
      transition: DESIGN_SYSTEM.transitions.fast,
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      cursor: 'pointer',
      ...props.style,
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.primary;
      e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0, 85, 255, 0.1)`;
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border;
      e.currentTarget.style.boxShadow = 'none';
    }}
    {...props}
  />
));

Select.displayName = 'Select';

// TextArea Component
interface TextAreaProps extends React.TextAreaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>((props, ref) => (
  <textarea
    ref={ref}
    style={{
      minHeight: '120px',
      padding: DESIGN_SYSTEM.spacing.sm,
      fontSize: DESIGN_SYSTEM.typography.base,
      backgroundColor: DESIGN_SYSTEM.colors.inputs,
      border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
      borderRadius: DESIGN_SYSTEM.borderRadius.md,
      color: DESIGN_SYSTEM.colors.textPrimary,
      outline: 'none',
      transition: DESIGN_SYSTEM.transitions.fast,
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      resize: 'vertical',
      ...props.style,
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.primary;
      e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0, 85, 255, 0.1)`;
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = DESIGN_SYSTEM.colors.border;
      e.currentTarget.style.boxShadow = 'none';
    }}
    {...props}
  />
));

TextArea.displayName = 'TextArea';

// Card Component
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ children, ...props }, ref) => (
  <div
    ref={ref}
    style={{
      backgroundColor: DESIGN_SYSTEM.colors.elevated,
      border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
      borderRadius: DESIGN_SYSTEM.borderRadius.lg,
      padding: DESIGN_SYSTEM.spacing.md,
      boxShadow: DESIGN_SYSTEM.shadows.sm,
      transition: DESIGN_SYSTEM.transitions.fast,
      ...props.style,
    }}
    {...props}
  >
    {children}
  </div>
));

Card.displayName = 'Card';

// Badge Component
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', children, ...props }, ref) => {
    const colorMap = {
      success: { bg: DESIGN_SYSTEM.colors.successLight, text: DESIGN_SYSTEM.colors.success },
      warning: { bg: DESIGN_SYSTEM.colors.warningLight, text: DESIGN_SYSTEM.colors.warning },
      error: { bg: DESIGN_SYSTEM.colors.errorLight, text: DESIGN_SYSTEM.colors.error },
      info: { bg: DESIGN_SYSTEM.colors.infoLight, text: DESIGN_SYSTEM.colors.info },
      default: { bg: DESIGN_SYSTEM.colors.tertiary, text: DESIGN_SYSTEM.colors.textSecondary },
    };

    const { bg, text } = colorMap[variant];

    return (
      <span
        ref={ref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
          fontSize: DESIGN_SYSTEM.typography.xs,
          fontWeight: DESIGN_SYSTEM.typography.semibold,
          backgroundColor: bg,
          color: text,
          borderRadius: DESIGN_SYSTEM.borderRadius.md,
          whiteSpace: 'nowrap',
          ...props.style,
        }}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Loading Skeleton Component
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: string;
  width?: string;
  circle?: boolean;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ height = '20px', width = '100%', circle = false, ...props }, ref) => (
    <div
      ref={ref}
      style={{
        height,
        width,
        backgroundColor: DESIGN_SYSTEM.colors.tertiary,
        borderRadius: circle ? '50%' : DESIGN_SYSTEM.borderRadius.md,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        ...props.style,
      }}
      {...props}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
);

Skeleton.displayName = 'Skeleton';
