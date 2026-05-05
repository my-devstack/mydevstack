# check=skip=SecretsUsedInArgOrEnv
# Stage 1: Build the Go backend proxy
FROM --platform=$BUILDPLATFORM golang:alpine AS builder-proxy

ARG VERSION

WORKDIR /build/proxy
COPY ./pkg ./pkg
COPY ./go.* .

# Install git and ca-certificates for cloning
RUN apk add --no-cache ca-certificates

# Build the Go proxy
RUN CGO_ENABLED=0 GOOS=linux go build -o /mydevstack-proxy ./pkg/proxy/cmd/server

# Stage 2: Build the frontend
FROM --platform=$BUILDPLATFORM node:alpine AS builder-frontend

ARG VERSION

WORKDIR /build/ui

# Install dependencies and build
WORKDIR /build/ui/pkg/ui
COPY ./pkg/ui/. .
RUN npm ci && npm run build

# Stage 3: Final image
FROM alpine:latest AS final

ARG VERSION

RUN apk add --no-cache nginx curl

# Create non-root user
RUN adduser -D -g '' appuser

# Copy proxy binary from builder-proxy
COPY --from=builder-proxy /mydevstack-proxy /usr/local/bin/mydevstack-proxy

# Copy frontend dist from builder-frontend
COPY --from=builder-frontend /build/ui/pkg/ui/dist /usr/share/nginx/html

RUN echo "$VERSION" >> /usr/share/nginx/html/VERSION

# Copy nginx configuration
COPY ./build/nginx.conf /etc/nginx/nginx.conf

# Create necessary directories and set ownership
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/lib/nginx/tmp /var/run  /etc/mydevstack/config && \
    chown -R appuser:appuser /var/cache/nginx /var/log/nginx /var/lib/nginx /var/run /etc/nginx /etc/mydevstack/config

COPY ./config.yaml.example /etc/mydevstack/config/config.yaml

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 3000 8081

ENV CONFIG_FILE=/etc/mydevstack/config/config.yaml
ENV GIN_MODE=release

# Environment variables with defaults
ENV PROXY_PORT=8081
ENV AWS_ENDPOINT=http://localhost:4566
ENV AWS_ACCESS_KEY=test
ENV AWS_SECRET_KEY=test
ENV EMULATOR=

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start both nginx and proxy with proper startup order
CMD ["/bin/sh", "-c", "/usr/local/bin/mydevstack-proxy & sleep 2 && nginx -g 'daemon off;'"]