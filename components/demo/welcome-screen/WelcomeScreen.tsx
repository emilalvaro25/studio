/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import './WelcomeScreen.css';

const WelcomeScreen: React.FC = () => {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="eburon-logo">
          Eburon
        </div>
        <p>LLM Studio for Conversational Agents</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
