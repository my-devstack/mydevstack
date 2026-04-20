package bootstrap

import (
	httphandlers "github.com/my-devstack/mydevstack/pkg/proxy/internal/adapters/http"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/application"
	configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type Container struct {
	Config  *configloader.Config
	Service ports.ProxyService
	Handler *httphandlers.ProxyHandler
}

func NewContainer(cfg *configloader.Config) (*Container, error) {
	svc := application.NewProxyService(cfg)
	// Initialize adapters with default region
	if err := svc.SetServices(); err != nil {
		return nil, err
	}

	handler := httphandlers.NewProxyHandler(svc)

	return &Container{
		Config:  cfg,
		Service: svc,
		Handler: handler,
	}, nil
}
