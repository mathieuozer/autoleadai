# Azure Deployment Guide (Lowest Cost)

This guide shows how to deploy AutoLead.ai to Azure with minimal cost for MVP/development.

## Cost Summary

| Service | Tier | Estimated Cost |
|---------|------|----------------|
| Azure Container Apps | Consumption | ~$0-5/month (pay per use) |
| Azure Database for PostgreSQL | Flexible Server (Burstable B1ms) | ~$12/month |
| Azure Container Registry | Basic | ~$5/month |
| **Total** | | **~$17-22/month** |

> **Free Tier Alternative:** Use Azure App Service Free tier (F1) + Supabase free PostgreSQL for $0/month (with limitations).

---

## Option 1: Lowest Cost Production (~$17/month)

### Prerequisites

```bash
# Install Azure CLI
brew install azure-cli

# Login to Azure
az login

# Install Container Apps extension
az extension add --name containerapp --upgrade
```

### Step 1: Create Resource Group

```bash
# Set variables
RESOURCE_GROUP="autolead-rg"
LOCATION="eastus"  # Choose closest region

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION
```

### Step 2: Create PostgreSQL Database

```bash
# Create PostgreSQL Flexible Server (Burstable B1ms - cheapest)
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name autolead-db \
  --location $LOCATION \
  --admin-user autoleadadmin \
  --admin-password "YourSecurePassword123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --public-access 0.0.0.0

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name autolead-db \
  --database-name autolead

# Get connection string
az postgres flexible-server show \
  --resource-group $RESOURCE_GROUP \
  --name autolead-db \
  --query "fullyQualifiedDomainName" -o tsv
```

**Connection string format:**
```
postgresql://autoleadadmin:YourSecurePassword123!@autolead-db.postgres.database.azure.com:5432/autolead?sslmode=require
```

### Step 3: Create Container Registry

```bash
# Create Azure Container Registry (Basic tier)
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name autoleadregistry \
  --sku Basic \
  --admin-enabled true

# Login to registry
az acr login --name autoleadregistry

# Get registry credentials
az acr credential show --name autoleadregistry
```

### Step 4: Build and Push Docker Image

Create `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

Update `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
};
```

Build and push:

```bash
# Build Docker image
docker build -t autoleadregistry.azurecr.io/autolead:latest .

# Push to Azure Container Registry
docker push autoleadregistry.azurecr.io/autolead:latest
```

### Step 5: Create Container Apps Environment

```bash
# Create Container Apps environment
az containerapp env create \
  --name autolead-env \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Get ACR credentials
ACR_PASSWORD=$(az acr credential show --name autoleadregistry --query "passwords[0].value" -o tsv)
```

### Step 6: Deploy Container App

```bash
# Create Container App
az containerapp create \
  --name autolead-app \
  --resource-group $RESOURCE_GROUP \
  --environment autolead-env \
  --image autoleadregistry.azurecr.io/autolead:latest \
  --target-port 3000 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 2 \
  --cpu 0.25 \
  --memory 0.5Gi \
  --registry-server autoleadregistry.azurecr.io \
  --registry-username autoleadregistry \
  --registry-password $ACR_PASSWORD \
  --env-vars \
    DATABASE_URL="postgresql://autoleadadmin:YourSecurePassword123!@autolead-db.postgres.database.azure.com:5432/autolead?sslmode=require" \
    NEXT_PUBLIC_APP_URL="https://autolead-app.azurecontainerapps.io"

# Get app URL
az containerapp show \
  --name autolead-app \
  --resource-group $RESOURCE_GROUP \
  --query "properties.configuration.ingress.fqdn" -o tsv
```

### Step 7: Run Database Migrations

```bash
# Run migrations (one-time)
az containerapp exec \
  --name autolead-app \
  --resource-group $RESOURCE_GROUP \
  --command "npx prisma migrate deploy"

# Seed database (optional)
az containerapp exec \
  --name autolead-app \
  --resource-group $RESOURCE_GROUP \
  --command "npx prisma db seed"
