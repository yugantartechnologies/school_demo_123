# Use the official lightweight Nginx image based on Alpine Linux
FROM nginx:alpine

# Remove default nginx static assets if any
RUN rm -rf /usr/share/nginx/html/*

# Copy the static website files to the Nginx HTML directory
COPY Enfance_Pre_School_Website/ /usr/share/nginx/html/

# Expose port 80 to the outside world
EXPOSE 80

# Start Nginx and keep the process running in the foreground
CMD ["nginx", "-g", "daemon off;"]
