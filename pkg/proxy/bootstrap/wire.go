package bootstrap

import (
	"log"

	httphandlers "github.com/my-devstack/mydevstack/pkg/proxy/internal/adapters/http"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/application"
	configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/service"
)

type Container struct {
	Config      *configloader.Config
	Service     ports.ProxyService
	Handler     *httphandlers.ProxyHandler
	VersionSvc  *service.VersionService
}

func NewContainer(cfg *configloader.Config) (*Container, error) {
	svc := application.NewProxyService(cfg)
	// Initialize adapters with default region
	if err := svc.SetServices(); err != nil {
		return nil, err
	}

	// Create version service and start scheduler
	versionSvc := service.NewVersionService(cfg.GitHubRepo)
	go versionSvc.StartScheduler(cfg.VersionCheckHours)
	log.Printf("[Version] Starting version check scheduler every %d hours", cfg.VersionCheckHours)

	handler := httphandlers.NewProxyHandler(svc, versionSvc)

	return &Container{
		Config:     cfg,
		Service:    svc,
		Handler:    handler,
		VersionSvc: versionSvc,
	}, nil
}
