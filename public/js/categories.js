/**
 * MDBlog 카테고리 관리 JavaScript 기능
 */
document.addEventListener("DOMContentLoaded", function () {
  console.log("카테고리 관리 스크립트 로드됨");

  // 카테고리 수정 모달 관련 스크립트
  const modal = document.getElementById("editCategoryModal");
  if (modal) {
    const closeBtn = modal.querySelector(".close");

    // 모달 닫기
    if (closeBtn) {
      closeBtn.onclick = function () {
        modal.style.display = "none";
      };
    }

    // 모달 외부 클릭 시 닫기
    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };

    // 카테고리 편집 버튼 클릭 이벤트
    document.querySelectorAll(".edit-category").forEach((button) => {
      button.addEventListener("click", function () {
        const id = this.dataset.id;
        const name = this.dataset.name;
        const parent = this.dataset.parent || "";

        document.getElementById("editCategoryId").value = id;
        document.getElementById("editName").value = name;
        document.getElementById("editParent").value = parent;

        // 자기 자신은 부모로 선택할 수 없게 처리
        document.querySelectorAll("#editParent option").forEach((option) => {
          option.disabled = option.value === id;
        });

        modal.style.display = "block";
      });
    });

    // CSRF 토큰 추가 및 삭제 관련 처리
    const deleteForms = document.querySelectorAll(".delete-category-form");
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");

    // 삭제 폼에 CSRF 토큰 추가
    if (csrfToken) {
      deleteForms.forEach((form) => {
        if (!form.querySelector('input[name="_csrf"]')) {
          const csrfInput = document.createElement("input");
          csrfInput.type = "hidden";
          csrfInput.name = "_csrf";
          csrfInput.value = csrfToken;
          form.appendChild(csrfInput);
        }
      });
    }

    // AJAX로 삭제 요청 처리
    deleteForms.forEach((form) => {
      form.addEventListener("submit", function (e) {
        e.preventDefault();

        if (
          confirm(
            "정말 이 카테고리를 삭제하시겠습니까? 이 카테고리를 사용하는 게시물이 있거나 하위 카테고리가 있으면 삭제할 수 없습니다."
          )
        ) {
          const formUrl = this.getAttribute("action");

          fetch(formUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(csrfToken && { "CSRF-Token": csrfToken }),
            },
            credentials: "same-origin",
          })
            .then((response) => {
              if (response.redirected) {
                window.location.href = response.url;
              } else {
                return response.json();
              }
            })
            .then((data) => {
              if (data && data.error) {
                alert(data.error);
              } else if (data && data.success) {
                alert(data.success);
                location.reload();
              }
            })
            .catch((error) => {
              console.error("카테고리 삭제 오류:", error);
              alert("카테고리 삭제 중 오류가 발생했습니다.");
            });
        }
      });
    });
  }
});
