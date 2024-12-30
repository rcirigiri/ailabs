import React, { useState, useRef } from "react";
import { Input, Button } from "antd";
import { SendOutlined, PictureOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string) => void;
  onSendImage: (file: File) => void;
  isThinking: boolean;
  imageRequested: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onSendImage,
  isThinking,
  imageRequested,
}) => {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // const maxSizeInBytes = 1 * 1024 * 1024; // 1MB limit

    // if (file && file.size > maxSizeInBytes) {
    //   alert("The selected image exceeds the maximum size of 1MB.");
    //   return;
    // }
    if (file) {
      onSendImage(file);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Input.TextArea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your message here..."
        autoSize={{ minRows: 1, maxRows: 4 }}
        className="flex-grow"
      />
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={isThinking}
        >
          Send
        </Button>
      </motion.div>
      {imageRequested && (
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            icon={<PictureOutlined />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isThinking}
          >
            Upload Image
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: "none" }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default ChatInput;