```

---

## Option 2: Free Tier ($0/month)

For development/testing with limitations.

### Use Azure App Service Free Tier + Supabase

1. **Supabase (Free PostgreSQL)**
   - Go to [supabase.com](https://supabase.com)
   - Create free project
   - Get connection string from Settings > Database

2. **Azure App Service (Free F1)**

```bash
# Create App Service Plan (Free)
az appservice plan create \
  --name autolead-plan \
  --resource-group $RESOURCE_GROUP \
  --sku F1 \
  --is-linux

# Create Web App
az webapp create \
  --name autolead-app \
  --resource-group $RESOURCE_GROUP \
  --plan autolead-plan \
  --runtime "NODE:20-lts"

# Configure environment
az webapp config appsettings set \
  --name autolead-app \
  --resource-group $RESOURCE_GROUP \
  --settings \
    DATABASE_URL="your-supabase-connection-string" \
    NEXT_PUBLIC_APP_URL="https://autolead-app.azurewebsites.net"

# Deploy using ZIP
npm run build
zip -r deploy.zip .next package.json node_modules prisma public
az webapp deploy \
  --name autolead-app \
  --resource-group $RESOURCE_GROUP \
  --src-path deploy.zip
```

**Free Tier Limitations:**
- 60 CPU minutes/day
- 1 GB RAM
- No custom domain
- Cold starts

---

## Option 3: GitHub Actions CI/CD

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

env:
  AZURE_CONTAINER_REGISTRY: autoleadregistry.azurecr.io
  IMAGE_NAME: autolead
  RESOURCE_GROUP: autolead-rg
  CONTAINER_APP_NAME: autolead-app

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Login to ACR
        run: az acr login --name autoleadregistry

      - name: Build and push image
        run: |
          docker build -t ${{ env.AZURE_CONTAINER_REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} .
          docker push ${{ env.AZURE_CONTAINER_REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Deploy to Container Apps
        run: |
          az containerapp update \
            --name ${{ env.CONTAINER_APP_NAME }} \
            --resource-group ${{ env.RESOURCE_GROUP }} \
            --image ${{ env.AZURE_CONTAINER_REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
```

Add secrets to GitHub:
- `AZURE_CREDENTIALS`: Service principal JSON

---

## Cost Optimization Tips

1. **Scale to Zero**
   - Container Apps with `--min-replicas 0` scales to zero when idle
   - Only pay when app is accessed

2. **Use Burstable DB**
   - B1ms is cheapest PostgreSQL option
   - Sufficient for MVP traffic

3. **Reserved Instances**
   - 1-year reservation saves ~40% on DB costs
   - Only for production workloads

4. **Stop Resources**
   ```bash
   # Stop Container App (no charges when stopped)
   az containerapp update --name autolead-app --resource-group $RESOURCE_GROUP --min-replicas 0 --max-replicas 0

   # Stop PostgreSQL (dev only)
   az postgres flexible-server stop --name autolead-db --resource-group $RESOURCE_GROUP
   ```

5. **Monitor Costs**
   ```bash
   # View current costs
   az consumption usage list --resource-group $RESOURCE_GROUP
   ```

---

## Quick Reference

| Action | Command |
|--------|---------|
| View logs | `az containerapp logs show --name autolead-app -g autolead-rg` |
| Restart app | `az containerapp revision restart --name autolead-app -g autolead-rg` |
| Scale up | `az containerapp update --name autolead-app -g autolead-rg --max-replicas 5` |
| Get URL | `az containerapp show --name autolead-app -g autolead-rg --query properties.configuration.ingress.fqdn` |
| Delete all | `az group delete --name autolead-rg --yes` |

---

## Troubleshooting

**Container won't start:**
```bash
az containerapp logs show --name autolead-app -g autolead-rg --type system
```

**Database connection issues:**
- Ensure firewall allows Azure services
- Check SSL mode in connection string

**Build fails:**
- Ensure `output: 'standalone'` in next.config.ts
- Check Prisma client is generated in Dockerfile
