/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import cn from 'classnames';

import { memo, ReactNode, useEffect, useRef, useState } from 'react';
import { AudioRecorder } from '../../../lib/audio-recorder';
import { useSettings, useTools, useLogStore } from '@/lib/state';

import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';

export type ControlTrayProps = {
  children?: ReactNode;
};

function ControlTray({ children }: ControlTrayProps) {
  const [audioRecorder] = useState(() => new AudioRecorder());
  // Start with microphone muted for privacy and user control.
  const [muted, setMuted] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  const { client, connected, connect, disconnect } = useLiveAPIContext();

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  // When disconnected or muted, reset all mic-related state.
  useEffect(() => {
    if (!connected) {
      setMuted(true);
    }
    if (!connected || muted) {
      setIsSpeaking(false);
    }
  }, [connected, muted]);

  // This effect hook manages the AudioRecorder lifecycle.
  // It starts recording when the session is connected and the mic is unmuted,
  // and stops otherwise.
  useEffect(() => {
    const onData = (base64: string) => {
      // Send recorded audio data to the Live API.
      client.sendRealtimeInput([
        {
          mimeType: 'audio/pcm;rate=16000',
          data: base64,
        },
      ]);
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    // The `start` method will automatically request microphone permissions.
    if (connected && !muted && audioRecorder) {
      audioRecorder.on('data', onData);
      audioRecorder.on('speechStart', onSpeechStart);
      audioRecorder.on('speechEnd', onSpeechEnd);
      audioRecorder.start();
    } else {
      audioRecorder.stop();
    }

    return () => {
      audioRecorder.stop();
      audioRecorder.off('data', onData);
      audioRecorder.off('speechStart', onSpeechStart);
      audioRecorder.off('speechEnd', onSpeechEnd);
    };
  }, [connected, client, muted, audioRecorder]);

  // Toggles microphone input only when a session is active.
  const handleMicClick = () => {
    if (connected) {
      setMuted(!muted);
    }
  };

  const handleExportLogs = () => {
    const { systemPrompt, model } = useSettings.getState();
    const { tools } = useTools.getState();
    const { turns } = useLogStore.getState();

    const logData = {
      configuration: {
        model,
        systemPrompt,
      },
      tools,
      conversation: turns.map(turn => ({
        ...turn,
        // Convert Date object to ISO string for JSON serialization
        timestamp: turn.timestamp.toISOString(),
      })),
    };

    const jsonString = JSON.stringify(logData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `eburon-telemetry-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Provide informative tooltips based on connection and mic state.
  const micButtonTitle = connected
    ? muted
      ? 'Unmute microphone'
      : 'Mute microphone'
    : 'Connect session to enable microphone';

  const connectButtonTitle = connected ? 'Stop Session' : 'Start Session';

  return (
    <section className="control-tray">
      <div className={cn('connection-container', { connected })}>
        <button
          ref={connectButtonRef}
          className={cn('action-button connect-toggle', { connected })}
          onClick={connected ? disconnect : connect}
          title={connectButtonTitle}
        >
          <span className="material-symbols-outlined filled">
            {connected ? 'stop' : 'play_arrow'}
          </span>
          {connected ? 'Stop' : 'Start'}
        </button>
      </div>
      <nav className={cn('actions-nav')}>
        <button
          className={cn('action-button mic-button', {
            active: connected && !muted,
            speaking: isSpeaking && !muted,
          })}
          onClick={handleMicClick}
          disabled={!connected}
          title={micButtonTitle}
        >
          {!muted ? (
            <span className="material-symbols-outlined filled">mic</span>
          ) : (
            <span className="material-symbols-outlined filled">mic_off</span>
          )}
        </button>
        <button
          className={cn('action-button')}
          onClick={handleExportLogs}
          aria-label="Export Telemetry"
          title="Export Telemetry (JSON)"
        >
          <span className="icon">monitoring</span>
        </button>
        <button
          className={cn('action-button')}
          onClick={useLogStore.getState().clearTurns}
          aria-label="Reset Session"
          title="Reset Session"
        >
          <span className="icon">refresh</span>
        </button>
        {children}
      </nav>
    </section>
  );
}

export default memo(ControlTray);