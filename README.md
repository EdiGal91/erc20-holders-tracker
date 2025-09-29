# 🔗 ERC20 Tracker

A comprehensive real-time ERC20 token tracking system built with modern microservices architecture. Monitor token transfers, manage blockchain networks, and track wallet balances across multiple chains.

## 🏗️ Architecture

This project consists of 5 microservices working together to provide a complete ERC20 tracking solution:

### 🎛️ **Admin Panel** (`apps/admin`)

- **Tech Stack**: React 19, TypeScript, Vite, TailwindCSS
- **Port**: `http://localhost:5173`
- **Features**:
  - Manage blockchain networks (chains)
  - Configure ERC20 tokens for tracking
  - View real-time holder balances
  - Modern, responsive UI with Heroicons

### 🔌 **API Service** (`apps/api`)

- **Tech Stack**: NestJS, MongoDB, Mongoose
- **Port**: `http://localhost:4000`
- **Features**:
  - RESTful API for admin operations
  - Chain and token management endpoints
  - Balance queries and holder analytics
  - Data validation and transformation

### 📊 **Queue Dashboard** (`apps/dashboard`)

- **Tech Stack**: NestJS, Bull Board, BullMQ
- **Port**: `http://localhost:4002/queues`
- **Features**:
  - Monitor job queues in real-time
  - Track processing statistics
  - Debug failed jobs
  - Queue management interface

### 🎧 **Live Listener** (`apps/live-listener`)

- **Tech Stack**: NestJS, Viem, BullMQ
- **Features**:
  - Real-time blockchain event listening
  - ERC20 transfer detection using Viem
  - Infura integration for reliable connectivity
  - Queue job creation for processing

### ⚙️ **Worker Service** (`apps/worker`)

- **Tech Stack**: NestJS, BullMQ, MongoDB
- **Features**:
  - Process "safe" transfers (with confirmations)
  - Handle blockchain reorganizations
  - Calculate and update wallet balances
  - Automated cleanup of invalid transfers

## 🚀 Quick Start

### Prerequisites

- **Docker** & **Docker Compose**
- **Node.js** 22.20.0+
- **npm** package manager

### Installation & Setup

1.  **Clone the repository**

    ```bash
    git clone git@github.com:EdiGal91/erc20-holders-tracker.git
    cd erc20-tracker
    ```

2.  **Set up environment variables**
    Create `.env` files for each service by copying the corresponding `.env.example` file:
    - For the `admin` app:
      ```bash
      cp apps/admin/.env.example apps/admin/.env
      ```
    - For the `api` app:
      ```bash
      cp apps/api/.env.example apps/api/.env
      ```
    - For the `dashboard` app:
      ```bash
      cp apps/dashboard/.env.example apps/dashboard/.env
      ```
    - For the `live-listener` app:
      ```bash
      cp apps/live-listener/.env.example apps/live-listener/.env
      ```
      After creating the `live-listener`'s `.env` file, you must add your `INFURA_WS_API_KEY` to it.
    - For the `worker` app:
      ```bash
      cp apps/worker/.env.example apps/worker/.env
      ```

3.  **Start all services**
    ```bash
    npm run dev
    ```

This command will:

- Build and start all Docker containers
- Scale worker service to 2 instances for better performance
- Set up MongoDB and Redis automatically

4. **Access the applications**
   - **Admin Panel**: http://localhost:5173
   - **Queue Dashboard**: http://localhost:4002/queues
   - **API**: http://localhost:4000

### Available Commands

```bash
# Start all services
npm run dev

# Stop all services
npm run stop

# Restart all services
npm run restart
```

## 🛠️ Infrastructure

The system uses Docker Compose to orchestrate the following services:

- **MongoDB** (Port 27017): Primary database for storing chains, tokens, and balances
- **Redis** (Port 6379): Queue management and caching
- **API Service** (Port 4000): REST API with debug support
- **Worker Service** (2 instances): Parallel processing for better throughput
- **Dashboard** (Port 4002): Queue monitoring interface
- **Admin Panel** (Port 5173): Management interface
- **Live Listener**: Background blockchain monitoring

## 📋 Key Features

### Real-time Tracking

- Live ERC20 transfer monitoring using Viem
- Automatic balance calculations
- Multi-chain support

### Data Integrity

- Blockchain reorganization handling
- Confirmation-based "safe" transfer processing
- Automatic cleanup of invalid data

### Scalability

- Microservices architecture
- Queue-based job processing
- Horizontal worker scaling

### Monitoring

- Real-time queue dashboard
- Job status tracking
- Error handling and retry mechanisms

### Management

- Intuitive admin interface
- Chain and token configuration
- Holder analytics and filtering

## 🔧 Development

Each service can be developed independently:

```bash
# Work on a specific service
cd apps/admin && npm run dev
cd apps/api && npm run start:dev
cd apps/worker && npm run start:dev
```

## 📦 Tech Stack Summary

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, React Query
- **Backend**: NestJS, MongoDB, Redis, BullMQ
- **Blockchain**: Viem, Infura
- **Infrastructure**: Docker, Docker Compose
- **Monitoring**: Bull Board Dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC License - see package.json for details

---

**Built with ❤️ by EdiGal**
