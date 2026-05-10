package aws

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sfn"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type StepFunctionsAdapter struct {
	client ports.SFNClientPort
}

func NewStepFunctionsAdapter(cfg aws.Config, endpoint string) *StepFunctionsAdapter {
	client := sfn.NewFromConfig(cfg, func(o *sfn.Options) {
		if endpoint != "" {
			o.BaseEndpoint = aws.String(endpoint)
		}
	})
	return &StepFunctionsAdapter{client: client}
}

func (a *StepFunctionsAdapter) ListStateMachines(ctx context.Context, input *sfn.ListStateMachinesInput) (*sfn.ListStateMachinesOutput, error) {
	result, err := a.client.ListStateMachines(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("list state machines: %w", err)
	}
	return result, nil
}

func (a *StepFunctionsAdapter) CreateStateMachine(ctx context.Context, input *sfn.CreateStateMachineInput) (*sfn.CreateStateMachineOutput, error) {
	result, err := a.client.CreateStateMachine(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("create state machine: %w", err)
	}
	return result, nil
}

func (a *StepFunctionsAdapter) DescribeStateMachine(ctx context.Context, input *sfn.DescribeStateMachineInput) (*sfn.DescribeStateMachineOutput, error) {
	result, err := a.client.DescribeStateMachine(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("describe state machine: %w", err)
	}
	return result, nil
}

func (a *StepFunctionsAdapter) UpdateStateMachine(ctx context.Context, input *sfn.UpdateStateMachineInput) (*sfn.UpdateStateMachineOutput, error) {
	result, err := a.client.UpdateStateMachine(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("update state machine: %w", err)
	}
	return result, nil
}

func (a *StepFunctionsAdapter) DeleteStateMachine(ctx context.Context, input *sfn.DeleteStateMachineInput) (*sfn.DeleteStateMachineOutput, error) {
	result, err := a.client.DeleteStateMachine(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("delete state machine: %w", err)
	}
	return result, nil
}

func (a *StepFunctionsAdapter) StartExecution(ctx context.Context, input *sfn.StartExecutionInput) (*sfn.StartExecutionOutput, error) {
	result, err := a.client.StartExecution(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("start execution: %w", err)
	}
	return result, nil
}

func (a *StepFunctionsAdapter) StopExecution(ctx context.Context, input *sfn.StopExecutionInput) (*sfn.StopExecutionOutput, error) {
	result, err := a.client.StopExecution(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("stop execution: %w", err)
	}
	return result, nil
}

func (a *StepFunctionsAdapter) ListExecutions(ctx context.Context, input *sfn.ListExecutionsInput) (*sfn.ListExecutionsOutput, error) {
	result, err := a.client.ListExecutions(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("list executions: %w", err)
	}
	return result, nil
}

func (a *StepFunctionsAdapter) DescribeExecution(ctx context.Context, input *sfn.DescribeExecutionInput) (*sfn.DescribeExecutionOutput, error) {
	result, err := a.client.DescribeExecution(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("describe execution: %w", err)
	}
	return result, nil
}

func (a *StepFunctionsAdapter) GetExecutionHistory(ctx context.Context, input *sfn.GetExecutionHistoryInput) (*sfn.GetExecutionHistoryOutput, error) {
	result, err := a.client.GetExecutionHistory(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("get execution history: %w", err)
	}
	return result, nil
}

func (a *StepFunctionsAdapter) ListTagsForResource(ctx context.Context, input *sfn.ListTagsForResourceInput) (*sfn.ListTagsForResourceOutput, error) {
	result, err := a.client.ListTagsForResource(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("list tags for resource: %w", err)
	}
	return result, nil
}

func (a *StepFunctionsAdapter) TagResource(ctx context.Context, input *sfn.TagResourceInput) (*sfn.TagResourceOutput, error) {
	result, err := a.client.TagResource(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("tag resource: %w", err)
	}
	return result, nil
}

func (a *StepFunctionsAdapter) UntagResource(ctx context.Context, input *sfn.UntagResourceInput) (*sfn.UntagResourceOutput, error) {
	result, err := a.client.UntagResource(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("untag resource: %w", err)
	}
	return result, nil
}
