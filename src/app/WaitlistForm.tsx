"use client";

import { useState } from "react";
import { joinWaitlist } from "~/server/actions/waitlist";
import { Loader2 } from "lucide-react";

export default function WaitlistForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | null;
  }>({ text: "", type: null });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: "", type: null });

    try {
      const formData = new FormData(e.currentTarget);
      const response = await joinWaitlist(formData);

      if (response.success) {
        setMessage({ text: response.message, type: "success" });
        // Clear form if successful and not already on waitlist
        if (!response.message.includes("already")) {
          (e.target as HTMLFormElement).reset();
        }
      } else {
        setMessage({ text: response.message, type: "error" });
      }
    } catch (error) {
      setMessage({
        text: "An unexpected error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            className="w-full rounded-lg border border-gray-300 bg-white/80 p-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
        <div>
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            required
            className="w-full rounded-lg border border-gray-300 bg-white/80 p-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full transform rounded-lg bg-orange-500 py-3 font-bold text-white transition duration-300 hover:bg-orange-600 disabled:opacity-70"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </span>
          ) : (
            "Join Waitlist"
          )}
        </button>
      </form>

      {message.text && (
        <div
          className={`mt-4 rounded-lg p-3 text-center text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : message.type === "error"
                ? "bg-red-100 text-red-800"
                : ""
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
