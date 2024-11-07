/**
 * ChatMessage Component - Renders individual message
 * @param {Object} message - Message object with text and sender
 */

import React from "react";
import { Avatar } from "antd";
import {
  UserOutlined,
  RobotOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";

interface MessageProps {
  message: {
    text: string;
    sender: "user" | "bot" | "error"; // Updated to support 'error'
  };
}

const ChatMessage: React.FC<MessageProps> = ({ message }) => {
  const { text, sender } = message;

  const getAvatar = () => {
    switch (sender) {
      case "user":
        return <UserOutlined />;
      case "bot":
        return <RobotOutlined />;
      case "error":
        return <ExclamationCircleOutlined style={{ color: "red" }} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex w-full px-3 mt-4 ${
        sender === "user" ? "justify-end" : "justify-start"
      }`}
      suppressHydrationWarning
    >
      <div
        className={`flex items-start space-x-3 max-w-[70%] ${
          sender === "user" ? "flex-row-reverse space-x-reverse" : ""
        }`}
      >
        <Avatar icon={getAvatar()} className="flex-shrink-0" />
        <div
          className={`p-3 rounded-lg ${
            sender === "user"
              ? "bg-blue-500 text-white"
              : sender === "bot"
              ? "bg-gray-100"
              : "bg-red-100"
          }`}
        >
          <p>{text}</p>
          <div className="text-xs font-medium text-right mt-2">
            {moment().format("hh:mm A")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
