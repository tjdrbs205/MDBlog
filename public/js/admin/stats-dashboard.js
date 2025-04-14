// 통계 대시보드용 JavaScript 파일
document.addEventListener("DOMContentLoaded", function () {
  // CSRF 토큰 가져오기
  const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

  // hidden input 필드에서 차트 데이터 가져오기
  const chartDataElement = document.getElementById("chartDataJSON");
  let chartData;

  try {
    // JSON 문자열 파싱
    chartData = JSON.parse(chartDataElement.value);
  } catch (error) {
    console.error("차트 데이터 파싱 에러:", error);
    // 오류 발생 시 기본값 제공
    chartData = {
      labels: [],
      visits: [],
      pageViews: [],
      regionLabels: [],
      regionData: [],
      browserLabels: [],
      browserData: [],
    };
  }

  // 방문자 차트 데이터
  const visitorsData = {
    labels: chartData.labels,
    datasets: [
      {
        label: "방문자",
        data: chartData.visits,
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
        tension: 0.4,
      },
      {
        label: "페이지뷰",
        data: chartData.pageViews,
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
        tension: 0.4,
      },
    ],
  };

  // 방문자 차트 생성
  const visitorsChart = new Chart(document.getElementById("visitorsChart").getContext("2d"), {
    type: "line",
    data: visitorsData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "일별 방문자 및 페이지뷰",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });

  // 지역별 차트 데이터
  const regionLabels = chartData.regionLabels;
  const regionData = chartData.regionData;
  const regionColors = generateColors(regionLabels.length);

  const regionsChart = new Chart(document.getElementById("regionsChart").getContext("2d"), {
    type: "pie",
    data: {
      labels: regionLabels,
      datasets: [
        {
          data: regionData,
          backgroundColor: regionColors,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "right",
        },
        title: {
          display: true,
          text: "지역별 방문자 분포",
        },
      },
    },
  });

  // 브라우저별 차트 데이터
  const browserLabels = chartData.browserLabels;
  const browserData = chartData.browserData;
  const browserColors = {
    Chrome: "rgba(66, 133, 244, 0.8)",
    Firefox: "rgba(255, 108, 0, 0.8)",
    Safari: "rgba(0, 122, 255, 0.8)",
    Edge: "rgba(0, 120, 215, 0.8)",
    IE: "rgba(0, 153, 204, 0.8)",
    other: "rgba(128, 128, 128, 0.8)",
    unknown: "rgba(200, 200, 200, 0.8)",
  };

  const colorArray = browserLabels.map(
    (browser) =>
      browserColors[browser] ||
      `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(
        Math.random() * 255
      )}, 0.8)`
  );

  const browsersChart = new Chart(document.getElementById("browsersChart").getContext("2d"), {
    type: "doughnut",
    data: {
      labels: browserLabels,
      datasets: [
        {
          data: browserData,
          backgroundColor: colorArray,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "right",
        },
        title: {
          display: true,
          text: "브라우저별 방문자 분포",
        },
      },
    },
  });

  // 차트 기간 변경 버튼 이벤트
  document.getElementById("btn-week").addEventListener("click", function () {
    updateChartPeriod("week", this);
  });

  document.getElementById("btn-month").addEventListener("click", function () {
    updateChartPeriod("month", this);
  });

  document.getElementById("btn-year").addEventListener("click", function () {
    updateChartPeriod("year", this);
  });

  // 새로고침 버튼 이벤트
  document.getElementById("refresh-active").addEventListener("click", function () {
    fetchActiveVisitors();
  });

  // 활성 방문자 자동 업데이트 (10초마다)
  setInterval(fetchActiveVisitors, 10000);

  // 랜덤 색상 생성 함수
  function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      colors.push(`rgba(${r}, ${g}, ${b}, 0.8)`);
    }
    return colors;
  }

  // 차트 기간 업데이트 함수
  function updateChartPeriod(period, buttonEl) {
    // 버튼 활성화 상태 변경
    document.querySelectorAll(".btn-group .btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    buttonEl.classList.add("active");

    // AJAX로 서버에 데이터 요청
    fetch(`/admin/stats/chart-data?period=${period}`, {
      headers: {
        "CSRF-Token": csrfToken,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // 차트 데이터 업데이트
        visitorsChart.data.labels = data.labels;
        visitorsChart.data.datasets[0].data = data.visits;
        visitorsChart.data.datasets[1].data = data.pageViews;
        visitorsChart.update();
      })
      .catch((error) => console.error("차트 데이터 로드 중 오류:", error));
  }

  // 활성 방문자 데이터 가져오기
  function fetchActiveVisitors() {
    fetch("/admin/stats/active-visitors", {
      headers: {
        "CSRF-Token": csrfToken,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // 활성 방문자 수 업데이트
        document.getElementById("active-visitors").textContent = data.count;
        document.getElementById("active-visitors-count").textContent = data.count;

        // 테이블 업데이트
        const tbody = document.getElementById("active-visitors-table").querySelector("tbody");
        tbody.innerHTML = "";

        if (data.visitors.length === 0) {
          const tr = document.createElement("tr");
          tr.innerHTML = '<td colspan="5" class="text-center">현재 활성 방문자가 없습니다</td>';
          tbody.appendChild(tr);
        } else {
          data.visitors.forEach((visitor) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${visitor.id}</td>
              <td>${visitor.path}</td>
              <td>${visitor.browser}</td>
              <td>${visitor.region}</td>
              <td>${new Date(visitor.time).toLocaleTimeString()}</td>
            `;
            tbody.appendChild(tr);
          });
        }
      })
      .catch((error) => console.error("활성 방문자 데이터 로드 중 오류:", error));
  }
});
