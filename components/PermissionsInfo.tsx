/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

/**
 * A component that displays information on how to grant microphone permissions
 * when they have been denied by the user.
 */
export default function PermissionsInfo() {
  return (
    <div className="permissions-info">
      <h2>Microphone Access Denied</h2>
      <p>
        Eburon LLM Studio needs access to your microphone to capture your voice
        for the conversational agent.
      </p>
      <p>
        To enable microphone access, please go to your browser's settings for
        this site and change the microphone permission to "Allow". You may need
        to reload the page after changing the setting.
      </p>
    </div>
  );
}