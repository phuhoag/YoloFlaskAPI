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
        submitBtn.innerHTML = '<div class="loading-spinner"></div> Đang nhận diện...';
        
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
        submitBtn.innerHTML = '<div class="loading-spinner"></div> Đang nhận diện...';
        
        showToast('🎬 Đang phân tích video...', 'info');
        
        const response = await fetch('/api/predict_video', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayVideoResult(data);
            loadHistory(); // Reload history
            loadStatistics(); // Update statistics
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

// Display image result with preview images
function displayImageResult(data) {
    const container = document.getElementById('image-result');
    
    // Display original and result images
    const imagesHtml = `
        <div class="comparison-view">
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
    
    // Enhanced object summary with emoji and Vietnamese names
    const objectsHtml = data.detected_objects ? data.detected_objects.map(obj => {
        const emoji = obj.emoji || getObjectEmoji(obj.class_name);
        const vietnameseName = obj.vietnamese_name || getVietnameseName(obj.class_name);
        const confidence = (obj.confidence * 100).toFixed(1);
        
        return `
            <div class="object-card detailed">
                <div class="object-header">
                    <span class="object-emoji">${emoji}</span>
                    <div class="object-info">
                        <div class="object-names">
                            <span class="vietnamese-name">${vietnameseName}</span>
                            <span class="english-name">${obj.class_name}</span>
                        </div>
                        <div class="confidence-display">
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: ${confidence}%"></div>
                            </div>
                            <span class="confidence-text">${confidence}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('') : Object.entries(data.object_counts || {}).map(([name, count]) => {
        const emoji = getObjectEmoji(name);
        const vietnameseName = getVietnameseName(name);
        
        return `
            <div class="object-card">
                <div class="object-header">
                    <span class="object-name">${emoji} ${vietnameseName}</span>
                    <span class="confidence-badge">${count} phát hiện</span>
                </div>
                <div class="object-stats">
                    <div class="stat-box">
                        <span class="stat-label">Tên tiếng Anh</span>
                        <span class="stat-number">${name}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Số lượng</span>
                        <span class="stat-number">${count}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

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
                        <span class="stat-value">${data.total_objects}</span> vật thể
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${data.processing_time.toFixed(2)}s</span> xử lý
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${Object.keys(data.object_counts || {}).length}</span> loại khác nhau
                    </div>
                    <div class="stat-item">
                        ID: <span class="stat-value">${data.detection_id}</span>
                    </div>
                </div>
            </div>
            
            ${imagesHtml}
            
            <div class="objects-section">
                <h4>📋 Chi tiết tất cả vật thể được nhận diện:</h4>
                <div class="objects-grid">
                    ${objectsHtml || '<div class="no-objects">❌ Không tìm thấy vật thể nào</div>'}
                </div>
            </div>
            
            <div class="detection-stats">
                <div class="stat-item">
                    <span class="stat-icon">⏱️</span>
                    <span>Thời gian xử lý: <strong>${data.processing_time.toFixed(2)}s</strong></span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">📊</span>
                    <span>Độ tin cậy tối thiểu: <strong>${((data.confidence_threshold || 0.5) * 100).toFixed(0)}%</strong></span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">🎯</span>
                    <span>Tổng số vật thể: <strong>${data.total_objects}</strong></span>
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
    
    // Enhanced video object summary with frame tracking
    const objectsHtml = data.detected_objects ? Object.entries(data.object_counts || {}).map(([name, count]) => {
        const emoji = getObjectEmoji(name);
        const vietnameseName = getVietnameseName(name);
        
        // Calculate frequency per frame if we have frame data
        const frequency = data.total_frames ? (count / data.total_frames * 100).toFixed(1) : 0;
        
        return `
            <div class="object-card video">
                <div class="object-header">
                    <span class="object-name">${emoji} ${vietnameseName}</span>
                    <span class="confidence-badge">${count} lần</span>
                </div>
                <div class="object-details">
                    <strong>🏷️ Tên:</strong> ${name} (${vietnameseName})<br>
                    <strong>📊 Tần suất xuất hiện:</strong> ${frequency}% các frame<br>
                    <strong>🔢 Tổng số phát hiện:</strong> ${count} lần<br>
                    <strong>🎬 Di chuyển qua:</strong> ${Math.round(count/data.total_frames*100)}% video
                </div>
                <div class="object-stats">
                    <div class="stat-box">
                        <span class="stat-label">Xuất hiện</span>
                        <span class="stat-number">${count}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Tần suất</span>
                        <span class="stat-number">${frequency}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join('') : '';
    
    // Calculate video statistics
    const totalFrames = data.total_frames || 0;
    const framesWithObjects = data.frames_with_objects || 0;
    const detectionRate = totalFrames > 0 ? (framesWithObjects / totalFrames * 100).toFixed(1) : 0;
    const avgObjectsPerFrame = framesWithObjects > 0 ? (data.total_objects / framesWithObjects).toFixed(1) : 0;
    
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
                        <span class="stat-value">${Object.keys(data.object_counts || {}).length}</span> loại vật thể
                    </div>
                    <div class="stat-item">
                        ID: <span class="stat-value">${data.detection_id}</span>
                    </div>
                </div>
            </div>
            
            <div class="video-tracking-summary">
                <div class="tracking-title">📊 Chi tiết theo dõi chuyển động:</div>
                <div class="movement-grid">
                    ${movementSummaryHtml || '<div class="no-movement">❌ Không phát hiện chuyển động</div>'}
                </div>
            </div>
            
            <div class="objects-section">
                <h4>📋 Chi tiết vật thể trong video:</h4>
                <div class="objects-grid">
                    ${objectsHtml || '<div class="no-objects">❌ Không tìm thấy vật thể nào</div>'}
                </div>
            </div>
            
            <div class="video-stats">
                <div class="stat-item">
                    <span class="stat-icon">🎬</span>
                    <span>Tổng frames: <strong>${totalFrames}</strong></span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">🎯</span>
                    <span>Frames có vật thể: <strong>${framesWithObjects}</strong></span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">📊</span>
                    <span>Tỷ lệ phát hiện: <strong>${detectionRate}%</strong></span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">⚡</span>
                    <span>TB vật thể/frame: <strong>${avgObjectsPerFrame}</strong></span>
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
                    <div class="history-filename">${fileTypeIcon} ${dateTime}</div>
                    <div class="history-type ${item.file_type}">${item.file_type.toUpperCase()}</div>
                </div>
                
                <div class="detected-objects-preview">
                    <h4>🎯 Vật thể được phát hiện:</h4>
                    <div class="objects-list">
                        ${objectNames.length > 0 ? 
                            objectNames.map(name => `<span class="object-tag">${name}</span>`).join('') 
                            : '<span class="no-objects">Không có vật thể nào</span>'
                        }
                    </div>
                </div>
                
                <div class="history-stats">
                    <div class="history-stat-item">
                        <span class="stat-icon">📊</span>
                        <span class="stat-text">${item.total_objects} vật thể</span>
                    </div>
                    <div class="history-stat-item">
                        <span class="stat-icon">🎯</span>
                        <span class="stat-text">${(item.confidence_avg * 100).toFixed(0)}% tin cậy</span>
                    </div>
                    <div class="history-stat-item">
                        <span class="stat-icon">⏱️</span>
                        <span class="stat-text">${item.processing_time.toFixed(1)}s</span>
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

// Display statistics
function displayStatistics(stats) {
    const container = document.getElementById('statistics-content');
    
    if (!stats) return;
    
    const topObjectsHtml = stats.top_objects.map((obj, index) => {
        const emoji = getObjectEmoji(obj.object_name);
        const vietnameseName = getVietnameseName(obj.object_name);
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
        
        return `
            <div class="top-object-item">
                <div class="rank">${medal}</div>
                <div class="object-info">
                    <div class="object-name">${emoji} ${vietnameseName}</div>
                    <div class="object-stats">${obj.total_count} lần • ${(obj.avg_confidence * 100).toFixed(0)}% tin cậy</div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-icon">📊</span>
                    <span>Tổng nhận diện</span>
                </div>
                <div class="stat-value">${stats.total_detections}</div>
                <div class="stat-label">files đã xử lý</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-icon">🎯</span>
                    <span>TB vật thể/file</span>
                </div>
                <div class="stat-value">${stats.avg_objects_per_file}</div>
                <div class="stat-label">vật thể trung bình</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-icon">⚡</span>
                    <span>Thời gian xử lý</span>
                </div>
                <div class="stat-value">${stats.avg_processing_time}s</div>
                <div class="stat-label">trung bình</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-icon">🔥</span>
                    <span>Hoạt động 24h</span>
                </div>
                <div class="stat-value">${stats.recent_activity_24h}</div>
                <div class="stat-label">nhận diện gần đây</div>
            </div>
        </div>
        
        <div class="top-objects-section">
            <h4>🏆 Top vật thể phổ biến</h4>
            <div class="top-objects-list">
                ${topObjectsHtml || '<div class="no-data">Chưa có dữ liệu</div>'}
            </div>
        </div>
        
        <div class="file-distribution">
            <h4>📁 Phân bố loại file</h4>
            <div class="distribution-chart">
                ${Object.entries(stats.file_type_distribution || {}).map(([type, count]) => {
                    const icon = type === 'image' ? '📸' : '🎬';
                    const total = Object.values(stats.file_type_distribution).reduce((a, b) => a + b, 0);
                    const percentage = ((count / total) * 100).toFixed(1);
                    
                    return `
                        <div class="distribution-item">
                            <span class="type-icon">${icon}</span>
                            <span class="type-name">${type === 'image' ? 'Ảnh' : 'Video'}</span>
                            <span class="type-count">${count} (${percentage}%)</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
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


