# Video Processing System - Complete Setup Guide

This guide will help you set up the complete Video Processing System with a modern web frontend.

## 🎯 What You'll Get

- **Modern Web Interface**: React-based UI for uploading and managing videos
- **Video Processing Pipeline**: Automatic video processing with status tracking
- **Download & Thumbnails**: Easy access to processed videos and thumbnails
- **Monitoring Dashboard**: Real-time metrics and system health monitoring
- **Scalable Architecture**: Containerized microservices ready for production

## 📋 Prerequisites

### Required Software
- **Docker Desktop** (latest version)
- **Git** (for cloning the repository)
- **AWS Account** (for S3 storage)

### Optional (for development)
- **Node.js 16+** (for frontend development)
- **Python 3.9+** (for API development)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/VideoProcessingSystem.git
cd VideoProcessingSystem
```

### 2. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your AWS credentials
nano .env  # or use your preferred editor
```

Required environment variables:
```bash
S3_BUCKET=your-video-processing-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=us-east-1
REACT_APP_API_URL=http://localhost:5001
```

### 3. Start the System
```bash
# Use the existing deployment script
./scripts/deploy.sh
```

### 4. Access the Application
Open your browser and navigate to:
- **Web Interface**: http://localhost:3001
- **API Documentation**: http://localhost:5001
- **Monitoring Dashboard**: http://localhost:3000 (admin/admin)

## 🎨 Frontend Features

### Upload Interface
- **Drag & Drop**: Intuitive file upload with progress tracking
- **File Validation**: Automatic validation of video formats and sizes
- **Real-time Feedback**: Instant success/error notifications

### Job Management
- **Status Tracking**: Real-time processing status updates
- **Download Center**: One-click download of processed videos
- **Thumbnail Preview**: Quick preview of video thumbnails
- **Job History**: Complete history of all processing jobs

### Dashboard
- **System Metrics**: Overview of processing statistics
- **Performance Indicators**: Real-time system health monitoring
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🛠️ Development Setup

### Frontend Development
```bash
cd frontend
chmod +x dev-setup.sh
./dev-setup.sh
```

This will:
- Install all Node.js dependencies
- Start the development server with hot reload
- Proxy API calls to the backend
- Open http://localhost:3000 in your browser

### Backend Development
```bash
# Start only the backend services
docker-compose up -d api rabbitmq

# The API will be available at http://localhost:5001
```

## 📁 Project Structure

```
VideoProcessingSystem/
├── frontend/                 # React web application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API client services
│   │   └── App.js          # Main application
│   ├── public/             # Static assets
│   ├── Dockerfile          # Frontend container
│   └── nginx.conf          # Production web server config
├── api/                    # Flask API gateway
│   ├── app.py             # Main API application
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile         # API container
├── worker/                # Video processing worker
├── prometheus/            # Monitoring configuration
├── docker-compose.yml     # Service orchestration
├── scripts/
│   └── deploy.sh          # Deployment script
└── .env.example          # Environment template
```

## 🔧 API Endpoints

The system provides the following REST API endpoints:

### Upload & Management
- `POST /upload` - Upload video for processing
- `GET /jobs` - List all processing jobs
- `GET /status/{job_id}` - Get job status

### Download & Media
- `GET /download/{job_id}` - Download processed video
- `GET /thumbnail/{job_id}` - Get video thumbnail

### System
- `GET /health` - API health check
- `GET /metrics` - Prometheus metrics

## 🎛️ Configuration Options

### Frontend Configuration
Set these in your `.env` file:
- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:5001)

### API Configuration
- `S3_BUCKET`: AWS S3 bucket for video storage
- `RABBITMQ_HOST`: Message queue hostname
- `AWS_*`: AWS credentials and region

### Production Deployment
For production deployment:
1. Use environment-specific `.env` files
2. Configure SSL/TLS certificates
3. Set up load balancing
4. Configure monitoring alerts

## 🔍 Monitoring & Observability

### Built-in Monitoring
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visual dashboards and analytics
- **Application Metrics**: Custom business metrics
- **Infrastructure Metrics**: System resource monitoring

### Key Metrics
- Upload success/failure rates
- Processing times and queue depth
- System resource utilization
- Error rates and response times

## 🐛 Troubleshooting

### Common Issues

#### Docker Build Fails
```bash
# Clean Docker cache and rebuild
docker system prune -a
docker-compose build --no-cache
```

#### Frontend Not Loading
1. Check if the API is running: `curl http://localhost:5001/health`
2. Verify environment variables in `.env`
3. Check browser console for errors

#### Upload Fails
1. Verify AWS credentials and S3 bucket access
2. Check file size (max 100MB)
3. Ensure supported video format (MP4, AVI, MOV)

#### Services Won't Start
```bash
# Check service logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]
```

### Logs and Debugging
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend
docker-compose logs -f api
docker-compose logs -f worker
```

## 🚢 Deployment Options

### Local Development
Use the provided scripts for quick local setup and development.

### Docker Swarm
Deploy to Docker Swarm for production scaling:
```bash
docker stack deploy -c docker-compose.yml video-processing
```

### Kubernetes
Convert to Kubernetes manifests for cloud deployment:
```bash
# Use kompose or write custom manifests
kompose convert
```

### AWS ECS/Fargate
Deploy as containerized services on AWS for production use.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review the project documentation

---

**Ready to process some videos? Run `./scripts/deploy.sh` and visit http://localhost:3001 to get started!** 🎬
