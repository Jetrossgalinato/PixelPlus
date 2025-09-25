"use client";
import { createContext, useContext, useState } from "react";

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
  const [image, setImage] = useState<UploadedImage>({
    file: null,
    dataUrl: null,
    fileName: "",
  });
  return (
    <ImageContext.Provider value={{ image, setImage }}>
      {children}
    </ImageContext.Provider>
  );
}

export function useImage() {
  return useContext(ImageContext);
}
