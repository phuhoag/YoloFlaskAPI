// YOLO Object Detection - JavaScript Functions (No Step Guide)

// Global variables
let currentImageFile = null;
let currentVideoFile = null;

// Object emoji mapping for better visual display
const objectEmojis = {
    'person': '👤', 'bicycle': '🚲', 'car': '🚗', 'motorcycle': '🏍️', 'airplane': '✈️',
    'bus': '🚌', 'train': '🚂', 'truck': '🚚', 'boat': '⛵', 'traffic light': '🚦',
    'fire hydrant': '🚰', 'stop sign': '🛑', 'parking meter': '🅿️', 'bench': '🪑',
    'bird': '🐦', 'cat': '🐱', 'dog': '🐕', 'horse': '🐴', 'sheep': '🐑', 'cow': '🐄',
    'elephant': '🐘', 'bear': '🐻', 'zebra': '🦓', 'giraffe': '🦒', 'backpack': '🎒',
    'umbrella': '☂️', 'handbag': '👜', 'tie': '👔', 'suitcase': '🧳', 'frisbee': '🥏',
    'skis': '🎿', 'snowboard': '🏂', 'sports ball': '⚽', 'kite': '🪁', 'baseball bat': '⚾',
    'baseball glove': '🥎', 'skateboard': '🛹', 'surfboard': '🏄', 'tennis racket': '🎾',
    'bottle': '🍼', 'wine glass': '🍷', 'cup': '☕', 'fork': '🍴', 'knife': '🔪',
    'spoon': '🥄', 'bowl': '🍜', 'banana': '🍌', 'apple': '🍎', 'sandwich': '🥪',
    'orange': '🍊', 'broccoli': '🥦', 'carrot': '🥕', 'hot dog': '🌭', 'pizza': '🍕',
    'donut': '🍩', 'cake': '🎂', 'chair': '🪑', 'couch': '🛋️', 'potted plant': '🪴',
    'bed': '🛏️', 'dining table': '🪑', 'toilet': '🚽', 'tv': '📺', 'laptop': '💻',
    'mouse': '🖱️', 'remote': '📱', 'keyboard': '⌨️', 'cell phone': '📱', 'microwave': '📡',
    'oven': '🔥', 'toaster': '🍞', 'sink': '🚿', 'refrigerator': '🧊', 'book': '📚',
    'clock': '⏰', 'vase': '🏺', 'scissors': '✂️', 'teddy bear': '🧸', 'hair drier': '💨',
    'toothbrush': '🪥'
};

// Get emoji for object name
function getObjectEmoji(objectName) {
    return objectEmojis[objectName.toLowerCase()] || '📦';
}

// Get Vietnamese name for common objects
function getVietnameseName(objectName) {
    const vietnameseNames = {
        'person': 'Người', 'bicycle': 'Xe đạp', 'car': 'Ô tô', 'motorcycle': 'Xe máy',
        'airplane': 'Máy bay', 'bus': 'Xe buýt', 'train': 'Tàu hỏa', 'truck': 'Xe tải',
        'boat': 'Thuyền', 'traffic light': 'Đèn giao thông', 'fire hydrant': 'Vòi nước',
        'stop sign': 'Biển báo dừng', 'parking meter': 'Đồng hồ đậu xe', 'bench': 'Ghế dài',
        'bird': 'Chim', 'cat': 'Mèo', 'dog': 'Chó', 'horse': 'Ngựa', 'sheep': 'Cừu',
        'cow': 'Bò', 'elephant': 'Voi', 'bear': 'Gấu', 'zebra': 'Ngựa vằn',
        'giraffe': 'Hươu cao cổ', 'backpack': 'Ba lô', 'umbrella': 'Ô',
        'handbag': 'Túi xách', 'tie': 'Cà vạt', 'suitcase': 'Va li', 'frisbee': 'Đĩa bay',
        'skis': 'Ván trượt tuyết', 'snowboard': 'Ván trượt', 'sports ball': 'Bóng thể thao',
        'kite': 'Diều', 'baseball bat': 'Gậy bóng chày', 'baseball glove': 'Găng tay',
        'skateboard': 'Ván trượt', 'surfboard': 'Ván lướt sóng', 'tennis racket': 'Vợt tennis',
        'bottle': 'Chai', 'wine glass': 'Ly rượu', 'cup': 'Cốc', 'fork': 'Nĩa',
        'knife': 'Dao', 'spoon': 'Muỗng', 'bowl': 'Bát', 'banana': 'Chuối',
        'apple': 'Táo', 'sandwich': 'Bánh mì', 'orange': 'Cam', 'broccoli': 'Súp lơ',
        'carrot': 'Cà rốt', 'hot dog': 'Bánh mì kẹp', 'pizza': 'Pizza', 'donut': 'Bánh donut',
        'cake': 'Bánh ngọt', 'chair': 'Ghế', 'couch': 'Ghế sofa', 'potted plant': 'Cây cảnh',
        'bed': 'Giường', 'dining table': 'Bàn ăn', 'toilet': 'Toilet', 'tv': 'Tivi',
        'laptop': 'Laptop', 'mouse': 'Chuột máy tính', 'remote': 'Điều khiển',
        'keyboard': 'Bàn phím', 'cell phone': 'Điện thoại', 'microwave': 'Lò vi sóng',
        'oven': 'Lò nướng', 'toaster': 'Máy nướng bánh', 'sink': 'Chậu rửa',
        'refrigerator': 'Tủ lạnh', 'book': 'Sách', 'clock': 'Đồng hồ', 'vase': 'Bình hoa',
        'scissors': 'Kéo', 'teddy bear': 'Gấu bông', 'hair drier': 'Máy sấy tóc',
        'toothbrush': 'Bàn chải đánh răng'
    };
    
    return vietnameseNames[objectName.toLowerCase()] || objectName;
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Starting app initialization');
    initializeApp();
    checkModelStatus();
    setupEventListeners();
    loadHistory();
    loadStatistics();
});

// Initialize application
function initializeApp() {
    console.log('🚀 YOLO Object Detection App initialized');
    
    // Set up confidence sliders
    updateConfidenceDisplay('image');
    updateConfidenceDisplay('video');
    
    showToast('✅ Ứng dụng đã khởi động', 'success');
}

