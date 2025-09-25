"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export type UploadedImage = {
  file: File | null;
  dataUrl: string | null;
  fileName: string;
};

const ImageContext = createContext<{
  image: UploadedImage;
  setImage: (img: UploadedImage) => void;
}>({
  image: { file: null, dataUrl: null, fileName: "" },
  setImage: () => {},
});

export function ImageProvider({ children }: { children: React.ReactNode }) {
  const [image, setImageState] = useState<UploadedImage>({
    file: null,
    dataUrl: null,
    fileName: "",
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("pixelplus-image");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.dataUrl && parsed.fileName) {
          // Convert dataUrl back to File object
          const dataUrl = parsed.dataUrl;
          const fileName = parsed.fileName;
          // Helper to convert dataURL to File
          function dataURLtoFile(dataurl: string, filename: string) {
            const arr = dataurl.split(",");
            const mimeMatch = arr[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : "image/png";
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            return new File([u8arr], filename, { type: mime });
          }
          const file = dataURLtoFile(dataUrl, fileName);
          setImageState({
            file,
            dataUrl,
            fileName,
          });
        }
      } catch {}
    }
  }, []);

  // Persist to localStorage when image changes
  const setImage = useCallback((img: UploadedImage) => {
    setImageState(img);
    if (img.dataUrl && img.fileName) {
      // If a new image is selected, clear edit preview and undo stack
      localStorage.setItem(
        "pixelplus-image",
        JSON.stringify({ dataUrl: img.dataUrl, fileName: img.fileName })
      );
      localStorage.removeItem("pixelplus-edit-preview");
      localStorage.removeItem("pixelplus-edit-undo");
    } else {
      localStorage.removeItem("pixelplus-image");
      localStorage.removeItem("pixelplus-edit-preview");
      localStorage.removeItem("pixelplus-edit-undo");
    }
  }, []);

  return (
    <ImageContext.Provider value={{ image, setImage }}>
      {children}
    </ImageContext.Provider>
  );
}

export function useImage() {
  return useContext(ImageContext);
}
