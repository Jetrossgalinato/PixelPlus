const API_BASE_URL = "http://localhost:8000";

export type ArithmeticOperation = "add" | "subtract" | "multiply" | "divide";
export type BitwiseOperation = "and" | "or" | "xor" | "not";

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

// Arithmetic Operations
export const addImages = async (
  image1: string,
  image2: string,
  weight1: number = 0.5,
  weight2: number = 0.5
): Promise<string> => {
  const img1 = image1.startsWith('data:image/') ? image1 : `data:image/png;base64,${image1}`;
  const img2 = image2.startsWith('data:image/') ? image2 : `data:image/png;base64,${image2}`;

  const data = await postJson<{ image: string }>(`${API_BASE_URL}/arithmetic/add`, {
    image1: img1,
    image2: img2,
    weight1,
    weight2,
  });
  return data.image;
};

export const subtractImages = async (
  image1: string,
  image2: string
): Promise<string> => {
  const img1 = image1.startsWith('data:image/') ? image1 : `data:image/png;base64,${image1}`;
  const img2 = image2.startsWith('data:image/') ? image2 : `data:image/png;base64,${image2}`;

  const data = await postJson<{ image: string }>(`${API_BASE_URL}/arithmetic/subtract`, {
    image1: img1,
    image2: img2,
  });
  return data.image;
};

export const multiplyImages = async (
  image1: string,
  image2: string,
  scale: number = 1.0
): Promise<string> => {
  const img1 = image1.startsWith('data:image/') ? image1 : `data:image/png;base64,${image1}`;
  const img2 = image2.startsWith('data:image/') ? image2 : `data:image/png;base64,${image2}`;

  const data = await postJson<{ image: string }>(`${API_BASE_URL}/arithmetic/multiply`, {
    image1: img1,
    image2: img2,
    scale,
  });
  return data.image;
};

export const divideImages = async (
  image1: string,
  image2: string,
  scale: number = 1.0
): Promise<string> => {
  const img1 = image1.startsWith('data:image/') ? image1 : `data:image/png;base64,${image1}`;
  const img2 = image2.startsWith('data:image/') ? image2 : `data:image/png;base64,${image2}`;

  const data = await postJson<{ image: string }>(`${API_BASE_URL}/arithmetic/divide`, {
    image1: img1,
    image2: img2,
    scale,
  });
  return data.image;
};

// Bitwise Operations
export const bitwiseAnd = async (
  image1: string,
  image2: string
): Promise<string> => {
  const img1 = image1.startsWith('data:image/') ? image1 : `data:image/png;base64,${image1}`;
  const img2 = image2.startsWith('data:image/') ? image2 : `data:image/png;base64,${image2}`;

  const data = await postJson<{ image: string }>(`${API_BASE_URL}/bitwise/and`, {
    image1: img1,
    image2: img2,
  });
  return data.image;
};

export const bitwiseOr = async (
  image1: string,
  image2: string
): Promise<string> => {
  const img1 = image1.startsWith('data:image/') ? image1 : `data:image/png;base64,${image1}`;
  const img2 = image2.startsWith('data:image/') ? image2 : `data:image/png;base64,${image2}`;

  const data = await postJson<{ image: string }>(`${API_BASE_URL}/bitwise/or`, {
    image1: img1,
    image2: img2,
  });
  return data.image;
};

export const bitwiseXor = async (
  image1: string,
  image2: string
): Promise<string> => {
  const img1 = image1.startsWith('data:image/') ? image1 : `data:image/png;base64,${image1}`;
  const img2 = image2.startsWith('data:image/') ? image2 : `data:image/png;base64,${image2}`;

  const data = await postJson<{ image: string }>(`${API_BASE_URL}/bitwise/xor`, {
    image1: img1,
    image2: img2,
  });
  return data.image;
};

export const bitwiseNot = async (
  image: string
): Promise<string> => {
  const img = image.startsWith('data:image/') ? image : `data:image/png;base64,${image}`;

  const data = await postJson<{ image: string }>(`${API_BASE_URL}/bitwise/not`, {
    image: img,
  });
  return data.image;
};