# Quick Start Guide

## 🚀 Local Development Setup

### Prerequisites
- Docker and Docker Compose installed
- AWS account with S3 access
- AWS CLI configured

### Steps

1. **Clone and setup environment**:
   ```bash
   git clone <your-repo-url>
   cd VideoProcessingSystem
   cp .env.example .env
   ```

2. **Configure your .env file**:
   Edit `.env` and set your S3 bucket name:
   ```env
   S3_BUCKET=your-unique-s3-bucket-name
   ```

3. **Start the services**:
   ```bash
   docker-compose up --build -d
   ```

4. **Verify services are running**:
   ```bash
   docker-compose ps
   ```

5. **Test the API**:
   ```bash
   # Create a test video file
   echo "dummy video content" > test.mp4
   
   # Upload it
   curl -X POST -F "file=@test.mp4" http://localhost:5001/upload
   ```

6. **Access the dashboards**:
   - API: http://localhost:5001
   - RabbitMQ: http://localhost:15672 (guest/guest)
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3000 (admin/admin)

## ☁️ AWS Deployment

1. **Provision infrastructure**:
   ```bash
   ./scripts/provision_infra.sh
   ```

2. **SSH to your EC2 instance**:
   ```bash
   ssh -i ~/.ssh/your-key.pem ec2-user@<your-ec2-ip>
   ```

3. **Clone and deploy**:
   ```bash
   git clone <your-repo-url>
   cd VideoProcessingSystem
   ./scripts/deploy.sh
   ```

## 🔧 Troubleshooting

- **Services not starting**: Check logs with `docker-compose logs -f [service-name]`
- **S3 access issues**: Verify AWS credentials and bucket permissions
- **RabbitMQ connection failed**: Wait a few more seconds for RabbitMQ to fully start
- **Worker not processing**: Check RabbitMQ management UI for queue status

## 📊 Monitoring

The system includes comprehensive monitoring:
- **Prometheus**: Collects metrics from all services
- **Grafana**: Visualizes metrics with dashboards
- **RabbitMQ Management**: Queue monitoring and management

Key metrics to watch:
- Upload success/failure rates
- Processing time percentiles
- Queue depth and message rates
- System resource usage
