import os
import json
import time
import subprocess
import threading
from datetime import datetime
import boto3
import pika
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import logging
import tempfile
import shutil

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
S3_BUCKET = os.getenv('S3_BUCKET', 'video-processing-bucket')
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
RABBITMQ_PORT = int(os.getenv('RABBITMQ_PORT', '5672'))
AWS_REGION = os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
TEMP_DIR = '/app/temp'

# Ensure temp directory exists
os.makedirs(TEMP_DIR, exist_ok=True)

# Initialize AWS S3 client
try:
    s3_client = boto3.client('s3', region_name=AWS_REGION)
    logger.info(f"Initialized S3 client for bucket: {S3_BUCKET}")
except Exception as e:
    logger.error(f"Failed to initialize S3 client: {e}")
    s3_client = None

# Prometheus metrics
jobs_processed = Counter('worker_jobs_processed_total', 'Total number of jobs processed')
jobs_failed = Counter('worker_jobs_failed_total', 'Total number of failed jobs')
processing_time = Histogram('worker_processing_time_seconds', 'Job processing time')
active_jobs = Gauge('worker_active_jobs', 'Number of currently active jobs')
queue_size = Gauge('worker_queue_size', 'Number of messages in queue')

class VideoProcessor:
    def __init__(self):
        self.processing_jobs = 0
    
    def process_video(self, job_data):
        """Process a video file"""
        job_id = job_data['job_id']
        s3_key = job_data['s3_key']
        original_filename = job_data['original_filename']
        
        start_time = time.time()
        temp_input_path = None
        temp_output_path = None
        
        try:
            logger.info(f"Starting job {job_id}: {original_filename}")
            active_jobs.inc()
            self.processing_jobs += 1
            
            # Create temporary file paths
            temp_input_path = os.path.join(TEMP_DIR, f"{job_id}_input.mp4")
            temp_output_path = os.path.join(TEMP_DIR, f"{job_id}_output.mp4")
            
            # Download video from S3
            logger.info(f"Downloading {s3_key} from S3...")
            s3_client.download_file(S3_BUCKET, s3_key, temp_input_path)
            
            # Get video information
            video_info = self.get_video_info(temp_input_path)
            logger.info(f"Video info: {video_info}")
            
            # Process video (example: create a lower resolution version)
            self.transcode_video(temp_input_path, temp_output_path)
            
            # Upload processed video back to S3
            output_s3_key = s3_key.replace('videos/', 'processed/')
            logger.info(f"Uploading processed video to {output_s3_key}...")
            s3_client.upload_file(temp_output_path, S3_BUCKET, output_s3_key)
            
            # Generate thumbnail
            thumbnail_path = self.generate_thumbnail(temp_input_path, job_id)
            if thumbnail_path:
                thumbnail_s3_key = s3_key.replace('videos/', 'thumbnails/').replace('.mp4', '.jpg')
                s3_client.upload_file(thumbnail_path, S3_BUCKET, thumbnail_s3_key)
                logger.info(f"Uploaded thumbnail to {thumbnail_s3_key}")
            
            # Record success metrics
            processing_duration = time.time() - start_time
            processing_time.observe(processing_duration)
            jobs_processed.inc()
            
            logger.info(f"Job {job_id} completed successfully in {processing_duration:.2f}s")
            
            # In a real system, you would update a database with job status here
            self.update_job_status(job_id, 'completed', {
                'original_s3_key': s3_key,
                'processed_s3_key': output_s3_key,
                'thumbnail_s3_key': thumbnail_s3_key if thumbnail_path else None,
                'processing_duration': processing_duration,
                'video_info': video_info
            })
            
        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")
            jobs_failed.inc()
            self.update_job_status(job_id, 'failed', {'error': str(e)})
            
        finally:
            # Cleanup temporary files
            for temp_file in [temp_input_path, temp_output_path]:
                if temp_file and os.path.exists(temp_file):
                    os.remove(temp_file)
            
            active_jobs.dec()
            self.processing_jobs -= 1
    
    def get_video_info(self, video_path):
        """Get video metadata using FFprobe"""
        try:
            cmd = [
                'ffprobe', '-v', 'quiet', '-print_format', 'json',
                '-show_format', '-show_streams', video_path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return json.loads(result.stdout)
        except Exception as e:
            logger.warning(f"Failed to get video info: {e}")
            return {}
    
    def transcode_video(self, input_path, output_path):
        """Transcode video to a lower resolution"""
        try:
            # Example: Convert to 720p with H.264
            cmd = [
                'ffmpeg', '-i', input_path,
                '-vf', 'scale=1280:720',
                '-c:v', 'libx264',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-y',  # Overwrite output file if it exists
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            logger.info("Video transcoding completed successfully")
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg error: {e.stderr}")
            raise Exception(f"Video transcoding failed: {e.stderr}")
    
    def generate_thumbnail(self, video_path, job_id):
        """Generate a thumbnail from the video"""
        try:
            thumbnail_path = os.path.join(TEMP_DIR, f"{job_id}_thumb.jpg")
            cmd = [
                'ffmpeg', '-i', video_path,
                '-ss', '00:00:01.000',  # Take frame at 1 second
                '-vframes', '1',
                '-y',
                thumbnail_path
            ]
            
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            logger.info("Thumbnail generated successfully")
            return thumbnail_path
            
        except Exception as e:
            logger.warning(f"Failed to generate thumbnail: {e}")
            return None
    
    def update_job_status(self, job_id, status, metadata=None):
        """Update job status (placeholder - in real implementation, this would update a database)"""
        logger.info(f"Job {job_id} status: {status}")
        if metadata:
            logger.info(f"Job {job_id} metadata: {json.dumps(metadata, indent=2)}")

class RabbitMQConsumer:
    def __init__(self, processor):
        self.processor = processor
        self.connection = None
        self.channel = None
    
    def connect(self):
        """Connect to RabbitMQ"""
        max_retries = 5
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                self.connection = pika.BlockingConnection(
                    pika.ConnectionParameters(
                        host=RABBITMQ_HOST,
                        port=RABBITMQ_PORT,
                        heartbeat=600,
                        blocked_connection_timeout=300
                    )
                )
                self.channel = self.connection.channel()
                self.channel.queue_declare(queue='video_processing', durable=True)
                
                # Set QoS to process one message at a time
                self.channel.basic_qos(prefetch_count=1)
                
                logger.info("Successfully connected to RabbitMQ")
                return True
                
            except Exception as e:
                logger.warning(f"RabbitMQ connection attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    logger.error("Failed to connect to RabbitMQ after all retries")
                    return False
    
    def callback(self, ch, method, properties, body):
        """Process incoming messages"""
        try:
            job_data = json.loads(body)
            logger.info(f"Received job: {job_data['job_id']}")
            
            # Process the video
            self.processor.process_video(job_data)
            
            # Acknowledge the message
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        except Exception as e:
            logger.error(f"Failed to process message: {e}")
            # Reject and don't requeue to avoid infinite loops
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    
    def start_consuming(self):
        """Start consuming messages"""
        if not self.connect():
            raise Exception("Could not connect to RabbitMQ")
        
        self.channel.basic_consume(
            queue='video_processing',
            on_message_callback=self.callback
        )
        
        logger.info("Worker started. Waiting for messages...")
        try:
            self.channel.start_consuming()
        except KeyboardInterrupt:
            logger.info("Stopping worker...")
            self.channel.stop_consuming()
            self.connection.close()

def start_metrics_server():
    """Start Prometheus metrics server"""
    start_http_server(8080)
    logger.info("Metrics server started on port 8080")

def health_check_server():
    """Simple health check endpoint"""
    from http.server import HTTPServer, BaseHTTPRequestHandler
    import json
    
    class HealthHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/health':
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                health_data = {
                    'status': 'healthy',
                    'active_jobs': processor.processing_jobs,
                    'timestamp': datetime.utcnow().isoformat()
                }
                self.wfile.write(json.dumps(health_data).encode())
            else:
                self.send_response(404)
                self.end_headers()
        
        def log_message(self, format, *args):
            # Suppress default HTTP server logs
            pass
    
    server = HTTPServer(('0.0.0.0', 8081), HealthHandler)
    server.serve_forever()

if __name__ == '__main__':
    logger.info("Starting Video Processing Worker...")
    logger.info(f"S3 Bucket: {S3_BUCKET}")
    logger.info(f"RabbitMQ Host: {RABBITMQ_HOST}:{RABBITMQ_PORT}")
    
    # Initialize processor
    processor = VideoProcessor()
    
    # Start metrics server in a separate thread
    metrics_thread = threading.Thread(target=start_metrics_server, daemon=True)
    metrics_thread.start()
    
    # Start health check server in a separate thread
    health_thread = threading.Thread(target=health_check_server, daemon=True)
    health_thread.start()
    
    # Start consuming messages
    consumer = RabbitMQConsumer(processor)
    try:
        consumer.start_consuming()
    except Exception as e:
        logger.error(f"Worker failed: {e}")
        exit(1)
