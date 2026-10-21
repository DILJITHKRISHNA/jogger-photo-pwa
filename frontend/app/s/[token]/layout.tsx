import type { Metadata } from "next";

// The page a customer opens from a shared link — this title is what WhatsApp
// shows in the link preview.
export const metadata: Metadata = {
  title: { absolute: "Jogger Footwear — product photos" },
  description: "Tap to view and save the photos shared with you.",
  openGraph: {
    title: "Jogger Footwear — product photos",
    description: "Tap to view and save the photos shared with you.",
  },
};

export default function SharedPhotosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
