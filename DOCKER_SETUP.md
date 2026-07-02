# Docker Setup Guide

This project is containerized using Docker and Docker Compose. Follow these steps to run the project on any machine.

## Prerequisites

- Docker Desktop installed (or Docker Engine + Docker Compose)
- At least 4GB of RAM available
- Ports 3000, 5000, 8001, 8002, 8003, and 27017 available

## Quick Start

1. **Clone/Navigate to the project directory**
   ```bash
   cd new_project_satyabama
   ```

2. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

   Or run in detached mode:
   ```bash
   docker-compose up -d --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Crop Recommendation Service: http://localhost:8001
   - Fertilizer Recommendation Service: http://localhost:8002
   - Disease Detection Service: http://localhost:8003

## Services

The project consists of the following services:

- **mongodb**: MongoDB database (port 27017)
- **backend**: Node.js backend API (port 5000)
- **frontend**: React frontend (port 3000)
- **crop_reco**: Python ML service for crop recommendation (port 8001)
- **fertilizer_reco**: Python ML service for fertilizer recommendation (port 8002)
- **disease_detector**: Python ML service for disease detection (port 8003)

## Python Version

All Python ML services use **Python 3.9.18** for consistency and compatibility with TensorFlow and other dependencies.

## Useful Commands

### Stop all services
```bash
docker-compose down
```

### Stop and remove volumes (clears database)
```bash
docker-compose down -v
```

### View logs
```bash
docker-compose logs -f
```

### View logs for a specific service
```bash
docker-compose logs -f backend
docker-compose logs -f disease_detector
```

### Rebuild a specific service
```bash
docker-compose build disease_detector
docker-compose up -d disease_detector
```

### Execute commands in a container
```bash
docker-compose exec backend npm install
docker-compose exec disease_detector python train_disease_model.py
```

## Troubleshooting

### Port already in use
If you get port conflicts, you can modify the port mappings in `docker-compose.yml`.

### Build fails
- Ensure Docker has enough resources allocated (Settings > Resources)
- Try rebuilding without cache: `docker-compose build --no-cache`

### Services not connecting
- Check that all services are running: `docker-compose ps`
- Verify network connectivity: `docker network ls`

### Python dependencies issues
- The Dockerfiles automatically install all required packages
- If you need to add new packages, update the respective `requirements.txt` and rebuild

## Environment Variables

You can create a `.env` file in the project root to set environment variables:

```env
JWT_SECRET=your_secret_key_here
MONGO_URI=mongodb://mongodb:27017/farmer_assistant
```

## Notes

- Data is persisted in Docker volumes (MongoDB data survives container restarts)
- Code changes in mounted volumes are reflected immediately (development mode)
- For production, remove volume mounts and copy code into images

