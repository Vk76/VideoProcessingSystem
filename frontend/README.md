# Video Processing Frontend

A modern, responsive React application for the Video Processing System. This frontend provides a sleek interface for uploading videos, monitoring processing status, downloading processed videos, and viewing thumbnails.

## Features

- **Modern UI**: Clean, responsive design with smooth animations
- **Drag & Drop Upload**: Easy video file uploading with progress tracking
- **Real-time Status**: Monitor video processing status in real-time
- **Download Management**: Download processed videos with one click
- **Thumbnail Preview**: View video thumbnails once processing is complete
- **Statistics Dashboard**: Overview of processing jobs and system metrics
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices

## Technology Stack

- **React 18**: Modern React with hooks and functional components
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Axios**: HTTP client for API communication
- **React Dropzone**: Drag and drop file upload functionality
- **Lucide React**: Beautiful, customizable icons
- **Nginx**: Production web server with optimized configuration

## Quick Start

### Development Mode

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

### Production Build

1. Build the application:
```bash
npm run build
```

2. Serve the built application with a web server like nginx or serve.

## Docker Deployment

The frontend is containerized with Docker for easy deployment:

```bash
# Build the Docker image
docker build -t video-frontend .

# Run the container
docker run -p 3001:80 -e REACT_APP_API_URL=http://localhost:5001 video-frontend
```

## Environment Variables

- `REACT_APP_API_URL`: Backend API URL (default: `http://localhost:5001`)

## API Integration

The frontend communicates with the backend API through the following endpoints:

- `POST /upload`: Upload video files
- `GET /jobs`: List all processing jobs
- `GET /status/{job_id}`: Get job status
- `GET /download/{job_id}`: Download processed video
- `GET /thumbnail/{job_id}`: Get video thumbnail
- `GET /health`: API health check

## Components

### VideoUpload
- Drag and drop interface for file uploads
- File validation (type, size)
- Upload progress tracking
- Success/error feedback

### VideoList
- Display all processing jobs
- Status indicators with icons
- Download and thumbnail actions
- Responsive grid layout

### Stats
- System overview dashboard
- Job statistics
- File size metrics
- Visual indicators

### Header
- Application branding
- System information
- Responsive navigation

## Styling

The application uses Tailwind CSS with a custom design system:

- **Primary Colors**: Blue tones for main actions
- **Secondary Colors**: Gray tones for content
- **Animations**: Smooth transitions and micro-interactions
- **Typography**: Clear hierarchy and readability
- **Spacing**: Consistent spacing system

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimization

- Code splitting with React.lazy
- Image optimization
- Gzip compression
- Static asset caching
- Bundle size optimization

## Development

### Project Structure

```
src/
├── components/          # React components
│   ├── Header.js       # Application header
│   ├── Stats.js        # Statistics dashboard
│   ├── VideoUpload.js  # Upload interface
│   └── VideoList.js    # Job listing
├── services/           # API services
│   └── videoService.js # Video API client
├── App.js             # Main application component
├── index.js           # Application entry point
└── index.css          # Global styles
```

### Available Scripts

- `npm start`: Start development server
- `npm run build`: Build for production
- `npm test`: Run test suite
- `npm run eject`: Eject from Create React App

## Production Deployment

The application is deployed using a multi-stage Docker build:

1. **Build Stage**: Compiles React application
2. **Production Stage**: Serves with optimized Nginx configuration

### Nginx Configuration

- Gzip compression enabled
- Static asset caching
- Security headers
- API proxying
- React Router support

## Contributing

1. Follow React best practices
2. Use functional components with hooks
3. Maintain responsive design
4. Add proper error handling
5. Write clear, documented code
