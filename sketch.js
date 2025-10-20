let scaleFactor = 1;
let offsetX = 0;
let offsetY = 0;
let controlPoints = [];
let draggingPoint = null;
let draggingHandle = null;
let currentLetter = 'A';
let handleLength = 40;
let randomness = 0;
let anchorRandomness = 0;
let showAnchors = true;

function setup() {
  let canvas = createCanvas(windowWidth - 660, windowHeight);
  canvas.parent(document.body);
  pixelDensity(window.devicePixelRatio || 2);

  const slider = document.getElementById('handleSlider');
  handleLength = parseInt(slider.value);
  slider.addEventListener('input', () => {
    handleLength = parseInt(slider.value);
    document.getElementById('handleLenLabel').textContent = handleLength;
    initLetter(currentLetter);
  });

  const randomSlider = document.getElementById('randomnessSlider');
  randomness = parseInt(randomSlider.value);
  randomSlider.addEventListener('input', () => {
    randomness = parseInt(randomSlider.value);
    document.getElementById('randomnessValue').textContent = randomness;
    initLetter(currentLetter);
  });

  const anchorSlider = document.getElementById('anchorRandomnessSlider');
  anchorRandomness = parseInt(anchorSlider.value);
  anchorSlider.addEventListener('input', () => {
    anchorRandomness = parseInt(anchorSlider.value);
    document.getElementById('anchorRandomnessValue').textContent = anchorRandomness;
    initLetter(currentLetter);
  });

  const toggleButton = document.getElementById('toggleAnchorsBtn');
  toggleButton.addEventListener('click', () => {
    showAnchors = !showAnchors;
    toggleButton.textContent = showAnchors ? 'Hide Anchors' : 'Show Anchors';
    redraw();
  });

  initLetter(currentLetter);
}

function draw() {
  background(255);
  drawCurvedShape();
  drawHandles();
  drawControlPoints();
  updateCoordDisplay();
}

function initLetter(letter) {
  let data = letterData[letter];
  if (!data) return;

  let all = data.outer.concat(...data.holes);
  let minX = Math.min(...all.map(p => p[0]));
  let maxX = Math.max(...all.map(p => p[0]));
  let minY = Math.min(...all.map(p => p[1]));
  let maxY = Math.max(...all.map(p => p[1]));

  let shapeW = maxX - minX;
  let shapeH = maxY - minY;

  scaleFactor = 600 / shapeH;
  offsetX = (width - shapeW * scaleFactor) / 2 - minX * scaleFactor;
  offsetY = (height - shapeH * scaleFactor) / 2 - minY * scaleFactor;

  controlPoints = [];

  for (let [x, y] of data.outer) {
    let px = x * scaleFactor + offsetX + random(-anchorRandomness, anchorRandomness);
    let py = y * scaleFactor + offsetY + random(-anchorRandomness, anchorRandomness);
    controlPoints.push({
      anchor: createVector(px, py),
      handleIn: createVector(px + handleLength + random(-randomness, randomness), py + random(-randomness, randomness)),
      handleOut: createVector(px - handleLength + random(-randomness, randomness), py + random(-randomness, randomness))
    });
  }

  for (let hole of data.holes) {
    for (let [x, y] of hole) {
      let px = x * scaleFactor + offsetX + random(-anchorRandomness, anchorRandomness);
      let py = y * scaleFactor + offsetY + random(-anchorRandomness, anchorRandomness);
      controlPoints.push({
        anchor: createVector(px, py),
        handleIn: createVector(px + handleLength + random(-randomness, randomness), py + random(-randomness, randomness)),
        handleOut: createVector(px - handleLength + random(-randomness, randomness), py + random(-randomness, randomness))
      });
    }
  }

  if (typeof adjustHandlesFor === 'function') adjustHandlesFor(letter);
  redraw();
}

function drawCurvedShape() {
  noStroke();
  fill(0);
  beginShape();

  let outerLen = letterData[currentLetter].outer.length;
  let outer = controlPoints.slice(0, outerLen);
  vertex(outer[0].anchor.x, outer[0].anchor.y);
  for (let i = 0; i < outer.length; i++) {
    let curr = outer[i];
    let next = outer[(i + 1) % outer.length];
    bezierVertex(curr.handleOut.x, curr.handleOut.y, next.handleIn.x, next.handleIn.y, next.anchor.x, next.anchor.y);
  }

  let holeStart = outerLen;
  for (let hole of letterData[currentLetter].holes) {
    let holeLen = hole.length;
    let pts = controlPoints.slice(holeStart, holeStart + holeLen);
    beginContour();
    vertex(pts[0].anchor.x, pts[0].anchor.y);
    for (let i = 0; i < pts.length; i++) {
      let curr = pts[i];
      let next = pts[(i + 1) % pts.length];
      bezierVertex(curr.handleOut.x, curr.handleOut.y, next.handleIn.x, next.handleIn.y, next.anchor.x, next.anchor.y);
    }
    endContour();
    holeStart += holeLen;
  }

  endShape(CLOSE);
}

