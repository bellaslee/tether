import { forwardRef, type ReactNode } from 'react';
import { FieldError } from '@/components/ui/field-error';
import { FormInput, type FormInputProps } from '@/components/ui/form-input';
import { RequiredMark } from '@/components/ui/required-mark';
import type { FormControlSize } from '@/components/ui/form-control-classes';

export type TextFieldProps = Omit<FormInputProps, 'id'> & {
  id: string;
  label: string;
  labelClassName?: string;
  hint?: ReactNode;
  /** Helper text shown under the control (e.g. password requirements). */
  hintAfter?: ReactNode;
  fieldError?: string;
  fieldSize?: FormControlSize;
  containerClassName?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      id,
      label,
      labelClassName = 'text-sm font-semibold',
      hint,
      hintAfter,
      fieldError,
      fieldSize,
      containerClassName,
      className,
      required,
      ...inputProps
    },
    ref,
  ) {
    const errId = fieldError ? `${id}-error` : undefined;
    return (
      <div
        className={['min-w-0 space-y-2', containerClassName]
          .filter(Boolean)
          .join(' ')}
      >
        <label htmlFor={id} className={labelClassName}>
          {label}
          {required ? <RequiredMark /> : null}
        </label>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
        <FormInput
          ref={ref}
          id={id}
          fieldSize={fieldSize}
          className={className}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={errId}
          required={required}
          {...inputProps}
        />
        {hintAfter ? <p className="text-xs text-muted">{hintAfter}</p> : null}
        {fieldError ? (
          <FieldError id={errId} size="compact">
            {fieldError}
          </FieldError>
        ) : null}
      </div>
    );
  },
);
