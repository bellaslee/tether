import { ChevronDown } from 'lucide-react';
import { forwardRef, type SelectHTMLAttributes } from 'react';
import {
  picklistControlClassName,
  type FormControlSize,
} from '@/components/ui/form-control-classes';

const PICKLIST_SELECT_CLASS =
  'w-full cursor-pointer appearance-none disabled:cursor-not-allowed';

export type PicklistProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'size'
> & {
  fieldSize?: FormControlSize;
};

export const Picklist = forwardRef<HTMLSelectElement, PicklistProps>(
  function Picklist(
    { fieldSize = 'default', className = '', style, ...props },
    ref,
  ) {
    return (
      <div
        className={['relative w-full min-w-0', className].filter(Boolean).join(' ')}
      >
        <select
          ref={ref}
          className={[
            picklistControlClassName({ size: fieldSize }),
            PICKLIST_SELECT_CLASS,
          ]
            .filter(Boolean)
            .join(' ')}
          style={style}
          {...props}
        />
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-[0.75rem] size-4 -translate-y-1/2 text-muted"
          aria-hidden
          strokeWidth={2}
        />
      </div>
    );
  },
);
