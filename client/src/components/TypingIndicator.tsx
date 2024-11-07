/**
 * TypingIndicator Component - Shows a typing indicator
 */

import { Avatar } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import React from "react";

const TypingIndicator: React.FC = () => (
  <div className={`flex w-full justify-start mt-4`}>
    <div className={`flex space-x-3 max-w-[70%]`}>
      <Avatar icon={<RobotOutlined />} className="flex-shrink-0" />
      <div>
        <div className="chat-bubble">
          <div className="typing">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default TypingIndicator;
