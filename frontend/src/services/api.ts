const API_BASE_URL =
  "http://127.0.0.1:8000";


// ============================================================
// API ERROR MESSAGE
// ============================================================

function getErrorMessage(
  data: any
): string {

  if (
    typeof data?.detail === "string"
  ) {

    return data.detail;

  }


  if (
    Array.isArray(data?.detail)
  ) {

    return data.detail
      .map((item: any) => {

        if (
          typeof item === "string"
        ) {

          return item;

        }

        return (
          item?.msg
          ||
          JSON.stringify(item)
        );

      })
      .join(", ");

  }


  if (
    typeof data?.message === "string"
  ) {

    return data.message;

  }


  if (
    typeof data === "string"
  ) {

    return data;

  }


  return "Something went wrong";

}


// ============================================================
// API REQUEST
// ============================================================

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {

  const token =
    localStorage.getItem(
      "Smart Attend token"
    );


  const headers =
    new Headers(
      options.headers
    );


  const isFormData =
    options.body instanceof FormData;


  // ==========================================================
  // FORM DATA
  // ==========================================================

  if (isFormData) {

    /*
      IMPORTANT:

      Never manually set Content-Type for FormData.

      The browser automatically creates:

      multipart/form-data;
      boundary=----------------...

      FastAPI needs that boundary to correctly
      receive UploadFile.
    */

    headers.delete(
      "Content-Type"
    );

  }


  // ==========================================================
  // JSON REQUEST
  // ==========================================================

  else if (
    !headers.has("Content-Type")
    &&
    !(options.body instanceof URLSearchParams)
  ) {

    headers.set(
      "Content-Type",
      "application/json"
    );

  }


  // ==========================================================
  // AUTHORIZATION
  // ==========================================================

  if (token) {

    headers.set(
      "Authorization",
      `Bearer ${token}`
    );

  }


  // ==========================================================
  // REQUEST
  // ==========================================================

  let response: Response;


  try {

    response =
      await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
          ...options,
          headers,
        }
      );

  } catch {

    throw new Error(
      "Unable to connect to the FastAPI server."
    );

  }


  // ==========================================================
  // READ RESPONSE
  // ==========================================================

  let data: any = null;


  try {

    const contentType =
      response.headers.get(
        "content-type"
      );


    if (
      contentType
        ?.toLowerCase()
        .includes(
          "application/json"
        )
    ) {

      data =
        await response.json();

    } else {

      data =
        await response.text();

    }

  } catch {

    data = null;

  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (!response.ok) {

    throw new Error(
      getErrorMessage(data)
    );

  }


  // ==========================================================
  // SUCCESS
  // ==========================================================

  return data;

}