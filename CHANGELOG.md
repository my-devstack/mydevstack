# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.11.0] - 2026-08-24

### Added
- **Cognito** — full User Pools management:
  - User Pools CRUD, Users CRUD (with password reset)
  - Groups CRUD and group membership management
  - User Pool Clients (create, edit, delete)
  - Resource Servers (create, describe, delete)
  - User Pool tags (add/remove/list)
  - Per-user Test Login modal (AdminInitiateAuth)
- **Test coverage increase** — Vue unit tests across DynamoDB, Lambda, Cognito

## [1.10.1] - 2026-08-22

### Changed
- Dependency bumps (Go + Node)

## [1.10.0] - 2026-07-26

### Added
- **VPC integrated within other services** — VPC selector (VPC, Subnet, Security Group) is now accessible directly from EC2, RDS, Lambda, ElastiCache, MSK, and OpenSearch views, not just the VPC standalone view

## [1.9.0] - 2026-07-01

### Added
- **VPC standalone service** — VPC migrated from EC2 tabs to its own `/services/vpc` view with all 7 entity tabs (VPCs, Subnets, Route Tables, IGWs, NATGWs, NACLs, Flow Logs)
- Horizontal scroll on tab lists for better UX

### Fixed
- Missing expanded VPC/Subnet destructuring in EC2 view
- EC2 test coverage improvements

## [1.8.0] - 2026-05-29

### Added
- **S3 Lifecycle Rules** — support for adding and managing bucket lifecycle rules

## [1.7.0] - 2026-05-21

### Added
- **Proxy HTTP Handler Refactor** — replaced chi-based HTTP handler with a new REST design aligned with OpenAPI spec
- **OpenAPI-driven proxy** — all backend routes generated/validated against OpenAPI service definitions
- Configuration now loaded exclusively from environment variables (config.yaml env substitution)

### Fixed
- DynamoDB Streams caching and context handling

## [1.6.2] - 2026-05-21

### Fixed
- Release Docker version using pnpm

## [1.6.1] - 2026-05-19

### Added
- **UI test coverage improvements** — Vue unit tests added across multiple services

## [1.6.0] - 2026-05-16

### Added
- UI linting fixes and cleanup

## [1.5.0] - 2026-05-15

### Added
- **MSK and OpenSearch MiniStack scope** — UI shows a warning banner and disables create actions when running on MiniStack

## [1.4.0] - 2026-05-14

### Added
- Documentation improvements (ARCHITECTURE.md, CONCERNS.md updated)

## [1.3.2] - 2026-05-12

### Added
- Missing usage examples in UI

## [1.3.1] - 2026-05-11

### Added
- UI style fixes and improvements

## [1.3.0] - 2026-05-10

### Added
- Release pipeline improvements

## [1.2.2] - 2026-05-08

### Fixed
- Release notes display

## [1.2.1] - 2026-05-08

### Fixed
- Release notes display

## [1.2.0] - 2026-05-08

### Added
- Various service improvements (from tag message: "FIX: resolve No previous tags found")

## [1.1.0] - 2026-05-07

### Added
- **S3 creation and details improvements** — enhanced bucket creation flow and detail views

## [1.0.0] - 2026-05-05

### Added

- Initial production release with support for 18 AWS services:
  - S3 (Buckets & Objects, Presigned URLs)
  - Lambda (Functions, Invocations)
  - DynamoDB (Tables, Items)
  - DynamoDB Streams (Stream records, shards)
  - SQS (Queues, Messages)
  - SNS (Topics, Subscriptions, Publishing)
  - IAM (Users, Roles, Groups, Policies)
  - KMS (Keys, Encryption, Decryption)
  - Secrets Manager
  - SSM (Parameter Store, SecureString)
  - CloudWatch (Logs, Metrics, Alarms, Dashboards)
  - API Gateway (REST & HTTP APIs, Integrations)
  - Kinesis (Streams, Shards, Records)
  - CloudFormation (Stacks, Templates, Resources)
  - Cognito (User Pools)
  - ElastiCache (Redis Server Groups, Cache Nodes)
  - RDS (Databases, Instances, Snapshots)
  - Step Functions (State Machines, Executions)
- Dashboard with service overview
- Dark/Light mode support
- Settings page for endpoint configuration
- Responsive design

## [0.1.2] - 2026-04-23

### Fixed
- Lambda execution on API Gateway

## [0.1.1] - 2026-04-22

### Added
- Basic IAM operations (Users, Roles, Groups, Policies)

## [0.0.12] - 2026-04-22

### Added
- API Gateway mock creation improvements

## [0.0.11] - 2026-04-22

### Added
- UI improvements

## [0.0.10] - 2026-04-20

### Added
- Modular Monolith app refactor

## [0.0.9] - 2026-04-20

### Fixed
- UI path for release

## [0.0.8] - 2026-04-19

### Fixed
- Docker permission issues

## [0.0.7] - 2026-04-18

### Added
- Docker Compose examples for MiniStack and FloCi

## [0.0.6] - 2026-04-16

### Changed
- Tag version updates

## [0.0.5] - 2026-04-14

### Added
- ElastiCache support

## [0.0.4] - 2026-04-14

### Added
- Service version bumps

## [0.0.3] - 2026-04-13

### Added
- Initial service version

## [0.0.2] - 2026-04-13

### Added
- Docker Compose examples for MiniStack and FloCi

## [0.0.1] - 2026-04-12

### Added
- First release
