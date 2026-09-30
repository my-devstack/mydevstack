package httphandlers

import (
	"fmt"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudfront"
	cftypes "github.com/aws/aws-sdk-go-v2/service/cloudfront/types"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func (h *ProxyHandler) registerCloudFrontRoutes(r chi.Router) {
	r.Route("/cloudfront", func(r chi.Router) {
		// Distributions
		r.Get("/distributions", h.cloudfrontListDistributions)
		r.Post("/distributions", h.cloudfrontCreateDistribution)
		r.Get("/distributions/{id}", h.cloudfrontGetDistribution)
		r.Put("/distributions/{id}", h.cloudfrontUpdateDistribution)
		r.Delete("/distributions/{id}", h.cloudfrontDeleteDistribution)

		// Invalidations
		r.Get("/distributions/{id}/invalidations", h.cloudfrontListInvalidations)
		r.Post("/distributions/{id}/invalidate", h.cloudfrontCreateInvalidation)

		// Origin Access Controls
		r.Get("/origin-access-controls", h.cloudfrontListOriginAccessControls)
		r.Post("/origin-access-controls", h.cloudfrontCreateOriginAccessControl)
		r.Delete("/origin-access-controls/{id}", h.cloudfrontDeleteOriginAccessControl)
	})
}

// DTO for simplified distribution create/update
type cloudfrontDistributionDTO struct {
	Comment             string                           `json:"Comment"`
	Enabled             *bool                            `json:"Enabled"`
	DefaultRootObject   string                           `json:"DefaultRootObject"`
	Origins             []cloudfrontOriginDTO            `json:"Origins"`
	DefaultCacheBehavior *cloudfrontDefaultCacheBehaviorDTO `json:"DefaultCacheBehavior"`
	PriceClass          string                           `json:"PriceClass"`
	Aliases             []string                         `json:"Aliases"`
}

type cloudfrontOriginDTO struct {
	Id                    string                          `json:"Id"`
	DomainName            string                          `json:"DomainName"`
	OriginPath            string                          `json:"OriginPath"`
	OriginAccessControlId string                          `json:"OriginAccessControlId"`
	S3OriginConfig        *cloudfrontS3OriginConfigDTO    `json:"S3OriginConfig"`
	CustomOriginConfig    *cloudfrontCustomOriginConfigDTO `json:"CustomOriginConfig"`
}

type cloudfrontS3OriginConfigDTO struct {
	OriginAccessIdentity string `json:"OriginAccessIdentity"`
}

type cloudfrontCustomOriginConfigDTO struct {
	HTTPPort             int32  `json:"HTTPPort"`
	HTTPSPort            int32  `json:"HTTPSPort"`
	OriginProtocolPolicy string `json:"OriginProtocolPolicy"`
}

type cloudfrontDefaultCacheBehaviorDTO struct {
	TargetOriginId       string   `json:"TargetOriginId"`
	ViewerProtocolPolicy string   `json:"ViewerProtocolPolicy"`
	CachePolicyId        string   `json:"CachePolicyId"`
	AllowedMethods       []string `json:"AllowedMethods"`
	Compress             *bool    `json:"Compress"`
}

// ---------------------------------------------------------------------------
// Distributions
// ---------------------------------------------------------------------------

func (h *ProxyHandler) cloudfrontListDistributions(w http.ResponseWriter, r *http.Request) {
	result, err := h.Svc.CloudFront().ListDistributions(h.ctx, &cloudfront.ListDistributionsInput{})
	if err != nil {
		sendErrorWithStatus(w, "Failed to list distributions", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) cloudfrontCreateDistribution(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var dto cloudfrontDistributionDTO
	if err := parseBody(bodyBytes, &dto); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	config, err := h.buildDistributionConfig(&dto)
	if err != nil {
		sendError(w, http.StatusBadRequest, "Invalid distribution config", err)
		return
	}

	result, err := h.Svc.CloudFront().CreateDistribution(h.ctx, &cloudfront.CreateDistributionInput{
		DistributionConfig: config,
	})
	if err != nil {
		sendErrorWithStatus(w, "Failed to create distribution", err)
		return
	}
	writeJSON(w, http.StatusCreated, result)
}

func (h *ProxyHandler) cloudfrontGetDistribution(w http.ResponseWriter, r *http.Request) {
	id := urlParam(r, "id")
	result, err := h.Svc.CloudFront().GetDistribution(h.ctx, &cloudfront.GetDistributionInput{
		Id: aws.String(id),
	})
	if err != nil {
		sendErrorWithStatus(w, "Failed to get distribution", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) cloudfrontUpdateDistribution(w http.ResponseWriter, r *http.Request) {
	id := urlParam(r, "id")
	bodyBytes := readBody(r)
	var dto cloudfrontDistributionDTO
	if err := parseBody(bodyBytes, &dto); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Fetch current config and ETag
	current, err := h.Svc.CloudFront().GetDistributionConfig(h.ctx, &cloudfront.GetDistributionConfigInput{
		Id: aws.String(id),
	})
	if err != nil {
		sendErrorWithStatus(w, "Failed to get distribution config", err)
		return
	}

	config := current.DistributionConfig
	if config == nil {
		sendError(w, http.StatusNotFound, "Distribution config not found", nil)
		return
	}

	// Merge DTO fields into config
	if dto.Comment != "" {
		config.Comment = aws.String(dto.Comment)
	}
	if dto.Enabled != nil {
		config.Enabled = dto.Enabled
	}
	if dto.DefaultRootObject != "" {
		config.DefaultRootObject = aws.String(dto.DefaultRootObject)
	}
	if len(dto.Origins) > 0 {
		origins, err := h.buildOrigins(dto.Origins)
		if err != nil {
			sendError(w, http.StatusBadRequest, "Invalid origins", err)
			return
		}
		config.Origins = origins
	}
	if dto.DefaultCacheBehavior != nil {
		dcb, err := h.buildDefaultCacheBehavior(dto.DefaultCacheBehavior, dto.Origins)
		if err != nil {
			sendError(w, http.StatusBadRequest, "Invalid default cache behavior", err)
			return
		}
		config.DefaultCacheBehavior = dcb
	}
	if dto.PriceClass != "" {
		config.PriceClass = cftypes.PriceClass(dto.PriceClass)
	}
	if len(dto.Aliases) > 0 {
		config.Aliases = &cftypes.Aliases{
			Quantity: aws.Int32(int32(len(dto.Aliases))),
			Items:    dto.Aliases,
		}
	}

	result, err := h.Svc.CloudFront().UpdateDistribution(h.ctx, &cloudfront.UpdateDistributionInput{
		Id:              aws.String(id),
		IfMatch:         current.ETag,
		DistributionConfig: config,
	})
	if err != nil {
		sendErrorWithStatus(w, "Failed to update distribution", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) cloudfrontDeleteDistribution(w http.ResponseWriter, r *http.Request) {
	id := urlParam(r, "id")

	// Fetch current config and ETag
	current, err := h.Svc.CloudFront().GetDistributionConfig(h.ctx, &cloudfront.GetDistributionConfigInput{
		Id: aws.String(id),
	})
	if err != nil {
		sendErrorWithStatus(w, "Failed to get distribution config", err)
		return
	}

	config := current.DistributionConfig
	if config == nil {
		sendError(w, http.StatusNotFound, "Distribution config not found", nil)
		return
	}

	// If enabled, disable first
	if config.Enabled != nil && *config.Enabled {
		config.Enabled = aws.Bool(false)
		_, err := h.Svc.CloudFront().UpdateDistribution(h.ctx, &cloudfront.UpdateDistributionInput{
			Id:              aws.String(id),
			IfMatch:         current.ETag,
			DistributionConfig: config,
		})
		if err != nil {
			sendErrorWithStatus(w, "Failed to disable distribution", err)
			return
		}

		// Re-fetch ETag after update
		current, err = h.Svc.CloudFront().GetDistributionConfig(h.ctx, &cloudfront.GetDistributionConfigInput{
			Id: aws.String(id),
		})
		if err != nil {
			sendErrorWithStatus(w, "Failed to get updated distribution config", err)
			return
		}
	}

	// Now delete
	err = h.Svc.CloudFront().DeleteDistribution(h.ctx, &cloudfront.DeleteDistributionInput{
		Id:      aws.String(id),
		IfMatch: current.ETag,
	})
	if err != nil {
		sendErrorWithStatus(w, "Failed to delete distribution", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Distribution deleted successfully"})
}

// ---------------------------------------------------------------------------
// Invalidations
// ---------------------------------------------------------------------------

func (h *ProxyHandler) cloudfrontListInvalidations(w http.ResponseWriter, r *http.Request) {
	id := urlParam(r, "id")
	result, err := h.Svc.CloudFront().ListInvalidations(h.ctx, &cloudfront.ListInvalidationsInput{
		DistributionId: aws.String(id),
	})
	if err != nil {
		sendErrorWithStatus(w, "Failed to list invalidations", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) cloudfrontCreateInvalidation(w http.ResponseWriter, r *http.Request) {
	id := urlParam(r, "id")
	bodyBytes := readBody(r)
	var body struct {
		Paths           []string `json:"Paths"`
		CallerReference string   `json:"CallerReference"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if len(body.Paths) == 0 {
		sendError(w, http.StatusBadRequest, "Paths is required", nil)
		return
	}

	callerRef := body.CallerReference
	if callerRef == "" {
		callerRef = uuid.New().String()
	}

	result, err := h.Svc.CloudFront().CreateInvalidation(h.ctx, &cloudfront.CreateInvalidationInput{
		DistributionId: aws.String(id),
		InvalidationBatch: &cftypes.InvalidationBatch{
			Paths: &cftypes.Paths{
				Quantity: aws.Int32(int32(len(body.Paths))),
				Items:    body.Paths,
			},
			CallerReference: aws.String(callerRef),
		},
	})
	if err != nil {
		sendErrorWithStatus(w, "Failed to create invalidation", err)
		return
	}
	writeJSON(w, http.StatusCreated, result)
}

// ---------------------------------------------------------------------------
// Origin Access Controls
// ---------------------------------------------------------------------------

func (h *ProxyHandler) cloudfrontListOriginAccessControls(w http.ResponseWriter, r *http.Request) {
	result, err := h.Svc.CloudFront().ListOriginAccessControls(h.ctx, &cloudfront.ListOriginAccessControlsInput{})
	if err != nil {
		sendErrorWithStatus(w, "Failed to list origin access controls", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) cloudfrontCreateOriginAccessControl(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudfront.CreateOriginAccessControlInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudFront().CreateOriginAccessControl(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to create origin access control", err)
		return
	}
	writeJSON(w, http.StatusCreated, result)
}

func (h *ProxyHandler) cloudfrontDeleteOriginAccessControl(w http.ResponseWriter, r *http.Request) {
	id := urlParam(r, "id")

	// Fetch current ETag
	current, err := h.Svc.CloudFront().GetOriginAccessControl(h.ctx, &cloudfront.GetOriginAccessControlInput{
		Id: aws.String(id),
	})
	if err != nil {
		sendErrorWithStatus(w, "Failed to get origin access control", err)
		return
	}

	err = h.Svc.CloudFront().DeleteOriginAccessControl(h.ctx, &cloudfront.DeleteOriginAccessControlInput{
		Id:      aws.String(id),
		IfMatch: current.ETag,
	})
	if err != nil {
		sendErrorWithStatus(w, "Failed to delete origin access control", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Origin access control deleted successfully"})
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func (h *ProxyHandler) buildDistributionConfig(dto *cloudfrontDistributionDTO) (*cftypes.DistributionConfig, error) {
	if len(dto.Origins) == 0 {
		return nil, fmt.Errorf("at least one origin is required")
	}

	origins, err := h.buildOrigins(dto.Origins)
	if err != nil {
		return nil, err
	}

	dcb, err := h.buildDefaultCacheBehavior(dto.DefaultCacheBehavior, dto.Origins)
	if err != nil {
		return nil, err
	}

	enabled := true
	if dto.Enabled != nil {
		enabled = *dto.Enabled
	}

	priceClass := cftypes.PriceClassPriceClass100
	if dto.PriceClass != "" {
		priceClass = cftypes.PriceClass(dto.PriceClass)
	}

	config := &cftypes.DistributionConfig{
		CallerReference:      aws.String(uuid.New().String()),
		Comment:              aws.String(dto.Comment),
		Enabled:              aws.Bool(enabled),
		Origins:              origins,
		DefaultCacheBehavior: dcb,
		PriceClass:           priceClass,
	}

	if dto.DefaultRootObject != "" {
		config.DefaultRootObject = aws.String(dto.DefaultRootObject)
	}

	if len(dto.Aliases) > 0 {
		config.Aliases = &cftypes.Aliases{
			Quantity: aws.Int32(int32(len(dto.Aliases))),
			Items:    dto.Aliases,
		}
	}

	return config, nil
}

func (h *ProxyHandler) buildOrigins(origins []cloudfrontOriginDTO) (*cftypes.Origins, error) {
	items := make([]cftypes.Origin, 0, len(origins))
	for i, o := range origins {
		if o.DomainName == "" {
			return nil, fmt.Errorf("origin %d: DomainName is required", i)
		}

		origin := cftypes.Origin{
			DomainName: aws.String(o.DomainName),
		}

		if o.Id != "" {
			origin.Id = aws.String(o.Id)
		} else {
			origin.Id = aws.String(fmt.Sprintf("origin-%d", i))
		}

		if o.OriginPath != "" {
			origin.OriginPath = aws.String(o.OriginPath)
		}

		if o.OriginAccessControlId != "" {
			origin.OriginAccessControlId = aws.String(o.OriginAccessControlId)
		}

		if o.S3OriginConfig != nil {
			origin.S3OriginConfig = &cftypes.S3OriginConfig{
				OriginAccessIdentity: aws.String(o.S3OriginConfig.OriginAccessIdentity),
			}
		} else if o.CustomOriginConfig != nil {
			origin.CustomOriginConfig = &cftypes.CustomOriginConfig{
				HTTPPort:             aws.Int32(o.CustomOriginConfig.HTTPPort),
				HTTPSPort:            aws.Int32(o.CustomOriginConfig.HTTPSPort),
				OriginProtocolPolicy: cftypes.OriginProtocolPolicy(o.CustomOriginConfig.OriginProtocolPolicy),
			}
		} else {
			// Default to S3 origin with empty OAI
			origin.S3OriginConfig = &cftypes.S3OriginConfig{
				OriginAccessIdentity: aws.String(""),
			}
		}

		items = append(items, origin)
	}

	return &cftypes.Origins{
		Quantity: aws.Int32(int32(len(items))),
		Items:    items,
	}, nil
}

func (h *ProxyHandler) buildDefaultCacheBehavior(dto *cloudfrontDefaultCacheBehaviorDTO, origins []cloudfrontOriginDTO) (*cftypes.DefaultCacheBehavior, error) {
	if dto == nil {
		dto = &cloudfrontDefaultCacheBehaviorDTO{}
	}

	targetOriginId := dto.TargetOriginId
	if targetOriginId == "" && len(origins) > 0 {
		if origins[0].Id != "" {
			targetOriginId = origins[0].Id
		} else {
			targetOriginId = "origin-0"
		}
	}
	if targetOriginId == "" {
		return nil, fmt.Errorf("TargetOriginId is required")
	}

	viewerProtocolPolicy := cftypes.ViewerProtocolPolicyRedirectToHttps
	if dto.ViewerProtocolPolicy != "" {
		viewerProtocolPolicy = cftypes.ViewerProtocolPolicy(dto.ViewerProtocolPolicy)
	}

	cachePolicyId := "658327ea-f89d-4fab-a63d-7e88639e58f6" // CachingOptimized
	if dto.CachePolicyId != "" {
		cachePolicyId = dto.CachePolicyId
	}

	allowedMethods := []string{"GET", "HEAD"}
	if len(dto.AllowedMethods) > 0 {
		allowedMethods = dto.AllowedMethods
	}

	dcb := &cftypes.DefaultCacheBehavior{
		TargetOriginId:       aws.String(targetOriginId),
		ViewerProtocolPolicy: viewerProtocolPolicy,
		CachePolicyId:        aws.String(cachePolicyId),
		ForwardedValues: &cftypes.ForwardedValues{
			QueryString: aws.Bool(false),
			Cookies:     &cftypes.CookiePreference{Forward: cftypes.ItemSelectionNone},
		},
		AllowedMethods: &cftypes.AllowedMethods{
			Quantity: aws.Int32(int32(len(allowedMethods))),
			Items:    convertMethods(allowedMethods),
		},
	}

	if dto.Compress != nil {
		dcb.Compress = dto.Compress
	}

	return dcb, nil
}

func convertMethods(methods []string) []cftypes.Method {
	result := make([]cftypes.Method, len(methods))
	for i, m := range methods {
		result[i] = cftypes.Method(m)
	}
	return result
}
