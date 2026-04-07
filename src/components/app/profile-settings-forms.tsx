'use client';

import { useActionState, useEffect, useState } from 'react';
import type { ProfileFormState } from '@/lib/actions/profile';
import {
  updateAccountNameAction,
  updateAccountPasswordAction,
  updateAccountTimezoneAction,
} from '@/lib/actions/profile';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { TextField } from '@/components/ui/text-field';
import { Picklist } from '@/components/ui/picklist';

const nameInitial: ProfileFormState = {};
const passwordInitial: ProfileFormState = {};
const timezoneInitial: ProfileFormState = {};

type ProfileSettingsFormsProps = {
  defaultName: string;
  /** Persisted IANA zone, or empty when the user has not saved one yet. */
  savedTimezone: string;
  ianaTimeZones: readonly string[];
};

export function ProfileSettingsForms({
  defaultName,
  savedTimezone,
  ianaTimeZones,
}: ProfileSettingsFormsProps) {
  const [nameState, nameAction, namePending] = useActionState(
    updateAccountNameAction,
    nameInitial,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    updateAccountPasswordAction,
    passwordInitial,
  );
  const [timezoneState, timezoneAction, timezonePending] = useActionState(
    updateAccountTimezoneAction,
    timezoneInitial,
  );

  const [browserTzReady, setBrowserTzReady] = useState(false);
  useEffect(() => {
    setBrowserTzReady(true);
  }, []);

  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezoneSelectValue =
    savedTimezone.trim().length > 0 ? savedTimezone : browserTimeZone;

  const nameFormKey = nameState.success ? nameState.success : 'name';
  const passwordFormKey = passwordState.success ? passwordState.success : 'pw';
  const timezoneFormKey = timezoneState.success ? timezoneState.success : 'tz';

  return (
    <div className="space-y-10">
      <section className="card-surface rounded-2xl border border-border-soft p-6 sm:p-8">
        <h2 className="font-display text-xl tracking-tight">Your name</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          Shown in your account menu. Clear the field to drop a saved name; your
          menu will fall back to your email initial.
        </p>
        <form key={nameFormKey} action={nameAction} className="mt-6 space-y-5">
          {nameState.error ? <FieldError>{nameState.error}</FieldError> : null}
          {nameState.success ? (
            <p className="text-sm font-semibold text-accent">{nameState.success}</p>
          ) : null}
          <TextField
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            defaultValue={defaultName}
            label="Name"
            labelClassName="text-sm font-semibold text-foreground"
          />
          <Button type="submit" variant="primary" disabled={namePending}>
            {namePending ? 'Saving…' : 'Save name'}
          </Button>
        </form>
      </section>

      <section className="card-surface rounded-2xl border border-border-soft p-6 sm:p-8">
        <h2 className="font-display text-xl tracking-tight">Time zone</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          Used for dates and reminders in your local day. If you have not saved a
          preference yet, we default to what your browser reports (
          {browserTzReady ? browserTimeZone : '…'}).
        </p>
        {!browserTzReady ? (
          <p className="mt-6 text-sm text-muted">Preparing time zone list…</p>
        ) : (
          <form
            key={timezoneFormKey}
            action={timezoneAction}
            className="mt-6 space-y-5"
          >
            {timezoneState.error ? (
              <FieldError>{timezoneState.error}</FieldError>
            ) : null}
            {timezoneState.success ? (
              <p className="text-sm font-semibold text-accent">
                {timezoneState.success}
              </p>
            ) : null}
            <div className="space-y-2">
              <label
                htmlFor="timezone"
                className="text-sm font-semibold text-foreground"
              >
                Time zone
              </label>
              <Picklist
                id="timezone"
                name="timezone"
                defaultValue={timezoneSelectValue}
              >
                {ianaTimeZones.map((z) => (
                  <option key={z} value={z}>
                    {z.replace(/_/g, ' ')}
                  </option>
                ))}
              </Picklist>
            </div>
            <Button type="submit" variant="secondary" disabled={timezonePending}>
              {timezonePending ? 'Saving…' : 'Save time zone'}
            </Button>
          </form>
        )}
      </section>

      <section className="card-surface rounded-2xl border border-border-soft p-6 sm:p-8">
        <h2 className="font-display text-xl tracking-tight">Password</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          Choose a strong password you have not used elsewhere.
        </p>
        <form
          key={passwordFormKey}
          action={passwordAction}
          className="mt-6 space-y-5"
        >
          {passwordState.error ? (
            <FieldError>{passwordState.error}</FieldError>
          ) : null}
          {passwordState.success ? (
            <p className="text-sm font-semibold text-accent">
              {passwordState.success}
            </p>
          ) : null}
          <TextField
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            label="New password"
            labelClassName="text-sm font-semibold text-foreground"
            hintAfter="At least 8 characters."
          />
          <TextField
            id="password_confirm"
            name="password_confirm"
            type="password"
            autoComplete="new-password"
            required
            label="Confirm new password"
            labelClassName="text-sm font-semibold text-foreground"
          />
          <Button type="submit" variant="secondary" disabled={passwordPending}>
            {passwordPending ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </section>
    </div>
  );
}
