export const createUploadAdapter = (loader: any, accessToken: string) => {
  const url = import.meta.env.VITE_API_URL;
  return {
    upload: async () => {
      try {
        const file = await loader.file;
        const formData = new FormData();
        formData.append("postImage", file);

        const headers: HeadersInit = {};

        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const response = await fetch(url + "/posts/image", {
          method: "POST",
          headers,
          body: formData,
        });

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

export const createUploadAdapterPlugin = (accessToken: string) => {
  return function CustomUploadAdapter(editor: any) {
    editor.plugins.get("FileRepository").createUploadAdapter = (loader: any) => {
      return createUploadAdapter(loader, accessToken);
    };
  };
};
