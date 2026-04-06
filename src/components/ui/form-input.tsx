import { forwardRef, type InputHTMLAttributes } from 'react';
import {
  formControlClassName,
  isTemporalFormInputType,
  type FormControlSize,
} from '@/components/ui/form-control-classes';

export type FormInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  fieldSize?: FormControlSize;
};

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput(
    { fieldSize = 'default', className = '', type, ...props },
    ref,
  ) {
    const temporal = isTemporalFormInputType(
      typeof type === 'string' ? type : undefined,
    );
    return (
      <input
        ref={ref}
        type={type}
        className={formControlClassName({
          size: fieldSize,
          temporal,
          className,
        })}
        {...props}
      />
    );
  },
);
