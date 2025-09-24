# Buy My Skills - Deployment Guide

## Overview
This guide provides instructions for deploying the Buy My Skills application on Oracle Cloud Infrastructure (OCI).

## Prerequisites
- OCI account with necessary permissions
- MySQL HeatWave instance
- Compute instance for the application server
- Load balancer (optional)

## Step 1: Set up MySQL HeatWave
1. Create a MySQL HeatWave instance in OCI.
2. Configure security lists to allow connections from your application server.
3. Create the database and user.

## Step 2: Deploy Application Server
1. Launch a compute instance (Ubuntu recommended).
2. Install Node.js and npm.
3. Clone the repository.
4. Configure environment variables.
5. Run the application.

## Step 3: Configure Load Balancer (Optional)
1. Set up OCI Load Balancer.
2. Point to your application server.

## Environment Variables
Set the following in your .env file:

```
USE_DB=true
DB_HOST=your-oci-mysql-endpoint
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=buymyskills
PORT=4000
```

## Running the Application
1. Install dependencies: `npm install`
2. Start the server: `npm run server`
3. Start the frontend: `npm start`

## Additional Notes
- Ensure SSL is enabled for production.
- Monitor resource usage.
- Set up backups for the database.
