"use client";
/**
 * @version 0.0.1
 * Updated On: November 6, 2024
 * Main ChatPage component. Initializes the chat interface and handles message flow.
 */

import React, { useState, useEffect, useRef } from "react";
import { socket } from "@/utils";
import ChatMessage from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";
import ChatInput from "@/components/ChatInput";
import { notification } from "antd";

interface Message {
  text: string;
  sender: "user" | "bot" | "error";
}

const ChatPage: React.FC = () => {
  //-------------- State & Variables --------------//
  const [chat, setChat] = useState<Message[]>([
    { text: "Hi, I'm Tasi. How can I assist you today?", sender: "bot" },
  ]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [imageRequested, setImageRequested] = useState<boolean>(false); // New state for image request
  const chatEndRef = useRef<HTMLDivElement>(null);
  // const handleError = useErrorLog("pages/ChatPage");

  //-------------- Use Effects --------------//

  useEffect(() => {
    try {
      const onConnect = () => setIsThinking(false);
      const onDisconnect = () => setIsThinking(true);

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);

      socket.on("message", (data: { message: string; isError?: boolean; requestImage?: boolean }) => {
        const { message, isError, requestImage } = data;

        if (isError) {
          notification.error({
            message: JSON.parse(message)?.error?.message || "Unknown error",
          });
          setIsThinking(false);
          setChat((prev) => [...prev, { text: `Error: ${message}`, sender: "error" }]);
        } else {
          setChat((prev) => [...prev, { text: message, sender: "bot" }]);
          setIsThinking(false);
          setImageRequested(!!requestImage); // Set image request state based on message data
        }
      });

      socket.on("error", (error: { message: string }) => {
        console.error("Socket error:", error);
        setChat((prev) => [
          ...prev,
          { text: `Error: ${error.message || "An error occurred"}`, sender: "error" },
        ]);
        setIsThinking(false);
      });

      return () => {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("message");
        socket.off("error");
      };
    } catch (e: any) {
      // handleError(e);
      console.warn(e);
      
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const sendMessage = (text: string): void => {
    if (text.trim()) {
      setChat((prev) => [...prev, { text, sender: "user" }]);
      setIsThinking(true);
      socket.emit("message", { text });
    }
  };

  const sendImage = (base64Image: string): void => {
    setChat((prev) => [...prev, { text: "[Image Sent]", sender: "user" }]);
    setIsThinking(true);
    socket.emit("image", { image: base64Image });
    setImageRequested(false); // Reset image request state after sending
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="flex flex-col h-[90vh] bg-white container mx-auto justify-center rounded-md overflow-hidden shadow-lg">
        <header className="border-b border-gray-200 p-4 bg-[#000080] text-white">
          <h1 className="text-3xl font-bold text-center">First Claim</h1>
          <p className="text-2xl font-semibold text-center">Settlement Bot</p>
        </header>
        <main className="flex-grow overflow-auto p-4 hide-scrollbar">
          {chat.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          {isThinking && <TypingIndicator />}
          <div ref={chatEndRef} />
        </main>
        <footer className="border-t border-gray-200 p-4">
          <ChatInput onSend={sendMessage} onSendImage={sendImage} isThinking={isThinking} imageRequested={imageRequested} />
        </footer>
      </div>
    </div>
  );
};

export default ChatPage;
