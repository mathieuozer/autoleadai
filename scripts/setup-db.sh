#!/bin/bash

# AutoLead.ai Database Setup Script
# This script sets up the PostgreSQL database using Docker

set -e

echo "🚀 AutoLead.ai Database Setup"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running, start if not
echo -e "\n${YELLOW}Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}Docker is not running. Starting Docker Desktop...${NC}"
    open -a Docker

    # Wait for Docker to start (max 60 seconds)
    echo -n "Waiting for Docker to start"
    COUNTER=0
    while ! docker info > /dev/null 2>&1; do
        echo -n "."
        sleep 2
        COUNTER=$((COUNTER + 1))
        if [ $COUNTER -gt 30 ]; then
            echo -e "\n${RED}❌ Docker failed to start after 60 seconds. Please start Docker Desktop manually.${NC}"
            exit 1
        fi
    done
    echo ""
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Check if .env exists, if not copy from example
if [ ! -f .env ]; then
    echo -e "\n${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env from .env.example${NC}"
fi

# Start PostgreSQL container
echo -e "\n${YELLOW}Starting PostgreSQL container...${NC}"
docker compose up -d

# Wait for PostgreSQL to be ready
echo -e "\n${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
until docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo -e "\n${GREEN}✓ PostgreSQL is ready${NC}"

# Generate Prisma client
echo -e "\n${YELLOW}Generating Prisma client...${NC}"
npm run db:generate
echo -e "${GREEN}✓ Prisma client generated${NC}"

# Push schema to database
echo -e "\n${YELLOW}Pushing schema to database...${NC}"
npm run db:push
echo -e "${GREEN}✓ Schema pushed to database${NC}"

# Seed the database
echo -e "\n${YELLOW}Seeding database with test data...${NC}"
npm run db:seed
echo -e "${GREEN}✓ Database seeded${NC}"

echo -e "\n${GREEN}=============================="
echo -e "✅ Database setup complete!"
echo -e "==============================${NC}"
echo -e "\nUseful commands:"
echo -e "  ${YELLOW}npm run db:studio${NC}  - Open Prisma Studio (database GUI)"
echo -e "  ${YELLOW}npm run dev${NC}        - Start the development server"
echo -e "  ${YELLOW}docker compose down${NC} - Stop the database"
echo -e "\nDatabase URL: postgresql://postgres:postgres@localhost:5432/autolead"
