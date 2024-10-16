"use client";
import axios from "axios";
import Markdown from "markdown-to-jsx";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function AuthPage() {
  const isRefreshFunctionCalled = useRef(false);

  const [currentMessages, setCurrentMessages] = useState<any[]>([]);
  const [latestMessage, setLatestMessage] = useState<string>("");

  const [conversation, setConversation] = useState<any[]>([]);

  const stateRef = useRef(currentMessages);

  useEffect(() => {
    stateRef.current = currentMessages;
  }, [currentMessages]);

  const handleMessageSubmit = async () => {
    try {
      // setConversation((prevState: any) => [
      //   ...prevState,
      //   { role: "user", content: latestMessage },
      // ]);

      // Create a temporary array that includes the new message
      const updatedMessages = [
        ...currentMessages,
        { role: "user", content: latestMessage },
      ];

      // Update the state with the new message
      setCurrentMessages(updatedMessages);

      // Prepare the data for the API call
      const data = { messages: updatedMessages };

      // Send the API request with the updated messages
      const res = await axios.post(
        "http://localhost:8080/perplexity/chat-completions",
        data
      );

      const updatedWithResponse = [
        ...updatedMessages,
        { role: "assistant", content: res.data.choices[0].message.content },
      ];
      setCurrentMessages(updatedWithResponse);

      // Clear the input field after submission
      setLatestMessage("");
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  const loadConversation = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8080/perplexity/load-conversation"
      );
      setConversation(res.data);
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  // Save Conversation before leaving the page:
  useEffect(() => {
    loadConversation();

    const handleBeforeUnload = (event: any) => {
      // if (!isRefreshFunctionCalled.current) {
      // This function will be called right before the user leaves the page
      // event.preventDefault();
      const data = {
        messages: stateRef.current,
      };
      try {
        const res = axios.post(
          "http://localhost:8080/perplexity/save-conversation",
          data
        );
        isRefreshFunctionCalled.current = true;
      } catch (error) {
        console.error("Error sending message", error);
      }
      // }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col justify-between">
      <div>
        {conversation?.map((e: any, index) => {
          return e.role === "user" ? (
            <div key={index} className="justify-end flex conversation">
              <div>{e.content}</div>
            </div>
          ) : (
            <div
              key={index}
              className="flex flex-col justify-start conversation"
            >
              <Markdown options={{ forceBlock: false, wrapper: "aside" }}>
                {e.content}
              </Markdown>
            </div>
          );
        })}
        {currentMessages?.map((e: any, index) => {
          return (
            <div
              key={index}
              className={
                e.role === "user"
                  ? `justify-end flex current-message`
                  : `flex justify-start current-message`
              }
            >
              <div className={e.role === "user" ? `` : ``}>{e.content}</div>
            </div>
          );
        })}
      </div>

      <div className="flex px-10 space-x-4 py-10">
        <input
          className="border w-full"
          onChange={(e) => setLatestMessage(e.target.value)}
          value={latestMessage}
        />
        <p className="" onClick={handleMessageSubmit}>
          Send
        </p>
      </div>
    </div>
  );
}