// Check model status
async function checkModelStatus() {
    try {
        const response = await fetch('/api/statistics');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('model-status').textContent = '✅ YOLO Model sẵn sàng';
            document.getElementById('model-status').className = 'status-indicator ready';
        } else {
            throw new Error('Model not ready');
        }
    } catch (error) {
        document.getElementById('model-status').textContent = '❌ Lỗi model';
        document.getElementById('model-status').className = 'status-indicator error';
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log('🔧 Setting up event listeners');
    
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            console.log('Tab clicked:', e.target.dataset.tab);
            switchTab(e.target.dataset.tab);
        });
    });

    // File input handlers
    const imageInput = document.getElementById('image-input');
    const videoInput = document.getElementById('video-input');
    
    console.log('Image input found:', !!imageInput);
    console.log('Video input found:', !!videoInput);
    
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            console.log('Image file selected:', e.target.files[0]);
            handleFileSelection(e, 'image');
        });
    }
    
    if (videoInput) {
        videoInput.addEventListener('change', (e) => {
            console.log('Video file selected:', e.target.files[0]);
            handleFileSelection(e, 'video');
        });
    }

    // Form submission handlers
    const imageForm = document.getElementById('image-form');
    const videoForm = document.getElementById('video-form');
    
    console.log('Image form found:', !!imageForm);
    console.log('Video form found:', !!videoForm);
    
    if (imageForm) {
        imageForm.addEventListener('submit', handleImageSubmit);
    }
    
    if (videoForm) {
        videoForm.addEventListener('submit', handleVideoSubmit);
    }

    // Confidence sliders
    const imageSlider = document.getElementById('image-confidence');
    const videoSlider = document.getElementById('video-confidence');
    
    if (imageSlider) {
        imageSlider.addEventListener('input', () => updateConfidenceDisplay('image'));
    }
    
    if (videoSlider) {
        videoSlider.addEventListener('input', () => updateConfidenceDisplay('video'));
    }

    // History controls
    const refreshBtn = document.getElementById('refresh-history');
    const clearBtn = document.getElementById('clear-history');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadHistory);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearHistory);
    }
    
    console.log('✅ Event listeners setup complete');
}

// Handle file selection with preview
function handleFileSelection(event, type) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    if (type === 'image') {
        currentImageFile = file;
        previewImage(file);
    } else if (type === 'video') {
        currentVideoFile = file;
        previewVideo(file);
    }
}

// Preview image
function previewImage(file) {
    const previewContainer = document.getElementById('image-preview');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        previewContainer.innerHTML = `
            <div class="file-preview">
                <div class="preview-header">
                    <span class="header-icon">📸</span>
                    <span>Ảnh đã chọn: ${file.name}</span>
                    <button onclick="resetImageUpload()" class="reset-btn">✖️</button>
                </div>
                <div class="preview-content">
                    <img src="${e.target.result}" alt="Preview" class="preview-image">
                </div>
            </div>
        `;
        previewContainer.style.display = 'block';
    };
    
    reader.readAsDataURL(file);
}

// Preview video
function previewVideo(file) {
    const previewContainer = document.getElementById('video-preview');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        previewContainer.innerHTML = `
            <div class="file-preview">
                <div class="preview-header">
                    <span class="header-icon">🎬</span>
                    <span>Video đã chọn: ${file.name}</span>
                    <button onclick="resetVideoUpload()" class="reset-btn">✖️</button>
                </div>
                <div class="preview-content">
                    <video controls class="preview-video">
                        <source src="${e.target.result}" type="${file.type}">
                    </video>
                </div>
            </div>
        `;
        previewContainer.style.display = 'block';
    };
    
    reader.readAsDataURL(file);
}

// Reset uploads
function resetImageUpload() {
    document.getElementById('image-input').value = '';
    document.getElementById('image-preview').style.display = 'none';
    currentImageFile = null;
}

function resetVideoUpload() {
    document.getElementById('video-input').value = '';
    document.getElementById('video-preview').style.display = 'none';
    currentVideoFile = null;
}

// Update confidence display
function updateConfidenceDisplay(type) {
    const slider = document.getElementById(`${type}-confidence`);
    const display = document.getElementById(`${type}-confidence-value`);
    
    if (slider && display) {
        const value = Math.round(slider.value * 100);
        display.textContent = `${value}%`;
        
        // Update tip based on confidence level
        const tip = slider.parentElement.querySelector('small');
        if (tip) {
            if (value < 30) {
                tip.textContent = "💡 Độ tin cậy thấp - sẽ phát hiện nhiều vật thể hơn nhưng có thể có nhận diện sai";
                tip.style.color = "#f59e0b";
            } else if (value > 70) {
                tip.textContent = "⚠️ Độ tin cậy cao - chỉ phát hiện vật thể rất rõ ràng, có thể bỏ sót";
                tip.style.color = "#ef4444";
            } else {
                tip.textContent = "💡 Tip: Để nhận diện nhiều vật thể hơn, hãy giảm độ tin cậy xuống 20-30%";
                tip.style.color = "#64748b";
            }
        }
    }
}

