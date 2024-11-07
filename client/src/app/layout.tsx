import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "@/styles/index.css";

export const metadata = {
  title: "First Claim Settlement Bot",
  description: "A chatbot application using Next.js and Ant Design",
  openGraph: {
    title: "Chatbot",
    description: "A chatbot application using Next.js and Ant Design",
    type: "website",
    url: "https://example.com/chatbot",
    image: "/favicon.png",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chatbot",
    description: "A chatbot application using Next.js and Ant Design",
    image: "/favicon.png",
  },
};


const RootLayout = ({ children }: React.PropsWithChildren) => (
  <html lang="en" suppressHydrationWarning>
    <body>
      <AntdRegistry>{children}</AntdRegistry>
    </body>
  </html>
);

export default RootLayout;
