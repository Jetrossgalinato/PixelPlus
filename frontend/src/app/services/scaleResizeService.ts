const API_BASE_URL = "http://localhost:8000";

export type InterpMethod =
  | "nearest"
  | "linear"
  | "bilinear"
  | "cubic"
  | "area"
  | "lanczos";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data as T;
}

export const resizeImage = async (
  imageBase64: string,
  width: number,
  height: number,
  interpolation: InterpMethod = "linear"
): Promise<string> => {
  const imageData = imageBase64.startsWith('data:image/')
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`;

  const data = await postJson<{ image: string }>(`${API_BASE_URL}/resize`, {
    image: imageData,
    width,
    height,
    interpolation,
  });
  return data.image;
};

export const applyInterpolation = async (
  imageBase64: string,
  method: InterpMethod,
  opts: { width: number; height: number } | { scale_x: number; scale_y: number }
): Promise<string> => {
  const imageData = imageBase64.startsWith('data:image/')
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`;

  const data = await postJson<{ image: string }>(
    `${API_BASE_URL}/interpolation`,
    { image: imageData, method, ...opts }
  );
  return data.image;
};

export const cropImage = async (
  imageBase64: string,
  x: number,
  y: number,
  width: number,
  height: number,
  clamp: boolean = true
): Promise<string> => {
  const imageData = imageBase64.startsWith('data:image/')
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`;

  const data = await postJson<{ image: string }>(`${API_BASE_URL}/crop`, {
    image: imageData,
    x,
    y,
    width,
    height,
    clamp,
  });
  return data.image;
};