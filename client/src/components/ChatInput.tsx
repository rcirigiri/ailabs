/**
 * ChatInput Component - Handles user message input
 * @param {Function} onSend - Function to send message
 */

import React, { useState } from "react";
import { Input, Button } from "antd";
import { SendOutlined } from "@ant-design/icons";

interface ChatInputProps {
  onSend: (text: string) => void;
  isThinking: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isThinking }) => {
  const [inputText, setInputText] = useState<string>("");

  const handleSend = () => {
    onSend(inputText);
    setInputText("");
  };

  return (
    <div className="flex items-center space-x-2">
      <Input.TextArea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type a message..."
        autoSize={{ minRows: 2, maxRows: 2 }}
        className="flex-grow border-none outline-none rounded-md px-2 py-2 resize-none focus:ring-0"
      />
      <Button
        type="primary"
        onClick={handleSend}
        disabled={!inputText.trim() || isThinking}
        shape="circle"
      >
        <SendOutlined />
      </Button>
    </div>
  );
};

export default ChatInput;
