# Stage 1: Build the Go backend proxy
FROM --platform=$BUILDPLATFORM golang:latest AS builder-proxy

ARG FRONTEND_VERSION
ARG BACKEND_VERSION

WORKDIR /build/proxy

# Install git and ca-certificates for cloning
RUN apk add --no-cache git ca-certificates

# Clone mydevstack-proxy at the specified version
RUN git clone --depth 1 --branch ${BACKEND_VERSION} \
    https://github.com/my-devstack/mydevstack-proxy.git .

# Build the Go proxy
RUN CGO_ENABLED=0 GOOS=linux go build -o /mydevstack-proxy ./cmd/server

# Stage 2: Build the frontend
FROM --platform=$BUILDPLATFORM node:latest AS builder-frontend

ARG FRONTEND_VERSION

WORKDIR /build/frontend

# Install git for cloning
RUN apk add --no-cache git

# Clone mydevstack-ui at the specified version
RUN git clone --depth 1 --branch ${FRONTEND_VERSION} \
    https://github.com/my-devstack/mydevstack-ui.git .

# Install dependencies and build
RUN npm ci && npm run build

# Stage 3: Final image
FROM alpine:latest AS final

RUN apk add --no-cache nginx curl

# Create non-root user
RUN adduser -D -g '' appuser

# Copy proxy binary from builder-proxy
COPY --from=builder-proxy /mydevstack-proxy /usr/local/bin/mydevstack-proxy

# Copy frontend dist from builder-frontend
COPY --from=builder-frontend /build/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create necessary directories and set ownership
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/lib/nginx/tmp /var/run && \
    chown -R appuser:appuser /var/cache/nginx /var/log/nginx /var/lib/nginx /var/run /etc/nginx

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 3000 8081

ENV GIN_MODE=release

# Environment variables with defaults
ENV PROXY_PORT=8081
ENV AWS_ENDPOINT=http://localhost:4566
ENV AWS_ACCESS_KEY=test
ENV AWS_SECRET_KEY=test

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start both nginx and proxy with proper startup order
CMD sh -c "/usr/local/bin/mydevstack-proxy & sleep 2 && nginx -g 'daemon off;' "