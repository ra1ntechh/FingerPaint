      function createDiamondPattern() {
            const pattern = document.getElementById('diamondPattern');
            const emojis = ['FingerPaint', 'FP', 'FingerPAINT', 'FINGERPaint', 'FingerPaint59', 'FingerPaint'];
            for (let i = 0; i < 100; i++) {
                const diamond = document.createElement('div');
                diamond.className = 'diamond';
                diamond.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                diamond.style.animationDelay = (i * 0.1) + 's';
                pattern.appendChild(diamond);
            }
        }
        createDiamondPattern();

        function closeTutorial() {
            document.getElementById('tutorial_overlay').style.display = 'none';
        }

        function showTutorial() {
            document.getElementById('tutorial_overlay').style.display = 'flex';
        }

        const PX_PER_CM = 37.8;
        const video = document.getElementById('webcam');
        const videoCanvas = document.getElementById('videoCanvas');
        const drawingCanvas = document.getElementById('drawingCanvas');
        const debugCanvas = document.getElementById('debugCanvas');
        const rulerCanvas = document.getElementById('rulerCanvas');
        const iconCanvas = document.getElementById('iconCanvas');
        const videoCtx = videoCanvas.getContext('2d');
        const drawingCtx = drawingCanvas.getContext('2d');
        const debugCtx = debugCanvas.getContext('2d');
        const rulerCtx = rulerCanvas.getContext('2d');
        const iconCtx = iconCanvas.getContext('2d');
        const info = document.getElementById('info');
        const undoBtn = document.getElementById('undo_btn');
        const clearBtn = document.getElementById('clear_btn');
        const photoBtn = document.getElementById('photo_btn');
        const videoBtn = document.getElementById('video_btn');
        const saveBtn = document.getElementById('save_btn');
        const recordStatus = document.getElementById('record_status');
        const measurementDisplay = document.getElementById('measurement_display');
        const timerCircle = document.getElementById('timer_circle');
        const toolInfo = document.getElementById('tool_info');
        const shapeSelect = document.getElementById('shape_select');
        const textInput = document.getElementById('text_input');
        const iconBtn = document.getElementById('icon_btn');
        const emojiBtn = document.getElementById('emoji_btn');
        const simplifyBtn = document.getElementById('simplify_btn');
        const outlineBtn = document.getElementById('outline_btn');
        const saveIconBtn = document.getElementById('save_icon_btn');
        const iconStatus = document.getElementById('icon_status');
        
        const toolBrush = document.getElementById('tool_brush');
        const toolEraser = document.getElementById('tool_eraser');
        const toolRuler = document.getElementById('tool_ruler');
        const toolCompass = document.getElementById('tool_compass');
        const toolShapes = document.getElementById('tool_shapes');
        const toolText = document.getElementById('tool_text');
        const colorPicker = document.getElementById('color_picker');
        const brushSizeInput = document.getElementById('brush_size');
        const sizeVal = document.getElementById('size_val');
        const lineWidthInput = document.getElementById('line_width');
        const lineVal = document.getElementById('line_val');
        const paletteContainer = document.getElementById('palette_container');

        const aiCommand = document.getElementById('ai_command');
        const aiDrawBtn = document.getElementById('ai_draw_btn');
        const aiStatus = document.getElementById('ai_status');

        // Состояние
        let currentTool = 'brush', currentBrushColor = '#00ffff', currentBrushSize = 8, currentLineWidth = 3;
        let currentShape = 'circle', currentText = 'Привет!', lastPoint = null, isDrawingStopped = false;
        let fingerHistory = [], strokeHistory = [], currentStroke = [];
        const SMOOTHING_WINDOW = 5, MAX_HISTORY = 50, FINISH_HOLD_DURATION = 3000;
        let finishHoldStartTime = null, isFinishingHold = false, finishTimerInterval = null;
        let rulerStartPoint = null, rulerCurrentPoint = null, rulerIsDrawing = false;
        let compassStartPoint = null, compassCurrentPoint = null, compassIsDrawing = false;
        let shapesStartPoint = null, shapesCurrentPoint = null, shapesIsDrawing = false;
        let textStartPoint = null, textCurrentPoint = null, textIsDrawing = false;
        let swipeHandHistory = [], lastSwipeTime = 0, palmHistory = [], fistFrameCount = 0;
        const SWIPE_THRESHOLD = 200, SWIPE_SPEED = 0.5, SWIPE_COOLDOWN = 1000, FIST_THRESHOLD = 5;
        let mediaRecorder = null, recordedChunks = [], isRecording = false;

        // ============ AI РИСОВАНИЕ ============
        function processAICommand(command) {
            aiStatus.innerHTML = '...';
            
            const parsed = parseAICommand(command);
            
            if (parsed) {
                drawAIShape(parsed.shape, parsed.color, parsed.size, parsed.position);
                aiStatus.innerHTML = '✅ ' + parsed.colorName + ' ' + parsed.shapeName;
                setTimeout(() => { aiStatus.innerHTML = ''; }, 3000);
            } else {
                aiStatus.innerHTML = '❌ Пример: красный круг';
                setTimeout(() => { aiStatus.innerHTML = ''; }, 3000);
            }
        }

        function parseAICommand(command) {
            const lower = command.toLowerCase();
            
            const colors = {
                'красный': '#ff0000', 'красное': '#ff0000', 'красная': '#ff0000',
                'синий': '#0000ff', 'синее': '#0000ff', 'синяя': '#0000ff',
                'зеленый': '#00ff00', 'зеленое': '#00ff00', 'зеленая': '#00ff00',
                'желтый': '#ffff00', 'желтое': '#ffff00', 'желтая': '#ffff00',
                'фиолетовый': '#9b59b6', 'фиолетовое': '#9b59b6', 'фиолетовая': '#9b59b6',
                'оранжевый': '#ff6600', 'оранжевое': '#ff6600', 'оранжевая': '#ff6600',
                'розовый': '#ff69b4', 'розовое': '#ff69b4', 'розовая': '#ff69b4',
                'голубой': '#00ffff', 'голубое': '#00ffff', 'голубая': '#00ffff',
                'белый': '#ffffff', 'черный': '#000000', 'серый': '#808080'
            };
            
            const shapes = {
                'круг': 'circle', 'окружность': 'circle',
                'квадрат': 'square',
                'прямоугольник': 'rectangle',
                'треугольник': 'triangle',
                'звезда': 'star', 'звезду': 'star',
                'сердце': 'heart', 'сердечко': 'heart',
                'ромб': 'diamond',
                'трапеция': 'trapezoid', 'трапецию': 'trapezoid',
                'пятиугольник': 'pentagon',
                'шестиугольник': 'hexagon'
            };

            const shapeNames = {
                'circle': 'круг', 'square': 'квадрат', 'rectangle': 'прямоугольник',
                'triangle': 'треугольник', 'star': 'звезда', 'heart': 'сердце',
                'diamond': 'ромб', 'trapezoid': 'трапеция', 'pentagon': 'пятиугольник', 'hexagon': 'шестиугольник'
            };
            
            let detectedColor = null;
            let detectedColorName = '';
            let detectedShape = null;
            let detectedShapeName = '';
            let detectedSize = 200;
            let position = { x: 550, y: 400 };
            
            for (const [colorName, colorCode] of Object.entries(colors)) {
                if (lower.includes(colorName)) {
                    detectedColor = colorCode;
                    detectedColorName = colorName;
                    break;
                }
            }
            
            for (const [shapeName, shapeType] of Object.entries(shapes)) {
                if (lower.includes(shapeName)) {
                    detectedShape = shapeType;
                    detectedShapeName = shapeNames[shapeType];
                    break;
                }
            }
            
            const sizeMatch = lower.match(/(\d+)\s*(?:px|пиксел|см|размер)?/);
            if (sizeMatch) {
                detectedSize = Math.min(500, Math.max(50, parseInt(sizeMatch[1])));
            }
            
            if (lower.includes('слева')) position.x = 200;
            else if (lower.includes('справа')) position.x = 900;
            if (lower.includes('сверху')) position.y = 200;
            else if (lower.includes('снизу')) position.y = 600;
            else if (lower.includes('по центру') || lower.includes('посередине')) {
                position.x = 550;
                position.y = 400;
            }
            
            if (detectedShape) {
                return {
                    shape: detectedShape,
                    shapeName: detectedShapeName,
                    color: detectedColor || '#ffffff',
                    colorName: detectedColorName || 'белый',
                    size: detectedSize,
                    position: position
                };
            }
            
            return null;
        }

        function drawAIShape(shape, color, size, position) {
            saveCanvasState();
            
            const ctx = drawingCtx;
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            
            const cx = position.x;
            const cy = position.y;
            const w = size;
            const h = size;
            
            ctx.beginPath();
            
            switch(shape) {
                case 'circle':
                    ctx.arc(cx, cy, w/2, 0, Math.PI * 2);
                    break;
                case 'square':
                    ctx.rect(cx - w/2, cy - h/2, w, h);
                    break;
                case 'rectangle':
                    ctx.rect(cx - w/2, cy - h/3, w, h * 0.66);
                    break;
                case 'triangle':
                    ctx.moveTo(cx, cy - h/2);
                    ctx.lineTo(cx - w/2, cy + h/2);
                    ctx.lineTo(cx + w/2, cy + h/2);
                    ctx.closePath();
                    break;
                case 'star':
                    const outerR = w/2;
                    const innerR = outerR * 0.4;
                    for (let i = 0; i < 10; i++) {
                        const r = i % 2 === 0 ? outerR : innerR;
                        const angle = i * Math.PI / 5 - Math.PI / 2;
                        const x = cx + Math.cos(angle) * r;
                        const y = cy + Math.sin(angle) * r;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    break;
                case 'heart':
                    const hs = w/2;
                    ctx.moveTo(cx, cy + hs * 0.4);
                    ctx.bezierCurveTo(cx - hs * 0.8, cy - hs * 0.2, cx - hs, cy - hs * 0.6, cx - hs, cy - hs * 0.8);
                    ctx.bezierCurveTo(cx - hs, cy - hs * 1.0, cx - hs * 0.4, cy - hs * 1.1, cx, cy - hs * 0.4);
                    ctx.bezierCurveTo(cx + hs * 0.4, cy - hs * 1.1, cx + hs, cy - hs * 1.0, cx + hs, cy - hs * 0.8);
                    ctx.bezierCurveTo(cx + hs, cy - hs * 0.6, cx + hs * 0.8, cy - hs * 0.2, cx, cy + hs * 0.4);
                    ctx.closePath();
                    break;
                case 'diamond':
                    ctx.moveTo(cx, cy - h/2);
                    ctx.lineTo(cx + w/2, cy);
                    ctx.lineTo(cx, cy + h/2);
                    ctx.lineTo(cx - w/2, cy);
                    ctx.closePath();
                    break;
                case 'trapezoid':
                    const tw = w * 0.6;
                    ctx.moveTo(cx - tw/2, cy - h/2);
                    ctx.lineTo(cx + tw/2, cy - h/2);
                    ctx.lineTo(cx + w/2, cy + h/2);
                    ctx.lineTo(cx - w/2, cy + h/2);
                    ctx.closePath();
                    break;
                case 'pentagon':
                    const r5 = w/2;
                    for (let i = 0; i < 5; i++) {
                        const angle = i * 2 * Math.PI / 5 - Math.PI / 2;
                        const x = cx + Math.cos(angle) * r5;
                        const y = cy + Math.sin(angle) * r5;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    break;
                case 'hexagon':
                    const r6 = w/2;
                    for (let i = 0; i < 6; i++) {
                        const angle = i * Math.PI / 3 - Math.PI / 2;
                        const x = cx + Math.cos(angle) * r6;
                        const y = cy + Math.sin(angle) * r6;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    break;
            }
            
            ctx.stroke();
            ctx.fillStyle = color + '40';
            ctx.fill();
            
            saveCanvasState();
        }

        // ============ ИИ: ГЕНЕРАТОР ИКОНОК ============
        function analyzeDrawingShape() {
            const imageData = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
            let totalPixels = 0, centerX = 0, centerY = 0;
            let minX = drawingCanvas.width, minY = drawingCanvas.height, maxX = 0, maxY = 0;
            
            for (let y = 0; y < drawingCanvas.height; y += 4) {
                for (let x = 0; x < drawingCanvas.width; x += 4) {
                    const index = (y * drawingCanvas.width + x) * 4;
                    if (imageData.data[index + 3] > 50) {
                        totalPixels++;
                        centerX += x;
                        centerY += y;
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }
            
            if (totalPixels < 100) return { shape: 'empty', pixels: 0 };
            
            centerX /= totalPixels;
            centerY /= totalPixels;
            const width = maxX - minX;
            const height = maxY - minY;
            const aspectRatio = width / height;
            
            if (aspectRatio > 0.7 && aspectRatio < 1.4) {
                return { shape: 'circle', cx: centerX, cy: centerY, size: Math.max(width, height), pixels: totalPixels };
            } else if (aspectRatio > 1.5) {
                return { shape: 'rectangle', cx: centerX, cy: centerY, w: width, h: height, pixels: totalPixels };
            } else {
                return { shape: 'custom', cx: centerX, cy: centerY, w: width, h: height, pixels: totalPixels };
            }
        }

        function generateIcon() {
            const analysis = analyzeDrawingShape();
            
            if (analysis.pixels < 100) {
                iconStatus.innerHTML = '❌ Мало деталей';
                iconStatus.style.color = '#ff4444';
                return;
            }
            
            iconCtx.clearRect(0, 0, iconCanvas.width, iconCanvas.height);
            const size = Math.min(analysis.size || 200, 400);
            const cx = analysis.cx || 550;
            const cy = analysis.cy || 400;
            
            iconCtx.fillStyle = 'rgba(155, 89, 182, 0.2)';
            iconCtx.beginPath();
            iconCtx.roundRect(cx - size/2 - 20, cy - size/2 - 20, size + 40, size + 40, 20);
            iconCtx.fill();
            
            iconCtx.strokeStyle = '#9b59b6';
            iconCtx.lineWidth = 3;
            iconCtx.beginPath();
            iconCtx.roundRect(cx - size/2 - 20, cy - size/2 - 20, size + 40, size + 40, 20);
            iconCtx.stroke();
            
            iconCtx.save();
            iconCtx.translate(cx, cy);
            iconCtx.scale(-1, 1);
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = size;
            tempCanvas.height = size;
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCtx.drawImage(drawingCanvas, 
                analysis.cx - size/2, analysis.cy - size/2, 
                size, size, 
                0, 0, 
                size, size);
            
            iconCtx.filter = 'brightness(1.2) contrast(1.5) saturate(1.3)';
            iconCtx.drawImage(tempCanvas, -size/2, -size/2, size, size);
            iconCtx.filter = 'none';
            iconCtx.restore();
            
            iconCtx.fillStyle = '#9b59b6';
            iconCtx.font = 'bold 14px Arial';
            iconCtx.textAlign = 'center';
            iconCtx.save();
            iconCtx.translate(cx, cy + size/2 + 35);
            iconCtx.scale(-1, 1);
            iconCtx.fillText('ICON', 0, 0);
            iconCtx.restore();
            
            iconStatus.innerHTML = '✅ Иконка готова!';
            iconStatus.style.color = '#00ff00';
        }

        function generateEmoji() {
            const analysis = analyzeDrawingShape();
            
            if (analysis.pixels < 100) {
                iconStatus.innerHTML = '❌ Мало деталей';
                iconStatus.style.color = '#ff4444';
                return;
            }
            
            iconCtx.clearRect(0, 0, iconCanvas.width, iconCanvas.height);
            const size = 250;
            const cx = analysis.cx || 550;
            const cy = analysis.cy || 400;
            
            const gradient = iconCtx.createRadialGradient(cx - 30, cy - 30, 0, cx, cy, size/2);
            gradient.addColorStop(0, '#FFE44D');
            gradient.addColorStop(1, '#FFA500');
            iconCtx.fillStyle = gradient;
            iconCtx.beginPath();
            iconCtx.arc(cx, cy, size/2, 0, Math.PI * 2);
            iconCtx.fill();
            
            iconCtx.strokeStyle = '#FF8C00';
            iconCtx.lineWidth = 3;
            iconCtx.beginPath();
            iconCtx.arc(cx, cy, size/2, 0, Math.PI * 2);
            iconCtx.stroke();
            
            iconCtx.fillStyle = '#000000';
            iconCtx.beginPath();
            iconCtx.arc(cx - 40, cy - 35, 18, 0, Math.PI * 2);
            iconCtx.fill();
            iconCtx.beginPath();
            iconCtx.arc(cx + 40, cy - 35, 18, 0, Math.PI * 2);
            iconCtx.fill();
            
            iconCtx.strokeStyle = '#000000';
            iconCtx.lineWidth = 4;
            iconCtx.beginPath();
            iconCtx.arc(cx, cy + 15, 60, 0.1 * Math.PI, 0.9 * Math.PI);
            iconCtx.stroke();
            
            iconStatus.innerHTML = '😀 Эмодзи готов!';
            iconStatus.style.color = '#FFD700';
        }

        function simplifyDrawing() {
            const imageData = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
            let minX = drawingCanvas.width, minY = drawingCanvas.height, maxX = 0, maxY = 0;
            
            for (let y = 0; y < drawingCanvas.height; y += 2) {
                for (let x = 0; x < drawingCanvas.width; x += 2) {
                    if (imageData.data[(y * drawingCanvas.width + x) * 4 + 3] > 50) {
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }
            
            if (maxX - minX < 10) return;
            
            saveCanvasState();
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            
            drawingCtx.strokeStyle = currentBrushColor;
            drawingCtx.lineWidth = 4;
            drawingCtx.lineCap = 'round';
            drawingCtx.lineJoin = 'round';
            drawingCtx.beginPath();
            drawingCtx.roundRect(minX, minY, maxX - minX, maxY - minY, 15);
            drawingCtx.stroke();
            
            saveCanvasState();
            iconStatus.innerHTML = '📐 Упрощено!';
            iconStatus.style.color = '#00ff00';
        }

        function outlineDrawing() {
            const imageData = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
            let minX = drawingCanvas.width, minY = drawingCanvas.height, maxX = 0, maxY = 0;
            
            for (let y = 0; y < drawingCanvas.height; y += 2) {
                for (let x = 0; x < drawingCanvas.width; x += 2) {
                    if (imageData.data[(y * drawingCanvas.width + x) * 4 + 3] > 50) {
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }
            
            if (maxX - minX < 10) return;
            
            drawingCtx.strokeStyle = '#ffffff';
            drawingCtx.lineWidth = 3;
            drawingCtx.setLineDash([10, 5]);
            drawingCtx.beginPath();
            drawingCtx.rect(minX - 15, minY - 15, maxX - minX + 30, maxY - minY + 30);
            drawingCtx.stroke();
            drawingCtx.setLineDash([]);
            
            iconStatus.innerHTML = '✏️ Контур обведен!';
            iconStatus.style.color = '#00ff00';
        }

        function saveIcon() {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 512;
            tempCanvas.height = 512;
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCtx.fillStyle = '#000000';
            tempCtx.fillRect(0, 0, 512, 512);
            
            tempCtx.save();
            tempCtx.translate(256, 256);
            tempCtx.scale(-1, 1);
            tempCtx.drawImage(drawingCanvas, 
                drawingCanvas.width/2 - 200, drawingCanvas.height/2 - 200, 
                400, 400, 
                -200, -200, 
                400, 400);
            tempCtx.restore();
            
            const link = document.createElement('a');
            link.download = `fingerpaint-icon-${Date.now()}.png`;
            link.href = tempCanvas.toDataURL('image/png');
            link.click();
            
            iconStatus.innerHTML = '💾 Сохранено!';
            iconStatus.style.color = '#00ff00';
        }

        // ============ БАЗОВЫЕ ФУНКЦИИ ============
        function getShapeName(s) {
            const n = {
                'circle': 'Круг', 'square': 'Квадрат', 'rectangle': 'Прямоугольник',
                'triangle': 'Треугольник', 'star': 'Звезда', 'heart': 'Сердечко',
                'trapezoid': 'Трапеция', 'diamond': 'Ромб', 'pentagon': 'Пятиугольник', 'hexagon': 'Шестиугольник'
            };
            return n[s] || s;
        }

        function pixelsToCm(p) {
            return (p / PX_PER_CM).toFixed(1);
        }

        function updateMeasurement(t, v1, v2) {
            if (t === 'ruler' && v1) measurementDisplay.innerHTML = `📏 ${pixelsToCm(v1)} см`;
            else if (t === 'compass' && v1) measurementDisplay.innerHTML = `🔵 r=${pixelsToCm(v1)} см`;
            else if (t === 'shapes' && v1 && v2) measurementDisplay.innerHTML = `⭐ ${pixelsToCm(v1)}×${pixelsToCm(v2)} см`;
            else if (t === 'text' && v1) measurementDisplay.innerHTML = `🔤 ${pixelsToCm(v1)} см`;
            else measurementDisplay.innerHTML = '--';
        }

        function isOpenPalm(lm) {
            if (!lm || lm.length === 0) return false;
            const fingers = [
                { tip: 8, pip: 6 }, { tip: 12, pip: 10 }, { tip: 16, pip: 14 }, { tip: 20, pip: 18 }
            ];
            let raised = 0;
            fingers.forEach(f => { if (lm[f.tip].y < lm[f.pip].y) raised++; });
            return raised >= 4;
        }

        function isFistGesture(lm) {
            if (!lm || lm.length === 0) return false;
            const fingers = [
                { tip: 8, pip: 6 }, { tip: 12, pip: 10 }, { tip: 16, pip: 14 }, { tip: 20, pip: 18 }
            ];
            let bent = 0;
            fingers.forEach(f => { if (lm[f.tip].y > lm[f.pip].y) bent++; });
            return bent >= 4;
        }

        function detectSwipeGesture(lm) {
            if (!lm || lm.length === 0) return false;
            if (!isOpenPalm(lm)) { palmHistory = []; return false; }
            
            const wrist = lm[0];
            const wx = wrist.x * videoCanvas.width;
            const currentTime = Date.now();
            
            palmHistory.push({ x: wx, time: currentTime });
            if (palmHistory.length > 15) palmHistory.shift();
            if (palmHistory.length < 5) return false;
            if (currentTime - lastSwipeTime < SWIPE_COOLDOWN) return false;
            
            const firstPoint = palmHistory[0];
            const lastPoint = palmHistory[palmHistory.length - 1];
            const distance = firstPoint.x - lastPoint.x;
            const timeDiff = lastPoint.time - firstPoint.time;
            const speed = distance / timeDiff;
            
            if (distance > SWIPE_THRESHOLD && speed > SWIPE_SPEED) {
                lastSwipeTime = currentTime;
                palmHistory = [];
                return true;
            }
            return false;
        }

        function isFingerStationary(cx, cy, rx, ry) {
            if (!rx || !ry) return false;
            return Math.sqrt(Math.pow(cx - rx, 2) + Math.pow(cy - ry, 2)) < 25;
        }

        function smoothFingerPosition(x, y) {
            fingerHistory.push({ x, y });
            if (fingerHistory.length > SMOOTHING_WINDOW) fingerHistory.shift();
            
            let totalWeight = 0, weightedX = 0, weightedY = 0;
            fingerHistory.forEach((p, i) => {
                const weight = (i + 1) / fingerHistory.length;
                weightedX += p.x * weight;
                weightedY += p.y * weight;
                totalWeight += weight;
            });
            
            return { x: weightedX / totalWeight, y: weightedY / totalWeight };
        }

        function saveCanvasState() {
            const imageData = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
            strokeHistory.push(imageData);
            if (strokeHistory.length > MAX_HISTORY) strokeHistory.shift();
        }

        function undoLastStroke() {
            if (strokeHistory.length > 0) {
                strokeHistory.pop();
                drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                if (strokeHistory.length > 0) {
                    drawingCtx.putImageData(strokeHistory[strokeHistory.length - 1], 0, 0);
                }
                measurementDisplay.innerHTML = '--';
            }
        }

        function clearCanvasWithAnimation() {
            saveCanvasState();
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            rulerCtx.clearRect(0, 0, rulerCanvas.width, rulerCanvas.height);
            iconCtx.clearRect(0, 0, iconCanvas.width, iconCanvas.height);
            lastPoint = null;
            currentStroke = [];
            resetAllTools();
            saveCanvasState();
            measurementDisplay.innerHTML = '--';
        }

        function resetAllTools() {
            rulerCtx.clearRect(0, 0, rulerCanvas.width, rulerCanvas.height);
            stopFinishTimer();
            rulerIsDrawing = false; rulerStartPoint = null; rulerCurrentPoint = null;
            compassIsDrawing = false; compassStartPoint = null; compassCurrentPoint = null;
            shapesIsDrawing = false; shapesStartPoint = null; shapesCurrentPoint = null;
            textIsDrawing = false; textStartPoint = null; textCurrentPoint = null;
        }

        function startFinishTimer() {
            finishHoldStartTime = Date.now();
            isFinishingHold = true;
            timerCircle.style.display = 'flex';
            
            if (finishTimerInterval) clearInterval(finishTimerInterval);
            
            finishTimerInterval = setInterval(() => {
                if (finishHoldStartTime) {
                    const remaining = Math.max(0, FINISH_HOLD_DURATION - (Date.now() - finishHoldStartTime));
                    const seconds = Math.ceil(remaining / 1000);
                    timerCircle.textContent = seconds;
                    
                    if (remaining < 1000) {
                        timerCircle.style.borderColor = '#ff0000';
                        timerCircle.style.color = '#ff0000';
                    } else {
                        timerCircle.style.borderColor = '#00ff00';
                        timerCircle.style.color = '#00ff00';
                    }
                    
                    if (remaining <= 0) {
                        finishDrawing();
                        stopFinishTimer();
                    }
                }
            }, 100);
        }

        function stopFinishTimer() {
            if (finishTimerInterval) { clearInterval(finishTimerInterval); finishTimerInterval = null; }
            finishHoldStartTime = null;
            isFinishingHold = false;
            timerCircle.style.display = 'none';
            timerCircle.style.borderColor = '#00ff00';
            timerCircle.style.color = '#00ff00';
        }

        function drawShape(ctx, shape, cx, cy, w, h) {
            ctx.strokeStyle = currentBrushColor;
            ctx.lineWidth = currentLineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            
            switch(shape) {
                case 'circle': ctx.arc(cx, cy, Math.max(w, h) / 2, 0, Math.PI * 2); break;
                case 'square': const s = Math.max(w, h); ctx.rect(cx - s/2, cy - s/2, s, s); break;
                case 'rectangle': ctx.rect(cx - w/2, cy - h/2, w, h); break;
                case 'triangle': ctx.moveTo(cx, cy - h/2); ctx.lineTo(cx - w/2, cy + h/2); ctx.lineTo(cx + w/2, cy + h/2); ctx.closePath(); break;
                case 'star':
                    const outerR = Math.max(w, h) / 2; const innerR = outerR * 0.4;
                    for (let i = 0; i < 10; i++) {
                        const r = i % 2 === 0 ? outerR : innerR;
                        const angle = i * Math.PI / 5 - Math.PI / 2;
                        const x = cx + Math.cos(angle) * r; const y = cy + Math.sin(angle) * r;
                        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.closePath(); break;
                case 'heart':
                    const hs = Math.max(w, h) / 2;
                    ctx.moveTo(cx, cy + hs * 0.4);
                    ctx.bezierCurveTo(cx - hs * 0.8, cy - hs * 0.2, cx - hs, cy - hs * 0.6, cx - hs, cy - hs * 0.8);
                    ctx.bezierCurveTo(cx - hs, cy - hs * 1.0, cx - hs * 0.4, cy - hs * 1.1, cx, cy - hs * 0.4);
                    ctx.bezierCurveTo(cx + hs * 0.4, cy - hs * 1.1, cx + hs, cy - hs * 1.0, cx + hs, cy - hs * 0.8);
                    ctx.bezierCurveTo(cx + hs, cy - hs * 0.6, cx + hs * 0.8, cy - hs * 0.2, cx, cy + hs * 0.4);
                    ctx.closePath(); break;
                case 'trapezoid': const tw = w * 0.6; ctx.moveTo(cx - tw/2, cy - h/2); ctx.lineTo(cx + tw/2, cy - h/2); ctx.lineTo(cx + w/2, cy + h/2); ctx.lineTo(cx - w/2, cy + h/2); ctx.closePath(); break;
                case 'diamond': ctx.moveTo(cx, cy - h/2); ctx.lineTo(cx + w/2, cy); ctx.lineTo(cx, cy + h/2); ctx.lineTo(cx - w/2, cy); ctx.closePath(); break;
                case 'pentagon':
                    const r5 = Math.max(w, h) / 2;
                    for (let i = 0; i < 5; i++) {
                        const angle = i * 2 * Math.PI / 5 - Math.PI / 2;
                        const x = cx + Math.cos(angle) * r5; const y = cy + Math.sin(angle) * r5;
                        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.closePath(); break;
                case 'hexagon':
                    const r6 = Math.max(w, h) / 2;
                    for (let i = 0; i < 6; i++) {
                        const angle = i * Math.PI / 3 - Math.PI / 2;
                        const x = cx + Math.cos(angle) * r6; const y = cy + Math.sin(angle) * r6;
                        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.closePath(); break;
            }
            ctx.stroke();
        }

        function drawRulerPreview(sx, sy, ex, ey) {
            rulerCtx.clearRect(0, 0, rulerCanvas.width, rulerCanvas.height);
            rulerCtx.strokeStyle = '#ffffff'; rulerCtx.lineWidth = 2;
            rulerCtx.setLineDash([5, 5]);
            rulerCtx.beginPath(); rulerCtx.moveTo(sx, sy); rulerCtx.lineTo(ex, ey); rulerCtx.stroke();
            rulerCtx.setLineDash([]);
            const distance = Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2));
            const mx = (sx + ex) / 2; const my = (sy + ey) / 2;
            rulerCtx.save(); rulerCtx.translate(mx, my); rulerCtx.scale(-1, 1);
            rulerCtx.fillStyle = '#ffffff'; rulerCtx.font = 'bold 16px Arial'; rulerCtx.textAlign = 'center';
            rulerCtx.fillText(`${pixelsToCm(distance)} см`, 0, -15); rulerCtx.restore();
        }

        function drawCompassPreview(cx, cy, ex, ey) {
            rulerCtx.clearRect(0, 0, rulerCanvas.width, rulerCanvas.height);
            const radius = Math.sqrt(Math.pow(ex - cx, 2) + Math.pow(ey - cy, 2));
            if (radius > 5) {
                rulerCtx.strokeStyle = '#ffffff'; rulerCtx.lineWidth = 2;
                rulerCtx.beginPath(); rulerCtx.arc(cx, cy, radius, 0, Math.PI * 2); rulerCtx.stroke();
                rulerCtx.save(); rulerCtx.translate(cx + radius/2, cy - 15); rulerCtx.scale(-1, 1);
                rulerCtx.fillStyle = '#ffffff'; rulerCtx.font = 'bold 16px Arial'; rulerCtx.textAlign = 'center';
                rulerCtx.fillText(`r=${pixelsToCm(radius)} см`, 0, 0); rulerCtx.restore();
            }
        }

        function drawShapePreview(shape, sx, sy, ex, ey) {
            rulerCtx.clearRect(0, 0, rulerCanvas.width, rulerCanvas.height);
            const w = Math.abs(ex - sx); const h = Math.abs(ey - sy);
            if (w > 5 && h > 5) {
                const cx = (sx + ex) / 2; const cy = (sy + ey) / 2;
                rulerCtx.strokeStyle = '#ffffff'; rulerCtx.lineWidth = 2;
                drawShape(rulerCtx, shape, cx, cy, w, h);
                rulerCtx.save(); rulerCtx.translate(cx, cy - Math.max(w, h)/2 - 20); rulerCtx.scale(-1, 1);
                rulerCtx.fillStyle = '#ffffff'; rulerCtx.font = 'bold 16px Arial'; rulerCtx.textAlign = 'center';
                rulerCtx.fillText(`${pixelsToCm(w)}×${pixelsToCm(h)} см`, 0, 0); rulerCtx.restore();
            }
        }

        function drawTextPreview(sx, sy, ex, ey, text) {
            rulerCtx.clearRect(0, 0, rulerCanvas.width, rulerCanvas.height);
            const size = Math.max(Math.abs(ex - sx), Math.abs(ey - sy));
            if (size > 5 && text) {
                const cx = (sx + ex) / 2; const cy = (sy + ey) / 2;
                rulerCtx.fillStyle = '#ffffff';
                const fontSize = Math.min(size, 200 / text.length * 2);
                rulerCtx.font = `bold ${fontSize}px Arial`; rulerCtx.textAlign = 'center'; rulerCtx.textBaseline = 'middle';
                rulerCtx.save(); rulerCtx.translate(cx, cy); rulerCtx.scale(-1, 1);
                rulerCtx.fillText(text, 0, 0); rulerCtx.restore();
            }
        }

        function finishDrawing() {
            if (rulerIsDrawing && rulerStartPoint && rulerCurrentPoint) {
                const distance = Math.sqrt(Math.pow(rulerCurrentPoint.x - rulerStartPoint.x, 2) + Math.pow(rulerCurrentPoint.y - rulerStartPoint.y, 2));
                if (distance > 10) {
                    saveCanvasState();
                    drawingCtx.strokeStyle = currentBrushColor; drawingCtx.lineWidth = currentLineWidth; drawingCtx.lineCap = 'round';
                    drawingCtx.beginPath(); drawingCtx.moveTo(rulerStartPoint.x, rulerStartPoint.y); drawingCtx.lineTo(rulerCurrentPoint.x, rulerCurrentPoint.y); drawingCtx.stroke();
                    saveCanvasState();
                }
                rulerStartPoint = { x: rulerCurrentPoint.x, y: rulerCurrentPoint.y };
            }
            if (compassIsDrawing && compassStartPoint && compassCurrentPoint) {
                const radius = Math.sqrt(Math.pow(compassCurrentPoint.x - compassStartPoint.x, 2) + Math.pow(compassCurrentPoint.y - compassStartPoint.y, 2));
                if (radius > 10) {
                    saveCanvasState();
                    drawingCtx.strokeStyle = currentBrushColor; drawingCtx.lineWidth = currentLineWidth;
                    drawingCtx.beginPath(); drawingCtx.arc(compassStartPoint.x, compassStartPoint.y, radius, 0, Math.PI * 2); drawingCtx.stroke();
                    drawingCtx.fillStyle = currentBrushColor;
                    drawingCtx.beginPath(); drawingCtx.arc(compassStartPoint.x, compassStartPoint.y, currentLineWidth, 0, Math.PI * 2); drawingCtx.fill();
                    saveCanvasState();
                }
                compassCurrentPoint = { x: compassStartPoint.x + radius, y: compassStartPoint.y };
            }
            if (shapesIsDrawing && shapesStartPoint && shapesCurrentPoint) {
                const w = Math.abs(shapesCurrentPoint.x - shapesStartPoint.x); const h = Math.abs(shapesCurrentPoint.y - shapesStartPoint.y);
                if (w > 10 && h > 10) {
                    const cx = (shapesStartPoint.x + shapesCurrentPoint.x) / 2; const cy = (shapesStartPoint.y + shapesCurrentPoint.y) / 2;
                    saveCanvasState(); drawShape(drawingCtx, currentShape, cx, cy, w, h); saveCanvasState();
                }
                shapesStartPoint = { x: shapesCurrentPoint.x, y: shapesCurrentPoint.y };
            }
            if (textIsDrawing && textStartPoint && textCurrentPoint) {
                const size = Math.max(Math.abs(textCurrentPoint.x - textStartPoint.x), Math.abs(textCurrentPoint.y - textStartPoint.y));
                if (size > 10 && currentText) {
                    const cx = (textStartPoint.x + textCurrentPoint.x) / 2; const cy = (textStartPoint.y + textCurrentPoint.y) / 2;
                    saveCanvasState();
                    drawingCtx.fillStyle = currentBrushColor;
                    const fontSize = Math.min(size, 200 / currentText.length * 2);
                    drawingCtx.font = `bold ${fontSize}px Arial`; drawingCtx.textAlign = 'center'; drawingCtx.textBaseline = 'middle';
                    drawingCtx.save(); drawingCtx.translate(cx, cy); drawingCtx.scale(-1, 1); drawingCtx.fillText(currentText, 0, 0); drawingCtx.restore();
                    saveCanvasState();
                }
                textStartPoint = { x: textCurrentPoint.x, y: textCurrentPoint.y };
            }
        }

        function drawLine(from, to) {
            if (!from || !to) return;
            drawingCtx.beginPath();
            drawingCtx.moveTo(from.x, from.y); drawingCtx.lineTo(to.x, to.y);
            drawingCtx.lineWidth = to.size || currentBrushSize;
            drawingCtx.lineCap = 'round'; drawingCtx.lineJoin = 'round';
            if (to.mode === 'eraser') {
                drawingCtx.globalCompositeOperation = 'destination-out';
                drawingCtx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                drawingCtx.globalCompositeOperation = 'source-over';
                drawingCtx.strokeStyle = currentBrushColor;
            }
            drawingCtx.stroke();
        }

        function switchTool(tool) {
            if (tool === 'eraser' && ['ruler', 'compass', 'shapes', 'text'].includes(currentTool)) {
                currentTool = 'brush'; updateToolButtons(); resetAllTools(); measurementDisplay.innerHTML = '--'; return;
            }
            currentTool = tool; updateToolButtons(); resetAllTools(); measurementDisplay.innerHTML = '--';
        }

        function updateToolButtons() {
            toolBrush.classList.remove('active'); toolEraser.classList.remove('active');
            toolRuler.classList.remove('active'); toolCompass.classList.remove('active');
            toolShapes.classList.remove('active'); toolText.classList.remove('active');
            switch(currentTool) {
                case 'brush': toolBrush.classList.add('active'); toolInfo.innerHTML = '🖌️ Кисть'; break;
                case 'eraser': toolEraser.classList.add('active'); toolInfo.innerHTML = '🧹 Ластик'; break;
                case 'ruler': toolRuler.classList.add('active'); toolInfo.innerHTML = '📏 Линейка'; break;
                case 'compass': toolCompass.classList.add('active'); toolInfo.innerHTML = '🔵 Циркуль'; break;
                case 'shapes': toolShapes.classList.add('active'); toolInfo.innerHTML = '⭐ Фигуры'; break;
                case 'text': toolText.classList.add('active'); toolInfo.innerHTML = '🔤 Текст'; break;
            }
        }

        function onHandsResults(results) {
            debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
            videoCtx.save(); videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
            videoCtx.drawImage(results.image, 0, 0, videoCanvas.width, videoCanvas.height); videoCtx.restore();
            
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                const landmarks = results.multiHandLandmarks[0];
                if (detectSwipeGesture(landmarks)) { clearCanvasWithAnimation(); lastPoint = null; return; }
                
                const fistDetected = isFistGesture(landmarks);
                if (fistDetected) {
                    fistFrameCount++;
                    if (fistFrameCount >= FIST_THRESHOLD) {
                        isDrawingStopped = true;
                        if (rulerIsDrawing || compassIsDrawing || shapesIsDrawing || textIsDrawing) finishDrawing();
                        lastPoint = null; return;
                    }
                } else { fistFrameCount = 0; isDrawingStopped = false; }
                
                if (isOpenPalm(landmarks)) stopFinishTimer();
                
                const indexTip = landmarks[8];
                const fingerX = indexTip.x * videoCanvas.width; const fingerY = indexTip.y * videoCanvas.height;
                const smoothed = smoothFingerPosition(fingerX, fingerY);
                const isRaised = indexTip.y < landmarks[5].y;
                
                if (isRaised && !isOpenPalm(landmarks) && !isDrawingStopped && !fistDetected) {
                    if (currentTool === 'brush' || currentTool === 'eraser') {
                        stopFinishTimer(); rulerCtx.clearRect(0, 0, rulerCanvas.width, rulerCanvas.height);
                        rulerIsDrawing = compassIsDrawing = shapesIsDrawing = textIsDrawing = false;
                        measurementDisplay.innerHTML = '--';
                        if (lastPoint) {
                            const distance = Math.sqrt(Math.pow(smoothed.x - lastPoint.x, 2) + Math.pow(smoothed.y - lastPoint.y, 2));
                            if (distance < 50) {
                                drawLine(lastPoint, { x: smoothed.x, y: smoothed.y, size: currentBrushSize, mode: currentTool });
                                currentStroke.push({ x: smoothed.x, y: smoothed.y });
                            }
                        } else { if (currentStroke.length > 0) { saveCanvasState(); currentStroke = []; } }
                        lastPoint = { x: smoothed.x, y: smoothed.y };
                    } else if (currentTool === 'ruler') {
                        if (!rulerIsDrawing) { rulerStartPoint = rulerCurrentPoint || { x: smoothed.x, y: smoothed.y }; rulerCurrentPoint = { x: smoothed.x, y: smoothed.y }; rulerIsDrawing = true; stopFinishTimer(); }
                        else {
                            rulerCurrentPoint = { x: smoothed.x, y: smoothed.y };
                            drawRulerPreview(rulerStartPoint.x, rulerStartPoint.y, rulerCurrentPoint.x, rulerCurrentPoint.y);
                            updateMeasurement('ruler', Math.sqrt(Math.pow(rulerCurrentPoint.x - rulerStartPoint.x, 2) + Math.pow(rulerCurrentPoint.y - rulerStartPoint.y, 2)));
                            if (isFingerStationary(smoothed.x, smoothed.y, rulerCurrentPoint.x, rulerCurrentPoint.y)) { if (!isFinishingHold) startFinishTimer(); }
                            else { if (isFinishingHold) stopFinishTimer(); }
                        }
                        lastPoint = { x: smoothed.x, y: smoothed.y };
                    } else if (currentTool === 'compass') {
                        if (!compassIsDrawing) { compassStartPoint = compassCurrentPoint || { x: smoothed.x, y: smoothed.y }; compassCurrentPoint = { x: smoothed.x, y: smoothed.y }; compassIsDrawing = true; stopFinishTimer(); }
                        else {
                            compassCurrentPoint = { x: smoothed.x, y: smoothed.y };
                            drawCompassPreview(compassStartPoint.x, compassStartPoint.y, compassCurrentPoint.x, compassCurrentPoint.y);
                            updateMeasurement('compass', Math.sqrt(Math.pow(compassCurrentPoint.x - compassStartPoint.x, 2) + Math.pow(compassCurrentPoint.y - compassStartPoint.y, 2)));
                            if (isFingerStationary(smoothed.x, smoothed.y, compassCurrentPoint.x, compassCurrentPoint.y)) { if (!isFinishingHold) startFinishTimer(); }
                            else { if (isFinishingHold) stopFinishTimer(); }
                        }
                        lastPoint = { x: smoothed.x, y: smoothed.y };
                    } else if (currentTool === 'shapes') {
                        if (!shapesIsDrawing) { shapesStartPoint = shapesCurrentPoint || { x: smoothed.x, y: smoothed.y }; shapesCurrentPoint = { x: smoothed.x, y: smoothed.y }; shapesIsDrawing = true; stopFinishTimer(); }
                        else {
                            shapesCurrentPoint = { x: smoothed.x, y: smoothed.y };
                            drawShapePreview(currentShape, shapesStartPoint.x, shapesStartPoint.y, shapesCurrentPoint.x, shapesCurrentPoint.y);
                            updateMeasurement('shapes', Math.abs(shapesCurrentPoint.x - shapesStartPoint.x), Math.abs(shapesCurrentPoint.y - shapesStartPoint.y));
                            if (isFingerStationary(smoothed.x, smoothed.y, shapesCurrentPoint.x, shapesCurrentPoint.y)) { if (!isFinishingHold) startFinishTimer(); }
                            else { if (isFinishingHold) stopFinishTimer(); }
                        }
                        lastPoint = { x: smoothed.x, y: smoothed.y };
                    } else if (currentTool === 'text') {
                        if (!textIsDrawing) { textStartPoint = textCurrentPoint || { x: smoothed.x, y: smoothed.y }; textCurrentPoint = { x: smoothed.x, y: smoothed.y }; textIsDrawing = true; stopFinishTimer(); }
                        else {
                            textCurrentPoint = { x: smoothed.x, y: smoothed.y };
                            drawTextPreview(textStartPoint.x, textStartPoint.y, textCurrentPoint.x, textCurrentPoint.y, currentText);
                            updateMeasurement('text', Math.max(Math.abs(textCurrentPoint.x - textStartPoint.x), Math.abs(textCurrentPoint.y - textStartPoint.y)));
                            if (isFingerStationary(smoothed.x, smoothed.y, textCurrentPoint.x, textCurrentPoint.y)) { if (!isFinishingHold) startFinishTimer(); }
                            else { if (isFinishingHold) stopFinishTimer(); }
                        }
                        lastPoint = { x: smoothed.x, y: smoothed.y };
                    }
                    debugCtx.beginPath(); debugCtx.arc(smoothed.x, smoothed.y, 8, 0, 2 * Math.PI);
                    debugCtx.strokeStyle = '#ffffff'; debugCtx.lineWidth = 2; debugCtx.stroke();
                } else if (!isDrawingStopped) {
                    if (lastPoint && currentStroke.length > 0) { saveCanvasState(); currentStroke = []; }
                    stopFinishTimer(); lastPoint = null;
                }
            } else {
                if (lastPoint && currentStroke.length > 0) { saveCanvasState(); currentStroke = []; }
                resetAllTools(); lastPoint = null; fistFrameCount = 0; measurementDisplay.innerHTML = '--';
            }
        }

        function createMirroredScreenshot() {
            const compositeCanvas = document.createElement('canvas');
            compositeCanvas.width = 1100; compositeCanvas.height = 800;
            const compositeCtx = compositeCanvas.getContext('2d');
            compositeCtx.drawImage(videoCanvas, 0, 0); compositeCtx.drawImage(drawingCanvas, 0, 0);
            return compositeCanvas;
        }

        function takePhoto() {
            const screenshot = createMirroredScreenshot();
            const link = document.createElement('a');
            link.download = `fingerpaint-photo-${Date.now()}.png`; link.href = screenshot.toDataURL('image/png'); link.click();
        }

        function toggleVideoRecording() { if (!isRecording) startRecording(); else stopRecording(); }

        function startRecording() {
            const compositeCanvas = document.createElement('canvas');
            compositeCanvas.width = 1100; compositeCanvas.height = 800;
            const compositeCtx = compositeCanvas.getContext('2d');
            const stream = compositeCanvas.captureStream(30);
            recordedChunks = [];
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const link = document.createElement('a');
                link.download = `fingerpaint-video-${Date.now()}.webm`; link.href = URL.createObjectURL(blob); link.click(); URL.revokeObjectURL(link.href);
            };
            mediaRecorder.start(); isRecording = true;
            videoBtn.textContent = '⏹'; videoBtn.classList.add('recording'); recordStatus.innerHTML = '🔴';
            const drawFrame = () => { if (!isRecording) return; compositeCtx.drawImage(videoCanvas, 0, 0); compositeCtx.drawImage(drawingCanvas, 0, 0); requestAnimationFrame(drawFrame); };
            drawFrame();
        }

        function stopRecording() {
            if (mediaRecorder && isRecording) {
                mediaRecorder.stop(); isRecording = false;
                videoBtn.textContent = '🎥'; videoBtn.classList.remove('recording'); recordStatus.innerHTML = '';
            }
        }

        function saveDrawing() {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 1100; tempCanvas.height = 800;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.save(); tempCtx.translate(1100, 0); tempCtx.scale(-1, 1); tempCtx.drawImage(drawingCanvas, 0, 0); tempCtx.restore();
            const link = document.createElement('a');
            link.download = `fingerpaint-drawing-${Date.now()}.png`; link.href = tempCanvas.toDataURL('image/png'); link.click();
        }

        // Инициализация
        const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
        hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.5 });
        hands.onResults(onHandsResults);

        const camera = new Camera(video, { onFrame: async () => { await hands.send({ image: video }); }, width: 1100, height: 800 });
        camera.start().then(() => {
            info.style.color = '#00ff00'; textInput.value = currentText;
        }).catch(err => { info.innerText = 'Ошибка камеры: ' + err.message; });

        // Обработчики
        shapeSelect.addEventListener('change', (e) => { currentShape = e.target.value; });
        textInput.addEventListener('input', (e) => { if (textInput.value.length > 100) textInput.value = textInput.value.slice(0, 100); currentText = textInput.value || 'Текст'; });
        undoBtn.addEventListener('click', undoLastStroke);
        clearBtn.addEventListener('click', clearCanvasWithAnimation);
        photoBtn.addEventListener('click', takePhoto);
        videoBtn.addEventListener('click', toggleVideoRecording);
        saveBtn.addEventListener('click', saveDrawing);
        toolBrush.addEventListener('click', () => switchTool('brush'));
        toolEraser.addEventListener('click', () => switchTool('eraser'));
        toolRuler.addEventListener('click', () => switchTool('ruler'));
        toolCompass.addEventListener('click', () => switchTool('compass'));
        toolShapes.addEventListener('click', () => switchTool('shapes'));
        toolText.addEventListener('click', () => switchTool('text'));
        paletteContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-badge')) {
                document.querySelectorAll('.color-badge').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected'); currentBrushColor = e.target.getAttribute('data-color'); colorPicker.value = currentBrushColor;
            }
        });
        colorPicker.addEventListener('input', (e) => { currentBrushColor = e.target.value; });
        brushSizeInput.addEventListener('input', (e) => { currentBrushSize = parseInt(e.target.value); sizeVal.innerText = currentBrushSize; });
        lineWidthInput.addEventListener('input', (e) => { currentLineWidth = parseInt(e.target.value); lineVal.innerText = currentLineWidth; });

        // AI обработчики
        aiDrawBtn.addEventListener('click', () => {
            const command = aiCommand.value.trim();
            if (command) processAICommand(command);
            else { aiStatus.innerHTML = '❌ Введите команду'; setTimeout(() => { aiStatus.innerHTML = ''; }, 2000); }
        });
        aiCommand.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { const command = aiCommand.value.trim(); if (command) processAICommand(command); }
        });
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undoLastStroke(); }
        });
        iconBtn.addEventListener('click', generateIcon);
        emojiBtn.addEventListener('click', generateEmoji);
        simplifyBtn.addEventListener('click', simplifyDrawing);
        outlineBtn.addEventListener('click', outlineDrawing);
        saveIconBtn.addEventListener('click', saveIcon);