// Handle image submission
async function handleImageSubmit(event) {
    event.preventDefault();
    
    if (!currentImageFile) {
        showToast('❌ Vui lòng chọn ảnh trước', 'error');
        return;
    }
    
    const confidence = document.getElementById('image-confidence').value;
    const formData = new FormData();
    formData.append('image', currentImageFile);
    formData.append('confidence', confidence);
    
    const submitBtn = document.querySelector('#image-form button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '🔍 Đang nhận diện...';
        
        showToast('🔍 Đang phân tích ảnh...', 'info');
        
        const response = await fetch('/api/predict_image', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayImageResult(data);
            loadHistory(); // Reload history
            loadStatistics(); // Update statistics
        } else {
            throw new Error(data.error || 'Lỗi nhận diện ảnh');
        }
        
    } catch (error) {
        showToast(`❌ Lỗi: ${error.message}`, 'error');
    } finally {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Handle video submission
async function handleVideoSubmit(event) {
    event.preventDefault();
    
    if (!currentVideoFile) {
        showToast('❌ Vui lòng chọn video trước', 'error');
        return;
    }
    
    const confidence = document.getElementById('video-confidence').value;
    const formData = new FormData();
    formData.append('video', currentVideoFile);
    formData.append('confidence', confidence);
    
    const submitBtn = document.querySelector('#video-form button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '🎬 Đang nhận diện...';
        
        showToast('🎬 Đang phân tích video với tracking paths...', 'info');
        
        const response = await fetch('/api/predict_video', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayVideoResult(data);
            loadHistory(); // Reload history
            loadStatistics(); // Update statistics
            showToast('🎉 Video đã được phân tích xong với tracking paths!', 'success');
        } else {
            throw new Error(data.error || 'Lỗi nhận diện video');
        }
        
    } catch (error) {
        showToast(`❌ Lỗi: ${error.message}`, 'error');
    } finally {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Poll video processing status
async function pollVideoStatus(sessionId) {
    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/video_status/${sessionId}`);
            const data = await response.json();
            
            if (data.success) {
                if (data.status === 'completed' && data.result) {
                    // Processing completed
                    clearInterval(pollInterval);
                    stopRealtimePreview();
                    
                    // Display final result
                    displayVideoResult(data.result);
                    loadHistory(); // Reload history
                    loadStatistics(); // Update statistics
                    
                    showToast('🎉 Video đã được phân tích xong!', 'success');
                    
                } else if (data.status === 'error') {
                    // Processing failed
                    clearInterval(pollInterval);
                    stopRealtimePreview();
                    showToast(`❌ Lỗi xử lý: ${data.error}`, 'error');
                }
                // Continue polling if still processing
            }
        } catch (error) {
            console.error('Status polling error:', error);
            // Continue polling on network errors
        }
    }, 3000); // Poll every 3 seconds for status to reduce server load
}

// Create realtime preview container with immediate video playback
function createRealtimePreview() {
    const container = document.getElementById('video-result');
    
    const previewHtml = `
        <div id="realtime-preview" class="realtime-preview">
            <div class="preview-header">
                <span class="header-icon">🎬</span>
                <span>Video Realtime - Nhận diện trực tiếp</span>
                <div class="preview-status">
                    <div class="status-dot"></div>
                    <span>LIVE</span>
                </div>
            </div>
            <div class="preview-content">
                <img id="realtime-frame" src="" alt="Realtime frame" class="realtime-frame">
                <div class="preview-overlay" id="preview-overlay">
                    <div class="processing-info">
                        <div class="pulse-dot"></div>
                        <span>Đang khởi động nhận diện...</span>
                    </div>
                </div>
            </div>
            <div class="realtime-stats">
                <div class="stat-box">
                    <span class="stat-label">Frame hiện tại:</span>
                    <span class="stat-value" id="current-frame">0</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Vật thể phát hiện:</span>
                    <span class="stat-value" id="objects-count">0</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">Trạng thái:</span>
                    <span class="stat-value" id="status-text">Đang xử lý...</span>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = previewHtml;
}

// Start realtime preview with immediate video display
function startRealtimePreview(sessionId) {
    let frameLoadAttempts = 0;
    const maxAttempts = 10;
    let frameCount = 0;
    let objectsDetected = 0;
    
    // Show video frame immediately, overlay will disappear when detection starts
    const frameImg = document.getElementById('realtime-frame');
    const overlay = document.getElementById('preview-overlay');
    
    if (frameImg) {
        frameImg.style.display = 'block'; // Show video container immediately
    }
    
    window.realtimePreviewInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/realtime_frame/${sessionId}`);
            const data = await response.json();
            
            if (data.success && data.frame) {
                if (frameImg) {
                    // YouTube-level instant update - zero delay
                    frameImg.style.transition = 'none';
                    frameImg.style.transform = 'translateZ(0)'; // Hardware acceleration
                    frameImg.src = data.frame;
                    frameImg.style.display = 'block';
                    frameImg.style.opacity = '1';
                    
                    // Hide overlay after first successful frame
                    if (overlay && frameCount === 0) {
                        overlay.style.display = 'none';
                    }
                    
                    // Update stats với live FPS
                    frameCount++;
                    const currentFrameEl = document.getElementById('current-frame');
                    const fpsEl = document.getElementById('live-fps');
                    
                    if (currentFrameEl) currentFrameEl.textContent = frameCount;
                    if (fpsEl) fpsEl.textContent = `${data.live_fps || 0} FPS`;
                    
                    frameLoadAttempts = 0; // Reset attempts on success
                }
            } else {
                frameLoadAttempts++;
                
                // Stop after too many failed attempts
                if (frameLoadAttempts > maxAttempts) {
                    console.log('Stopping realtime preview - session ended or too many failures');
                    stopRealtimePreview();
                }
            }
        } catch (error) {
            console.error('Realtime preview error:', error);
            frameLoadAttempts++;
            
            if (frameLoadAttempts > maxAttempts) {
                stopRealtimePreview();
            }
        }
    }, 8); // 125 FPS target - siêu siêu nhanh (1000ms/125 = 8ms)
}

// Stop realtime preview
function stopRealtimePreview() {
    if (window.realtimePreviewInterval) {
        clearInterval(window.realtimePreviewInterval);
        window.realtimePreviewInterval = null;
    }
}

// Display image result with preview images
function displayImageResult(data) {
    const container = document.getElementById('image-result');
    
    // Display original and result images - compact layout
    const imagesHtml = `
        <div class="comparison-view compact">
            <div class="comparison-image">
                <div class="image-header">
                    <span class="header-icon">📸</span>
                    <span>Ảnh gốc</span>
                </div>
                <img src="${data.original_image}" alt="Ảnh gốc" class="result-image" 
                     onerror="this.src='/static/placeholder.jpg'">
                <div class="image-badge original">ORIGINAL</div>
            </div>
            
            <div class="comparison-image">
                <div class="image-header">
                    <span class="header-icon">🎯</span>
                    <span>Kết quả nhận diện</span>
                </div>
                <img src="${data.result_image}" alt="Kết quả nhận diện" class="result-image"
                     onerror="this.src='/static/placeholder.jpg'">
                <div class="image-badge detected">${data.total_objects} vật thể</div>
            </div>
        </div>
    `;

    // Create main object identification summary
    const mainObjectsHtml = data.detected_objects && data.detected_objects.length > 0 
        ? data.detected_objects.slice(0, 3).map(obj => {
            const emoji = obj.emoji || getObjectEmoji(obj.class_name);
            const vietnameseName = obj.vietnamese_name || getVietnameseName(obj.class_name);
            const confidence = (obj.confidence * 100).toFixed(0);
            
            return `<span class="main-object-tag">${emoji} ${vietnameseName} (${confidence}%)</span>`;
        }).join(' ')
        : '<span class="no-detection">❌ Không nhận diện được vật thể</span>';

    container.innerHTML = `
        <div class="result-card">
            <div class="result-header">
                <h3>🎯 Kết quả nhận diện ảnh</h3>
                <div class="main-identification">
                    <h4>📸 Ảnh này chứa: ${mainObjectsHtml}</h4>
                </div>
                <div class="result-stats">
                    <div class="stat-item">
                        <span class="stat-label">🎯 Tổng vật thể:</span>
                        <span class="stat-value">${data.total_objects}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">⏱️ Thời gian xử lý:</span>
                        <span class="stat-value">${data.processing_time.toFixed(2)}s</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">🏷️ Loại khác nhau:</span>
                        <span class="stat-value">${Object.keys(data.object_counts || {}).length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">🆔 Mã nhận diện:</span>
                        <span class="stat-value">${data.detection_id}</span>
                    </div>
                </div>
            </div>
            
            ${imagesHtml}
            
            <div class="objects-section">
                <h4>📋 Chi tiết vật thể được nhận diện:</h4>
                <div class="analysis-cards">
                    ${data.detected_objects && data.detected_objects.length > 0 ? 
                        data.detected_objects.map((obj, index) => `
                            <div class="analysis-card">
                                <div class="analysis-header">
                                    <span class="object-index">#${index + 1}</span>
                                    <span class="object-emoji">${obj.emoji || getObjectEmoji(obj.class_name)}</span>
                                    <span class="object-name">${obj.vietnamese_name || obj.english_name || getVietnameseName(obj.class_name)}</span>
                                </div>
                                <div class="analysis-details">
                                    <div class="detail-row">
                                        <span class="detail-label">🏷️ Tên tiếng Anh:</span>
                                        <span class="detail-value">${obj.class_name}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">🎯 Độ tin cậy:</span>
                                        <span class="detail-value confidence-${(obj.confidence * 100 >= 80) ? 'high' : (obj.confidence * 100 >= 60) ? 'medium' : 'low'}">
                                            ${(obj.confidence * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">📍 Vị trí trong ảnh:</span>
                                        <span class="detail-value bbox">
                                            X: ${obj.bbox ? Math.round(obj.bbox[0]) : 'N/A'}, Y: ${obj.bbox ? Math.round(obj.bbox[1]) : 'N/A'}, 
                                            W: ${obj.bbox ? Math.round(obj.bbox[2] - obj.bbox[0]) : 'N/A'}, H: ${obj.bbox ? Math.round(obj.bbox[3] - obj.bbox[1]) : 'N/A'}
                                        </span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">🔍 Kích thước vùng:</span>
                                        <span class="detail-value">
                                            ${obj.bbox ? Math.round(obj.bbox[2] - obj.bbox[0]) + ' × ' + Math.round(obj.bbox[3] - obj.bbox[1]) + ' pixels' : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <div class="confidence-section">
                                    <div class="detail-row">
                                        <span class="detail-label">📊 Mức độ tin cậy:</span>
                                        <span class="detail-value">Đo lường độ chính xác của nhận diện</span>
                                    </div>
                                    <div class="confidence-visualization">
                                        <div class="confidence-bar-full">
                                            <div class="confidence-fill-full" style="width: ${obj.confidence * 100}%"></div>
                                        </div>
                                        <span class="confidence-percentage">${(obj.confidence * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        `).join('') 
                        : '<div class="no-analysis">❌ Không có dữ liệu phân tích</div>'
                    }
                </div>
            </div>
        </div>
    `;
    
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });
    
    showToast(`✅ Nhận diện thành công ${data.total_objects} vật thể trong ảnh!`, 'success');
}

// Display video result (without video preview)
function displayVideoResult(data) {
    const container = document.getElementById('video-result');
    
    // Create main object identification summary for video with proper spacing
    const mainObjectsHtml = data.movement_summary && Object.keys(data.movement_summary).length > 0
        ? Object.entries(data.movement_summary).slice(0, 5).map(([name, info]) => {
            const emoji = info.emoji || getObjectEmoji(name);
            const vietnameseName = info.vietnamese_name || getVietnameseName(name);
            const appearanceRate = info.appearance_rate || 0;
            
            return `<span class="moving-object-tag">${emoji} ${vietnameseName} (${appearanceRate}%)</span>`;
        }).join(' ')  // Simple space separation instead of arrows
        : '<span class="no-detection">❌ Không phát hiện vật thể di chuyển</span>';

    // Enhanced movement summary with Vietnamese names
    const movementSummaryHtml = data.movement_summary ? Object.entries(data.movement_summary).map(([name, info]) => {
        const emoji = info.emoji || getObjectEmoji(name);
        const vietnameseName = info.vietnamese_name || getVietnameseName(name);
        const appearanceRate = info.appearance_rate || 0;
        
        return `
            <div class="movement-card">
                <div class="movement-header">
                    <span class="object-emoji">${emoji}</span>
                    <div class="object-info">
                        <div class="object-names">
                            <span class="vietnamese-name">${vietnameseName}</span>
                            <span class="english-name">${name}</span>
                        </div>
                        <div class="movement-stats">
                            <span class="detection-count">${info.total_detections} lần phát hiện</span>
                            <span class="frame-coverage">${info.frames_appeared}/${data.total_frames} frames</span>
                        </div>
                    </div>
                </div>
                <div class="appearance-bar">
                    <div class="appearance-fill" style="width: ${appearanceRate}%"></div>
                    <span class="appearance-text">${appearanceRate}% thời gian xuất hiện</span>
                </div>
            </div>
        `;
    }).join('') : '';
    

    
    // Calculate video statistics
    const totalFrames = data.total_frames || 0;
    const framesWithObjects = data.frames_with_objects || 0;
    const detectionRate = totalFrames > 0 ? (framesWithObjects / totalFrames * 100).toFixed(1) : 0;
    const avgObjectsPerFrame = framesWithObjects > 0 ? (data.total_objects / framesWithObjects).toFixed(1) : 0;
    
    // Chi tiết thống kê mở rộng
    const detailedStatsHtml = data.class_statistics ? Object.entries(data.class_statistics).map(([name, stats]) => {
        const emoji = stats.emoji || getObjectEmoji(name);
        const vietnameseName = stats.vietnamese_name || getVietnameseName(name);
        
        return `
            <div class="detailed-stats-card">
                <div class="stats-header">
                    <span class="object-emoji">${emoji}</span>
                    <span class="object-name">${vietnameseName}</span>
                    <span class="confidence-badge">${stats.avg_confidence}% độ tin cậy</span>
                </div>
                <div class="stats-grid">
                    <div class="stat-box">
                        <span class="stat-number">${stats.total_detections}</span>
                        <span class="stat-label">Tổng phát hiện</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-number">${stats.frames_appeared}</span>
                        <span class="stat-label">Frames xuất hiện</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-number">${stats.appearance_rate}%</span>
                        <span class="stat-label">Tỷ lệ xuất hiện</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-number">${stats.detection_density}</span>
                        <span class="stat-label">Mật độ phát hiện</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-number">${stats.duration_frames}</span>
                        <span class="stat-label">Thời lượng (frames)</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-number">${stats.min_confidence}%-${stats.max_confidence}%</span>
                        <span class="stat-label">Độ tin cậy</span>
                    </div>
                </div>
                <div class="timeline-info">
                    <span class="timeline-label">⏱️ Xuất hiện:</span>
                    <span class="timeline-range">Frame ${stats.first_appearance} → ${stats.last_appearance}</span>
                </div>
            </div>
        `;
    }).join('') : '';
    
    // Video info chi tiết
    const videoInfoHtml = data.video_info ? `
        <div class="video-info-section">
            <h4>📹 Thông tin video:</h4>
            <div class="video-info-grid">
                <div class="info-item">
                    <span class="info-label">📏 Độ phân giải:</span>
                    <span class="info-value">${data.video_info.resolution}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">🎬 FPS:</span>
                    <span class="info-value">${data.video_info.fps}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">⏱️ Thời lượng:</span>
                    <span class="info-value">${data.video_info.duration_seconds}s</span>
                </div>
                <div class="info-item">
                    <span class="info-label">🎞️ Tổng frames:</span>
                    <span class="info-value">${totalFrames}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">🎯 Unique objects:</span>
                    <span class="info-value">${data.unique_classes}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">📊 Trung bình/frame:</span>
                    <span class="info-value">${data.avg_objects_per_frame}</span>
                </div>
            </div>
        </div>
    ` : '';
    
    container.innerHTML = `
        <div class="result-card">
            <div class="result-header">
                <h3>🎥 Kết quả nhận diện video</h3>
                <div class="main-identification">
                    <h4>🎬 Video này có các vật thể di chuyển: ${mainObjectsHtml}</h4>
                </div>
                <div class="result-stats">
                    <div class="stat-item">
                        <span class="stat-value">${data.total_objects}</span> tổng phát hiện
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${framesWithObjects}</span> frame có vật thể
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${detectionRate}%</span> tỷ lệ phát hiện
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${data.processing_time.toFixed(2)}s</span> xử lý
                    </div>
                    <div class="stat-item">
                        ID: <span class="stat-value">${data.detection_id}</span>
                    </div>
                </div>
            </div>
            
            <div class="objects-section">
                <h4>📋 Chi tiết vật thể trong video:</h4>
                <div class="video-analysis-summary">
                    ${Object.entries(data.object_counts || {}).map(([name, count]) => {
                        const emoji = getObjectEmoji(name);
                        const vietnameseName = getVietnameseName(name);
                        const frequency = data.total_frames ? (count / data.total_frames * 100).toFixed(1) : 0;
                        const avgPerFrame = data.total_frames ? (count / data.total_frames).toFixed(2) : 0;
                        
                        return `
                            <div class="video-analysis-card">
                                <div class="video-analysis-header">
                                    <span class="object-emoji">${emoji}</span>
                                    <span class="object-name">${vietnameseName}</span>
                                    <span class="object-count-badge">${count} lần</span>
                                </div>
                                <div class="video-analysis-details">
                                    <div class="detail-row">
                                        <span class="detail-label">🏷️ Tên tiếng Anh:</span>
                                        <span class="detail-value">${name}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">📊 Tần suất:</span>
                                        <span class="detail-value">${frequency}% frames</span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">🔢 Tổng:</span>
                                        <span class="detail-value">${count} lần</span>
                                    </div>
                                </div>
                                <div class="frequency-visualization">
                                    <div class="frequency-bar">
                                        <div class="frequency-fill" style="width: ${frequency}%"></div>
                                    </div>
                                    <span class="frequency-text">${frequency}%</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            ${videoInfoHtml}
            
            <div class="detailed-statistics-section">
                <h4>📊 Thống kê chi tiết từng vật thể:</h4>
                <div class="detailed-stats-container">
                    ${detailedStatsHtml}
                </div>
            </div>
        </div>
    `;
    
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });
    
    showToast(`✅ Nhận diện video thành công: ${data.total_objects} vật thể trong ${totalFrames} frames!`, 'success');
}

// Load and display history with controls
async function loadHistory() {
    try {
        const response = await fetch('/api/history');
        const data = await response.json();
        
        if (data.success) {
            displayHistory(data.history);
        } else {
            throw new Error(data.error || 'Lỗi tải lịch sử');
        }
    } catch (error) {
        showToast(`❌ Lỗi tải lịch sử: ${error.message}`, 'error');
    }
}

// Display history with refresh and clear buttons
function displayHistory(history) {
    const container = document.getElementById('history-list');
    
    if (!history || history.length === 0) {
        container.innerHTML = `
            <div class="no-history">
                <p>📂 Chưa có lịch sử nhận diện nào</p>
            </div>
        `;
        return;
    }

    const historyHtml = history.map((item, index) => {
        const dateTime = new Date(item.timestamp).toLocaleString('vi-VN');
        const fileTypeIcon = item.file_type === 'image' ? '📸' : '🎬';
        
        // Extract unique object names from the detection
        let objectNames = [];
        if (item.object_details && item.object_details.length > 0) {
            objectNames = item.object_details.map(obj => {
                const emoji = getObjectEmoji(obj.object_name);
                const vietnameseName = getVietnameseName(obj.object_name);
                return `${emoji} ${vietnameseName}`;
            });
        } else if (item.objects_detected) {
            // Fallback: parse from objects_detected JSON if available
            try {
                const detectedObjects = typeof item.objects_detected === 'string' 
                    ? JSON.parse(item.objects_detected) 
                    : item.objects_detected;
                
                if (Array.isArray(detectedObjects)) {
                    const uniqueObjects = [...new Set(detectedObjects.map(obj => obj.class_name))];
                    objectNames = uniqueObjects.map(className => {
                        const emoji = getObjectEmoji(className);
                        const vietnameseName = getVietnameseName(className);
                        return `${emoji} ${vietnameseName}`;
                    });
                }
            } catch (e) {
                console.warn('Could not parse objects_detected:', e);
            }
        }
        
        return `
            <div class="history-item" onclick="viewDetectionDetail(${item.id})" style="animation-delay: ${index * 0.1}s;">
                <div class="history-header">
                    <span class="history-emoji">${fileTypeIcon}</span>
                    <div class="history-info">
                        <div class="history-filename">Nhận diện ${item.file_type === 'image' ? 'ảnh' : 'video'}: ${item.filename}</div>
                        <div class="history-timestamp">${dateTime}</div>
                    </div>
                    <div class="history-type ${item.file_type}">${item.file_type === 'image' ? 'ẢNH' : 'VIDEO'}</div>
                </div>
                
                <div class="detected-objects-preview">
                    <h4>🎯 Danh sách vật thể được phát hiện:</h4>
                    <div class="objects-list">
                        ${objectNames.length > 0 ? 
                            objectNames.map(name => `<span class="object-tag">${name}</span>`).join('') 
                            : '<span class="no-objects">❌ Không phát hiện vật thể nào</span>'
                        }
                    </div>
                </div>
                
                <div class="history-stats">
                    <div class="history-stat-item">
                        <span class="stat-emoji">📊</span>
                        <span class="stat-text">Tổng vật thể: ${item.total_objects}</span>
                    </div>
                    <div class="history-stat-item">
                        <span class="stat-emoji">🎯</span>
                        <span class="stat-text">Độ tin cậy: ${(item.confidence_avg * 100).toFixed(0)}%</span>
                    </div>
                    <div class="history-stat-item">
                        <span class="stat-emoji">⏱️</span>
                        <span class="stat-text">Thời gian xử lý: ${item.processing_time.toFixed(1)}s</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = historyHtml;
}

// View detection detail
async function viewDetectionDetail(detectionId) {
    try {
        const response = await fetch(`/api/detection/${detectionId}`);
        const data = await response.json();
        
        if (data.success) {
            // Display detailed information in a modal or expand in place
            showDetectionModal(data.detection);
        } else {
            throw new Error(data.error || 'Lỗi tải chi tiết');
        }
    } catch (error) {
        showToast(`❌ Lỗi: ${error.message}`, 'error');
    }
}

// Load and display statistics
async function loadStatistics() {
    try {
        const response = await fetch('/api/statistics');
        const data = await response.json();
        
        if (data.success) {
            displayStatistics(data.statistics);
        } else {
            throw new Error(data.error || 'Lỗi tải thống kê');
        }
    } catch (error) {
        console.error('Statistics error:', error);
    }
}

// Display modern statistics dashboard
function displayStatistics(stats) {
    if (!stats) return;
    
    // Update overview cards
    updateOverviewCards(stats);
    
    // Update top objects chart
    updateTopObjectsChart(stats.top_objects || []);
    
    // Update file types chart
    updateFileTypesChart(stats.file_type_distribution || {});
    
    // Update recent activity
    updateRecentActivity(stats.recent_detections || []);
}

// Update overview cards with animation
function updateOverviewCards(stats) {
    const totalFiles = document.getElementById('total-files');
    const totalObjects = document.getElementById('total-objects');
    const avgTime = document.getElementById('avg-processing-time');
    const accuracyRate = document.getElementById('accuracy-rate');
    
    // Animate numbers
    animateNumber(totalFiles, stats.total_detections || 0);
    animateNumber(totalObjects, stats.total_objects || 0);
    
    if (avgTime) avgTime.textContent = `${stats.avg_processing_time || 0}s`;
    if (accuracyRate) accuracyRate.textContent = `${((stats.avg_confidence || 0) * 100).toFixed(0)}%`;
}

// Update top objects chart
function updateTopObjectsChart(topObjects) {
    const container = document.getElementById('top-objects-chart');
    
    if (!topObjects.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <p>Chưa có dữ liệu nhận diện</p>
            </div>
        `;
        return;
    }
    
    const chartHtml = topObjects.slice(0, 5).map((obj, index) => {
        const emoji = getObjectEmoji(obj.object_name);
        const vietnameseName = getVietnameseName(obj.object_name);
        const rank = index + 1;
        const percentage = ((obj.total_count / topObjects[0].total_count) * 100).toFixed(0);
        
        return `
            <div class="chart-item">
                <div class="chart-item-info">
                    <span class="chart-emoji">${emoji}</span>
                    <div class="chart-item-details">
                        <h4>${vietnameseName}</h4>
                        <p>${obj.total_count} lần phát hiện • ${(obj.avg_confidence * 100).toFixed(0)}% tin cậy</p>
                    </div>
                </div>
                <div class="chart-item-value">
                    <span class="value">${obj.total_count}</span>
                    <span class="percentage">${percentage}%</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = chartHtml;
}

// Update file types chart
function updateFileTypesChart(fileDistribution) {
    const container = document.getElementById('file-types-chart');
    
    if (!Object.keys(fileDistribution).length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📁</div>
                <p>Chưa có file nào được xử lý</p>
            </div>
        `;
        return;
    }
    
    const total = Object.values(fileDistribution).reduce((a, b) => a + b, 0);
    
    const chartHtml = Object.entries(fileDistribution).map(([type, count]) => {
        const icon = type === 'image' ? '📸' : '🎬';
        const name = type === 'image' ? 'Ảnh' : 'Video';
        const percentage = ((count / total) * 100).toFixed(1);
        
        return `
            <div class="chart-item">
                <div class="chart-item-info">
                    <span class="chart-emoji">${icon}</span>
                    <div class="chart-item-details">
                        <h4>Files ${name}</h4>
                        <p>${count} files đã được xử lý thành công</p>
                    </div>
                </div>
                <div class="chart-item-value">
                    <span class="value">${count}</span>
                    <span class="percentage">${percentage}%</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = chartHtml;
}

// Update recent activity timeline
function updateRecentActivity(recentDetections) {
    const container = document.getElementById('recent-activity');
    
    if (!recentDetections.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🕒</div>
                <p>Chưa có hoạt động gần đây</p>
            </div>
        `;
        return;
    }
    
    const activityHtml = recentDetections.slice(0, 8).map(detection => {
        const timeAgo = getTimeAgo(detection.timestamp);
        const fileType = detection.file_type === 'image' ? '📸' : '🎬';
        
        return `
            <div class="activity-item">
                <span class="activity-emoji">${fileType}</span>
                <div class="activity-content">
                    <h4>Nhận diện ${detection.file_type === 'image' ? 'ảnh' : 'video'}: ${detection.filename}</h4>
                    <p>Đã phát hiện ${detection.total_objects} vật thể • Độ tin cậy ${(detection.confidence_avg * 100).toFixed(0)}%</p>
                </div>
                <div class="activity-time">${timeAgo}</div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = activityHtml;
}

// Animate number counter
function animateNumber(element, target) {
    if (!element) return;
    
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / 20;
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 50);
}

// Get time ago string
function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor((now - past) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ngày trước`;
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Show detection modal
function showDetectionModal(detection) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Chi tiết nhận diện #${detection.id}</h3>
                <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">✖️</button>
            </div>
            <div class="modal-body">
                <div class="detection-info">
                    <p><strong>📁 File:</strong> ${detection.filename}</p>
                    <p><strong>📅 Thời gian:</strong> ${new Date(detection.timestamp).toLocaleString('vi-VN')}</p>
                    <p><strong>🎯 Tổng vật thể:</strong> ${detection.total_objects}</p>
                    <p><strong>📊 Độ tin cậy TB:</strong> ${(detection.confidence_avg * 100).toFixed(1)}%</p>
                    <p><strong>⏱️ Thời gian xử lý:</strong> ${detection.processing_time.toFixed(2)}s</p>
                </div>
                <div class="detected-objects">
                    <h4>🔍 Chi tiết vật thể:</h4>
                    <div class="modal-objects-list">
                        ${detection.object_details.map(obj => {
                            const emoji = getObjectEmoji(obj.object_name);
                            const vietnameseName = getVietnameseName(obj.object_name);
                            
                            return `
                                <div class="modal-object-tag">
                                    <span class="object-name">${emoji} ${vietnameseName}</span>
                                    <span class="object-stats">${obj.count} lần • ${(obj.confidence * 100).toFixed(1)}%</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// History Control Functions
function initializeHistoryControls() {
    const refreshBtn = document.getElementById('refresh-history');
    const clearBtn = document.getElementById('clear-history');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            showToast('🔄 Đang làm mới lịch sử...', 'info');
            
            // Add loading animation to button
            refreshBtn.disabled = true;
            const originalContent = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<span class="icon">⏳</span>Đang tải...';
            
            try {
                await loadHistory();
                showToast('✅ Đã làm mới lịch sử thành công!', 'success');
            } catch (error) {
                console.error('Error refreshing history:', error);
                showToast('❌ Lỗi khi làm mới lịch sử', 'error');
            } finally {
                // Restore button
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = originalContent;
            }
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            // Show confirmation dialog
            const confirmed = confirm('⚠️ Bạn có chắc muốn xóa tất cả lịch sử nhận diện?\n\nHành động này không thể hoàn tác!');
            
            if (!confirmed) return;
            
            showToast('🗑️ Đang xóa lịch sử...', 'info');
            
            // Add loading animation to button
            clearBtn.disabled = true;
            const originalContent = clearBtn.innerHTML;
            clearBtn.innerHTML = '<span class="icon">⏳</span>Đang xóa...';
            
            try {
                const response = await fetch('/api/clear_history', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                if (response.ok) {
                    // Clear the history display
                    const historyList = document.getElementById('history-list');
                    if (historyList) {
                        historyList.innerHTML = '<div class="no-history"><p>📂 Chưa có lịch sử nhận diện nào</p></div>';
                    }
                    
                    showToast('✅ Đã xóa tất cả lịch sử thành công!', 'success');
                } else {
                    throw new Error('Failed to clear history');
                }
            } catch (error) {
                console.error('Error clearing history:', error);
                showToast('❌ Lỗi khi xóa lịch sử', 'error');
            } finally {
                // Restore button
                clearBtn.disabled = false;
                clearBtn.innerHTML = originalContent;
            }
        });
    }
}

// Initialize history controls when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeHistoryControls();
});

// ============================================================================
// VIDEO STREAMING FUNCTIONALITY
// ============================================================================

let streamingActive = false;
let statsUpdateInterval = null;

// Start video streaming
async function startVideoStreaming() {
    try {
        debugLog('info', '🎬 Starting video streaming...');
        
        // Check if video file is selected
        if (!currentVideoFile) {
            debugLog('warn', 'No currentVideoFile selected');
            showToast('❌ Vui lòng chọn video trước', 'error');
            return;
        }

        // Check if video input element exists and has files
        const videoInput = document.getElementById('video-input');
        if (!videoInput) {
            debugLog('error', 'video-input element not found');
            showToast('❌ Không tìm thấy video input element', 'error');
            return;
        }
        
        if (!videoInput.files || !videoInput.files[0]) {
            debugLog('warn', 'No files in video input', {
                hasFiles: !!videoInput.files,
                fileCount: videoInput.files ? videoInput.files.length : 0
            });
            showToast('❌ Không tìm thấy file video. Vui lòng chọn lại.', 'error');
            return;
        }

        // Use the file from input element as backup
        const videoFile = currentVideoFile || videoInput.files[0];
        debugLog('info', 'Video file selected', {
            filename: videoFile.name,
            size: videoFile.size,
            type: videoFile.type
        });
        
        const formData = new FormData();
        formData.append('video', videoFile);
        
        const confidenceSlider = document.getElementById('video-confidence');
        if (!confidenceSlider) {
            debugLog('error', 'video-confidence slider not found');
            showToast('❌ Không tìm thấy điều khiển confidence', 'error');
            return;
        }
        
        const confidence = confidenceSlider.value || '0.3';
        formData.append('confidence', confidence);
        
        debugLog('info', 'Starting upload with confidence', { confidence });

        showToast('🎬 Đang khởi động video streaming...', 'info');

        const response = await fetch('/start_video_stream', {
            method: 'POST',
            body: formData
        });

        debugLog('info', 'Upload response received', {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        debugLog('info', 'Response data', data);

        if (data.success) {
            streamingActive = true;
            
            debugLog('info', 'Creating streaming interface...');
            // Create video streaming interface
            createVideoStreamingInterface();
            
            // Start the video stream with error handling
            const videoElement = document.getElementById('stream-video');
            if (videoElement) {
                const streamUrl = `/video_stream?confidence=${confidence}`;
                debugLog('info', 'Setting video stream URL', { url: streamUrl });
                
                videoElement.src = streamUrl;
                videoElement.onerror = function(e) {
                    debugLog('error', 'Video element error', { error: e });
                    showToast('❌ Lỗi tải video stream', 'error');
                };
            } else {
                throw new Error('Không tìm thấy video element');
            }
            
            // Start statistics updates
            debugLog('info', 'Starting stats updates...');
            startStatsUpdates();
            
            showToast('✅ Video streaming đã bắt đầu!', 'success');
        } else {
            throw new Error(data.message || 'Không thể khởi động streaming');
        }

    } catch (error) {
        debugLog('error', 'Streaming error caught', {
            message: error.message,
            stack: error.stack
        });
        showToast(`❌ Lỗi: ${error.message}`, 'error');
        
        // Reset streaming state
        streamingActive = false;
        removeVideoStreamingInterface();
    }
}

// Stop video streaming
async function stopVideoStreaming() {
    try {
        const response = await fetch('/stop_video_stream', {
            method: 'POST'
        });

        const data = await response.json();
        
        streamingActive = false;
        
        // Stop statistics updates
        if (statsUpdateInterval) {
            clearInterval(statsUpdateInterval);
            statsUpdateInterval = null;
        }
        
        // Remove streaming interface
        removeVideoStreamingInterface();
        
        showToast('⏹️ Video streaming đã dừng', 'success');

    } catch (error) {
        showToast(`❌ Lỗi: ${error.message}`, 'error');
    }
}

// Create video streaming interface
function createVideoStreamingInterface() {
    const videoTab = document.getElementById('video-tab');
    if (!videoTab) {
        throw new Error('Không tìm thấy video tab');
    }
    
    const uploadSection = videoTab.querySelector('.upload-section') || videoTab.querySelector('.upload-section-modern');
    if (!uploadSection) {
        console.warn('Không tìm thấy upload section, tạo interface mới');
    } else {
        // Hide upload section and show streaming interface
        uploadSection.style.display = 'none';
    }
    
    // Create streaming container
    const streamingContainer = document.createElement('div');
    streamingContainer.id = 'streaming-container';
    streamingContainer.className = 'streaming-container';
    streamingContainer.innerHTML = `
        <div class="streaming-header">
            <h2>🎬 Video Streaming - Nhận diện Realtime</h2>
            <div class="streaming-controls">
                <button onclick="stopVideoStreaming()" class="btn-danger">
                    <i class="fas fa-stop"></i> Dừng Streaming
                </button>
            </div>
        </div>
        
        <div class="streaming-content">
            <div class="video-container">
                <img id="stream-video" class="stream-video" alt="Video Stream">
                <div class="stream-overlay">
                    <div class="stream-info">
                        <span id="stream-status">🔴 LIVE <span id="live-fps">0 FPS</span></span>
                    </div>
                </div>
            </div>
            
            <div class="stats-container">
                <div class="stats-header">
                    <h3>📊 Thống kê Realtime</h3>
                </div>
                <div class="stats-content">
                    <div class="stat-item">
                        <span class="stat-label">Frame hiện tại:</span>
                        <span id="current-frame">--</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Tổng vật thể:</span>
                        <span id="total-objects">0</span>
                    </div>
                    <div id="objects-list" class="objects-list">
                        <p>Đang tải...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    videoTab.appendChild(streamingContainer);
    
    // Add streaming styles
    addStreamingStyles();
}

// Remove video streaming interface
function removeVideoStreamingInterface() {
    const streamingContainer = document.getElementById('streaming-container');
    if (streamingContainer) {
        streamingContainer.remove();
    }
    
    // Show upload section again
    const videoTab = document.getElementById('video-tab');
    if (videoTab) {
        const uploadSection = videoTab.querySelector('.upload-section') || videoTab.querySelector('.upload-section-modern');
        if (uploadSection) {
            uploadSection.style.display = 'block';
        }
    }
}

// Start statistics updates
function startStatsUpdates() {
    statsUpdateInterval = setInterval(async () => {
        try {
            const response = await fetch('/video_stats');
            const stats = await response.json();
            
            updateStreamingStats(stats);
            
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }, 500); // Update every 0.5 seconds for faster feedback
}

// Update streaming statistics display
function updateStreamingStats(stats) {
    // Update frame info
    const currentFrameEl = document.getElementById('current-frame');
    if (currentFrameEl && stats.current_frame !== undefined) {
        currentFrameEl.textContent = `${stats.current_frame}/${stats.total_frames}`;
    }
    
    // Update total objects
    const totalObjectsEl = document.getElementById('total-objects');
    if (totalObjectsEl && stats.total_objects !== undefined) {
        totalObjectsEl.textContent = stats.total_objects;
    }
    
    // Update objects list
    const objectsList = document.getElementById('objects-list');
    if (objectsList && stats.top_objects) {
        if (stats.top_objects.length === 0) {
            objectsList.innerHTML = '<p>Chưa phát hiện vật thể nào</p>';
        } else {
            const objectsHTML = stats.top_objects.map(([name, count]) => {
                const emoji = getObjectEmoji(name);
                return `
                    <div class="object-stat">
                        <span class="object-name">${emoji} ${name}</span>
                        <span class="object-count">${count}</span>
                    </div>
                `;
            }).join('');
            
            objectsList.innerHTML = objectsHTML;
        }
    }
}

// Add streaming styles
function addStreamingStyles() {
    if (document.getElementById('streaming-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'streaming-styles';
    styles.textContent = `
        .streaming-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 24px;
            padding: 30px;
            margin-bottom: 30px;
        }
        
        .streaming-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        
        .streaming-header h2 {
            color: white;
            font-size: 1.5rem;
            margin: 0;
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            border: none;
            border-radius: 12px;
            padding: 12px 20px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-danger:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
        }
        
        .streaming-content {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
        }
        
        .video-container {
            position: relative;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        
        .stream-video {
            width: 100%;
            height: auto;
            display: block;
        }
        
        .stream-overlay {
            position: absolute;
            top: 15px;
            left: 15px;
            background: rgba(0, 0, 0, 0.7);
            padding: 8px 15px;
            border-radius: 8px;
            color: white;
            font-size: 0.875rem;
        }
        
        .stream-info {
            display: flex;
            gap: 15px;
        }
        
        .stats-container {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 20px;
        }
        
        .stats-header h3 {
            color: white;
            margin: 0 0 20px 0;
            font-size: 1.1rem;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            color: white;
            font-size: 0.9rem;
        }
        
        .stat-label {
            opacity: 0.8;
        }
        
        .objects-list {
            margin-top: 20px;
        }
        
        .object-stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            margin-bottom: 8px;
            color: white;
            font-size: 0.875rem;
        }
        
        .object-count {
            background: #667eea;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.75rem;
        }
        
        @media (max-width: 768px) {
            .streaming-content {
                grid-template-columns: 1fr;
            }
            
            .streaming-header {
                flex-direction: column;
                gap: 15px;
                align-items: stretch;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

// Add streaming button to video form
function addStreamingButton() {
    debugLog('info', '🔧 Trying to add streaming button...');
    
    const videoForm = document.getElementById('video-form');
    if (!videoForm) {
        debugLog('warn', 'Video form not found');
        return;
    }
    
    // Check if button already exists
    const existingButton = videoForm.querySelector('.streaming-btn');
    if (existingButton) {
        debugLog('info', 'Streaming button already exists');
        return;
    }
    
    const submitButton = videoForm.querySelector('button[type="submit"]');
    if (!submitButton) {
        debugLog('warn', 'Submit button not found');
        return;
    }
    
    // Create streaming button
    const streamButton = document.createElement('button');
    streamButton.type = 'button';
    streamButton.className = 'btn-primary streaming-btn';
    streamButton.onclick = function() {
        debugLog('info', '🎬 Streaming button clicked');
        startVideoStreaming();
    };
    streamButton.innerHTML = `🔴 Xem Realtime`;
    
    // Insert streaming button before submit button
    submitButton.parentNode.insertBefore(streamButton, submitButton);
    
    // Add margin to separate buttons
    streamButton.style.marginBottom = '15px';
    
    debugLog('info', 'Streaming button added successfully');
}

// Initialize streaming functionality
function initializeStreaming() {
    debugLog('info', '🚀 Initializing streaming functionality...');
    
    // Wait for DOM elements to be ready
    const checkAndInit = () => {
        const videoForm = document.getElementById('video-form');
        const videoInput = document.getElementById('video-input');
        const videoTab = document.getElementById('video-tab');
        
        debugLog('debug', 'Checking DOM elements', {
            videoForm: !!videoForm,
            videoInput: !!videoInput,
            videoTab: !!videoTab
        });
        
        if (videoForm && videoInput && videoTab) {
            debugLog('info', '✅ All required elements found');
            addStreamingButton();
        } else {
            debugLog('info', '⏳ Waiting for DOM elements...');
            setTimeout(checkAndInit, 100);
        }
    };
    
    checkAndInit();
}

// ============================================================================
// DEBUG & ERROR HANDLING
// ============================================================================

// Enhanced console.log that also sends to backend
function debugLog(level, message, data = {}) {
    const originalConsole = {
        info: console.info,
        warn: console.warn,
        error: console.error,
        log: console.log
    };
    
    // Log to browser console
    originalConsole[level] ? originalConsole[level](message, data) : originalConsole.log(message, data);
    
    // Send to backend for server-side logging
    fetch('/api/debug/console_log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            level: level,
            message: message,
            data: data,
            timestamp: new Date().toISOString(),
            url: window.location.href
        })
    }).catch(err => {
        // Don't log this error to avoid infinite loop
    });
}

// Global error handler
window.addEventListener('error', function(event) {
    const errorData = {
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error ? event.error.stack : 'No stack trace',
        url: window.location.href,
        timestamp: new Date().toISOString()
    };
    
    console.error('🐛 JavaScript Error Caught:', errorData);
    
    // Send error to backend
    fetch('/api/debug/frontend_errors', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
    }).catch(err => {
        console.error('Failed to send error to backend:', err);
    });
});

// Promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    const errorData = {
        message: 'Unhandled Promise Rejection: ' + event.reason,
        source: 'Promise',
        stack: event.reason && event.reason.stack ? event.reason.stack : 'No stack trace',
        url: window.location.href,
        timestamp: new Date().toISOString()
    };
    
    console.error('🐛 Promise Rejection Caught:', errorData);
    
    // Send error to backend
    fetch('/api/debug/frontend_errors', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
    }).catch(err => {
        console.error('Failed to send promise rejection to backend:', err);
    });
});

// Test system status
async function testSystemStatus() {
    try {
        debugLog('info', '🔧 Testing system status...');
        
        const response = await fetch('/api/debug/check_system');
        const data = await response.json();
        
        if (data.success) {
            debugLog('info', '✅ System check passed', data.system_info);
            return true;
        } else {
            debugLog('error', '❌ System check failed', data);
            return false;
        }
    } catch (error) {
        debugLog('error', '❌ System check error', { error: error.message });
        return false;
    }
}

// Initialize streaming functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    debugLog('info', '📄 DOM Content Loaded - Starting streaming init...');
    
    // Test system first
    testSystemStatus().then(systemOk => {
        if (systemOk) {
            initializeStreaming();
        } else {
            debugLog('error', '❌ System not ready, delaying initialization...');
            setTimeout(initializeStreaming, 1000);
        }
    });
});

// Also try to initialize after window load as backup
window.addEventListener('load', () => {
    debugLog('info', '🏁 Window Load Event - Backup streaming init...');
    setTimeout(initializeStreaming, 100);
});
