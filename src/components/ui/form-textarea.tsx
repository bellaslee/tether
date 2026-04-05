import { forwardRef, type TextareaHTMLAttributes } from 'react';
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
    { fieldSize = 'default', resize = 'none', className = '', ...props },
    ref,
  ) {
    return (
      <textarea
        ref={ref}
        className={formControlClassName({
          size: fieldSize,
          resize: resize === 'y' ? 'y' : 'none',
          className,
        })}
        {...props}
      />
    );
  },
);
