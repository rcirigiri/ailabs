import { message } from "antd";

export const responseHandler = async (
  api_call: Promise<any>,
  toast_success: string | boolean,
  toast_loading: string | boolean = "Loading..."
): Promise<any> => {
  let response: any = null;
  const key = "loadingMessage";

  // Display the loading message with a specific key
  message.loading({ content: toast_loading, key });

  try {
    response = await api_call;

    if (!response) {
      message.error({
        content: response?.data?.message || "Unknown error",
        key,
      });
    } else {
      if (toast_success) {
        message.success({ content: toast_success as string, key });
      } else {
        message.destroy(key);
      }
    }
  } catch (error: any) {
    message.error({
      content: error?.response?.data?.message || "Request failed",
      key,
    });
    response = error.response;
  }

  // Handle success/error response based on status
  if (response?.status === 200) return response;
  else if (response?.status === 202) {
    message.error({
      content: response?.data?.error || "Request accepted with warnings",
      key,
    });
  } else if (response?.status === 400) {
    message.error({
      content: `Error 400: ${response?.data?.message || "Bad Request"}`,
      key,
    });
  } else if (response?.status === 401) {
    message.error({
      content: `Unauthorized 401: ${
        response?.data?.message || "Not authorized"
      }`,
      key,
    });
  } else if (response?.status === 403) {
    message.error({ content: "Unauthorized 403: Action forbidden", key });
  } else if (response?.status === 500) {
    message.error({
      content: `Error 500: ${response?.data?.message || "Server Error"}`,
      key,
    });
  } else {
    message.error({
      content: "Error: Something went wrong. Please contact admin.",
      key,
    });
  }

  return false;
};

/**
 * Generate random string with given length
 * @param {number} length - Desired length of generated string
 * @returns {string}
 */
export const generateString = (length: number): string => {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
};
