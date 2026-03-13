import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";


export type ExtractionStatus = "pending" | "processing" | "completed" | "failed";

export interface Extraction {
  id: string;
  user_id: string;
  file_path: string;
  status: ExtractionStatus;
  extracted_markdown: string | null;
  error_message: string | null;
  created_at: string;
}

export function useExtraction() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  /**
   * 1. Upload file to Supabase Storage
   * 2. Insert row into 'extractions' table (triggers the Python worker)
   */
  const startExtraction = async (file: File) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to upload documents.");

      // --- Step 1: Upload to Storage ---
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // --- Step 2: Create DB Record ---
      const { data, error: dbError } = await supabase
        .from("extractions")
        .insert({
          user_id: user.id,
          file_path: filePath,
          status: "pending",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return data as Extraction;
    } catch (error: any) {
      console.error("Extraction error:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Listen for real-time updates on a specific extraction
   */
  const subscribeToExtraction = (id: string, onUpdate: (data: Extraction) => void) => {
    const channel = supabase
      .channel(`extraction-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "extractions",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          onUpdate(payload.new as Extraction);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    startExtraction,
    subscribeToExtraction,
    loading,
  };
}
