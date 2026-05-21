package application

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/adapters/github"
	httphandlers "github.com/my-devstack/mydevstack/pkg/proxy/internal/adapters/http"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/cache"
	configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/proxy"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/version"
	"golang.org/x/sync/errgroup"
)

type Container struct {
	Config  *configloader.Config
	Handler *httphandlers.ProxyHandler
	Wg      *errgroup.Group
	ctx     context.Context
}

func NewContainer(ctx context.Context, wg *errgroup.Group, cfg *configloader.Config) (*Container, error) {
	svc := proxy.NewProxyService(cfg)
	// Initialize adapters with default region
	if err := svc.SetServices(); err != nil {
		return nil, err
	}

	// Create version service and start scheduler
	c := cache.New()
	gh := github.NewClient()
	versionSvc := version.NewVersionService(c, gh, cfg.GitHubRepo)
	handler := httphandlers.NewProxyHandler(ctx, svc, versionSvc)

	return &Container{
		Config:  cfg,
		Handler: handler,
		ctx:     ctx,
		Wg:      wg,
	}, nil
}

func (c *Container) RunServer(address string) {
	r := c.setupRoutes()
	server := &http.Server{
		Addr:    address,
		Handler: r,
	}
	c.Wg.Go(func() error {
		log.Printf("http server started")
		if err := server.ListenAndServe(); err != nil {
			if err == http.ErrServerClosed {
				return nil
			}
			log.Printf("http server stopped with error: %v", err)
			return err
		}
		return nil
	})

	c.Wg.Go(func() error {
		<-c.ctx.Done()
		log.Println("shutting down gracefully http server")
		ctxTimeout, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(ctxTimeout); err != nil {
			log.Printf("error shutting server down %v", err)
			return err
		}
		return nil
	})
}

func (c *Container) RunScheduler(checkHours int) {
	interval := time.Duration(checkHours) * time.Hour
	ticker := time.NewTicker(interval)
	log.Printf("[Version] Starting version check scheduler every %d hours", checkHours)

	// Run the scheduler loop in the errgroup so it's tracked for errors/panics.
	c.Wg.Go(func() error {
		defer ticker.Stop()
		c.Handler.VersionSvc.StartScheduler(c.ctx, ticker)
		return nil
	})

	// Listen for context cancellation to stop the scheduler.
	c.Wg.Go(func() error {
		<-c.ctx.Done()
		log.Println("shutting down gracefully scheduler")
		c.Handler.VersionSvc.Stop()
		return nil
	})
}

func (c *Container) setupRoutes() http.Handler {
	handler := c.Handler
	r := chi.NewRouter()
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)

	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD")
			w.Header().Set("Access-Control-Allow-Headers",
				"Content-Type, Authorization, X-Requested-With, "+
					"X-Amz-Date, X-Amz-Security-Token, X-Api-Key, "+
					"x-amz-content-sha256, x-amz-target, x-amz-user-agent, "+
					"x-amz-id-2, x-amz-request-id, Accept, Accept-Encoding, "+
					"Content-Length, Host, User-Agent, "+
					"x-amz-invocation-type, x-amz-log-type, x-amz-client-context, "+
					"amz-sdk-request, amz-sdk-invocation-id, amz-content-sha256, "+
					"X-Mock-Signature")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	})

	r.Get("/health", handler.HealthCheck)
	r.Post("/proxy/region", handler.SetRegion)

	r.HandleFunc("/{service}", handler.ServiceRouter)
	r.HandleFunc("/{service}/{path:.*}", handler.ServiceRouter)
	return r
}
