'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MutableRefObject,
  type TextareaHTMLAttributes,
} from 'react';
import {
  formControlClassName,
  type FormControlSize,
} from '@/components/ui/form-control-classes';

export type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  fieldSize?: FormControlSize;
  resize?: 'y' | 'none';
  /** When true, show voice-to-text control (bottom-right). Default true. */
  voiceInput?: boolean;
};

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
] as const;

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  for (const m of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

function extensionForMime(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('ogg')) return 'ogg';
  return 'webm';
}

function voicePaddingClass(size: FormControlSize): string {
  switch (size) {
    case 'compact':
      return 'pb-9 pr-11';
    case 'dense':
      return 'pb-9 pr-11';
    default:
      return 'pb-10 pr-12';
  }
}

function MicIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
      />
    </svg>
  );
}

type VoicePhase = 'idle' | 'recording' | 'transcribing';

function VoiceMicControl({
  textareaRef,
  fieldSize,
}: {
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>;
  fieldSize: FormControlSize;
}) {
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeRef = useRef<string>('audio/webm');
  const allowUploadRef = useRef(true);

  const stopStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  }, []);

  useEffect(() => {
    allowUploadRef.current = true;
    return () => {
      allowUploadRef.current = false;
      const rec = mediaRecorderRef.current;
      if (rec && rec.state !== 'inactive') {
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
      }
      mediaRecorderRef.current = null;
      stopStream();
    };
  }, [stopStream]);

  const appendTranscript = useCallback((text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const prefix = ta.value.length > 0 && !/\s$/.test(ta.value) ? ' ' : '';
    ta.value = `${ta.value}${prefix}${trimmed}`;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
  }, [textareaRef]);

  const uploadBlob = useCallback(
    async (blob: Blob) => {
      setPhase('transcribing');
      setVoiceError(null);
      const formData = new FormData();
      const ext = extensionForMime(blob.type || mimeRef.current);
      const name = `recording.${ext}`;
      formData.set(
        'audio',
        new File([blob], name, { type: blob.type || mimeRef.current }),
      );

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });

      const data: unknown = await res.json().catch(() => null);
      const errMsg =
        data && typeof data === 'object' && 'error' in data
          ? String((data as { error: unknown }).error)
          : null;

      if (!res.ok) {
        setVoiceError(errMsg || 'Could not transcribe audio. Try again.');
        setPhase('idle');
        return;
      }

      const text =
        data && typeof data === 'object' && 'text' in data
          ? String((data as { text: unknown }).text)
          : '';
      if (!text.trim()) {
        setVoiceError('No speech detected. Try speaking closer to the mic.');
        setPhase('idle');
        return;
      }

      appendTranscript(text);
      setPhase('idle');
    },
    [appendTranscript],
  );

  const stopRecording = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    setVoiceError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceError('Voice input is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mimeType = pickRecorderMime();
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mimeRef.current =
        recorder.mimeType || mimeType || 'audio/webm';
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onerror = () => {
        setVoiceError('Recording failed.');
        setPhase('idle');
        stopStream();
        mediaRecorderRef.current = null;
        chunksRef.current = [];
      };

      recorder.onstop = () => {
        stopStream();
        const blob = new Blob(chunksRef.current, {
          type: mimeRef.current,
        });
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        if (!allowUploadRef.current) {
          return;
        }
        void uploadBlob(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setPhase('recording');
    } catch {
      setVoiceError('Microphone access was denied or unavailable.');
      setPhase('idle');
      stopStream();
    }
  }, [stopStream, uploadBlob]);

  const onMicClick = useCallback(() => {
    if (phase === 'transcribing') return;
    if (phase === 'recording') {
      stopRecording();
      return;
    }
    void startRecording();
  }, [phase, startRecording, stopRecording]);

  const iconSize = fieldSize === 'default' ? 'h-5 w-5' : 'h-4 w-4';
  const btnSize = fieldSize === 'default' ? 'p-2' : 'p-1.5';

  return (
    <>
      <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1">
        {phase === 'transcribing' ? (
          <span
            className="pointer-events-none inline-block h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-accent"
            aria-hidden
          />
        ) : null}
        <button
          type="button"
          onClick={onMicClick}
          disabled={phase === 'transcribing'}
          aria-pressed={phase === 'recording'}
          aria-label={
            phase === 'recording'
              ? 'Stop recording and transcribe'
              : phase === 'transcribing'
                ? 'Transcribing'
                : 'Start voice input'
          }
          title={
            phase === 'recording'
              ? 'Stop and transcribe'
              : 'Speak to add text (tap again to stop)'
          }
          className={[
            'pointer-events-auto rounded-full border border-border-soft bg-white/90 text-foreground shadow-sm transition hover:bg-white disabled:opacity-50',
            btnSize,
            phase === 'recording' ? 'ring-2 ring-red-400/80' : '',
          ].join(' ')}
        >
          <MicIcon className={iconSize} />
        </button>
      </div>
      {voiceError ? (
        <p
          className="mt-1 text-xs text-red-800"
          role="status"
          aria-live="polite"
        >
          {voiceError}
        </p>
      ) : null}
    </>
  );
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea(
    {
      fieldSize = 'default',
      resize = 'none',
      className = '',
      voiceInput = true,
      onKeyDown,
      ...props
    },
    ref,
  ) {
    const localRef = useRef<HTMLTextAreaElement>(null);
    const setTextareaRef = useCallback(
      (el: HTMLTextAreaElement | null) => {
        localRef.current = el;
        if (typeof ref === 'function') {
          ref(el);
        } else if (ref != null) {
          (ref as MutableRefObject<HTMLTextAreaElement | null>).current = el;
        }
      },
      [ref],
    );

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

    const padding = voiceInput ? voicePaddingClass(fieldSize) : '';
    const textarea = (
      <textarea
        ref={voiceInput ? setTextareaRef : ref}
        className={formControlClassName({
          size: fieldSize,
          resize: resize === 'y' ? 'y' : 'none',
          className: [padding, className].filter(Boolean).join(' '),
        })}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );

    if (!voiceInput) {
      return textarea;
    }

    return (
      <div className="relative w-full">
        {textarea}
        <VoiceMicControl textareaRef={localRef} fieldSize={fieldSize} />
      </div>
    );
  },
);
