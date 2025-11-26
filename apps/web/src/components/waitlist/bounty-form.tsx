"use client";

import { useState } from "react";
import { Github } from "lucide-react";
import { api } from "@/trpc/client";

interface BountyFormProps {
  onSubmitSuccess: (email: string, entryId: string) => void;
}

export function BountyForm({ onSubmitSuccess }: BountyFormProps) {
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitMutation = api.waitlist.submit.useMutation();

  const handleSubmit = async () => {
    if (!email) return;
    setIsSubmitting(true);

    try {
      const result = await submitMutation.mutateAsync({
        email,
        title: title || undefined,
        description: description || undefined,
        price: price ? parseInt(price) * 100 : undefined, // Convert to cents
      });

      onSubmitSuccess(email, result.entryId);
    } catch (error) {
      console.error("Failed to submit:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-[21px] bg-[#191919] border border-[#232323] overflow-hidden">
      {/* Top row: Email input + hint */}
      <div className="flex items-center justify-between px-4 py-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email..."
          className="bg-transparent text-white text-base outline-none placeholder:text-[#5A5A5A] flex-1"
        />
        <span className="text-[#5A5A5A] text-base hidden sm:block">
          Create a bounty to join the waitlist
        </span>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-[#1E1E1E]" />

      {/* Chips row */}
      <div className="flex flex-row flex-wrap items-center gap-2.5 px-4 py-3">
        {/* Title chip */}
        {activeField === "title" ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => !title && setActiveField(null)}
            placeholder="Enter title..."
            autoFocus
            className="rounded-full px-4 py-1.5 bg-[#201F1F] text-white text-base outline-none placeholder:text-[#5A5A5A] min-w-[120px]"
          />
        ) : (
          <button
            onClick={() => setActiveField("title")}
            className={`rounded-full px-4 py-1.5 bg-[#201F1F] text-base transition-colors ${
              title ? "text-white" : "text-[#5A5A5A] hover:text-white"
            }`}
          >
            {title || "Title"}
          </button>
        )}

        {/* Description chip */}
        {activeField === "description" ? (
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => !description && setActiveField(null)}
            placeholder="Enter description..."
            autoFocus
            className="rounded-full px-4 py-1.5 bg-[#201F1F] text-white text-base outline-none placeholder:text-[#5A5A5A] min-w-[150px]"
          />
        ) : (
          <button
            onClick={() => setActiveField("description")}
            className={`rounded-full px-4 py-1.5 bg-[#201F1F] text-base transition-colors ${
              description ? "text-white" : "text-[#5A5A5A] hover:text-white"
            }`}
          >
            {description || "Description"}
          </button>
        )}

        {/* Price chip */}
        {activeField === "price" ? (
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
            onBlur={() => !price && setActiveField(null)}
            placeholder="0"
            autoFocus
            className="rounded-full px-4 py-1.5 bg-[#201F1F] text-white text-base outline-none placeholder:text-[#5A5A5A] w-[80px]"
          />
        ) : (
          <button
            onClick={() => setActiveField("price")}
            className={`rounded-full px-4 py-1.5 bg-[#201F1F] text-base transition-colors ${
              price ? "text-white" : "text-[#5A5A5A] hover:text-white"
            }`}
          >
            {price ? `$${price}` : "$ Price"}
          </button>
        )}

        {/* Divider text */}
        <span className="text-[#5A5A5A] text-base">or</span>

        {/* GitHub import chip */}
        <button className="rounded-full flex items-center gap-1.5 px-4 py-1.5 bg-[#201F1F] text-base text-[#5A5A5A] hover:text-white transition-colors">
          <Github size={14} />
          Import from GitHub issue
        </button>
      </div>

      {/* Footer row with submit */}
      <div className="flex justify-end px-4 py-3">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !email}
          className="flex items-center justify-center gap-1.5 px-[13px] h-[32px] rounded-full text-white text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            backgroundImage: "linear-gradient(180deg, #ccc 0%, #808080 100%)",
          }}
        >
          {isSubmitting ? "Joining..." : "Join waitlist"}
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