function drawHandles() {
  if (!showAnchors) return;
  stroke(200, 0, 0);
  strokeWeight(1);
  for (let pt of controlPoints) {
    line(pt.anchor.x, pt.anchor.y, pt.handleIn.x, pt.handleIn.y);
    line(pt.anchor.x, pt.anchor.y, pt.handleOut.x, pt.handleOut.y);
    fill(255);
    stroke(200, 0, 0);
    ellipse(pt.handleIn.x, pt.handleIn.y, 8);
    ellipse(pt.handleOut.x, pt.handleOut.y, 8);
  }
}

function drawControlPoints() {
  if (!showAnchors) return;
  textAlign(CENTER, TOP);
  textSize(10);
  for (let i = 0; i < controlPoints.length; i++) {
    let pt = controlPoints[i];
    let ax = Math.round(pt.anchor.x);
    let ay = Math.round(pt.anchor.y);
    fill(255);
    stroke(255, 0, 158);
    strokeWeight(2);
    ellipse(ax, ay, 10);
    noStroke();
    fill(2, 217, 10);
    text(`${i + 1}: (${ax}, ${ay})`, ax, ay + 12);
  }
}

function updateCoordDisplay() {
  let html = '';
  for (let i = 0; i < controlPoints.length; i++) {
    let pt = controlPoints[i];
    html += `<strong>${i + 1}</strong>:<br>`;
    html += `&nbsp;&nbsp;anchor: (${Math.round(pt.anchor.x)}, ${Math.round(pt.anchor.y)})<br>`;
    html += `&nbsp;&nbsp;in: (${Math.round(pt.handleIn.x)}, ${Math.round(pt.handleIn.y)})<br>`;
    html += `&nbsp;&nbsp;out: (${Math.round(pt.handleOut.x)}, ${Math.round(pt.handleOut.y)})<br><br>`;
  }
  document.getElementById('coords').innerHTML = html;
}

function mousePressed() {
  for (let pt of controlPoints) {
    if (dist(mouseX, mouseY, pt.anchor.x, pt.anchor.y) < 6) {
      draggingPoint = pt;
      return;
    }
    if (dist(mouseX, mouseY, pt.handleIn.x, pt.handleIn.y) < 6) {
      draggingHandle = { pt, type: 'in' };
      return;
    }
    if (dist(mouseX, mouseY, pt.handleOut.x, pt.handleOut.y) < 6) {
      draggingHandle = { pt, type: 'out' };
      return;
    }
  }
}

function mouseDragged() {
  if (draggingPoint) {
    let delta = createVector(mouseX, mouseY).sub(draggingPoint.anchor);
    draggingPoint.anchor.set(mouseX, mouseY);
    draggingPoint.handleIn.add(delta);
    draggingPoint.handleOut.add(delta);
  }

  if (draggingHandle) {
    let type = draggingHandle.type;
    draggingHandle.pt[`handle${type === 'in' ? 'In' : 'Out'}`].set(mouseX, mouseY);
  }

  redraw();
}

function mouseReleased() {
  draggingPoint = null;
  draggingHandle = null;
  redraw();
}

