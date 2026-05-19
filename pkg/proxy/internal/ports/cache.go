package ports

import "time"

// CachePort defines a simple TTL cache interface.
type CachePort interface {
	Get(key string) (string, bool)
	Set(key, value string, ttl time.Duration)
}
