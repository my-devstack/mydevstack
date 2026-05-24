package cache

import (
	"testing"
	"time"
)

func TestCache_SetAndGet(t *testing.T) {
	c := New()

	// Test setting and getting a value
	c.Set("key1", "value1", time.Hour)
	val, found := c.Get("key1")
	if !found || val != "value1" {
		t.Errorf("expected value1, got %v, found=%v", val, found)
	}
}

func TestCache_GetNotFound(t *testing.T) {
	c := New()

	val, found := c.Get("nonexistent")
	if found {
		t.Errorf("expected not found, got %v", val)
	}
}

func TestCache_Expiration(t *testing.T) {
	c := New()

	// Set with very short TTL
	c.Set("key1", "value1", time.Millisecond)
	time.Sleep(10 * time.Millisecond)

	val, found := c.Get("key1")
	if found {
		t.Errorf("expected expired value, got %v", val)
	}
}

func TestCache_Delete(t *testing.T) {
	c := New()

	c.Set("key1", "value1", time.Hour)
	c.Delete("key1")

	val, found := c.Get("key1")
	if found {
		t.Errorf("expected deleted, got %v", val)
	}
}

func TestCache_GetOrSet(t *testing.T) {
	c := New()

	// First call should set the value
	val, set := c.GetOrSet("key1", "value1", time.Hour)
	if val != "value1" || set {
		t.Errorf("expected value1 and set=true, got %v, set=%v", val, set)
	}

	// Second call should return cached value
	val, set = c.GetOrSet("key1", "value2", time.Hour)
	if val != "value1" || !set {
		t.Errorf("expected value1 and set=false, got %v, set=%v", val, set)
	}
}

func TestCache_Len(t *testing.T) {
	c := New()

	if got := c.Len(); got != 0 {
		t.Errorf("expected empty cache, got Len=%d", got)
	}

	c.Set("a", "1", time.Hour)
	c.Set("b", "2", time.Hour)
	c.Set("c", "3", time.Hour)

	if got := c.Len(); got != 3 {
		t.Errorf("expected Len=3, got %d", got)
	}

	c.Delete("a")
	if got := c.Len(); got != 2 {
		t.Errorf("expected Len=2 after delete, got %d", got)
	}
}

func TestCache_Cleanup(t *testing.T) {
	c := New()

	c.Set("short", "x", time.Millisecond)
	c.Set("long", "y", time.Hour)

	time.Sleep(10 * time.Millisecond)

	c.Cleanup()

	if got := c.Len(); got != 1 {
		t.Errorf("expected Len=1 after cleanup (long only), got %d", got)
	}
	_, found := c.Get("short")
	if found {
		t.Error("expected 'short' to be removed by Cleanup")
	}
	val, found := c.Get("long")
	if !found || val != "y" {
		t.Errorf("expected 'long' to remain, got val=%v, found=%v", val, found)
	}
}

func TestCache_GetLazyDelete(t *testing.T) {
	c := New()

	c.Set("expired", "val", time.Millisecond)
	time.Sleep(10 * time.Millisecond)

	// Get should return false AND delete the expired entry
	val, found := c.Get("expired")
	if found {
		t.Errorf("expected expired key to not be found, got val=%v", val)
	}

	// Len should have decreased
	if got := c.Len(); got != 0 {
		t.Errorf("expected Len=0 after lazy delete, got %d", got)
	}
}

func TestCache_ConcurrentAccess(t *testing.T) {
	c := New()

	// Test concurrent read/write
	done := make(chan bool)
	for i := 0; i < 100; i++ {
		go func(n int) {
			c.Set("key", "value", time.Hour)
			c.Get("key")
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 100; i++ {
		<-done
	}
}