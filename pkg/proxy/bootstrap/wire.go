package bootstrap

import (
	"context"
	"log"
	"time"

	"github.com/my-devstack/mydevstack/pkg/proxy/internal/adapters/github"
	httphandlers "github.com/my-devstack/mydevstack/pkg/proxy/internal/adapters/http"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/application"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/cache"
	configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/version"
)

type Container struct {
	Config     *configloader.Config
	Service    ports.ProxyService
	Handler    *httphandlers.ProxyHandler
	VersionSvc *version.VersionService
}

func NewContainer(cfg *configloader.Config) (*Container, error) {
	svc := application.NewProxyService(cfg)
	// Initialize adapters with default region
	if err := svc.SetServices(); err != nil {
		return nil, err
	}

	// Create version service and start scheduler
	c := cache.New()
	gh := github.NewClient()
	versionSvc := version.NewVersionService(c, gh, cfg.GitHubRepo)

	// Initial version check on startup
	interval := time.Duration(cfg.VersionCheckHours) * time.Hour
	ticker := time.NewTicker(interval)
	go versionSvc.StartScheduler(context.Background(), ticker)
	log.Printf("[Version] Starting version check scheduler every %d hours", cfg.VersionCheckHours)

	handler := httphandlers.NewProxyHandler(svc, versionSvc)

	return &Container{
		Config:     cfg,
		Service:    svc,
		Handler:    handler,
		VersionSvc: versionSvc,
	}, nil
}
