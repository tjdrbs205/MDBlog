import React from "react";

interface ServerLoadingPageProps {
  error?: string | null;
}

const ServerLoadingPage: React.FC<ServerLoadingPageProps> = ({ error }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f5f5f5",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        {!error ? (
          <>
            <div
              style={{
                width: "50px",
                height: "50px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #3498db",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px",
              }}
            />
            <h2 style={{ color: "#333", marginBottom: "10px" }}>서버 연결 중...</h2>
            <p style={{ color: "#666" }}>잠시만 기다려주세요.</p>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: "48px",
                marginBottom: "20px",
              }}
            >
              ⚠️
            </div>
            <h2 style={{ color: "#e74c3c", marginBottom: "10px" }}>연결 실패</h2>
            <p style={{ color: "#666", marginBottom: "20px" }}>{error}</p>
            <div
              style={{
                width: "20px",
                height: "20px",
                border: "2px solid #f3f3f3",
                borderTop: "2px solid #3498db",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto",
              }}
            />
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ServerLoadingPage;
