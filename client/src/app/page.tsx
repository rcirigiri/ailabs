"use client";
/**
 * @version 0.0.1
 * Updated On: November 6, 2024
 * Main ChatPage component. Initializes the chat interface and handles message flow.
 */

import React, { useState, useEffect, useRef } from "react";
import { socket } from "@/utils";
import { useErrorLog } from "@/hooks";
import ChatMessage from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";
import ChatInput from "@/components/ChatInput";
import { notification } from "antd";

interface Message {
  text: string;
  sender: "user" | "bot" | "error";
}

interface SocketResponse {
  message: string;
  isComplete: boolean;
  isError: boolean;
}

const ChatPage: React.FC = () => {
  //-------------- State & Variables --------------//
  const [chat, setChat] = useState<Message[]>([
    { text: "Hello! How can I assist you today?", sender: "bot" },
  ]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [partialResponse, setPartialResponse] = useState<string>(""); // Track partial response
  const [completedMessage, setCompletedMessage] = useState<string>(""); // Track completed message
  const [error, setError] = useState<string | null>(null); // Track errors separately
  const chatEndRef = useRef<HTMLDivElement>(null);
  const handleError = useErrorLog("pages/ChatPage");

  //-------------- Use Effects --------------//

  useEffect(() => {
    try {
      if (socket.connected) {
        setIsThinking(false);
      }

      const onConnect = () => {
        setIsThinking(false); // Hide thinking indicator when connected
      };

      const onDisconnect = () => setIsThinking(true); // Show thinking indicator when disconnected

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);

      // Listen for partial bot responses
      socket.on("response", (data: SocketResponse) => {
        const { message, isComplete, isError } = data;

        if (isError) {
          notification.error({
            message: JSON.parse(message)?.error?.message || "Unknown error",
          });
          setIsThinking(false); // Stop thinking indicator
        } else if (isComplete) {
          // Check if the full message has already been added
          if (completedMessage !== partialResponse + message) {
            // Add the full response to the chat when streaming is complete
            setChat((prev) => [
              ...prev,
              { text: partialResponse + message, sender: "bot" },
            ]);
            setCompletedMessage(partialResponse + message);
          }
          setPartialResponse(""); // Clear partial response state
          setIsThinking(false); // Stop thinking indicator
        } else {
          // Update the partial response state
          setPartialResponse((prev) => prev + message);
          setIsThinking(true);
        }
      });

      // Listen for socket errors
      socket.on("error", (error: { message: string }) => {
        console.error("Socket error:", error); // Log to console for debugging
        setError(error.message || "An error occurred");
        setIsThinking(false); // Hide typing indicator on error
        setChat((prev) => [
          ...prev,
          {
            text: `Error: ${error.message || "An error occurred"}`,
            sender: "error",
          },
        ]);
      });

      return () => {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("response"); // Clean up event listener
        socket.off("error"); // Clean up error listener
      };
    } catch (e: any) {
      handleError(e);
    }
  }, [partialResponse, completedMessage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, partialResponse]);

  //-------------- Other Methods --------------//

  /**
   * Sends a user message and triggers bot response.
   * @param {string} text - User input message
   */
  const sendMessage = (text: string): void => {
    if (text.trim()) {
      try {
        setChat((prev) => [...prev, { text, sender: "user" }]);
        setIsThinking(true); // Show thinking indicator
        setPartialResponse(""); // Reset partial response for new message
        setCompletedMessage(""); // Reset completed message tracker

        // Emit the message to the server
        socket.emit("chat message", { text });
      } catch (e: any) {
        handleError(e);
      }
    }
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
          {/* Display partial response */}
          {partialResponse && !error && (
            <ChatMessage message={{ text: partialResponse, sender: "bot" }} />
          )}
          {isThinking && <TypingIndicator />}

          <div ref={chatEndRef} />
        </main>
        <footer className="border-t border-gray-200 p-4">
          <ChatInput onSend={sendMessage} isThinking={isThinking} />
        </footer>
      </div>
    </div>
  );
};

export default ChatPage;
