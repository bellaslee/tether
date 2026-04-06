import {
  forwardRef,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from 'react';
import {
  formControlClassName,
  isTemporalFormInputType,
  type FormControlSize,
} from '@/components/ui/form-control-classes';
import { submitFormFromTextControl } from '@/components/ui/form-cmd-enter-submit';

export type FormInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  fieldSize?: FormControlSize;
};

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput(
    {
      fieldSize = 'default',
      className = '',
      type,
      onKeyDown,
      ...props
    },
    ref,
  ) {
    const temporal = isTemporalFormInputType(
      typeof type === 'string' ? type : undefined,
    );

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      if (
        !e.defaultPrevented &&
        (e.metaKey || e.ctrlKey) &&
        e.key === 'Enter' &&
        !e.nativeEvent.isComposing
      ) {
        e.preventDefault();
        submitFormFromTextControl(e.currentTarget);
      }
    };

    return (
      <input
        ref={ref}
        type={type}
        className={formControlClassName({
          size: fieldSize,
          temporal,
          className,
        })}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  },
);
