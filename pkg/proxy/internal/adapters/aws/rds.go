package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type RDSAdapter struct {
	client ports.RDSClientPort
}

func NewRDSAdapter(awsCfg aws.Config, endpoint string) ports.RDSPort {
	httpClient := &http.Client{Timeout: 60 * time.Second}
	client := rds.NewFromConfig(awsCfg, func(o *rds.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &RDSAdapter{client: client}
}

func (a *RDSAdapter) DescribeDBInstances(ctx context.Context, input *rds.DescribeDBInstancesInput) (*rds.DescribeDBInstancesOutput, error) {
	return a.client.DescribeDBInstances(ctx, input)
}

func (a *RDSAdapter) CreateDBInstance(ctx context.Context, input *rds.CreateDBInstanceInput) (*rds.CreateDBInstanceOutput, error) {
	return a.client.CreateDBInstance(ctx, input)
}

func (a *RDSAdapter) DeleteDBInstance(ctx context.Context, input *rds.DeleteDBInstanceInput) (*rds.DeleteDBInstanceOutput, error) {
	return a.client.DeleteDBInstance(ctx, input)
}

func (a *RDSAdapter) DescribeDBEngineVersions(ctx context.Context, input *rds.DescribeDBEngineVersionsInput) (*rds.DescribeDBEngineVersionsOutput, error) {
	return a.client.DescribeDBEngineVersions(ctx, input)
}

func (a *RDSAdapter) ModifyDBInstance(ctx context.Context, input *rds.ModifyDBInstanceInput) (*rds.ModifyDBInstanceOutput, error) {
	return a.client.ModifyDBInstance(ctx, input)
}

func (a *RDSAdapter) RebootDBInstance(ctx context.Context, input *rds.RebootDBInstanceInput) (*rds.RebootDBInstanceOutput, error) {
	return a.client.RebootDBInstance(ctx, input)
}
