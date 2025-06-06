export const createUploadAdapter = (
  loader: any,
  accessToken: string,
  onTokenRefresh?: () => Promise<string | null>
) => {
  const url = import.meta.env.VITE_API_URL;
  return {
    upload: async () => {
      try {
        const file = await loader.file;
        const formData = new FormData();
        formData.append("postImage", file);

        let currentAccessToken = accessToken;
        let headers: HeadersInit = {};

        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        let response = await fetch(url + "/posts/image", {
          method: "POST",
          headers,
          body: formData,
        });

        if (response.status === 401 && onTokenRefresh && currentAccessToken) {
          try {
            const newAccessToken = await onTokenRefresh();
            if (newAccessToken) {
              currentAccessToken = newAccessToken;
              headers["Authorization"] = `Bearer ${newAccessToken}`;
              response = await fetch(url + "/posts/image", {
                method: "POST",
                headers,
                body: formData,
              });
            }
          } catch (error) {
            console.error("토큰 갱신 중 오류 발생:", error);
            throw new Error("토큰 갱신 실패");
          }
        }

        if (!response.ok) {
          throw new Error("이미지 업로드 실패");
        }

        const result = await response.json();

        if (!result.body) {
          throw new Error("이미지 URL이 응답에 포함되어 있지 않습니다.");
        }
        return { default: result.body.url };
      } catch (error) {
        throw new Error(`이미지 업로드 중 오류 발생: ${(error as Error).message}`);
      }
    },
    abort: () => {
      console.warn("이미지 업로드가 중단되었습니다.");
    },
  };
};

export const createUploadAdapterPlugin = (
  accessToken: string,
  onTokenRefresh?: () => Promise<string | null>
) => {
  return function CustomUploadAdapter(editor: any) {
    editor.plugins.get("FileRepository").createUploadAdapter = (loader: any) => {
      return createUploadAdapter(loader, accessToken, onTokenRefresh);
    };
  };
};
