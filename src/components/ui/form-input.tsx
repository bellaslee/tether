import { forwardRef, type InputHTMLAttributes } from 'react';
import {
  formControlClassName,
  type FormControlSize,
} from '@/components/ui/form-control-classes';

export type FormInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  fieldSize?: FormControlSize;
};

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput({ fieldSize = 'default', className = '', ...props }, ref) {
    return (
      <input
        ref={ref}
        className={formControlClassName({ size: fieldSize, className })}
        {...props}
      />
    );
  },
);
