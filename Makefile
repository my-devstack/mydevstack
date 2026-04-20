.PHONY: help run-proxy run-ui run-dev build dist lint lint-proxy lint-ui test clean

.DEFAULT_GOAL := help

help:
	@echo "Available commands:"
	@echo "  make run-proxy     - Run the Go proxy backend"
	@echo "  make run-ui     - Run the Vue UI dev server"
	@echo "  make run-dev    - Run both proxy and UI for development"
	@echo "  make build      - Build production binaries and dist"
	@echo "  make dist     - Build production dist (UI)"
	@echo "  make lint     - Run lint on all (proxy + UI)"
	@echo "  make lint-proxy - Run golangci-lint on proxy"
	@echo "  make lint-ui  - Run ESLint on UI"
	@echo "  make test     - Run tests on proxy"
	@echo "  make mockery - Generate mocks for proxy"

run-proxy:
	go mod tidy && go run ./pkg/proxy/cmd/server

run-ui:
	cd pkg/ui && npm run dev

run-dev: run-proxy run-ui

build:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o mydevstack-proxy-linux-amd64 ./pkg/proxy/cmd/server
	CGO_ENABLED=0 GOARCH=amd64 go build -o mydevstack-proxy-darwin-amd64 ./pkg/proxy/cmd/server
	GOOS=windows GOARCH=amd64 go build -o mydevstack-proxy-windows-amd64.exe ./pkg/proxy/cmd/server
	cd pkg/ui && npm run build

dist:
	cd pkg/ui && npm run build

lint: lint-proxy lint-ui

lint-proxy:
	cd pkg/proxy && golangci-lint run

lint-ui:
	cd pkg/ui && npm run lint

test:
	go test ./pkg/proxy/...

mockery:
	cd pkg/proxy && mockery && go mod tidy

.PHONY: unit
unit:
	go mod tidy
	go test $(shell go list ./pkg/proxy/internal/... | grep -v /mocks) -race -coverprofile .testCoverage.txt -v 2>&1

.PHONY: unit-coverage
unit-coverage: unit ## Runs unit tests and generates a html coverage report
	go tool cover -html=.testCoverage.txt -o unit.html