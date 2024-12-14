import React, { useState } from "react";
import { Input, Button, Upload, message } from "antd";
import { SendOutlined, UploadOutlined } from "@ant-design/icons";
import type { RcFile } from "antd/es/upload/interface";

interface ChatInputProps {
  onSend: (text: string) => void;
  onSendImage: (base64Image: string) => void;
  isThinking: boolean;
  imageRequested: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, onSendImage, isThinking, imageRequested }) => {
  const [inputText, setInputText] = useState<string>("");

  const handleSend = () => {
    if (inputText.trim()) {
      onSend(inputText);
      setInputText("");
    }
  };

  const getBase64 = (file: RcFile): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleUpload = async (file: RcFile) => {
    try {
      const base64 = await getBase64(file);
      onSendImage(base64);
      message.success("Image uploaded successfully!");
    } catch (error) {
      console.log(">>> ~ handleUpload ~ error:", error)
      message.error("Image upload failed.");
    }
    return false; // Prevent antd from auto-uploading
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
      {imageRequested && (
        <Upload
          beforeUpload={handleUpload}
          showUploadList={false}
          accept="image/png"
        >
          <Button icon={<UploadOutlined />} disabled={isThinking}>
            Upload Image
          </Button>
        </Upload>
      )}
    </div>
  );
};

export default ChatInput;
