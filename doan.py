import os
import cv2
import sqlite3
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, render_template, send_from_directory
from werkzeug.utils import secure_filename
from ultralytics import YOLO
import time
import json
import numpy as np
from collections import Counter
import traceback
import logging
import gc  # Garbage collection for memory management
import psutil  # Process monitoring
import torch  # PyTorch for GPU detection

# Tắt log không cần thiết
logging.getLogger('werkzeug').setLevel(logging.ERROR)
import json
from PIL import Image
import numpy as np
from collections import Counter
import time

# ============================================================================
# GPU DETECTION AND DEVICE CONFIGURATION
# ============================================================================

def detect_device():
    """Detect best available device (GPU/CPU)"""
    if torch.cuda.is_available():
        device = 'cuda'
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
        print(f"🚀 GPU Detected: {gpu_name} ({gpu_memory:.1f}GB VRAM)")
        print(f"🔥 Using GPU for ULTRA SPEED processing!")
        return device
    else:
        print("⚠️ GPU not available, using CPU (slower)")
        return 'cpu'

# Global device configuration
DEVICE = detect_device()

# ============================================================================
# FLASK APP CONFIGURATION
# ============================================================================

app = Flask(__name__)
app.config['SECRET_KEY'] = 'yolo-object-detection-2025'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Directory paths
UPLOAD_FOLDER = 'static/uploads'
RESULTS_FOLDER = 'static/results'
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'}

# Create directories if not exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)
os.makedirs('static', exist_ok=True)
os.makedirs('templates', exist_ok=True)

# Ensure static folders are properly set
app.static_folder = 'static'
app.template_folder = 'templates'

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

DATABASE_PATH = 'object_detection.db'

