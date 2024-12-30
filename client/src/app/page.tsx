"use client";
/**
 * @version 0.0.1
 * Updated On: November 6, 2024
 * Main ChatPage component. Initializes the chat interface and handles message flow.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { socket } from "@/utils";
import ChatMessage from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";
import ChatInput from "@/components/ChatInput";
import ImagePreview from "@/components/ImagePreview";
import { notification, Progress } from "antd";
import { motion, AnimatePresence } from "framer-motion";

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
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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

  // const sendImage = useCallback((file: File): void => {
  //   const reader = new FileReader();
  //   reader.onload = (event) => {
  //     const base64Image = event.target?.result as string;
  //     setPreviewImage(base64Image);
  //     setChat((prev) => [...prev, { text: "[Image Sent]", sender: "user" }]);
  //     setIsThinking(true);

  //     // Simulate upload progress
  //     let progress = 0;
  //     const interval = setInterval(() => {
  //       progress += 10;
  //       setUploadProgress(progress);
  //       if (progress >= 100) {
  //         clearInterval(interval);
  //         socket.emit("image", { image: base64Image });
  //         setImageRequested(false);
  //         setUploadProgress(0);
  //       }
  //     }, 200);
  //   };
  //   reader.readAsDataURL(file);
  // }, []);

  const sendImage = useCallback((file: File): void => {
    const CHUNK_SIZE = 900 * 1024; // Chunk size in bytes (16 KB)
    const reader = new FileReader();
  
    reader.onload = (event) => {
      const base64Image = event.target?.result as string;
      setPreviewImage(base64Image);
      setChat((prev) => [...prev, { text: "[Image Sent]", sender: "user" }]);
      setIsThinking(true);
  
      // Split the base64 string into chunks
      const totalChunks = Math.ceil(base64Image.length / CHUNK_SIZE);
      let currentChunk = 0;
  
      const sendNextChunk = () => {
        if (currentChunk < totalChunks) {
          const start = currentChunk * CHUNK_SIZE;
          const end = start + CHUNK_SIZE;
          const chunk = base64Image.slice(start, end);
  
          socket.emit("image", {
            image: chunk,
            isChunk: true,
            isLastChunk: currentChunk === totalChunks - 1,
          });
  
          // Update upload progress
          const progress = Math.round(((currentChunk + 1) / totalChunks) * 100);
          setUploadProgress(progress);
  
          currentChunk++;
          setTimeout(sendNextChunk, 50); // Add delay between chunks if needed
        } else {
          // Reset states after sending
          setImageRequested(false);
          setUploadProgress(0);
        }
      };
  
      // Start sending chunks
      sendNextChunk();
    };
  
    reader.readAsDataURL(file);
  }, []);
  

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col h-[90vh] w-full max-w-4xl bg-white container mx-auto justify-center rounded-md overflow-hidden shadow-lg"
      >
        <header className="border-b border-gray-200 p-4 bg-[#000080] text-white">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl font-bold text-center"
          >
            First Claim
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-2xl font-semibold text-center"
          >
            Settlement Bot
          </motion.p>
        </header>
        <main className="flex-grow overflow-auto p-4 hide-scrollbar">
          <AnimatePresence>
            {chat.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ChatMessage message={message} />
              </motion.div>
            ))}
          </AnimatePresence>
          {isThinking && <TypingIndicator />}
          <div ref={chatEndRef} />
        </main>
        {previewImage && (
          <ImagePreview 
            src={previewImage} 
            onClose={() => setPreviewImage(null)} 
            progress={uploadProgress}
          />
        )}
        <footer className="border-t border-gray-200 p-4">
          <ChatInput 
            onSend={sendMessage} 
            onSendImage={sendImage} 
            isThinking={isThinking} 
            imageRequested={imageRequested} 
          />
        </footer>
      </motion.div>
    </div>
  );
};

export default ChatPage;

