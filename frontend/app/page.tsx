"use client";

import { useState } from "react";

const API_URL = "pdf-chatbot-production-61fb.up.railway.app";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState<
    { role: string; content: string }[]
  >([]);

  async function uploadPDF() {
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("https://pdf-chatbot-production-61fb.up.railway.app/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      console.log(data);

      alert("PDF Uploaded Successfully");
    } catch (err) {
      console.error(err);
      alert("Upload Failed");
    }

    setUploading(false);
  }

  async function askQuestion() {
    if (!question.trim()) return;

    const userMessage = {
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);

    const currentQuestion = question;
    setQuestion("");

    try {
      const response = await fetch("https://pdf-chatbot-production-61fb.up.railway.app/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: currentQuestion,
        }),
      });

      const data = await response.json();

      const aiMessage = {
        role: "assistant",
        content: data.answer,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Backend Error",
        },
      ]);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <h1 className="text-4xl font-bold text-center mb-10">
          PDF Chatbot
        </h1>

        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* Upload */}

          <div className="border rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              Upload PDF
            </h2>

            <input
              type="file"
              accept=".pdf"
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
              className="mb-4 w-full"
            />

            <button
              onClick={uploadPDF}
              disabled={uploading}
              className="w-full bg-black text-white rounded-xl p-3"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>

          {/* Animation */}

          <div className="flex justify-center items-center h-[500px]">
            <div className="animate-bounce">
              <div className="w-40 h-40 rounded-full border-4 flex items-center justify-center text-5xl">
                🤖
              </div>
            </div>
          </div>

          {/* Chat */}

          <div className="border rounded-3xl p-6 shadow-sm">

            <h2 className="text-xl font-semibold mb-4">
              Chat With PDF
            </h2>

            <div className="h-[400px] overflow-y-auto border rounded-xl p-3 mb-4">

              {messages.length === 0 && (
                <p className="text-gray-400">
                  Ask questions about your PDF...
                </p>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 ${
                    msg.role === "user"
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  <div className="inline-block border rounded-xl px-3 py-2">
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={question}
                onChange={(e) =>
                  setQuestion(e.target.value)
                }
                placeholder="Ask a question..."
                className="flex-1 border rounded-xl p-3"
              />

              <button
                onClick={askQuestion}
                className="bg-black text-white px-5 rounded-xl"
              >
                Send
              </button>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}