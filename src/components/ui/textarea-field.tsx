import { forwardRef, type ReactNode } from 'react';
import { FieldError } from '@/components/ui/field-error';
import { FormTextarea, type FormTextareaProps } from '@/components/ui/form-textarea';
import type { FormControlSize } from '@/components/ui/form-control-classes';

export type TextareaFieldProps = Omit<FormTextareaProps, 'id'> & {
  id: string;
  label: string;
  labelClassName?: string;
  hint?: ReactNode;
  fieldError?: string;
  fieldSize?: FormControlSize;
  containerClassName?: string;
};

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField(
    {
      id,
      label,
      labelClassName = 'text-sm font-semibold',
      hint,
      fieldError,
      fieldSize,
      containerClassName,
      className,
      ...textareaProps
    },
    ref,
  ) {
    const errId = fieldError ? `${id}-error` : undefined;
    return (
      <div className={['space-y-2', containerClassName].filter(Boolean).join(' ')}>
        <label htmlFor={id} className={labelClassName}>
          {label}
        </label>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
        <FormTextarea
          ref={ref}
          id={id}
          fieldSize={fieldSize}
          className={className}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={errId}
          {...textareaProps}
        />
        {fieldError ? (
          <FieldError id={errId} size="compact">
            {fieldError}
          </FieldError>
        ) : null}
      </div>
    );
  },
);