def init_database():
    """Initialize SQLite database"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Create detections table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            file_type TEXT NOT NULL,  -- 'image' or 'video'
            original_path TEXT NOT NULL,
            result_path TEXT,
            objects_detected TEXT,  -- JSON string
            total_objects INTEGER DEFAULT 0,
            confidence_avg REAL DEFAULT 0.0,
            processing_time REAL DEFAULT 0.0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create objects_count table for statistics
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS objects_count (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            detection_id INTEGER,
            object_class TEXT NOT NULL,
            object_name TEXT NOT NULL,
            count INTEGER DEFAULT 1,
            confidence REAL DEFAULT 0.0,
            FOREIGN KEY (detection_id) REFERENCES detections (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized successfully!")

# ============================================================================
# MEMORY & RESOURCE MANAGEMENT
# ============================================================================

def cleanup_memory():
    """Clean up memory and temporary files to prevent resource exhaustion"""
    try:
        # Force garbage collection
        gc.collect()
        
        # GPU memory cleanup if using CUDA
        if DEVICE == 'cuda' and torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.synchronize()
            gpu_memory = torch.cuda.memory_allocated() / 1024**3
            print(f"🚀 GPU memory cleared. Current usage: {gpu_memory:.2f}GB")
        
        # Clean up OpenCV cache
        cv2.destroyAllWindows()
        
        # Clean up temp files older than 1 hour
        cleanup_old_files()
        
        # Clear globals if needed
        global current_processing_frame
        if 'current_processing_frame' in globals():
            current_processing_frame = None
            
        ram_usage = psutil.Process().memory_info().rss / 1024 / 1024
        print(f"💾 Memory cleaned. RAM usage: {ram_usage:.1f}MB")
        
    except Exception as e:
        print(f"⚠️ Memory cleanup warning: {e}")

def cleanup_old_files():
    """Remove old result files to free disk space"""
    try:
        current_time = time.time()
        old_file_threshold = 3600  # 1 hour
        
        # Clean results folder
        for folder in [RESULTS_FOLDER, 'static/uploads']:
            if os.path.exists(folder):
                for filename in os.listdir(folder):
                    file_path = os.path.join(folder, filename)
                    if os.path.isfile(file_path):
                        file_age = current_time - os.path.getctime(file_path)
                        if file_age > old_file_threshold:
                            os.remove(file_path)
                            print(f"🗑️ Removed old file: {filename}")
                            
    except Exception as e:
        print(f"⚠️ File cleanup warning: {e}")

# ============================================================================
# YOLO MODEL CONFIGURATION
# ============================================================================

# YOLO model path - using YOLOv8n (nano) for faster processing
YOLO_MODEL_PATH = '../yolo11n.pt'  # You can change to yolov8s.pt, yolov8m.pt, etc.

def load_yolo_model():
    """Load YOLO model with memory optimization"""
    try:
        # Kiểm tra nhiều vị trí có thể có của model
        possible_paths = [
            '../yolo11n.pt',  # Thư mục cha
            'yolo11n.pt',     # Thư mục hiện tại  
            './yolo11n.pt',   # Thư mục hiện tại (explicit)
        ]
        
        model_path = None
        for path in possible_paths:
            if os.path.exists(path):
                model_path = path
                break
                
        if model_path:
            print(f"📦 Loading YOLO model from {model_path}")
            model = YOLO(model_path)
        else:
            print("💡 Model not found locally. Downloading YOLOv11n model...")
            model = YOLO('yolo11n.pt')  # Auto-download
        
        # GPU optimization for model - ULTRA SPEED!
        model.to(DEVICE)  # Move model to GPU if available
        if DEVICE == 'cuda':
            print(f"🚀 Model moved to GPU: {torch.cuda.get_device_name(0)}")
        
        # Force garbage collection after model loading
        gc.collect()
        if DEVICE == 'cuda':
            torch.cuda.empty_cache()  # Clear GPU cache
        
        print("✅ YOLO model loaded successfully!")
        print(f"💾 Current RAM usage: {psutil.Process().memory_info().rss / 1024 / 1024:.1f}MB")
        return model
    except Exception as e:
        print(f"❌ Error loading YOLO model: {e}")
        gc.collect()  # Cleanup on error
        return None

# Initialize YOLO model
yolo_model = load_yolo_model()

# ============================================================================
# LIVE FPS TRACKING GLOBALS
# ============================================================================

# Live FPS tracking variables
current_processing_frame = None
last_frame_update_time = 0
live_fps = 0.0
frame_count_for_fps = 0
fps_start_time = time.time()
processing_session_id = None

# ============================================================================
# LIVE FPS TRACKING FUNCTIONS
# ============================================================================

def update_live_fps():
    """Update live FPS calculation"""
    global live_fps, frame_count_for_fps, fps_start_time
    
    frame_count_for_fps += 1
    current_time = time.time()
    
    # Update FPS every 10 frames for smooth calculation
    if frame_count_for_fps % 10 == 0:
        elapsed_time = current_time - fps_start_time
        if elapsed_time > 0:
            live_fps = frame_count_for_fps / elapsed_time
        
        # Reset counter every 100 frames để tránh số quá lớn
        if frame_count_for_fps >= 100:
            frame_count_for_fps = 0
            fps_start_time = current_time

def get_live_fps():
    """Get current live FPS"""
    return round(live_fps, 1)

# ============================================================================
COCO_CLASSES = {
    0: 'person', 1: 'bicycle', 2: 'car', 3: 'motorcycle', 4: 'airplane',
    5: 'bus', 6: 'train', 7: 'truck', 8: 'boat', 9: 'traffic light',
    10: 'fire hydrant', 11: 'stop sign', 12: 'parking meter', 13: 'bench', 
    14: 'bird', 15: 'cat', 16: 'dog', 17: 'horse', 18: 'sheep', 19: 'cow',
    20: 'elephant', 21: 'bear', 22: 'zebra', 23: 'giraffe', 24: 'backpack',
    25: 'umbrella', 26: 'handbag', 27: 'tie', 28: 'suitcase', 29: 'frisbee',
    30: 'skis', 31: 'snowboard', 32: 'sports ball', 33: 'kite', 34: 'baseball bat',
    35: 'baseball glove', 36: 'skateboard', 37: 'surfboard', 38: 'tennis racket',
    39: 'bottle', 40: 'wine glass', 41: 'cup', 42: 'fork', 43: 'knife',
    44: 'spoon', 45: 'bowl', 46: 'banana', 47: 'apple', 48: 'sandwich',
    49: 'orange', 50: 'broccoli', 51: 'carrot', 52: 'hot dog', 53: 'pizza',
    54: 'donut', 55: 'cake', 56: 'chair', 57: 'couch', 58: 'potted plant',
    59: 'bed', 60: 'dining table', 61: 'toilet', 62: 'tv', 63: 'laptop',
    64: 'mouse', 65: 'remote', 66: 'keyboard', 67: 'cell phone', 68: 'microwave',
    69: 'oven', 70: 'toaster', 71: 'sink', 72: 'refrigerator', 73: 'book',
    74: 'clock', 75: 'vase', 76: 'scissors', 77: 'teddy bear', 78: 'hair drier',
    79: 'toothbrush'
}

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def allowed_file(filename, file_type='image'):
    """Check if file extension is allowed"""
    if '.' not in filename:
        return False
    
    ext = filename.rsplit('.', 1)[1].lower()
    
    if file_type == 'image':
        return ext in ALLOWED_IMAGE_EXTENSIONS
    elif file_type == 'video':
        return ext in ALLOWED_VIDEO_EXTENSIONS
    else:
        return ext in (ALLOWED_IMAGE_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS)

def generate_unique_filename(original_filename):
    """Generate unique filename with timestamp and UUID"""
    name, ext = os.path.splitext(original_filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"{name}_{timestamp}_{unique_id}{ext}"

def save_detection_to_db(filename, file_type, original_path, result_path, 
                        objects_detected, processing_time):
    """Save detection result to database with enhanced debugging"""
    try:
        print(f"💾 Saving to database: {len(objects_detected)} objects")
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Calculate statistics
        total_objects = len(objects_detected)
        confidence_avg = np.mean([obj['confidence'] for obj in objects_detected]) if objects_detected else 0.0
        
        print(f"📊 Stats - Total: {total_objects}, Avg confidence: {confidence_avg:.2f}")
        
        # Insert detection record
        cursor.execute('''
            INSERT INTO detections 
            (filename, file_type, original_path, result_path, objects_detected, 
             total_objects, confidence_avg, processing_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (filename, file_type, original_path, result_path, 
              json.dumps(objects_detected), total_objects, confidence_avg, processing_time))
        
        detection_id = cursor.lastrowid
        print(f"✅ Saved detection with ID: {detection_id}")
        
        # Count objects by class
        object_counts = Counter([obj['class_name'] for obj in objects_detected])
        
        # Insert object counts
        for class_name, count in object_counts.items():
            # Find class confidence
            class_confidences = [obj['confidence'] for obj in objects_detected 
                               if obj['class_name'] == class_name]
            avg_confidence = np.mean(class_confidences) if class_confidences else 0.0
            
            cursor.execute('''
                INSERT INTO objects_count 
                (detection_id, object_class, object_name, count, confidence)
                VALUES (?, ?, ?, ?, ?)
            ''', (detection_id, class_name, class_name, count, avg_confidence))
            
            print(f"  📝 Saved {class_name}: {count} objects")
        
        conn.commit()
        conn.close()
        print(f"🎉 Database save completed successfully!")
        return detection_id
        
    except Exception as e:
        print(f"❌ Database save error: {e}")
        import traceback
        traceback.print_exc()
        return None

# ============================================================================
# YOLO DETECTION FUNCTIONS
# ============================================================================

def detect_objects_in_image(image_path, confidence_threshold=0.5):
    """Detect objects in image using YOLO with enhanced sensitivity"""
    if yolo_model is None:
        print("❌ YOLO model not loaded!")
        return [], None, 0.0

    try:
        start_time = time.time()
        
        # Ultra low confidence để phát hiện TOÀN BỘ vật thể
        working_confidence = 0.1  # Confidence cực thấp để không bỏ sót vật thể nào
        
        print(f"🔍 Processing image: {image_path}")
        print(f"🎯 Working confidence: {working_confidence}, User threshold: {confidence_threshold}")
        
        # Run YOLO inference để phát hiện TOÀN BỘ vật thể
        results = yolo_model(image_path, conf=working_confidence, verbose=False, 
                           imgsz=640, half=True, device=DEVICE, max_det=300)  # GPU SPEED!
        
        # Load image for drawing
        image = cv2.imread(image_path)
        if image is None:
            print("❌ Could not load image!")
            return [], None, 0.0
            
        detected_objects = []
        all_detections = []  # Track all detections for debugging
        
        # Process results
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                print(f"📦 Found {len(boxes)} raw detections from YOLO")
                for box in boxes:
                    # Get box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    confidence = float(box.conf[0])
                    class_id = int(box.cls[0])
                    class_name = COCO_CLASSES.get(class_id, f'class_{class_id}')
                    
                    # Track all detections for debugging
                    all_detections.append({
                        'class_name': class_name,
                        'confidence': confidence,
                        'meets_threshold': confidence >= confidence_threshold
                    })
                    
                    # RELAXED THRESHOLD - Chấp nhận vật thể có confidence thấp hơn
                    if confidence >= 0.2:  # Threshold cực thấp để đảm bảo phát hiện
                        
                        detected_objects.append({
                            'class_id': class_id,
                            'class_name': class_name,
                            'confidence': confidence,
                            'bbox': [x1, y1, x2, y2]
                        })
                        
                        # Get English name for enhanced display
                        english_name = get_vietnamese_name(class_name)
                        confidence_percent = confidence * 100
                        
                        # Draw enhanced bounding box with thicker border
                        cv2.rectangle(image, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 3)
                        
                        # Create detailed label with English name only (clear and readable)
                        main_label = f'{english_name}'
                        confidence_label = f'{confidence_percent:.1f}%'
                        
                        # Calculate label sizes with larger font and more padding
                        main_font_scale = 1.2  # Tăng từ 1.0 lên 1.2
                        conf_font_scale = 0.8  # Tăng từ 0.7 lên 0.8
                        main_thickness = 3
                        conf_thickness = 3
                        
                        main_label_size = cv2.getTextSize(main_label, cv2.FONT_HERSHEY_SIMPLEX, main_font_scale, main_thickness)[0]
                        conf_label_size = cv2.getTextSize(confidence_label, cv2.FONT_HERSHEY_SIMPLEX, conf_font_scale, conf_thickness)[0]
                        
                        # Determine label background size with much more padding + safety margin
                        safety_margin = 20  # Thêm margin an toàn
                        max_width = max(main_label_size[0], conf_label_size[0]) + 40 + safety_margin
                        total_height = main_label_size[1] + conf_label_size[1] + 40
                        
                        # Draw label background (gradient effect)
                        bg_start_y = int(y1) - total_height - 10
                        bg_end_y = int(y1) - 5
                        
                        # Yellow background for main label
                        cv2.rectangle(image, (int(x1), bg_start_y), 
                                    (int(x1) + max_width, int(y1) - main_label_size[1] - 15), 
                                    (0, 255, 255), -1)  # Yellow
                        
                        # Blue background for confidence
                        cv2.rectangle(image, (int(x1), int(y1) - main_label_size[1] - 15), 
                                    (int(x1) + max_width, bg_end_y), 
                                    (255, 165, 0), -1)  # Blue
                        
                        # Draw border around entire label
                        cv2.rectangle(image, (int(x1), bg_start_y), 
                                    (int(x1) + max_width, bg_end_y), 
                                    (0, 0, 0), 2)
                        
                        # Draw main label text (English name)
                        # Use larger font size and more padding for better readability
                        cv2.putText(image, main_label, 
                                  (int(x1) + 20, bg_start_y + main_label_size[1] + 15),
                                  cv2.FONT_HERSHEY_SIMPLEX, main_font_scale, (0, 0, 0), main_thickness)
                        
                        # Draw confidence label text
                        cv2.putText(image, confidence_label, 
                                  (int(x1) + 20, int(y1) - 12),
                                  cv2.FONT_HERSHEY_SIMPLEX, conf_font_scale, (255, 255, 255), conf_thickness)
                        
                        # Draw confidence indicator bar on the right side
                        bar_width = 10
                        bar_height = int((y2 - y1) * confidence)
                        bar_x = int(x2) + 5
                        
                        # Choose color based on confidence level
                        if confidence > 0.8:
                            bar_color = (0, 255, 0)  # Green - high confidence
                        elif confidence > 0.6:
                            bar_color = (0, 255, 255)  # Yellow - medium confidence  
                        else:
                            bar_color = (0, 0, 255)  # Red - low confidence
                        
                        # Draw confidence bar
                        cv2.rectangle(image, (bar_x, int(y2)), 
                                    (bar_x + bar_width, int(y2) - bar_height), 
                                    bar_color, -1)
                        
                        # Draw confidence bar border
                        cv2.rectangle(image, (bar_x, int(y1)), 
                                    (bar_x + bar_width, int(y2)), 
                                    (255, 255, 255), 2)
                        
                        # Add confidence percentage text next to bar
                        cv2.putText(image, f'{confidence_percent:.0f}%', 
                                  (bar_x + bar_width + 5, int(y1) + 20),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
        
        processing_time = time.time() - start_time
        
        # Debug output for troubleshooting
        print(f"🔍 Detection completed in {processing_time:.2f}s")
        print(f"📊 Found {len(detected_objects)} objects above confidence {confidence_threshold}")
        print(f"📋 All detections: {len(all_detections)} total")
        
        if detected_objects:
            print("✅ Objects detected:")
            for obj in detected_objects:
                print(f"  - {obj['class_name']}: {obj['confidence']:.2f}")
        else:
            print("❌ No objects found meeting confidence threshold")
        
        return detected_objects, image, processing_time
        
    except Exception as e:
        print(f"❌ Error in object detection: {e}")
        import traceback
        traceback.print_exc()
        return [], None, 0.0

def add_video_summary_frames(out, all_detected_objects, fps, width, height, video_path):
    """Add summary frames at the end of video"""
    try:
        # Count objects by class
        object_counts = Counter([obj['class_name'] for obj in all_detected_objects])
        total_objects = len(all_detected_objects)
        unique_classes = len(object_counts)
        
        # Create summary frame (show for 3 seconds)
        summary_frames = fps * 3
        
        for i in range(summary_frames):
            # Create black frame
            summary_frame = np.zeros((height, width, 3), dtype=np.uint8)
            
            # Title
            cv2.putText(summary_frame, "VIDEO ANALYSIS SUMMARY", 
                       (width//2 - 200, 80), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 3)
            
            # Video info
            video_name = os.path.basename(video_path)
            cv2.putText(summary_frame, f"File: {video_name}", 
                       (50, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (200, 200, 200), 2)
            
            # Statistics
            stats_y = 200
            cv2.putText(summary_frame, f"Total Objects Detected: {total_objects}", 
                       (50, stats_y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            cv2.putText(summary_frame, f"Unique Object Types: {unique_classes}", 
                       (50, stats_y + 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            
            # Top 5 objects
            cv2.putText(summary_frame, "Most Detected Objects:", 
                       (50, stats_y + 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
            
            y_pos = stats_y + 140
            for idx, (class_name, count) in enumerate(object_counts.most_common(5)):
                english_name = get_vietnamese_name(class_name)
                text = f"{idx+1}. {english_name}: {count} times"
                cv2.putText(summary_frame, text, 
                           (70, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                y_pos += 35
            
            # Progress indicator for summary
            progress = (i / summary_frames) * 100
            bar_width = 400
            bar_x = width//2 - bar_width//2
            bar_y = height - 60
            
            # Progress bar background
            cv2.rectangle(summary_frame, (bar_x, bar_y), (bar_x + bar_width, bar_y + 20), (50, 50, 50), -1)
            # Progress bar fill
            progress_width = int((progress / 100) * bar_width)
            cv2.rectangle(summary_frame, (bar_x, bar_y), (bar_x + progress_width, bar_y + 20), (0, 255, 0), -1)
            
            cv2.putText(summary_frame, "Analysis Complete", 
                       (width//2 - 100, bar_y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            out.write(summary_frame)
            
    except Exception as e:
        print(f"Warning: Could not add summary frames: {e}")

def add_video_info_overlay(frame, frame_objects, frame_count, total_frames, video_path, fps=30, active_tracks=0):
    """Add minimal information overlay for speed"""
    try:
        height, width = frame.shape[:2]
        
        # Minimal overlay chỉ thông tin cần thiết
        cv2.rectangle(frame, (0, 0), (width, 40), (0, 0, 0), -1)
        
        progress = (frame_count / total_frames) * 100
        cv2.putText(frame, f"YOLO {len(frame_objects)} objects - {progress:.0f}%", 
                   (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
    except:
        pass

def draw_tracking_paths(frame, object_tracks):
    """Draw simplified tracking paths for speed (3s target)"""
    try:
        for track_id, track_data in object_tracks.items():
            track_points = track_data['points']
            class_name = track_data['class_name']
            
            if len(track_points) > 1:
                # Draw simplified path (skip points for speed)
                for i in range(2, len(track_points), 2):  
                    pt1 = track_points[i-2]
                    pt2 = track_points[i]
                    cv2.line(frame, pt1, pt2, (0, 255, 255), 2)
                
                # Simple current marker
                current_point = track_points[-1]
                cv2.circle(frame, current_point, 5, (0, 0, 255), -1)
                
                # Quick label
                english_name = get_vietnamese_name(class_name)
                cv2.putText(frame, f"#{track_id}:{english_name}", 
                           (current_point[0] + 8, current_point[1] - 8),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
    except:
        pass

def detect_objects_in_video_optimized(video_path, confidence_threshold=0.5):
    """Optimized video object detection for realtime preview"""
    global current_processing_frame, last_frame_update_time
    
    if yolo_model is None:
        return [], None, 0.0, 0

    try:
        start_time = time.time()
        print("🎬 Bắt đầu nhận diện video...")
        
        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print("❌ Không thể mở video!")
            return [], None, 0.0, 0
        
        # Get video properties but don't use FPS for streaming timing
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Fixed output for file saving only - doesn't affect streaming speed
        output_fps = 25  # Standard output FPS
        
        # Create output video writer
        output_filename = f"result_{generate_unique_filename(os.path.basename(video_path))}"
        output_path = os.path.join(RESULTS_FOLDER, output_filename)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, output_fps, (width, height))
        
        all_detected_objects = []
        frame_count = 0
        processing_start_time = time.time()
        
        # ULTRA HIGH SPEED - Skip nhiều frames để tăng tốc
        skip_frames = 8 if DEVICE == 'cuda' else 12  # Cân bằng tốc độ và độ chính xác
        
        # SPEED optimized resolution
        processing_resolution = 160  # Cân bằng giữa tốc độ và chất lượng detection
        
        # Optimized for YOUTUBE speed
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_objects = []
            
            # Process only selected frames for speed
            if frame_count % skip_frames == 0:
                # Update live FPS tracking
                update_live_fps()
                
                # Resize frame for faster processing
                original_height, original_width = frame.shape[:2]
                if original_width > processing_resolution:
                    scale = processing_resolution / original_width
                    new_width = processing_resolution
                    new_height = int(original_height * scale)
                    resized_frame = cv2.resize(frame, (new_width, new_height))
                    
                    # CÂN BẰNG TỐC ĐỘ VÀ PHÁT HIỆN
                    results = yolo_model(resized_frame, conf=0.3, verbose=False, 
                                       imgsz=processing_resolution, half=True, device=DEVICE, 
                                       max_det=50, agnostic_nms=True, iou=0.6)  # Cân bằng speed + detection
                    
                    # Calculate scale factors
                    scale_x = original_width / new_width
                    scale_y = original_height / new_height
                else:
                    results = yolo_model(frame, conf=0.3, verbose=False, 
                                       imgsz=processing_resolution, half=True, device=DEVICE,
                                       max_det=50, agnostic_nms=True, iou=0.6)
                    scale_x = scale_y = 1.0
                
                # Process results with coordinate scaling
                for result in results:
                    boxes = result.boxes
                    if boxes is not None:
                        for box in boxes:
                            x1, y1, x2, y2 = box.xyxy[0].tolist()
                            
                            # Scale coordinates back if needed
                            if scale_x != 1.0:
                                x1 *= scale_x
                                y1 *= scale_y
                                x2 *= scale_x
                                y2 *= scale_y
                            
                            confidence = float(box.conf[0])
                            class_id = int(box.cls[0])
                            
                            if confidence >= 0.25:  # Threshold thấp để đảm bảo phát hiện được vật thể
                                class_name = COCO_CLASSES.get(class_id, f'class_{class_id}')
                                
                                frame_objects.append({
                                    'frame': frame_count,
                                    'class_id': class_id,
                                    'class_name': class_name,
                                    'confidence': confidence,
                                    'bbox': [x1, y1, x2, y2]
                                })
                                
                                # NO DRAWING - YouTube speed optimization
                                # Skip all visual overlays for maximum speed
            
            
            # YOUTUBE SPEED video streaming - instant like YouTube
            if frame.shape[1] > 320:
                # YouTube mobile quality for instant streaming
                preview_frame = cv2.resize(frame, (320, 240))
            else:
                preview_frame = frame.copy()
            current_processing_frame = preview_frame
                
            # Only do heavy YOLO processing on selected frames
            if frame_count % skip_frames == 0:
                # YOLO processing happens here but doesn't block frame updates
                pass  # Processing logic is already above
            
            all_detected_objects.extend(frame_objects)
            out.write(frame)
            frame_count += 1
            
            # Báo cáo tiến trình cực ít để tối ưu tốc độ
            if frame_count % 300 == 0:  # Chỉ báo mỗi 300 frames
                progress = (frame_count / total_frames) * 100
                print(f"⚡ Siêu nhanh: {progress:.0f}% | Phát hiện: {len(all_detected_objects)}")
        
        cap.release()
        out.release()
        
        # Memory cleanup after processing
        gc.collect()
        cv2.destroyAllWindows()
        
        processing_time = time.time() - start_time
        final_fps = get_live_fps()
        print(f"✅ Hoàn thành! Thời gian: {processing_time:.1f}s")
        print(f"🎯 Tổng vật thể phát hiện: {len(all_detected_objects)}")
        print(f"⚡ FPS trung bình: {final_fps}")
        
        # Trả về video info với live FPS
        video_info = {
            'fps': fps,
            'width': width,
            'height': height,
            'total_frames': total_frames,
            'live_fps': final_fps
        }
        return all_detected_objects, output_path, processing_time, total_frames, video_info
        
    except Exception as e:
        print(f"❌ Error in optimized video detection: {e}")
        # Cleanup on error
        gc.collect()
        return [], None, 0.0, 0, {'fps': 0, 'width': 0, 'height': 0, 'total_frames': 0}

def detect_objects_in_video(video_path, confidence_threshold=0.5):
    """Detect objects in video using YOLO"""
    if yolo_model is None:
        return [], None, 0.0
    
    try:
        start_time = time.time()
        
        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return [], None, 0.0
        
        # Get video properties but don't use FPS for streaming timing
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Fixed output for file saving only - doesn't affect streaming speed
        output_fps = 25  # Standard output FPS
        
        # Create output video writer
        output_filename = f"result_{generate_unique_filename(os.path.basename(video_path))}"
        output_path = os.path.join(RESULTS_FOLDER, output_filename)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, output_fps, (width, height))
        
        all_detected_objects = []
        frame_count = 0
        
        # Ultra-fast frame processing for maximum speed
        skip_frames = 1  # Process every frame for maximum speed
        # Silent video processing
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_objects = []
            results = []  # Initialize results for each frame
            
            # Process only selected frames for speed optimization
            if frame_count % skip_frames == 0:
                # Run YOLO directly on frame (no temp file for speed)
                results = yolo_model(frame, conf=confidence_threshold, verbose=False)
            
            # Process results
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        confidence = float(box.conf[0])
                        class_id = int(box.cls[0])
                        
                        if confidence >= confidence_threshold:
                            class_name = COCO_CLASSES.get(class_id, f'class_{class_id}')
                            
                            frame_objects.append({
                                'frame': frame_count,
                                'class_id': class_id,
                                'class_name': class_name,
                                'confidence': confidence,
                                'bbox': [x1, y1, x2, y2]
                            })
                            
                            # Draw bounding box with thicker border
                            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 3)
                            
                            # Get Vietnamese name and emoji
                            vietnamese_name = get_vietnamese_name(class_name)
                            emoji = get_object_emoji(class_name)
                            
                            # Create simple but clear label
                            label = f'{emoji} {vietnamese_name} ({confidence*100:.0f}%)'
                            
                            # Draw yellow arrow pointing to object
                            arrow_start = (int(x1 + (x2-x1)/2), int(y1) - 30)
                            arrow_end = (int(x1 + (x2-x1)/2), int(y1) - 10)
                            cv2.arrowedLine(frame, arrow_start, arrow_end, (0, 255, 255), 3, tipLength=0.3)
                            
                            # Simple yellow label background
                            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                            cv2.rectangle(frame, (int(x1), int(y1) - 35), 
                                        (int(x1) + label_size[0] + 10, int(y1) - 10), 
                                        (0, 255, 255), -1)
                            cv2.rectangle(frame, (int(x1), int(y1) - 35), 
                                        (int(x1) + label_size[0] + 10, int(y1) - 10), 
                                        (0, 0, 0), 2)
                            
                            # Black text on yellow background
                            cv2.putText(frame, label, (int(x1) + 5, int(y1) - 15),
                                      cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
            
            all_detected_objects.extend(frame_objects)
            out.write(frame)
            frame_count += 1
            
            # Silent progress - only show at major milestones (every 10%)
            if frame_count % max(1, total_frames // 10) == 0:
                progress = (frame_count / total_frames) * 100
                if progress % 10 == 0:  # Only at 10%, 20%, 30%, etc.
                    print(f"⚡ Processing: {progress:.0f}% complete")
        
        # Silent video processing completion
        
        # Release resources
        cap.release()
        out.release()
        
        processing_time = time.time() - start_time
        return all_detected_objects, output_path, processing_time, total_frames
        
    except Exception as e:
        print(f"❌ Error in video detection: {e}")
        return [], None, 0.0
    """Detect objects in video using YOLO with realtime preview"""
    global current_processing_frame, processing_session_id
    
    if yolo_model is None:
        return [], None, 0.0
    
    try:
        # Set processing session
        processing_session_id = session_id
        start_time = time.time()
        
        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return [], None, 0.0
        
        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Create output video writer
        output_filename = f"result_{generate_unique_filename(os.path.basename(video_path))}"
        output_path = os.path.join(RESULTS_FOLDER, output_filename)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        all_detected_objects = []
        frame_count = 0
        
        # Optimize: Skip frames for faster processing
        skip_frames = 2 if total_frames > 300 else 1
        # Silent video processing
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_objects = []
            results = []  # Initialize results for each frame
            
            # Process only selected frames for speed optimization
            if frame_count % skip_frames == 0:
                # Run YOLO directly on frame (no temp file for speed)
                results = yolo_model(frame, conf=confidence_threshold, verbose=False)
            
            # Process results
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        confidence = float(box.conf[0])
                        class_id = int(box.cls[0])
                        
                        if confidence >= confidence_threshold:
                            class_name = COCO_CLASSES.get(class_id, f'class_{class_id}')
                            
                            frame_objects.append({
                                'frame': frame_count,
                                'class_id': class_id,
                                'class_name': class_name,
                                'confidence': confidence,
                                'bbox': [x1, y1, x2, y2]
                            })
                            
                            # Draw bounding box with thicker border
                            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 3)
                            
                            # Get Vietnamese name and emoji
                            vietnamese_name = get_vietnamese_name(class_name)
                            emoji = get_object_emoji(class_name)
                            
                            # Create simple but clear label
                            label = f'{emoji} {vietnamese_name} ({confidence*100:.0f}%)'
                            
                            # Draw yellow arrow pointing to object
                            arrow_start = (int(x1 + (x2-x1)/2), int(y1) - 30)
                            arrow_end = (int(x1 + (x2-x1)/2), int(y1) - 10)
                            cv2.arrowedLine(frame, arrow_start, arrow_end, (0, 255, 255), 3, tipLength=0.3)
                            
                            # Simple yellow label background
                            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                            cv2.rectangle(frame, (int(x1), int(y1) - 35), 
                                        (int(x1) + label_size[0] + 10, int(y1) - 10), 
                                        (0, 255, 255), -1)
                            cv2.rectangle(frame, (int(x1), int(y1) - 35), 
                                        (int(x1) + label_size[0] + 10, int(y1) - 10), 
                                        (0, 0, 0), 2)
                            
                            # Black text on yellow background
                            cv2.putText(frame, label, (int(x1) + 5, int(y1) - 15),
                                      cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
            
            
            # YOUTUBE SPEED video streaming - instant like YouTube
            if frame.shape[1] > 320:
                preview_frame = cv2.resize(frame, (320, 240))
            else:
                preview_frame = frame.copy()
            current_processing_frame = preview_frame
            
            all_detected_objects.extend(frame_objects)
            out.write(frame)
            frame_count += 1
            
            # Silent progress - only show at major milestones (every 10%)
            if frame_count % max(1, total_frames // 10) == 0:
                progress = (frame_count / total_frames) * 100
                if progress % 10 == 0:  # Only at 10%, 20%, 30%, etc.
                    print(f"⚡ Processing: {progress:.0f}% complete")
        
        # Silent video processing completion
        
        # Release resources
        cap.release()
        out.release()
        
        # Clear processing session
        current_processing_frame = None
        processing_session_id = None
        
        processing_time = time.time() - start_time
        return all_detected_objects, output_path, processing_time, total_frames
        
    except Exception as e:
        print(f"❌ Error in video detection: {e}")
        # Clear processing session on error
        current_processing_frame = None
        processing_session_id = None
        return [], None, 0.0

# ============================================================================
# Initialize database on startup
# ============================================================================

init_database()

# ============================================================================
# FLASK ROUTES - API ENDPOINTS
# ============================================================================

@app.route('/')
def index():
    """Home page with web UI"""
    return render_template('index.html')

@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/static/results/<filename>')
def result_file(filename):
    """Serve result files"""
    return send_from_directory(RESULTS_FOLDER, filename)

@app.route('/api/predict_image', methods=['POST'])
def predict_image():
    """API endpoint for image object detection"""
    try:
        # Check if file is uploaded
        if 'image' not in request.files:
            print("❌ No image file in request")
            return jsonify({
                'success': False,
                'error': 'No image file uploaded'
            }), 400
        
        file = request.files['image']
        # Silent upload processing
        
        if file.filename == '':
            print("❌ Empty filename")
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Check file extension
        if not allowed_file(file.filename, 'image'):
            print(f"❌ Invalid file type: {file.filename}")
            return jsonify({
                'success': False,
                'error': f'Invalid file type. Allowed: {", ".join(ALLOWED_IMAGE_EXTENSIONS)}'
            }), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        unique_filename = generate_unique_filename(filename)
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        file.save(file_path)
        
        # Verify file was saved
        if not os.path.exists(file_path):
            print(f"❌ File not saved: {file_path}")
            return jsonify({
                'success': False,
                'error': 'Failed to save uploaded file'
            }), 500
            
        # Silent file save
        
        # Get confidence threshold from request (thấp hơn để đảm bảo phát hiện)
        confidence_threshold = float(request.form.get('confidence', 0.3))
        
        # Perform object detection
        detected_objects, annotated_image, processing_time = detect_objects_in_image(
            file_path, confidence_threshold
        )
        
        # Simple completion message
        if len(detected_objects) > 0:
            pass  # Silent completion
        else:
            pass  # Silent no objects
        
        result_path = None
        result_filename = None
        if annotated_image is not None:
            # Save annotated image
            result_filename = f"result_{unique_filename}"
            result_path = os.path.join(RESULTS_FOLDER, result_filename)
            cv2.imwrite(result_path, annotated_image)
        
        # Save to database
        detection_id = save_detection_to_db(
            unique_filename, 'image', file_path, result_path, 
            detected_objects, processing_time
        )
        
        # Count objects by class
        object_counts = Counter([obj['class_name'] for obj in detected_objects])
        
        # Create detailed object list with English names - ensure complete data
        detailed_objects = []
        for obj in detected_objects:
            detailed_objects.append({
                'class_name': obj['class_name'],
                'english_name': get_vietnamese_name(obj['class_name']),
                'vietnamese_name': get_vietnamese_name(obj['class_name']),  # Add this field
                'confidence': obj['confidence'],
                'bbox': obj['bbox'],
                'emoji': get_object_emoji(obj['class_name'])
            })
        
        # Ensure object_counts has complete data
        complete_object_counts = {}
        for obj in detected_objects:
            class_name = obj['class_name']
            if class_name not in complete_object_counts:
                complete_object_counts[class_name] = 0
            complete_object_counts[class_name] += 1
        
        return jsonify({
            'success': True,
            'detection_id': detection_id,
            'filename': unique_filename,
            'original_image': f'/{UPLOAD_FOLDER}/{unique_filename}',
            'result_image': f'/{RESULTS_FOLDER}/{result_filename}' if result_filename else None,
            'detected_objects': detailed_objects,
            'object_counts': complete_object_counts,  # Use complete counts
            'total_objects': len(detected_objects),
            'processing_time': processing_time,
            'confidence_threshold': confidence_threshold,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error in predict_image: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Processing error: {str(e)}'
        }), 500

def get_vietnamese_name(english_name):
    """Return English object name (keeping original function name for compatibility)"""
    # Return the original English name directly with proper formatting
    name = english_name.title()  # Capitalize first letter of each word
    
    # Handle special cases for better display
    if len(name) > 12:  # If name too long, use abbreviation
        abbreviations = {
            'Traffic Light': 'Traffic',
            'Fire Hydrant': 'Hydrant', 
            'Parking Meter': 'P.Meter',
            'Baseball Bat': 'Bat',
            'Baseball Glove': 'Glove',
            'Sports Ball': 'Ball',
            'Tennis Racket': 'Racket',
            'Wine Glass': 'Glass',
            'Hot Dog': 'Hotdog',
            'Potted Plant': 'Plant',
            'Dining Table': 'Table',
            'Cell Phone': 'Phone',
            'Hair Drier': 'Dryer',
            'Teddy Bear': 'Bear'
        }
        return abbreviations.get(name, name[:10])  # Max 10 chars
    
    return name

def get_object_emoji(object_name):
    """Get emoji for object"""
    object_emojis = {
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
    }
    return object_emojis.get(object_name.lower(), '📦')

import threading

# Global variable to store current processing frame
current_processing_frame = None
processing_session_id = None
last_frame_update_time = 0  # Add timestamp to control frame updates
processing_status = {}  # {session_id: {'status': 'processing/completed', 'result': data}}

def process_video_async(file_path, confidence_threshold, session_id, unique_filename):
    """Process video in background thread"""
    global processing_status
    
    try:
        # Set status to processing
        processing_status[session_id] = {'status': 'processing', 'progress': 0}
        
        # Perform object detection on video
        detected_objects, result_video_path, processing_time, total_frames = detect_objects_in_video(
            file_path, confidence_threshold
        )
        
        # Save to database
        detection_id = save_detection_to_db(
            unique_filename, 'video', file_path, result_video_path, 
            detected_objects, processing_time
        )
        
        # Count objects by class across all frames
        object_counts = Counter([obj['class_name'] for obj in detected_objects])
        
        # Create detailed object tracking with Vietnamese names
        detailed_objects = []
        frame_stats = {}
        
        for obj in detected_objects:
            frame_num = obj['frame']
            if frame_num not in frame_stats:
                frame_stats[frame_num] = []
            
            detailed_obj = {
                'frame': frame_num,
                'class_name': obj['class_name'],
                'vietnamese_name': get_vietnamese_name(obj['class_name']),
                'confidence': obj['confidence'],
                'bbox': obj['bbox'],
                'emoji': get_object_emoji(obj['class_name'])
            }
            
            frame_stats[frame_num].append(detailed_obj)
            detailed_objects.append(detailed_obj)
        
        # Create movement summary for better tracking
        movement_summary = {}
        for class_name, count in object_counts.items():
            frames_appeared = len([f for f in frame_stats.keys() 
                                 if any(obj['class_name'] == class_name for obj in frame_stats[f])])
            movement_summary[class_name] = {
                'english_name': get_vietnamese_name(class_name),
                'emoji': get_object_emoji(class_name),
                'total_detections': count,
                'frames_appeared': frames_appeared,
                'appearance_rate': round((frames_appeared / len(frame_stats)) * 100, 1) if frame_stats else 0
            }
        
        # Store completed result
        result_data = {
            'success': True,
            'detection_id': detection_id,
            'filename': unique_filename,
            'original_video': f'/{UPLOAD_FOLDER}/{unique_filename}',
            'result_video': f'/{RESULTS_FOLDER}/{os.path.basename(result_video_path)}' if result_video_path else None,
            'detected_objects': detailed_objects,
            'frame_tracking': frame_stats,
            'movement_summary': movement_summary,
            'object_counts': dict(object_counts),
            'total_objects': len(detected_objects),
            'total_frames': len(frame_stats),
            'frames_with_objects': len([f for f in frame_stats.values() if f]),
            'processing_time': processing_time,
            'timestamp': datetime.now().isoformat()
        }
        
        processing_status[session_id] = {'status': 'completed', 'result': result_data}
        
    except Exception as e:
        processing_status[session_id] = {'status': 'error', 'error': str(e)}

@app.route('/api/video_status/<session_id>')
def get_video_status(session_id):
    """Get video processing status"""
    global processing_status
    
    if session_id not in processing_status:
        return jsonify({
            'success': False,
            'error': 'Session not found'
        }), 404
    
    status_data = processing_status[session_id]
    
    return jsonify({
        'success': True,
        'status': status_data['status'],
        'result': status_data.get('result'),
        'error': status_data.get('error'),
        'progress': status_data.get('progress', 0)
    })

@app.route('/api/realtime_frame/<session_id>')
def get_realtime_frame(session_id):
    """Get current processing frame for realtime preview - optimized"""
    global current_processing_frame, processing_session_id
    
    if processing_session_id != session_id or current_processing_frame is None:
        return jsonify({
            'success': False,
            'error': 'No active processing session or invalid session ID'
        }), 404
    
    try:
        # YouTube-style frame encoding with balanced quality and speed
        import base64
        # HIGH FPS encoding - ultra-low quality cho tốc độ tối đa
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 20]  # Giảm xuống 20% để tăng FPS
        _, buffer = cv2.imencode('.jpg', current_processing_frame, encode_param)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # Clear buffer from memory immediately
        del buffer
        
        return jsonify({
            'success': True,
            'frame': f'data:image/jpeg;base64,{img_base64}',
            'session_id': session_id,
            'live_fps': get_live_fps()
        })
        
    except Exception as e:
        # Force garbage collection on error
        gc.collect()
        return jsonify({
            'success': False,
            'error': f'Frame encoding error: {str(e)}'
        }), 500

@app.route('/api/predict_video', methods=['POST'])
def predict_video():
    """API endpoint for video object detection with tracking paths"""
    try:
        # Check if file is uploaded
        if 'video' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No video file uploaded'
            }), 400
        
        file = request.files['video']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Check file extension
        if not allowed_file(file.filename, 'video'):
            return jsonify({
                'success': False,
                'error': f'Invalid file type. Allowed: {", ".join(ALLOWED_VIDEO_EXTENSIONS)}'
            }), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        unique_filename = generate_unique_filename(filename)
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        
        # Get confidence threshold from request (thấp hơn để đảm bảo phát hiện video)
        confidence_threshold = float(request.form.get('confidence', 0.3))
        
        # Perform optimized object detection on video for better realtime performance
        detected_objects, result_video_path, processing_time, total_frames, video_info = detect_objects_in_video_optimized(
            file_path, confidence_threshold
        )
        
        # Save to database
        detection_id = save_detection_to_db(
            unique_filename, 'video', file_path, result_video_path, 
            detected_objects, processing_time
        )
        
        # Count objects by class across all frames
        object_counts = Counter([obj['class_name'] for obj in detected_objects])
        
        # Create detailed object tracking with Vietnamese names - ensure complete data
        detailed_objects = []
        frame_stats = {}
        
        for obj in detected_objects:
            frame_num = obj['frame']
            if frame_num not in frame_stats:
                frame_stats[frame_num] = []
            
            detailed_obj = {
                'frame': frame_num,
                'class_name': obj['class_name'],
                'vietnamese_name': get_vietnamese_name(obj['class_name']),
                'english_name': get_vietnamese_name(obj['class_name']),  # Add for consistency
                'confidence': obj['confidence'],
                'bbox': obj['bbox'],
                'emoji': get_object_emoji(obj['class_name'])
            }
            
            frame_stats[frame_num].append(detailed_obj)
            detailed_objects.append(detailed_obj)
        
        # ULTRA SPEED OPTIMIZED: Simplified statistics với ít tính toán hơn
        movement_summary = {}
        class_statistics = {}  
        
        # Đơn giản hóa - không dùng numpy cho speed
        for class_name, count in object_counts.items():
            # FAST: Count unique frames directly
            class_frames = set()
            class_confidences = []
            
            for obj in detected_objects:
                if obj['class_name'] == class_name:
                    class_frames.add(obj['frame'])
                    class_confidences.append(obj['confidence'])
            
            frames_appeared = len(class_frames)
            
            if class_confidences:
                avg_confidence = sum(class_confidences) / len(class_confidences)
                max_confidence = max(class_confidences)
                min_confidence = min(class_confidences)
                first_frame = min([obj['frame'] for obj in detected_objects if obj['class_name'] == class_name])
                last_frame = max([obj['frame'] for obj in detected_objects if obj['class_name'] == class_name])
            else:
                avg_confidence = max_confidence = min_confidence = 0.0
                first_frame = last_frame = 0
            
            # CACHED values
            vietnamese_name = get_vietnamese_name(class_name)
            emoji = get_object_emoji(class_name)
            appearance_rate = round((frames_appeared / len(frame_stats)) * 100, 1) if frame_stats else 0
            
            movement_summary[class_name] = {
                'vietnamese_name': vietnamese_name,
                'english_name': vietnamese_name,
                'emoji': emoji,
                'total_detections': count,
                'frames_appeared': frames_appeared,
                'appearance_rate': appearance_rate
            }
            
            # Simplified statistics
            class_statistics[class_name] = {
                'vietnamese_name': vietnamese_name,
                'emoji': emoji,
                'total_detections': count,
                'frames_appeared': frames_appeared,
                'appearance_rate': appearance_rate,
                'avg_confidence': round(avg_confidence * 100, 1),
                'max_confidence': round(max_confidence * 100, 1),
                'min_confidence': round(min_confidence * 100, 1),
                'first_appearance': first_frame,
                'last_appearance': last_frame,
                'duration_frames': last_frame - first_frame + 1,
                'detection_density': round(count / frames_appeared, 2) if frames_appeared > 0 else 0
            }
        
        return jsonify({
            'success': True,
            'detection_id': detection_id,
            'filename': unique_filename,
            'original_video': f'/{UPLOAD_FOLDER}/{unique_filename}',
            'result_video': f'/{RESULTS_FOLDER}/{os.path.basename(result_video_path)}' if result_video_path else None,
            'detected_objects': detailed_objects,
            'frame_tracking': frame_stats,
            'movement_summary': movement_summary,
            'class_statistics': class_statistics,  # Thống kê chi tiết mới
            'object_counts': dict(object_counts),
            'total_objects': len(detected_objects),
            'total_frames': len(frame_stats),
            'frames_with_objects': len([f for f in frame_stats.values() if f]),
            'frames_without_objects': len(frame_stats) - len([f for f in frame_stats.values() if f]),
            'unique_classes': len(object_counts),
            'processing_time': processing_time,
            'confidence_threshold': confidence_threshold,
            'avg_objects_per_frame': round(len(detected_objects) / len(frame_stats), 2) if frame_stats else 0,
            'video_info': {
                'fps': video_info['fps'],
                'duration_seconds': round(len(frame_stats) / video_info['fps'], 2) if video_info['fps'] > 0 else 0,
                'resolution': f"{video_info['width']}x{video_info['height']}"
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        # Cleanup on error
        cleanup_memory()
        return jsonify({
            'success': False,
            'error': f'Processing error: {str(e)}'
        }), 500
    finally:
        # Always cleanup after video processing
        cleanup_memory()

@app.route('/api/history')
def get_history():
    """Get detection history from database with object details"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, filename, file_type, total_objects, confidence_avg, 
                   processing_time, timestamp
            FROM detections 
            ORDER BY timestamp DESC
            LIMIT 50
        ''')
        
        history = []
        for row in cursor.fetchall():
            detection_id = row[0]
            
            # Get object details for this detection
            cursor.execute('''
                SELECT object_name, COUNT(*) as count, AVG(confidence) as avg_confidence
                FROM objects_count 
                WHERE detection_id = ?
                GROUP BY object_name
                ORDER BY count DESC
            ''', (detection_id,))
            
            object_details = []
            for obj_row in cursor.fetchall():
                object_details.append({
                    'object_name': obj_row[0],
                    'count': obj_row[1],
                    'confidence': obj_row[2]
                })
            
            history.append({
                'id': row[0],
                'filename': row[1],
                'file_type': row[2],
                'total_objects': row[3],
                'confidence_avg': row[4],
                'processing_time': row[5],
                'timestamp': row[6],
                'object_details': object_details
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'history': history,
            'total_records': len(history)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Database error: {str(e)}'
        }), 500

@app.route('/api/statistics')
def get_statistics():
    """Get detection statistics"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Overall statistics
        cursor.execute('SELECT COUNT(*), AVG(total_objects), AVG(confidence_avg), AVG(processing_time) FROM detections')
        overall_stats = cursor.fetchone()
        
        # Top objects
        cursor.execute('''
            SELECT object_name, SUM(count) as total_count, AVG(confidence) as avg_confidence
            FROM objects_count 
            GROUP BY object_name 
            ORDER BY total_count DESC 
            LIMIT 10
        ''')
        top_objects = []
        for row in cursor.fetchall():
            top_objects.append({
                'object_name': row[0],
                'total_count': row[1],
                'avg_confidence': row[2]
            })
        
        # File type distribution
        cursor.execute('SELECT file_type, COUNT(*) FROM detections GROUP BY file_type')
        file_types = dict(cursor.fetchall())
        
        # Recent activity (last 24 hours)
        cursor.execute('''
            SELECT COUNT(*) FROM detections 
            WHERE datetime(timestamp) > datetime('now', '-1 day')
        ''')
        recent_activity = cursor.fetchone()[0]
        
        # Recent detections for timeline
        cursor.execute('''
            SELECT filename, file_type, total_objects, confidence_avg, timestamp
            FROM detections 
            ORDER BY timestamp DESC 
            LIMIT 10
        ''')
        recent_detections = []
        for row in cursor.fetchall():
            recent_detections.append({
                'filename': row[0],
                'file_type': row[1],
                'total_objects': row[2],
                'confidence_avg': row[3],
                'timestamp': row[4]
            })
        
        conn.close()
        
        print(f"📊 Statistics loaded: {overall_stats[0]} detections, {len(top_objects)} top objects, {len(recent_detections)} recent")
        
        # GPU/System information
        system_info = {
            'device': DEVICE,
            'device_name': torch.cuda.get_device_name(0) if DEVICE == 'cuda' else 'CPU',
            'gpu_available': torch.cuda.is_available(),
            'gpu_memory_total': f"{torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f}GB" if DEVICE == 'cuda' else 'N/A',
            'gpu_memory_allocated': f"{torch.cuda.memory_allocated() / 1024**3:.2f}GB" if DEVICE == 'cuda' else 'N/A',
            'ram_usage': f"{psutil.Process().memory_info().rss / 1024 / 1024:.1f}MB"
        }
        
        return jsonify({
            'success': True,
            'statistics': {
                'total_detections': overall_stats[0] or 0,
                'total_objects': sum([obj['total_count'] for obj in top_objects]) or 0,
                'avg_objects_per_file': round(overall_stats[1] or 0, 2),
                'avg_confidence': round(overall_stats[2] or 0, 2),
                'avg_processing_time': round(overall_stats[3] or 0, 2),
                'top_objects': top_objects,
                'file_type_distribution': file_types,
                'recent_activity_24h': recent_activity,
                'recent_detections': recent_detections,
                'system_info': system_info
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Statistics error: {str(e)}'
        }), 500

@app.route('/api/detection/<int:detection_id>')
def get_detection_detail(detection_id):
    """Get detailed information about a specific detection"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get detection details
        cursor.execute('''
            SELECT * FROM detections WHERE id = ?
        ''', (detection_id,))
        
        detection = cursor.fetchone()
        if not detection:
            return jsonify({
                'success': False,
                'error': 'Detection not found'
            }), 404
        
        # Get object counts for this detection
        cursor.execute('''
            SELECT object_name, count, confidence 
            FROM objects_count 
            WHERE detection_id = ?
            ORDER BY count DESC
        ''', (detection_id,))
        
        object_details = []
        for row in cursor.fetchall():
            object_details.append({
                'object_name': row[0],
                'count': row[1],
                'confidence': row[2]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'detection': {
                'id': detection[0],
                'filename': detection[1],
                'file_type': detection[2],
                'original_path': detection[3],
                'result_path': detection[4],
                'objects_detected': json.loads(detection[5]) if detection[5] else [],
                'total_objects': detection[6],
                'confidence_avg': detection[7],
                'processing_time': detection[8],
                'timestamp': detection[9],
                'object_details': object_details
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Database error: {str(e)}'
        }), 500

# Serve static files
@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

# ============================================================================
# ADVANCED FEATURES & EXTENSIONS
# ============================================================================

@app.route('/api/count_objects', methods=['POST'])
def count_objects_by_class():
    """Advanced API: Count objects by class in image/video"""
    try:
        file_type = request.form.get('type', 'image')  # 'image' or 'video'
        confidence_threshold = float(request.form.get('confidence', 0.5))
        
        if file_type == 'image':
            if 'image' not in request.files:
                return jsonify({'success': False, 'error': 'No image file'}), 400
            
            file = request.files['image']
            if not allowed_file(file.filename, 'image'):
                return jsonify({'success': False, 'error': 'Invalid image format'}), 400
            
            # Save and process
            filename = secure_filename(file.filename)
            unique_filename = generate_unique_filename(filename)
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(file_path)
            
            # Detect objects
            detected_objects, _, processing_time = detect_objects_in_image(file_path, confidence_threshold)
            
        elif file_type == 'video':
            if 'video' not in request.files:
                return jsonify({'success': False, 'error': 'No video file'}), 400
                
            file = request.files['video']
            if not allowed_file(file.filename, 'video'):
                return jsonify({'success': False, 'error': 'Invalid video format'}), 400
            
            # Save and process
            filename = secure_filename(file.filename)
            unique_filename = generate_unique_filename(filename)
            file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(file_path)
            
            # Detect objects in video
            detected_objects, _, processing_time, _ = detect_objects_in_video(file_path, confidence_threshold)
        
        else:
            return jsonify({'success': False, 'error': 'Invalid type parameter'}), 400
        
        # Count by class with detailed statistics
        class_counts = {}
        class_confidences = {}
        
        for obj in detected_objects:
            class_name = obj['class_name']
            confidence = obj['confidence']
            
            if class_name not in class_counts:
                class_counts[class_name] = 0
                class_confidences[class_name] = []
            
            class_counts[class_name] += 1
            class_confidences[class_name].append(confidence)
        
        # Calculate detailed statistics per class
        detailed_stats = {}
        for class_name in class_counts:
            confidences = class_confidences[class_name]
            detailed_stats[class_name] = {
                'count': class_counts[class_name],
                'avg_confidence': np.mean(confidences),
                'min_confidence': min(confidences),
                'max_confidence': max(confidences),
                'confidence_std': np.std(confidences)
            }
        
        # Sort by count (descending)
        sorted_stats = dict(sorted(detailed_stats.items(), 
                                 key=lambda x: x[1]['count'], reverse=True))
        
        return jsonify({
            'success': True,
            'file_type': file_type,
            'filename': unique_filename,
            'processing_time': processing_time,
            'confidence_threshold': confidence_threshold,
            'total_objects': len(detected_objects),
            'unique_classes': len(class_counts),
            'class_statistics': sorted_stats,
            'summary': {
                'top_3_classes': list(sorted_stats.keys())[:3],
                'most_confident_class': max(detailed_stats.items(), 
                                          key=lambda x: x[1]['avg_confidence'])[0] if detailed_stats else None,
                'rarest_class': min(detailed_stats.items(), 
                                  key=lambda x: x[1]['count'])[0] if detailed_stats else None
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Advanced counting error: {str(e)}'
        }), 500

@app.route('/api/batch_process', methods=['POST'])
def batch_process_files():
    """Advanced API: Process multiple files at once"""
    try:
        files = request.files.getlist('files')
        confidence_threshold = float(request.form.get('confidence', 0.5))
        
        if not files or len(files) == 0:
            return jsonify({'success': False, 'error': 'No files uploaded'}), 400
        
        results = []
        total_processing_time = 0
        
        for file in files:
            if file.filename == '':
                continue
                
            # Determine file type
            if any(file.filename.lower().endswith(ext) for ext in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']):
                file_type = 'image'
            elif any(file.filename.lower().endswith(ext) for ext in ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv']):
                file_type = 'video'
            else:
                results.append({
                    'filename': file.filename,
                    'success': False,
                    'error': 'Unsupported file format'
                })
                continue
            
            try:
                # Save file
                filename = secure_filename(file.filename)
                unique_filename = generate_unique_filename(filename)
                file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
                file.save(file_path)
                
                # Process based on type
                if file_type == 'image':
                    detected_objects, annotated_image, processing_time = detect_objects_in_image(
                        file_path, confidence_threshold
                    )
                    
                    # Save annotated image
                    result_path = None
                    if annotated_image is not None:
                        result_filename = f"result_{unique_filename}"
                        result_path = os.path.join(RESULTS_FOLDER, result_filename)
                        cv2.imwrite(result_path, annotated_image)
                
                else:  # video
                    detected_objects, result_path, processing_time, _ = detect_objects_in_video(
                        file_path, confidence_threshold
                    )
                
                # Save to database
                detection_id = save_detection_to_db(
                    unique_filename, file_type, file_path, result_path, 
                    detected_objects, processing_time
                )
                
                # Count objects
                object_counts = Counter([obj['class_name'] for obj in detected_objects])
                
                results.append({
                    'filename': filename,
                    'unique_filename': unique_filename,
                    'file_type': file_type,
                    'success': True,
                    'detection_id': detection_id,
                    'total_objects': len(detected_objects),
                    'object_counts': dict(object_counts),
                    'processing_time': processing_time
                })
                
                total_processing_time += processing_time
                
            except Exception as e:
                results.append({
                    'filename': file.filename,
                    'success': False,
                    'error': str(e)
                })
        
        # Calculate batch statistics
        successful_results = [r for r in results if r.get('success')]
        total_objects = sum(r.get('total_objects', 0) for r in successful_results)
        
        return jsonify({
            'success': True,
            'batch_summary': {
                'total_files': len(files),
                'processed_successfully': len(successful_results),
                'total_objects_detected': total_objects,
                'total_processing_time': total_processing_time,
                'average_processing_time': total_processing_time / len(successful_results) if successful_results else 0
            },
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Batch processing error: {str(e)}'
        }), 500

@app.route('/api/model_info')
def get_model_info():
    """Get YOLO model information and supported classes"""
    try:
        model_info = {
            'model_name': 'YOLOv11n',
            'model_path': YOLO_MODEL_PATH,
            'model_ready': yolo_model is not None,
            'supported_classes': COCO_CLASSES,
            'total_classes': len(COCO_CLASSES),
            'popular_classes': [
                'person', 'car', 'bicycle', 'dog', 'cat', 'bird', 
                'chair', 'bottle', 'laptop', 'cell phone'
            ],
            'confidence_range': [0.1, 1.0],
            'recommended_confidence': 0.5
        }
        
        return jsonify({
            'success': True,
            'model_info': model_info
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Model info error: {str(e)}'
        }), 500

@app.route('/api/clear_history', methods=['DELETE'])
def clear_history():
    """Clear all detection history and files"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Get all file paths before deletion
        cursor.execute('SELECT original_path, result_path FROM detections')
        file_paths = cursor.fetchall()
        
        # Clear database tables
        cursor.execute('DELETE FROM objects_count')
        cursor.execute('DELETE FROM detections')
        conn.commit()
        conn.close()
        
        # Remove files
        files_removed = 0
        for original_path, result_path in file_paths:
            try:
                if original_path and os.path.exists(original_path):
                    os.remove(original_path)
                    files_removed += 1
                if result_path and os.path.exists(result_path):
                    os.remove(result_path)
                    files_removed += 1
            except:
                pass  # Continue even if file removal fails
        
        return jsonify({
            'success': True,
            'message': f'Cleared all history and removed {files_removed} files'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Clear history error: {str(e)}'
        }), 500

@app.route('/api/debug_db')
def debug_database():
    """Debug database tables and data"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        
        # Check detection count
        cursor.execute("SELECT COUNT(*) FROM detections")
        detection_count = cursor.fetchone()[0]
        
        # Check objects_count
        cursor.execute("SELECT COUNT(*) FROM objects_count")
        objects_count = cursor.fetchone()[0]
        
        # Get sample data
        cursor.execute("SELECT id, filename, total_objects FROM detections LIMIT 5")
        sample_detections = cursor.fetchall()
        
        cursor.execute("SELECT detection_id, object_name, count FROM objects_count LIMIT 10")
        sample_objects = cursor.fetchall()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'tables': tables,
            'detection_count': detection_count,
            'objects_count': objects_count,
            'sample_detections': sample_detections,
            'sample_objects': sample_objects
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# VIDEO STREAMING REALTIME
# ============================================================================

import threading
from flask import Response
import base64

# Global variables for streaming
streaming_active = False
current_video_path = None
video_stats = {}
video_lock = threading.Lock()

def generate_video_frames(video_path, confidence_threshold=0.5):
    """Generator function to yield video frames with object detection"""
    global streaming_active, video_stats
    
    if yolo_model is None:
        return
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return
    
    # Initialize video stats without FPS dependency
    with video_lock:
        video_stats = {
            'total_frames': int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
            'current_frame': 0,
            'objects_detected': {},
            'total_objects': 0
        }
        streaming_active = True
    
    frame_count = 0
    skip_frames = 1  # Process every frame for maximum speed
    
    try:
        while streaming_active:
            ret, frame = cap.read()
            if not ret:
                # Loop the video
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                frame_count = 0
                continue
            
            frame_objects = []
            
            # GPU ULTRA SPEED frame processing
            if frame_count % skip_frames == 0:
                results = yolo_model(frame, conf=0.2, verbose=False, max_det=100, half=True, device=DEVICE)  # GPU POWER!
                
                # Process detection results
                for result in results:
                    boxes = result.boxes
                    if boxes is not None:
                        for box in boxes:
                            x1, y1, x2, y2 = box.xyxy[0].tolist()
                            confidence = float(box.conf[0])
                            class_id = int(box.cls[0])
                            
                            if confidence >= confidence_threshold:
                                class_name = COCO_CLASSES.get(class_id, f'class_{class_id}')
                                vietnamese_name = get_vietnamese_name(class_name)
                                emoji = get_object_emoji(class_name)
                                
                                frame_objects.append({
                                    'class_name': class_name,
                                    'vietnamese_name': vietnamese_name,
                                    'confidence': confidence,
                                    'bbox': [x1, y1, x2, y2]
                                })
                                
                                # Update statistics
                                with video_lock:
                                    if vietnamese_name not in video_stats['objects_detected']:
                                        video_stats['objects_detected'][vietnamese_name] = 0
                                    video_stats['objects_detected'][vietnamese_name] += 1
                                    video_stats['total_objects'] += 1
                                
                                # Draw bounding box
                                cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                                
                                # Draw label
                                label = f'{emoji} {vietnamese_name} ({confidence*100:.0f}%)'
                                label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                                
                                # Background for label
                                cv2.rectangle(frame, (int(x1), int(y1) - 30), 
                                            (int(x1) + label_size[0] + 10, int(y1)), 
                                            (0, 255, 0), -1)
                                
                                # Text label
                                cv2.putText(frame, label, (int(x1) + 5, int(y1) - 10),
                                          cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
            
            # Add frame info overlay
            info_text = f"Frame: {frame_count}/{video_stats['total_frames']} | Objects: {len(frame_objects)}"
            cv2.putText(frame, info_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(frame, info_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 1)
            
            # Update frame count
            with video_lock:
                video_stats['current_frame'] = frame_count
            
            # Encode frame as JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            if ret:
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            frame_count += 1
            
            # Add small delay to control frame rate
            time.sleep(0.033)  # ~30 FPS
    
    except Exception as e:
        print(f"Error in video streaming: {e}")
    finally:
        cap.release()
        with video_lock:
            streaming_active = False

@app.route('/start_video_stream', methods=['POST'])
def start_video_stream():
    """Start video streaming with object detection"""
    global current_video_path, streaming_active
    
    try:
        if 'video' not in request.files:
            return jsonify({'success': False, 'message': 'No video file provided'}), 400
        
        video_file = request.files['video']
        if video_file.filename == '':
            return jsonify({'success': False, 'message': 'No video selected'}), 400
        
        if not allowed_file(video_file.filename, 'video'):
            return jsonify({'success': False, 'message': 'Invalid video format'}), 400
        
        # Get confidence threshold
        confidence = float(request.form.get('confidence', 0.3))
        
        # Save uploaded video
        filename = secure_filename(video_file.filename)
        unique_filename = generate_unique_filename(filename)
        video_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        video_file.save(video_path)
        
        # Stop any existing stream
        streaming_active = False
        time.sleep(0.1)  # Give time to stop
        
        # Set new video path
        current_video_path = video_path
        
        return jsonify({
            'success': True,
            'message': 'Video streaming started',
            'video_id': unique_filename
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/video_stream')
def video_stream():
    """Video streaming route"""
    global current_video_path
    
    if not current_video_path or not os.path.exists(current_video_path):
        return "No video available", 404
    
    confidence = float(request.args.get('confidence', 0.3))
    
    return Response(
        generate_video_frames(current_video_path, confidence),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

@app.route('/stop_video_stream', methods=['POST'])
def stop_video_stream():
    """Stop video streaming"""
    global streaming_active
    
    streaming_active = False
    
    return jsonify({
        'success': True,
        'message': 'Video streaming stopped'
    })

@app.route('/video_stats')
def get_video_stats():
    """Get current video streaming statistics"""
    global video_stats
    
    with video_lock:
        stats_copy = video_stats.copy()
    
    # Sort objects by detection count
    if 'objects_detected' in stats_copy:
        sorted_objects = sorted(stats_copy['objects_detected'].items(), 
                              key=lambda x: x[1], reverse=True)
        stats_copy['top_objects'] = sorted_objects[:10]
    
    return jsonify(stats_copy)

# ============================================================================
# DEBUG & ERROR HANDLING ROUTES
# ============================================================================

@app.route('/api/debug/check_system')
def debug_check_system():
    """Debug route to check system status"""
    try:
        system_info = {
            'yolo_model_loaded': yolo_model is not None,
            'database_accessible': True,
            'directories_exist': {
                'uploads': os.path.exists(UPLOAD_FOLDER),
                'results': os.path.exists(RESULTS_FOLDER),
                'static': os.path.exists('static'),
                'templates': os.path.exists('templates')
            },
            'streaming_status': {
                'active': streaming_active,
                'current_video': current_video_path is not None,
                'stats_available': bool(video_stats)
            },
            'server_time': datetime.now().isoformat(),
            'model_path': YOLO_MODEL_PATH,
            'supported_image_formats': list(ALLOWED_IMAGE_EXTENSIONS),
            'supported_video_formats': list(ALLOWED_VIDEO_EXTENSIONS)
        }
        
        # Test database connection
        try:
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM detections")
            detection_count = cursor.fetchone()[0]
            system_info['database_records'] = detection_count
            conn.close()
        except Exception as e:
            system_info['database_accessible'] = False
            system_info['database_error'] = str(e)
        
        return jsonify({
            'success': True,
            'system_info': system_info
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/debug/test_upload', methods=['POST'])
def debug_test_upload():
    """Debug route to test file upload functionality"""
    try:
        debug_info = {
            'request_method': request.method,
            'content_type': request.content_type,
            'files_in_request': list(request.files.keys()),
            'form_data': dict(request.form),
            'file_details': {}
        }
        
        for key in request.files:
            file = request.files[key]
            debug_info['file_details'][key] = {
                'filename': file.filename,
                'content_type': file.content_type,
                'size_bytes': len(file.read()) if file.filename else 0
            }
            # Reset file pointer
            file.seek(0)
        
        return jsonify({
            'success': True,
            'debug_info': debug_info
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/debug/frontend_errors', methods=['POST'])
def log_frontend_error():
    """Endpoint to receive and log frontend JavaScript errors"""
    try:
        error_data = request.get_json()
        
        print("🐛 FRONTEND ERROR RECEIVED:")
        print("=" * 50)
        print(f"📄 Message: {error_data.get('message', 'No message')}")
        print(f"📍 Source: {error_data.get('source', 'Unknown')}")
        print(f"📊 Line: {error_data.get('lineno', 'Unknown')}")
        print(f"📊 Column: {error_data.get('colno', 'Unknown')}")
        print(f"🔍 Stack: {error_data.get('stack', 'No stack trace')}")
        print(f"🌐 URL: {error_data.get('url', 'Unknown')}")
        print(f"⏰ Time: {datetime.now().isoformat()}")
        print("=" * 50)
        
        # Optional: Save to database or log file
        return jsonify({
            'success': True,
            'message': 'Error logged successfully'
        })
        
    except Exception as e:
        print(f"❌ Error logging frontend error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/debug/console_log', methods=['POST'])
def log_console_message():
    """Endpoint to receive console.log messages from frontend"""
    try:
        log_data = request.get_json()
        
        level = log_data.get('level', 'info')
        message = log_data.get('message', '')
        data = log_data.get('data', {})
        
        prefix = {
            'info': '💡',
            'warn': '⚠️', 
            'error': '❌',
            'debug': '🔧'
        }.get(level, '📝')
        
        print(f"{prefix} FRONTEND {level.upper()}: {message}")
        if data:
            print(f"    Data: {json.dumps(data, indent=2)}")
        
        return jsonify({
            'success': True,
            'message': 'Log received'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# MEMORY MANAGEMENT API
# ============================================================================

@app.route('/api/cleanup', methods=['POST'])
def manual_cleanup():
    """Manual cleanup endpoint to free up resources"""
    try:
        initial_memory = psutil.Process().memory_info().rss / 1024 / 1024
        
        # Perform cleanup
        cleanup_memory()
        
        final_memory = psutil.Process().memory_info().rss / 1024 / 1024
        memory_saved = initial_memory - final_memory
        
        return jsonify({
            'success': True,
            'message': 'Cleanup completed successfully',
            'memory_saved_mb': round(memory_saved, 2),
            'current_memory_mb': round(final_memory, 2)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Cleanup error: {str(e)}'
        }), 500

# ============================================================================
# MAIN APPLICATION
# ============================================================================
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# FLASK APP STARTUP
# ============================================================================

if __name__ == '__main__':
    print("🚀 YOLO Object Detection Flask API - UPDATED")
    print("=" * 50)
    print("📦 Model Status:", "✅ Ready" if yolo_model else "❌ Failed")
    print("💾 Database:", "✅ Initialized")
    print("📁 Upload folder:", UPLOAD_FOLDER)
    print("📁 Results folder:", RESULTS_FOLDER)
    
    # Perform initial cleanup
    print("🧹 Performing initial cleanup...")
    cleanup_memory()
    
    print("🌐 Starting server on http://localhost:5000")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)


