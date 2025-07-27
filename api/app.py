import os
import json
import time
import uuid
from datetime import datetime
from flask import Flask, request, jsonify
import boto3
import pika
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from werkzeug.utils import secure_filename
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
app.config['UPLOAD_FOLDER'] = '/app/uploads'

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Environment variables
S3_BUCKET = os.getenv('S3_BUCKET', 'video-processing-bucket')
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
RABBITMQ_PORT = int(os.getenv('RABBITMQ_PORT', '5672'))
AWS_REGION = os.getenv('AWS_DEFAULT_REGION', 'us-east-1')

# Initialize AWS S3 client
try:
    s3_client = boto3.client('s3', region_name=AWS_REGION)
    logger.info(f"Initialized S3 client for bucket: {S3_BUCKET}")
except Exception as e:
    logger.error(f"Failed to initialize S3 client: {e}")
    s3_client = None

# Prometheus metrics
upload_counter = Counter('api_uploads_total', 'Total number of video uploads')
upload_failures = Counter('api_upload_failures_total', 'Total number of failed uploads')
upload_duration = Histogram('api_upload_duration_seconds', 'Upload processing time')
queue_publish_counter = Counter('api_queue_messages_total', 'Total messages published to queue')
queue_publish_failures = Counter('api_queue_publish_failures_total', 'Failed queue message publishes')

def get_rabbitmq_connection():
    """Establish connection to RabbitMQ with retry logic"""
    max_retries = 5
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(
                    host=RABBITMQ_HOST,
                    port=RABBITMQ_PORT,
                    heartbeat=600,
                    blocked_connection_timeout=300
                )
            )
            logger.info("Successfully connected to RabbitMQ")
            return connection
        except Exception as e:
            logger.warning(f"RabbitMQ connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                retry_delay *= 2
            else:
                logger.error("Failed to connect to RabbitMQ after all retries")
                raise

def publish_to_queue(message):
    """Publish message to RabbitMQ queue"""
    try:
        connection = get_rabbitmq_connection()
        channel = connection.channel()
        
        # Declare queue (idempotent)
        channel.queue_declare(queue='video_processing', durable=True)
        
        # Publish message
        channel.basic_publish(
            exchange='',
            routing_key='video_processing',
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Make message persistent
            )
        )
        
        connection.close()
        queue_publish_counter.inc()
        logger.info(f"Published message to queue: {message['job_id']}")
        return True
        
    except Exception as e:
        queue_publish_failures.inc()
        logger.error(f"Failed to publish to queue: {e}")
        return False

def upload_to_s3(file, filename):
    """Upload file to S3 bucket"""
    if not s3_client:
        raise Exception("S3 client not initialized")
    
    try:
        s3_key = f"videos/{filename}"
        s3_client.upload_fileobj(
            file,
            S3_BUCKET,
            s3_key,
            ExtraArgs={'ContentType': 'video/mp4'}
        )
        logger.info(f"Uploaded file to S3: {s3_key}")
        return s3_key
    except Exception as e:
        logger.error(f"Failed to upload to S3: {e}")
        raise

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test S3 connection
        if s3_client:
            s3_client.list_objects_v2(Bucket=S3_BUCKET, MaxKeys=1)
        
        # Test RabbitMQ connection
        connection = get_rabbitmq_connection()
        connection.close()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            's3_bucket': S3_BUCKET,
            'rabbitmq_host': RABBITMQ_HOST
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 503

@app.route('/upload', methods=['POST'])
def upload_video():
    """Upload video endpoint"""
    start_time = time.time()
    
    try:
        # Check if file is in request
        if 'file' not in request.files:
            upload_failures.inc()
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            upload_failures.inc()
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type (basic check)
        allowed_extensions = {'.mp4', '.avi', '.mov', '.mkv'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            upload_failures.inc()
            return jsonify({'error': f'Unsupported file type. Allowed: {allowed_extensions}'}), 400
        
        # Generate unique filename
        job_id = str(uuid.uuid4())
        safe_filename = secure_filename(file.filename)
        unique_filename = f"{job_id}_{safe_filename}"
        
        # Upload to S3
        try:
            s3_key = upload_to_s3(file, unique_filename)
        except Exception as e:
            upload_failures.inc()
            return jsonify({'error': f'Failed to upload to S3: {str(e)}'}), 500
        
        # Create job message
        job_message = {
            'job_id': job_id,
            'original_filename': safe_filename,
            's3_bucket': S3_BUCKET,
            's3_key': s3_key,
            'timestamp': datetime.utcnow().isoformat(),
            'file_size': request.content_length or 0
        }
        
        # Publish to queue
        if not publish_to_queue(job_message):
            upload_failures.inc()
            return jsonify({'error': 'Failed to queue processing job'}), 500
        
        # Record metrics
        upload_counter.inc()
        upload_duration.observe(time.time() - start_time)
        
        return jsonify({
            'status': 'success',
            'message': 'Video uploaded successfully',
            'job_id': job_id,
            'filename': safe_filename,
            's3_key': s3_key
        }), 200
        
    except Exception as e:
        upload_failures.inc()
        logger.error(f"Upload error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/status/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Get job status (placeholder - in real implementation, this would query a database)"""
    return jsonify({
        'job_id': job_id,
        'status': 'processing',
        'message': 'Job status tracking not implemented yet'
    }), 200

@app.route('/metrics', methods=['GET'])
def metrics():
    """Prometheus metrics endpoint"""
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with API information"""
    return jsonify({
        'service': 'Video Processing API Gateway',
        'version': '1.0.0',
        'endpoints': {
            'upload': 'POST /upload',
            'health': 'GET /health',
            'metrics': 'GET /metrics',
            'status': 'GET /status/<job_id>'
        },
        'timestamp': datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    logger.info("Starting Video Processing API Gateway...")
    logger.info(f"S3 Bucket: {S3_BUCKET}")
    logger.info(f"RabbitMQ Host: {RABBITMQ_HOST}:{RABBITMQ_PORT}")
    
    # Run with Gunicorn in production, Flask dev server locally
    if os.getenv('FLASK_ENV') == 'production':
        # This won't be reached when using Gunicorn, but good for reference
        app.run(host='0.0.0.0', port=5000, debug=False)
    else:
        app.run(host='0.0.0.0', port=5000, debug=True)
