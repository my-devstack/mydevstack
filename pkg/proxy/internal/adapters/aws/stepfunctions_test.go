package aws

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sfn"
	sfnmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewStepFunctionsAdapter(t *testing.T) {
	adapter := NewStepFunctionsAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &StepFunctionsAdapter{}, adapter)
}

func TestStepFunctionsAdapter_ListStateMachines(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.ListStateMachinesInput{}
		expected := &sfn.ListStateMachinesOutput{}
		mockClient.EXPECT().ListStateMachines(ctx, input).Return(expected, nil)
		result, err := adapter.ListStateMachines(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.ListStateMachinesInput{}
		mockClient.EXPECT().ListStateMachines(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.ListStateMachines(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "list state machines")
	})
}

func TestStepFunctionsAdapter_CreateStateMachine(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.CreateStateMachineInput{}
		expected := &sfn.CreateStateMachineOutput{}
		mockClient.EXPECT().CreateStateMachine(ctx, input).Return(expected, nil)
		result, err := adapter.CreateStateMachine(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.CreateStateMachineInput{}
		mockClient.EXPECT().CreateStateMachine(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.CreateStateMachine(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "create state machine")
	})
}

func TestStepFunctionsAdapter_DescribeStateMachine(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.DescribeStateMachineInput{}
		expected := &sfn.DescribeStateMachineOutput{}
		mockClient.EXPECT().DescribeStateMachine(ctx, input).Return(expected, nil)
		result, err := adapter.DescribeStateMachine(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.DescribeStateMachineInput{}
		mockClient.EXPECT().DescribeStateMachine(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.DescribeStateMachine(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "describe state machine")
	})
}

func TestStepFunctionsAdapter_UpdateStateMachine(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.UpdateStateMachineInput{}
		expected := &sfn.UpdateStateMachineOutput{}
		mockClient.EXPECT().UpdateStateMachine(ctx, input).Return(expected, nil)
		result, err := adapter.UpdateStateMachine(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.UpdateStateMachineInput{}
		mockClient.EXPECT().UpdateStateMachine(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.UpdateStateMachine(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "update state machine")
	})
}

func TestStepFunctionsAdapter_DeleteStateMachine(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.DeleteStateMachineInput{}
		expected := &sfn.DeleteStateMachineOutput{}
		mockClient.EXPECT().DeleteStateMachine(ctx, input).Return(expected, nil)
		result, err := adapter.DeleteStateMachine(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.DeleteStateMachineInput{}
		mockClient.EXPECT().DeleteStateMachine(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.DeleteStateMachine(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "delete state machine")
	})
}

func TestStepFunctionsAdapter_StartExecution(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.StartExecutionInput{}
		expected := &sfn.StartExecutionOutput{}
		mockClient.EXPECT().StartExecution(ctx, input).Return(expected, nil)
		result, err := adapter.StartExecution(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.StartExecutionInput{}
		mockClient.EXPECT().StartExecution(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.StartExecution(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "start execution")
	})
}

func TestStepFunctionsAdapter_StopExecution(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.StopExecutionInput{}
		expected := &sfn.StopExecutionOutput{}
		mockClient.EXPECT().StopExecution(ctx, input).Return(expected, nil)
		result, err := adapter.StopExecution(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.StopExecutionInput{}
		mockClient.EXPECT().StopExecution(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.StopExecution(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "stop execution")
	})
}

func TestStepFunctionsAdapter_ListExecutions(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.ListExecutionsInput{}
		expected := &sfn.ListExecutionsOutput{}
		mockClient.EXPECT().ListExecutions(ctx, input).Return(expected, nil)
		result, err := adapter.ListExecutions(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.ListExecutionsInput{}
		mockClient.EXPECT().ListExecutions(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.ListExecutions(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "list executions")
	})
}

func TestStepFunctionsAdapter_DescribeExecution(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.DescribeExecutionInput{}
		expected := &sfn.DescribeExecutionOutput{}
		mockClient.EXPECT().DescribeExecution(ctx, input).Return(expected, nil)
		result, err := adapter.DescribeExecution(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.DescribeExecutionInput{}
		mockClient.EXPECT().DescribeExecution(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.DescribeExecution(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "describe execution")
	})
}

func TestStepFunctionsAdapter_GetExecutionHistory(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.GetExecutionHistoryInput{}
		expected := &sfn.GetExecutionHistoryOutput{}
		mockClient.EXPECT().GetExecutionHistory(ctx, input).Return(expected, nil)
		result, err := adapter.GetExecutionHistory(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.GetExecutionHistoryInput{}
		mockClient.EXPECT().GetExecutionHistory(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.GetExecutionHistory(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "get execution history")
	})
}

func TestStepFunctionsAdapter_ListTagsForResource(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.ListTagsForResourceInput{}
		expected := &sfn.ListTagsForResourceOutput{}
		mockClient.EXPECT().ListTagsForResource(ctx, input).Return(expected, nil)
		result, err := adapter.ListTagsForResource(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.ListTagsForResourceInput{}
		mockClient.EXPECT().ListTagsForResource(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.ListTagsForResource(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "list tags for resource")
	})
}

func TestStepFunctionsAdapter_TagResource(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.TagResourceInput{}
		expected := &sfn.TagResourceOutput{}
		mockClient.EXPECT().TagResource(ctx, input).Return(expected, nil)
		result, err := adapter.TagResource(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.TagResourceInput{}
		mockClient.EXPECT().TagResource(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.TagResource(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "tag resource")
	})
}

func TestStepFunctionsAdapter_UntagResource(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.UntagResourceInput{}
		expected := &sfn.UntagResourceOutput{}
		mockClient.EXPECT().UntagResource(ctx, input).Return(expected, nil)
		result, err := adapter.UntagResource(ctx, input)
		assert.NoError(t, err)
		assert.Equal(t, expected, result)
	})

	t.Run("error", func(t *testing.T) {
		mockClient := sfnmocks.NewSFNClientPort(t)
		adapter := &StepFunctionsAdapter{client: mockClient}
		ctx := context.Background()
		input := &sfn.UntagResourceInput{}
		mockClient.EXPECT().UntagResource(ctx, input).Return(nil, errors.New("api error"))
		result, err := adapter.UntagResource(ctx, input)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "untag resource")
	})
}
