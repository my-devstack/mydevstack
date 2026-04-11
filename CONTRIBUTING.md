# Contributing to MyDevStack

Thank you for your interest in contributing!

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/mydevstack.git`
3. **Create** a feature branch: `git checkout -b feature/my-new-feature`

## Development Setup

### Prerequisites

- Docker 24.0+
- Git

### Building

```bash
# Clone the repository
git clone https://github.com/my-devstack/mydevstack.git
cd mydevstack

# Update release.json
# {"frontend": "1.0.0", "backend": "1.0.0"}

# Build the Docker image
docker build -t beabys/mydevstack:latest .

# Run with docker-compose
docker-compose up -d
```

## Release Process

1. Update `release.json` with new versions
2. Create a git tag with prefix `v`:
   ```bash
   git add release.json
   git commit -m "Release v1.0.0"
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions will build and push the Docker image

## Submitting Changes

1. **Test** your changes locally
2. **Commit** with clear, descriptive messages
3. **Push** to your fork
4. **Open** a Pull Request against `main` branch

### Pull Request Guidelines

- Describe the changes and the motivation
- Link to any related issues
- Include any documentation updates

## Reporting Bugs

1. Check if the issue already exists
2. Create a detailed issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Docker version and environment details

## Questions?

Feel free to open an issue for questions about contributing or the project in general.