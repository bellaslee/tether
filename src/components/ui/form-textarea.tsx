import {
  forwardRef,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from 'react';
import {
  formControlClassName,
  type FormControlSize,
} from '@/components/ui/form-control-classes';

export type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  fieldSize?: FormControlSize;
  resize?: 'y' | 'none';
};

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea(
    {
      fieldSize = 'default',
      resize = 'none',
      className = '',
      onKeyDown,
      ...props
    },
    ref,
  ) {
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(e);
      if (
        !e.defaultPrevented &&
        (e.metaKey || e.ctrlKey) &&
        e.key === 'Enter'
      ) {
        const form = e.currentTarget.form;
        if (form) {
          e.preventDefault();
          form.requestSubmit();
        }
      }
    };

    return (
      <textarea
        ref={ref}
        className={formControlClassName({
          size: fieldSize,
          resize: resize === 'y' ? 'y' : 'none',
          className,
        })}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  },
);