// ✅ 每个字母的自定义手柄逻辑
function adjustHandlesFor(letter) {
  if (letter === 'A') {
    let pt = controlPoints[8]; // 第9个点
    pt.handleIn = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
    pt.handleOut = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
  }

  if (letter === 'B') {
    // 对第4个控制点调整
    let pt1 = controlPoints[3]; 
    pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
    pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
  
    
    let pt2 = controlPoints[4]; 
    pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength+ random(-randomness, randomness), pt2.anchor.y+ random(-randomness, randomness));
    pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength+ random(-randomness, randomness), pt2.anchor.y+ random(-randomness, randomness));

    let pt3 = controlPoints[5]; 
    pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness), pt3.anchor.y+ random(-randomness, randomness)- handleLength+ random(-randomness, randomness));
    pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness), pt3.anchor.y+ random(-randomness, randomness)+ handleLength+ random(-randomness, randomness));

    let pt4 = controlPoints[6]; 
    pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness), pt4.anchor.y+ random(-randomness, randomness)- handleLength)+ random(-randomness, randomness);
    pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness), pt4.anchor.y+ random(-randomness, randomness)+ handleLength+ random(-randomness, randomness));

    let pt5 = controlPoints[8]; 
    pt5.handleIn = createVector(pt5.anchor.x+ random(-randomness, randomness), pt5.anchor.y+ random(-randomness, randomness)- handleLength+ random(-randomness, randomness));
    pt5.handleOut = createVector(pt5.anchor.x+ random(-randomness, randomness), pt5.anchor.y+ random(-randomness, randomness)+ handleLength+ random(-randomness, randomness));

    let pt6 = controlPoints[0]; 
    pt6.handleIn = createVector(pt6.anchor.x+ random(-randomness, randomness), pt6.anchor.y+ random(-randomness, randomness)- handleLength+ random(-randomness, randomness));
    pt6.handleOut = createVector(pt6.anchor.x+ random(-randomness, randomness), pt6.anchor.y+ random(-randomness, randomness)+ handleLength+ random(-randomness, randomness));

    let pt7 = controlPoints[10]; 
    pt7.handleIn = createVector(pt7.anchor.x+ random(-randomness, randomness) - handleLength+ random(-randomness, randomness), pt7.anchor.y+ random(-randomness, randomness));
    pt7.handleOut = createVector(pt7.anchor.x+ random(-randomness, randomness) + handleLength+ random(-randomness, randomness), pt7.anchor.y+ random(-randomness, randomness));

    let pt8 = controlPoints[11]; 
    pt8.handleIn = createVector(pt8.anchor.x+ random(-randomness, randomness) - handleLength+ random(-randomness, randomness), pt8.anchor.y+ random(-randomness, randomness));
    pt8.handleOut = createVector(pt8.anchor.x+ random(-randomness, randomness) + handleLength+ random(-randomness, randomness), pt8.anchor.y+ random(-randomness, randomness));
    
    let pt9 = controlPoints[14]; 
    pt9.handleIn = createVector(pt9.anchor.x+ random(-randomness, randomness) - handleLength+ random(-randomness, randomness), pt9.anchor.y+ random(-randomness, randomness));
    pt9.handleOut = createVector(pt9.anchor.x+ random(-randomness, randomness) + handleLength+ random(-randomness, randomness), pt9.anchor.y+ random(-randomness, randomness));
    
    let pt10 = controlPoints[15]; 
    pt10.handleIn = createVector(pt10.anchor.x+ random(-randomness, randomness) - handleLength+ random(-randomness, randomness), pt10.anchor.y+ random(-randomness, randomness));
    pt10.handleOut = createVector(pt10.anchor.x+ random(-randomness, randomness) + handleLength+ random(-randomness, randomness), pt10.anchor.y+ random(-randomness, randomness));
    }

    if (letter === 'C') {
      let pt = controlPoints[4]; // 第9个点
      pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
      pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

      let pt1 = controlPoints[5]; 
      pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
      pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
    
      
      let pt2 = controlPoints[3]; 
      pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
      pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));
  
      let pt3 = controlPoints[10]; 
      pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
      pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

      let pt4 = controlPoints[12]; 
      pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness)- handleLength, pt4.anchor.y+ random(-randomness, randomness));
      pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness)+ handleLength, pt4.anchor.y+ random(-randomness, randomness));
  
      let pt5 = controlPoints[13]; 
      pt5.handleIn = createVector(pt5.anchor.x+ random(-randomness, randomness)- handleLength, pt5.anchor.y+ random(-randomness, randomness));
      pt5.handleOut = createVector(pt5.anchor.x+ random(-randomness, randomness)+ handleLength, pt5.anchor.y+ random(-randomness, randomness));
  
      let pt6 = controlPoints[14]; 
      pt6.handleIn = createVector(pt6.anchor.x+ random(-randomness, randomness)- handleLength, pt6.anchor.y+ random(-randomness, randomness));
      pt6.handleOut = createVector(pt6.anchor.x+ random(-randomness, randomness)+ handleLength, pt6.anchor.y+ random(-randomness, randomness));
  
      let pt7 = controlPoints[15]; 
      pt7.handleIn = createVector(pt7.anchor.x+ random(-randomness, randomness) - handleLength, pt7.anchor.y+ random(-randomness, randomness));
      pt7.handleOut = createVector(pt7.anchor.x+ random(-randomness, randomness) + handleLength, pt7.anchor.y+ random(-randomness, randomness));
    }

    if (letter === 'D') {
      let pt = controlPoints[3]; // 第9个点
      pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
      pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

      let pt1 = controlPoints[7]; 
      pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
      pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
    
      
      let pt2 = controlPoints[8]; 
      pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
      pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));
  
      let pt3 = controlPoints[5]; 
      pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
      pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

      let pt4 = controlPoints[4]; 
      pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness)- handleLength, pt4.anchor.y+ random(-randomness, randomness));
      pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness)+ handleLength, pt4.anchor.y+ random(-randomness, randomness));

    }

 
    
    if (letter === 'E') {
      let pt = controlPoints[2]; // 第9个点
      pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
      pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

      let pt1 = controlPoints[6]; 
      pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
      pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
    
      
      let pt2 = controlPoints[10]; 
      pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
      pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));
  
      let pt3 = controlPoints[3]; 
      pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
      pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

      let pt4 = controlPoints[7]; 
      pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness)- handleLength, pt4.anchor.y+ random(-randomness, randomness));
      pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness)+ handleLength, pt4.anchor.y+ random(-randomness, randomness));

      let pt5 = controlPoints[11]; 
      pt5.handleIn = createVector(pt5.anchor.x+ random(-randomness, randomness)- handleLength, pt5.anchor.y+ random(-randomness, randomness));
      pt5.handleOut = createVector(pt5.anchor.x+ random(-randomness, randomness)+ handleLength, pt5.anchor.y+ random(-randomness, randomness));
    }

    if (letter === 'F') {
      let pt = controlPoints[2]; // 第9个点
      pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
      pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

      let pt1 = controlPoints[3]; 
      pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
      pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
    
      
      let pt2 = controlPoints[4]; 
      pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
      pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));
  
      let pt3 = controlPoints[8]; 
      pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
      pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

      let pt4 = controlPoints[5]; 
      pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness)- handleLength, pt4.anchor.y+ random(-randomness, randomness));
      pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness)+ handleLength, pt4.anchor.y+ random(-randomness, randomness));

      let pt5 = controlPoints[9]; 
      pt5.handleIn = createVector(pt5.anchor.x+ random(-randomness, randomness)- handleLength, pt5.anchor.y+ random(-randomness, randomness));
      pt5.handleOut = createVector(pt5.anchor.x+ random(-randomness, randomness)+ handleLength, pt5.anchor.y+ random(-randomness, randomness));
    }

    if (letter === 'G') {
      let pt = controlPoints[3]; // 第9个点
      pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
      pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

      let pt1 = controlPoints[12]; 
      pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
      pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
    
      
      let pt2 = controlPoints[4]; 
      pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
      pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));
  
      let pt3 = controlPoints[17]; 
      pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
      pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

      let pt4 = controlPoints[5]; 
      pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness)- handleLength, pt4.anchor.y+ random(-randomness, randomness));
      pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness)+ handleLength, pt4.anchor.y+ random(-randomness, randomness));
  
      let pt5 = controlPoints[10]; 
      pt5.handleIn = createVector(pt5.anchor.x+ random(-randomness, randomness)- handleLength, pt5.anchor.y+ random(-randomness, randomness));
      pt5.handleOut = createVector(pt5.anchor.x+ random(-randomness, randomness)+ handleLength, pt5.anchor.y+ random(-randomness, randomness));
  
      let pt6 = controlPoints[16]; 
      pt6.handleIn = createVector(pt6.anchor.x+ random(-randomness, randomness)- handleLength, pt6.anchor.y+ random(-randomness, randomness));
      pt6.handleOut = createVector(pt6.anchor.x+ random(-randomness, randomness)+ handleLength, pt6.anchor.y+ random(-randomness, randomness));
  
      let pt7 = controlPoints[15]; 
      pt7.handleIn = createVector(pt7.anchor.x+ random(-randomness, randomness) - handleLength, pt7.anchor.y+ random(-randomness, randomness));
      pt7.handleOut = createVector(pt7.anchor.x+ random(-randomness, randomness) + handleLength, pt7.anchor.y+ random(-randomness, randomness));

      let pt8 = controlPoints[6]; 
      pt8.handleIn = createVector(pt8.anchor.x+ random(-randomness, randomness) - handleLength, pt8.anchor.y+ random(-randomness, randomness));
      pt8.handleOut = createVector(pt8.anchor.x+ random(-randomness, randomness) + handleLength, pt8.anchor.y+ random(-randomness, randomness));

      let pt9 = controlPoints[9]; 
      pt9.handleIn = createVector(pt9.anchor.x+ random(-randomness, randomness) - handleLength, pt9.anchor.y+ random(-randomness, randomness));
      pt9.handleOut = createVector(pt9.anchor.x+ random(-randomness, randomness) + handleLength, pt9.anchor.y+ random(-randomness, randomness));
    }

    if (letter === 'H') {
      let pt = controlPoints[7]; // 第9个点
      pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
      pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

      let pt1 = controlPoints[8]; 
      pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
      pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
    
      
      let pt2 = controlPoints[9]; 
      pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
      pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));
  
      let pt3 = controlPoints[10]; 
      pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
      pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

    }

    if (letter === 'I') {
      let pt = controlPoints[1]; // 第9个点
      pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
      pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

      let pt1 = controlPoints[2]; 
      pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
      pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));

    }

    if (letter === 'J') {
      let pt = controlPoints[2]; // 第9个点
      pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
      pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

      let pt1 = controlPoints[3]; 
      pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
      pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
    
      
      let pt2 = controlPoints[6]; 
      pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
      pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));
  
      let pt3 = controlPoints[9]; 
      pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
      pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

    }

    if (letter === 'K') {
      let pt = controlPoints[5]; // 第9个点
      pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
      pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

      let pt1 = controlPoints[3]; 
      pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
      pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
    
      
      let pt2 = controlPoints[7]; 
      pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
      pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));
  
      let pt3 = controlPoints[9]; 
      pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
      pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

      let pt4 = controlPoints[1]; 
      pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness)- handleLength, pt4.anchor.y+ random(-randomness, randomness));
      pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness)+ handleLength, pt4.anchor.y+ random(-randomness, randomness));
  
      let pt5 = controlPoints[10]; 
      pt5.handleIn = createVector(pt5.anchor.x+ random(-randomness, randomness), pt5.anchor.y+ random(-randomness, randomness)+ handleLength);
      pt5.handleOut = createVector(pt5.anchor.x+ random(-randomness, randomness), pt5.anchor.y+ random(-randomness, randomness)- handleLength);
  }

  if (letter === 'L') {
    let pt = controlPoints[2]; // 第9个点
    pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
    pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

    let pt1 = controlPoints[3]; 
    pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
    pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
  
    
    let pt2 = controlPoints[5]; 
    pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
    pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));
  }

  if (letter === 'M') {
    let pt = controlPoints[5]; // 第9个点
    pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
    pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

    let pt1 = controlPoints[6]; 
    pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
    pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
  
    
    let pt2 = controlPoints[11]; 
    pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
    pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));

    let pt3 = controlPoints[12]; 
    pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
    pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

  }

  if (letter === 'N') {
    let pt = controlPoints[5]; // 第9个点
    pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
    pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

    let pt1 = controlPoints[6]; 
    pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
    pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));

    let pt2 = controlPoints[9]; 
    pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
    pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));
  
  }

  if (letter === 'O') {
    let pt = controlPoints[9]; // 第9个点
    pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
    pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

    let pt1 = controlPoints[4]; 
    pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
    pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
  
    
    let pt2 = controlPoints[3]; 
    pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
    pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));

    let pt3 = controlPoints[5]; 
    pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
    pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

    let pt4 = controlPoints[6]; 
    pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness)- handleLength, pt4.anchor.y+ random(-randomness, randomness));
    pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness)+ handleLength, pt4.anchor.y+ random(-randomness, randomness));

    let pt5 = controlPoints[10]; 
    pt5.handleIn = createVector(pt5.anchor.x+ random(-randomness, randomness)- handleLength, pt5.anchor.y+ random(-randomness, randomness));
    pt5.handleOut = createVector(pt5.anchor.x+ random(-randomness, randomness)+ handleLength, pt5.anchor.y+ random(-randomness, randomness));

  }

  if (letter === 'P') {
    let pt = controlPoints[3]; // 第9个点
    pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
    pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

    let pt1 = controlPoints[4]; 
    pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
    pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
  
    
    let pt2 = controlPoints[9]; 
    pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
    pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));

    let pt3 = controlPoints[10]; 
    pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
    pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

    let pt4 = controlPoints[7]; 
    pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness)- handleLength, pt4.anchor.y+ random(-randomness, randomness));
    pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness)+ handleLength, pt4.anchor.y+ random(-randomness, randomness));

    let pt5 = controlPoints[6]; 
    pt5.handleIn = createVector(pt5.anchor.x+ random(-randomness, randomness)- handleLength, pt5.anchor.y+ random(-randomness, randomness));
    pt5.handleOut = createVector(pt5.anchor.x+ random(-randomness, randomness)+ handleLength, pt5.anchor.y+ random(-randomness, randomness));

  }

  if (letter === 'Q') {
    let pt = controlPoints[12]; // 第9个点
    pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
    pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

    let pt1 = controlPoints[3]; 
    pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
    pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
  
    let pt2 = controlPoints[4]; 
    pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
    pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));

    let pt3 = controlPoints[13]; 
    pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
    pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

    let pt4 = controlPoints[9]; 
    pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness)- handleLength, pt4.anchor.y+ random(-randomness, randomness));
    pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness)+ handleLength, pt4.anchor.y+ random(-randomness, randomness));

    let pt5 = controlPoints[5]; 
    pt5.handleIn = createVector(pt5.anchor.x+ random(-randomness, randomness)- handleLength, pt5.anchor.y+ random(-randomness, randomness));
    pt5.handleOut = createVector(pt5.anchor.x+ random(-randomness, randomness)+ handleLength, pt5.anchor.y+ random(-randomness, randomness));

    let pt6 = controlPoints[6]; 
    pt6.handleIn = createVector(pt6.anchor.x+ random(-randomness, randomness)- handleLength, pt6.anchor.y+ random(-randomness, randomness));
    pt6.handleOut = createVector(pt6.anchor.x+ random(-randomness, randomness)+ handleLength, pt6.anchor.y+ random(-randomness, randomness));

    let pt7 = controlPoints[7]; 
    pt7.handleIn = createVector(pt7.anchor.x+ random(-randomness, randomness) - handleLength, pt7.anchor.y+ random(-randomness, randomness));
    pt7.handleOut = createVector(pt7.anchor.x+ random(-randomness, randomness) + handleLength, pt7.anchor.y+ random(-randomness, randomness));

    let pt9 = controlPoints[9]; 
    pt9.handleIn = createVector(pt9.anchor.x+ random(-randomness, randomness) - handleLength, pt9.anchor.y+ random(-randomness, randomness));
    pt9.handleOut = createVector(pt9.anchor.x+ random(-randomness, randomness) + handleLength, pt9.anchor.y+ random(-randomness, randomness));
  }

  if (letter === 'R') {
    let pt = controlPoints[3]; // 第9个点
    pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
    pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

    let pt1 = controlPoints[14]; 
    pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
    pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
  
    let pt2 = controlPoints[4]; 
    pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
    pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));

    let pt3 = controlPoints[15]; 
    pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
    pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

    let pt4 = controlPoints[12]; 
    pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness)- handleLength, pt4.anchor.y+ random(-randomness, randomness));
    pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness)+ handleLength, pt4.anchor.y+ random(-randomness, randomness));

    let pt5 = controlPoints[11]; 
    pt5.handleIn = createVector(pt5.anchor.x+ random(-randomness, randomness)- handleLength, pt5.anchor.y+ random(-randomness, randomness));
    pt5.handleOut = createVector(pt5.anchor.x+ random(-randomness, randomness)+ handleLength, pt5.anchor.y+ random(-randomness, randomness));

    let pt6 = controlPoints[9]; 
    pt6.handleIn = createVector(pt6.anchor.x+ random(-randomness, randomness)- handleLength, pt6.anchor.y+ random(-randomness, randomness));
    pt6.handleOut = createVector(pt6.anchor.x+ random(-randomness, randomness)+ handleLength, pt6.anchor.y+ random(-randomness, randomness));

    let pt7 = controlPoints[8]; 
    pt7.handleIn = createVector(pt7.anchor.x+ random(-randomness, randomness) - handleLength, pt7.anchor.y+ random(-randomness, randomness));
    pt7.handleOut = createVector(pt7.anchor.x+ random(-randomness, randomness) + handleLength, pt7.anchor.y+ random(-randomness, randomness));

    let pt9 = controlPoints[6]; 
    pt9.handleIn = createVector(pt9.anchor.x+ random(-randomness, randomness) - handleLength, pt9.anchor.y+ random(-randomness, randomness));
    pt9.handleOut = createVector(pt9.anchor.x+ random(-randomness, randomness) + handleLength, pt9.anchor.y+ random(-randomness, randomness));
  }

  if (letter === 'S') {
    let pt = controlPoints[3]; // 第9个点
    pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
    pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

    let pt1 = controlPoints[4]; 
    pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
    pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
  
    let pt2 = controlPoints[17]; 
    pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
    pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));

    let pt3 = controlPoints[11]; 
    pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
    pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

    let pt4 = controlPoints[19]; 
    pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness)- handleLength, pt4.anchor.y+ random(-randomness, randomness));
    pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness)+ handleLength, pt4.anchor.y+ random(-randomness, randomness));

    let pt5 = controlPoints[20]; 
    pt5.handleIn = createVector(pt5.anchor.x+ random(-randomness, randomness)- handleLength, pt5.anchor.y+ random(-randomness, randomness));
    pt5.handleOut = createVector(pt5.anchor.x+ random(-randomness, randomness)+ handleLength, pt5.anchor.y+ random(-randomness, randomness));

    let pt6 = controlPoints[5]; 
    pt6.handleIn = createVector(pt6.anchor.x+ random(-randomness, randomness)- handleLength, pt6.anchor.y+ random(-randomness, randomness));
    pt6.handleOut = createVector(pt6.anchor.x+ random(-randomness, randomness)+ handleLength, pt6.anchor.y+ random(-randomness, randomness));

    let pt7 = controlPoints[13]; 
    pt7.handleIn = createVector(pt7.anchor.x+ random(-randomness, randomness) - handleLength, pt7.anchor.y+ random(-randomness, randomness));
    pt7.handleOut = createVector(pt7.anchor.x+ random(-randomness, randomness) + handleLength, pt7.anchor.y+ random(-randomness, randomness));

    let pt8 = controlPoints[7]; 
    pt8.handleIn = createVector(pt8.anchor.x+ random(-randomness, randomness) - handleLength, pt8.anchor.y+ random(-randomness, randomness));
    pt8.handleOut = createVector(pt8.anchor.x+ random(-randomness, randomness) + handleLength, pt8.anchor.y+ random(-randomness, randomness));

    let pt9 = controlPoints[12]; 
    pt9.handleIn = createVector(pt9.anchor.x+ random(-randomness, randomness) - handleLength, pt9.anchor.y+ random(-randomness, randomness));
    pt9.handleOut = createVector(pt9.anchor.x+ random(-randomness, randomness) + handleLength, pt9.anchor.y+ random(-randomness, randomness));

    let pt10 = controlPoints[10]; 
    pt10.handleIn = createVector(pt10.anchor.x+ random(-randomness, randomness) - handleLength, pt10.anchor.y+ random(-randomness, randomness));
    pt10.handleOut = createVector(pt10.anchor.x+ random(-randomness, randomness) + handleLength, pt10.anchor.y+ random(-randomness, randomness));
  }

  if (letter === 'T') {
    let pt = controlPoints[2]; // 第9个点
    pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
    pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

    let pt1 = controlPoints[7]; 
    pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
    pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
  
    
    let pt2 = controlPoints[3]; 
    pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
    pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));

    let pt3 = controlPoints[6]; 
    pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
    pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

    let pt4 = controlPoints[4]; 
    pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness)- handleLength, pt4.anchor.y+ random(-randomness, randomness));
    pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness)+ handleLength, pt4.anchor.y+ random(-randomness, randomness));

    let pt5 = controlPoints[5]; 
    pt5.handleIn = createVector(pt5.anchor.x+ random(-randomness, randomness)- handleLength, pt5.anchor.y+ random(-randomness, randomness));
    pt5.handleOut = createVector(pt5.anchor.x+ random(-randomness, randomness)+ handleLength, pt5.anchor.y+ random(-randomness, randomness));

  }

  if (letter === 'U') {
    let pt = controlPoints[6]; // 第9个点
    pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
    pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

    let pt1 = controlPoints[7]; 
    pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
    pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
  
    let pt2 = controlPoints[8]; 
    pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
    pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));

    let pt3 = controlPoints[9]; 
    pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
    pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

    // let pt4 = controlPoints[2]; 
    // pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness)- handleLength, pt4.anchor.y+ random(-randomness, randomness));
    // pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness)+ handleLength, pt4.anchor.y+ random(-randomness, randomness));

    // let pt5 = controlPoints[3]; 
    // pt5.handleIn = createVector(pt5.anchor.x+ random(-randomness, randomness)- handleLength, pt5.anchor.y+ random(-randomness, randomness));
    // pt5.handleOut = createVector(pt5.anchor.x+ random(-randomness, randomness)+ handleLength, pt5.anchor.y+ random(-randomness, randomness));

  }

  if (letter === 'V') {
    // let pt = controlPoints[2]; // 第9个点
    // pt.handleIn = createVector(pt.anchor.x - handleLength, pt.anchor.y);
    // pt.handleOut = createVector(pt.anchor.x + handleLength, pt.anchor.y);


  }

  if (letter === 'W') {
    let pt = controlPoints[9]; // 第9个点
    pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
    pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

    let pt1 = controlPoints[10]; 
    pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
    pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
  
    let pt2 = controlPoints[11]; 
    pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
    pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));


  }

  if (letter === 'X') {
    let pt = controlPoints[6]; // 第9个点
    pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
    pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

    let pt1 = controlPoints[7]; 
    pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
    pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
  
    let pt2 = controlPoints[8]; 
    pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
    pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));

    let pt3 = controlPoints[9]; 
    pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
    pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

    let pt4 = controlPoints[10]; 
    pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness)- handleLength, pt4.anchor.y+ random(-randomness, randomness));
    pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness)+ handleLength, pt4.anchor.y+ random(-randomness, randomness));

    let pt5 = controlPoints[5]; 
    pt5.handleIn = createVector(pt5.anchor.x+ random(-randomness, randomness), pt5.anchor.y+ random(-randomness, randomness)- handleLength);
    pt5.handleOut = createVector(pt5.anchor.x+ random(-randomness, randomness), pt5.anchor.y+ random(-randomness, randomness)+ handleLength);

    let pt6 = controlPoints[11]; 
    pt6.handleIn = createVector(pt6.anchor.x+ random(-randomness, randomness), pt6.anchor.y+ random(-randomness, randomness)+ handleLength);
    pt6.handleOut = createVector(pt6.anchor.x+ random(-randomness, randomness), pt6.anchor.y+ random(-randomness, randomness)- handleLength);

  }

  if (letter === 'Y') {
    let pt = controlPoints[5]; // 第9个点
    pt.handleIn = createVector(pt.anchor.x - handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));
    pt.handleOut = createVector(pt.anchor.x + handleLength+ random(-randomness, randomness), pt.anchor.y+ random(-randomness, randomness));

    let pt1 = controlPoints[6]; 
    pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
    pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
  
    let pt2 = controlPoints[7]; 
    pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
    pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));

    let pt3 = controlPoints[8]; 
    pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
    pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

    // let pt4 = controlPoints[2]; 
    // pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness)- handleLength, pt4.anchor.y+ random(-randomness, randomness));
    // pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness)+ handleLength, pt4.anchor.y+ random(-randomness, randomness));

    // let pt5 = controlPoints[3]; 
    // pt5.handleIn = createVector(pt5.anchor.x+ random(-randomness, randomness)- handleLength, pt5.anchor.y+ random(-randomness, randomness));
    // pt5.handleOut = createVector(pt5.anchor.x+ random(-randomness, randomness)+ handleLength, pt5.anchor.y+ random(-randomness, randomness));

  }

  if (letter === 'Z') {
    let pt = controlPoints[2]; // 第9个点
    pt.handleIn = createVector(pt.anchor.x + random(-randomness, randomness)- handleLength, pt.anchor.y+ random(-randomness, randomness));
    pt.handleOut = createVector(pt.anchor.x + random(-randomness, randomness+ handleLength), pt.anchor.y+ random(-randomness, randomness));

    let pt1 = controlPoints[5]; 
    pt1.handleIn = createVector(pt1.anchor.x+ random(-randomness, randomness) - handleLength, pt1.anchor.y+ random(-randomness, randomness));
    pt1.handleOut = createVector(pt1.anchor.x+ random(-randomness, randomness) + handleLength, pt1.anchor.y+ random(-randomness, randomness));
  
    let pt2 = controlPoints[3]; 
    pt2.handleIn = createVector(pt2.anchor.x+ random(-randomness, randomness) - handleLength, pt2.anchor.y+ random(-randomness, randomness));
    pt2.handleOut = createVector(pt2.anchor.x+ random(-randomness, randomness) + handleLength, pt2.anchor.y+ random(-randomness, randomness));

    let pt3 = controlPoints[9]; 
    pt3.handleIn = createVector(pt3.anchor.x+ random(-randomness, randomness)- handleLength, pt3.anchor.y+ random(-randomness, randomness));
    pt3.handleOut = createVector(pt3.anchor.x+ random(-randomness, randomness)+ handleLength, pt3.anchor.y+ random(-randomness, randomness));

    let pt4 = controlPoints[6]; 
    pt4.handleIn = createVector(pt4.anchor.x+ random(-randomness, randomness)- handleLength, pt4.anchor.y+ random(-randomness, randomness));
    pt4.handleOut = createVector(pt4.anchor.x+ random(-randomness, randomness)+ handleLength, pt4.anchor.y+ random(-randomness, randomness));


  }
}