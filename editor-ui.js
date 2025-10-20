window.onload = function () {
  const letterColumn = document.getElementById("letterColumn");
  const letters = Object.keys(letterData);

  for (let letter of letters) {
    const btn = document.createElement("button");
    btn.innerText = letter;
    btn.onclick = () => {
      currentLetter = letter;
      initLetter(currentLetter);
    };
    letterColumn.appendChild(btn);
  }

  // 显示/隐藏参数与锚点的按钮功能
  const toggleBtn = document.getElementById("toggleVisibilityBtn");
  toggleBtn.addEventListener("click", () => {
    showHandles = !showHandles;
    showControlPoints = !showControlPoints;
    showCoordData = !showCoordData;

    // 切换参数区显示
    document.getElementById("coords").style.display = showCoordData ? "block" : "none";

    // 更换按钮文字
    toggleBtn.innerText = showHandles ? "隐藏参数" : "显示参数";
    
    redraw();
  });
};