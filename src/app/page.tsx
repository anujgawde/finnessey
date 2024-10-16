"use client";
import axios from "axios";
import Markdown from "markdown-to-jsx";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const isRefreshFunctionCalled = useRef(false);

  const [currentMessages, setCurrentMessages] = useState<any[]>([]);
  const [latestMessage, setLatestMessage] = useState<string>("");
  const [financials, setFinancials] = useState();

  const [conversation, setConversation] = useState<any[]>([]);

  const stateRef = useRef(currentMessages);

  useEffect(() => {
    stateRef.current = currentMessages;
  }, [currentMessages]);

  const handleMessageSubmit = async () => {
    try {
      // Create a temporary array that includes the new message

      const updatedMessages = [
        ...currentMessages,
        { role: "user", content: latestMessage },
      ];
      // Clear the input field after submission
      setLatestMessage("");

      // Prepare the data for the API call
      const data = { messages: [...conversation, ...updatedMessages] };

      // Send the API request with the updated messages
      const res = await axios.post(
        "http://localhost:8080/perplexity/chat-completions",
        data
      );

      console.log(res.data);

      const updatedWithResponse = [
        ...updatedMessages,
        { role: "assistant", content: res.data.choices[0].message.content },
      ];
      setCurrentMessages(updatedWithResponse);
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
      console.log(res.data);
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  // TODO: Add financials in a prompt to set up the system prompt. Remove it from the backend
  const fetchFinancials = async () => {
    const res = await axios.get(
      "http://localhost:8080/financials/get-user-financials"
    );
    setFinancials(res.data);
  };

  const submitFinancialsHandler = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const data = {
      income: formData.get("income"),
      currentMonthExpense: formData.get("currentMonthExpense"),
      expectedMonthlyExpense: formData.get("expectedMonthlyExpense"),
      savings: formData.get("savings"),
      goal: formData.get("goal"),
    };

    const res = await axios.post(
      "http://localhost:8080/financials/save-user-financials",
      data
    );
    window.location.reload;
  };

  // Save Conversation before leaving the page:
  useEffect(() => {
    loadConversation();
    fetchFinancials();

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

  return financials ? (
    <div className="max-h-screen h-screen overflow-hidden flex flex-col justify-between bg-[#0A0A0A] ">
      <div className="flex flex-col items-center text-white max-h-[90vh]">
        <div className="max-w-[80%] py-10 space-y-4 overflow-y-auto flex-1">
          {conversation?.map((e: any, index) => {
            return e.role === "system" ? (
              <div key={index} className="hidden"></div>
            ) : e.role === "user" ? (
              <div key={index} className="justify-end flex conversation">
                <div className="bg-[#1E3A34] text-white max-w-[60%] rounded-lg py-2 px-4">
                  {e.content}
                </div>
              </div>
            ) : (
              <div
                key={index}
                className="flex flex-col justify-start conversation text-white max-w-[60%]"
              >
                <Markdown
                  options={{
                    forceBlock: false,
                    wrapper: "aside",
                  }}
                >
                  {e.content}
                </Markdown>
              </div>
            );
          })}
          {currentMessages?.map((e: any, index) => {
            return e.role === "system" ? (
              <div key={index} className="hidden"></div>
            ) : e.role === "user" ? (
              <div key={index} className={` justify-end flex current-message`}>
                <div className="bg-[#1E3A34] text-white max-w-[60%] rounded-lg py-2 px-4">
                  {e.content}
                </div>
              </div>
            ) : (
              <div
                key={index}
                className={`flex flex-col justify-start current-message text-white max-w-[60%]`}
              >
                <Markdown
                  options={{
                    forceBlock: false,
                    wrapper: "aside",
                  }}
                >
                  {e.content}
                </Markdown>
              </div>
            );
          })}
        </div>
        <div className="flex space-x-4 py-10 bottom-0 absolute  w-full justify-center">
          <input
            className="border max-w-[80%] w-full"
            onChange={(e) => setLatestMessage(e.target.value)}
            value={latestMessage}
          />
          <p className="text-white" onClick={handleMessageSubmit}>
            Send
          </p>
        </div>
      </div>
    </div>
  ) : (
    <div className="h-screen w-full flex justify-center items-center">
      <div className="border rounded-xl w-2/3 h-[70%]">
        <form
          className="flex flex-col space-y-4"
          onSubmit={submitFinancialsHandler}
        >
          <div>
            <label>Enter Income</label>
            <input name="income" type="number" className="border" />
          </div>
          <div>
            <label>Current Monthly Expenses</label>
            <input
              name="currentMonthExpense"
              type="number"
              className="border"
            />
          </div>
          <div>
            <label>Expected Monthly Expense</label>
            <input
              name="expectedMonthlyExpense"
              type="number"
              className="border"
            />
          </div>
          <div>
            <label>Total Saivings</label>
            <input name="savings" type="number" className="border" />
          </div>
          <div>
            <label>Financial Goal</label>
            <input name="goal" className="border" />
          </div>
          <button className="border py-2">Submit</button>
        </form>
      </div>
    </div>
  );
}
