# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install dependencies
# Note: Since no requirements.txt was provided, we install django directly
RUN pip install --no-cache-dir django==4.2.7
RUN pip install --no-cache-dir numpy

# Copy the project files into the container
COPY .. /app/

# Expose the port Django runs on
EXPOSE 8000