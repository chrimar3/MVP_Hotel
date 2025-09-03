/**
 * Load Testing for Hotel Review Generator
 * Tests system performance under expected traffic patterns
 */

const { HybridGenerator } = require('../../src/services/HybridGenerator.js');
const { LLMReviewGenerator } = require('../../src/services/LLMReviewGenerator.js');

// Mock fetch for controlled load testing
global.fetch = jest.fn();
global.performance = { now: jest.fn(() => Date.now()) };
global.AbortController = jest.fn(() => ({
  abort: jest.fn(),
  signal: { aborted: false }
}));

describe('Load Testing', () => {
  let hybridGenerator;
  let llmGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset fetch mock
    global.fetch = jest.fn();
    
    // Setup generators
    hybridGenerator = new HybridGenerator({
      openaiKey: 'test-key',
      groqKey: 'test-key',
      useProxy: false
    });
    
    llmGenerator = new LLMReviewGenerator({
      openaiKey: 'test-key',
      groqKey: 'test-key'
    });

    // Mock consistent API responses
    global.fetch.mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Load test review response' } }],
        usage: { total_tokens: 100 }
      })
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (hybridGenerator && typeof hybridGenerator.destroy === 'function') {
      try {
        hybridGenerator.destroy();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    if (llmGenerator && typeof llmGenerator.destroy === 'function') {
      try {
        llmGenerator.destroy();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Concurrent User Load', () => {
    test('should handle 10 concurrent requests successfully', async () => {
      const concurrentRequests = 10;
      const requests = [];

      const startTime = Date.now();

      // Create concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        const params = {
          hotelName: `Load Test Hotel ${i}`,
          rating: Math.floor(Math.random() * 5) + 1,
          tripType: ['leisure', 'business', 'family'][i % 3],
          highlights: ['location', 'service', 'cleanliness'].slice(0, (i % 3) + 1)
        };

        requests.push(hybridGenerator.generate(params));
      }

      const results = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all requests succeeded
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result.text).toBeTruthy();
        expect(result.requestId).toBeTruthy();
      });

      // Performance assertions
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
      expect(avgLatency).toBeLessThan(5000); // Average latency under 5 seconds

      console.log(`Concurrent test: ${concurrentRequests} requests in ${totalTime}ms, avg latency: ${avgLatency}ms`);
    });

    test('should handle 50 concurrent requests with degraded performance', async () => {
      const concurrentRequests = 50;
      const requests = [];

      // Add some artificial delay to simulate real conditions
      fetch.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({
              choices: [{ message: { content: 'Heavy load response' } }],
              usage: { total_tokens: 80 }
            })
          });
        }, Math.random() * 1000); // Random delay up to 1 second
      }));

      const startTime = Date.now();

      for (let i = 0; i < concurrentRequests; i++) {
        const params = {
          hotelName: `Heavy Load Hotel ${i}`,
          rating: (i % 5) + 1,
          highlights: ['location']
        };

        requests.push(hybridGenerator.generate(params));
      }

      const results = await Promise.allSettled(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Count successful vs failed requests
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      expect(successful.length).toBeGreaterThan(concurrentRequests * 0.8); // At least 80% success rate
      expect(totalTime).toBeLessThan(60000); // Should complete within 60 seconds

      console.log(`Heavy load test: ${successful.length}/${concurrentRequests} successful in ${totalTime}ms`);
    });

    test('should maintain cache effectiveness under load', async () => {
      const cacheTestRequests = 20;
      const uniqueRequests = 5; // Only 5 unique requests, rest should hit cache

      // First, make unique requests to populate cache
      const uniqueParams = [];
      for (let i = 0; i < uniqueRequests; i++) {
        uniqueParams.push({
          hotelName: `Cache Hotel ${i}`,
          rating: 5,
          highlights: ['location', 'service']
        });
      }

      // Populate cache
      await Promise.all(uniqueParams.map(params => hybridGenerator.generate(params)));

      // Now make many requests that should mostly hit cache
      const cacheRequests = [];
      const startTime = Date.now();

      for (let i = 0; i < cacheTestRequests; i++) {
        const paramIndex = i % uniqueRequests;
        cacheRequests.push(hybridGenerator.generate(uniqueParams[paramIndex]));
      }

      const results = await Promise.all(cacheRequests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Count cache hits
      const cacheHits = results.filter(r => r.source === 'cache');
      const cacheHitRate = cacheHits.length / results.length;

      expect(cacheHitRate).toBeGreaterThan(0.5); // At least 50% cache hits
      expect(totalTime).toBeLessThan(5000); // Should be fast due to caching

      console.log(`Cache test: ${cacheHitRate * 100}% hit rate, ${totalTime}ms total`);
    });
  });

  describe('Sustained Load Testing', () => {
    test('should handle sustained requests over time', async () => {
      const requestsPerSecond = 5;
      const testDurationSeconds = 10;
      const totalRequests = requestsPerSecond * testDurationSeconds;

      const results = [];
      const errors = [];
      const latencies = [];

      // Simulate sustained load
      for (let second = 0; second < testDurationSeconds; second++) {
        const secondRequests = [];

        for (let req = 0; req < requestsPerSecond; req++) {
          const params = {
            hotelName: `Sustained Test Hotel ${second}-${req}`,
            rating: (req % 5) + 1,
            highlights: ['location']
          };

          const requestPromise = hybridGenerator.generate(params)
            .then(result => {
              results.push(result);
              latencies.push(result.latency);
              return result;
            })
            .catch(error => {
              errors.push(error);
              throw error;
            });

          secondRequests.push(requestPromise);
        }

        await Promise.allSettled(secondRequests);
        
        // Small delay between seconds
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Analysis
      const successRate = results.length / totalRequests;
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      expect(successRate).toBeGreaterThan(0.9); // 90% success rate
      expect(avgLatency).toBeLessThan(3000); // Average under 3 seconds
      expect(maxLatency).toBeLessThan(10000); // Max under 10 seconds

      console.log(`Sustained load: ${successRate * 100}% success, avg: ${avgLatency}ms, max: ${maxLatency}ms`);
    });

    test('should handle traffic spikes', async () => {
      // Simulate sudden traffic spike
      const normalLoad = 5;
      const spikeLoad = 25;
      
      // Normal period
      const normalRequests = [];
      for (let i = 0; i < normalLoad; i++) {
        normalRequests.push(hybridGenerator.generate({
          hotelName: `Normal Hotel ${i}`,
          rating: 4,
          highlights: ['service']
        }));
      }

      const normalResults = await Promise.allSettled(normalRequests);
      const normalSuccess = normalResults.filter(r => r.status === 'fulfilled').length;

      // Traffic spike
      const spikeRequests = [];
      const spikeStartTime = Date.now();

      for (let i = 0; i < spikeLoad; i++) {
        spikeRequests.push(hybridGenerator.generate({
          hotelName: `Spike Hotel ${i}`,
          rating: 5,
          highlights: ['location', 'amenities']
        }));
      }

      const spikeResults = await Promise.allSettled(spikeRequests);
      const spikeTime = Date.now() - spikeStartTime;
      const spikeSuccess = spikeResults.filter(r => r.status === 'fulfilled').length;

      expect(normalSuccess / normalLoad).toBeGreaterThan(0.95); // Normal load should be 95%+ successful
      expect(spikeSuccess / spikeLoad).toBeGreaterThan(0.7); // Spike should be 70%+ successful
      expect(spikeTime).toBeLessThan(30000); // Spike should resolve within 30 seconds

      console.log(`Traffic spike: Normal ${normalSuccess}/${normalLoad}, Spike ${spikeSuccess}/${spikeLoad} in ${spikeTime}ms`);
    });
  });

  describe('Resource Usage Testing', () => {
    test('should not cause memory leaks under load', async () => {
      if (typeof performance.memory === 'undefined') {
        console.log('Performance memory API not available, skipping memory test');
        return;
      }

      const initialMemory = performance.memory.usedJSHeapSize;
      const requestBatches = 10;
      const requestsPerBatch = 20;

      for (let batch = 0; batch < requestBatches; batch++) {
        const batchRequests = [];

        for (let req = 0; req < requestsPerBatch; req++) {
          batchRequests.push(hybridGenerator.generate({
            hotelName: `Memory Test ${batch}-${req}`,
            rating: (req % 5) + 1,
            highlights: ['test']
          }));
        }

        await Promise.allSettled(batchRequests);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1048576;

      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncreaseMB).toBeLessThan(50);

      console.log(`Memory test: ${memoryIncreaseMB.toFixed(2)}MB increase`);
    });

    test('should handle cache cleanup under memory pressure', async () => {
      // Fill cache beyond normal limits
      const cacheStressRequests = 200;
      const requests = [];

      for (let i = 0; i < cacheStressRequests; i++) {
        requests.push(hybridGenerator.generate({
          hotelName: `Cache Stress ${i}`, // Each request unique to avoid cache hits
          rating: (i % 5) + 1,
          highlights: [`highlight_${i % 10}`]
        }));
      }

      await Promise.allSettled(requests);

      // Check cache size is within limits
      const cacheSize = hybridGenerator.cache.size;
      expect(cacheSize).toBeLessThanOrEqual(hybridGenerator.config.cache.maxSize);

      console.log(`Cache stress test: Final cache size ${cacheSize}/${hybridGenerator.config.cache.maxSize}`);
    });
  });

  describe('Failure Resilience Testing', () => {
    test('should handle partial API failures under load', async () => {
      let callCount = 0;
      
      // Mock intermittent failures (30% failure rate)
      fetch.mockImplementation(() => {
        callCount++;
        const shouldFail = callCount % 10 < 3; // 30% failure rate

        if (shouldFail) {
          return Promise.reject(new Error('Intermittent API failure'));
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'Resilience test response' } }],
            usage: { total_tokens: 90 }
          })
        });
      });

      const resilienceRequests = 50;
      const requests = [];

      for (let i = 0; i < resilienceRequests; i++) {
        requests.push(hybridGenerator.generate({
          hotelName: `Resilience Hotel ${i}`,
          rating: 4,
          highlights: ['resilience']
        }));
      }

      const results = await Promise.allSettled(requests);
      const successful = results.filter(r => r.status === 'fulfilled');
      
      // Should still get mostly successful results due to fallbacks
      expect(successful.length).toBeGreaterThan(resilienceRequests * 0.8);

      // Check that fallback strategies were used
      const successfulResults = successful.map(r => r.value);
      const templateFallbacks = successfulResults.filter(r => r.source === 'template');
      expect(templateFallbacks.length).toBeGreaterThan(0);

      console.log(`Resilience test: ${successful.length}/${resilienceRequests} successful, ${templateFallbacks.length} fallbacks`);
    });

    test('should handle timeout scenarios under load', async () => {
      // Mock slow API responses
      fetch.mockImplementation(() => new Promise((resolve) => {
        const delay = Math.random() * 2000 + 500; // 500ms to 2.5s delay
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({
              choices: [{ message: { content: 'Slow response' } }],
              usage: { total_tokens: 75 }
            })
          });
        }, delay);
      }));

      const timeoutRequests = 20;
      const requests = [];

      for (let i = 0; i < timeoutRequests; i++) {
        requests.push(hybridGenerator.generate({
          hotelName: `Timeout Test ${i}`,
          rating: 3,
          highlights: ['timeout']
        }));
      }

      const results = await Promise.allSettled(requests);
      const successful = results.filter(r => r.status === 'fulfilled');

      // Should handle timeouts gracefully
      expect(successful.length).toBeGreaterThan(0);

      console.log(`Timeout test: ${successful.length}/${timeoutRequests} successful`);
    });
  });

  describe('Performance Benchmarking', () => {
    test('should maintain response times under various loads', async () => {
      const loadLevels = [1, 5, 10, 20];
      const benchmarkResults = [];

      for (const loadLevel of loadLevels) {
        const requests = [];
        const startTime = Date.now();

        for (let i = 0; i < loadLevel; i++) {
          requests.push(hybridGenerator.generate({
            hotelName: `Benchmark Hotel ${loadLevel}-${i}`,
            rating: 5,
            highlights: ['benchmark']
          }));
        }

        const results = await Promise.allSettled(requests);
        const endTime = Date.now();
        const totalTime = endTime - startTime;

        const successful = results.filter(r => r.status === 'fulfilled');
        const avgResponseTime = successful.length > 0 ? 
          successful.reduce((sum, r) => sum + r.value.latency, 0) / successful.length : 0;

        benchmarkResults.push({
          loadLevel,
          totalTime,
          successCount: successful.length,
          avgResponseTime,
          throughput: successful.length / (totalTime / 1000) // requests per second
        });
      }

      // Analyze benchmark results
      benchmarkResults.forEach(result => {
        expect(result.successCount).toBeGreaterThan(0);
        expect(result.avgResponseTime).toBeLessThan(10000); // Max 10s response time
        
        console.log(`Load ${result.loadLevel}: ${result.throughput.toFixed(2)} req/s, avg: ${result.avgResponseTime}ms`);
      });

      // Check that system doesn't completely break down at higher loads
      const highestLoad = benchmarkResults[benchmarkResults.length - 1];
      expect(highestLoad.successCount / highestLoad.loadLevel).toBeGreaterThan(0.5);
    });

    test('should demonstrate scalability characteristics', async () => {
      const scalabilityTest = async (concurrency) => {
        const requests = [];
        const startTime = Date.now();

        for (let i = 0; i < concurrency; i++) {
          requests.push(hybridGenerator.generate({
            hotelName: `Scale Test ${concurrency}-${i}`,
            rating: 4,
            highlights: ['scale']
          }));
        }

        const results = await Promise.allSettled(requests);
        const endTime = Date.now();
        
        const successful = results.filter(r => r.status === 'fulfilled');
        const totalTime = Math.max(endTime - startTime, 1); // Prevent division by zero
        const throughput = successful.length / (totalTime / 1000);

        return {
          concurrency,
          successful: successful.length,
          totalTime,
          throughput,
          successRate: successful.length / concurrency
        };
      };

      const concurrencyLevels = [5, 15, 30];
      const scalabilityResults = [];

      for (const level of concurrencyLevels) {
        const result = await scalabilityTest(level);
        scalabilityResults.push(result);
        
        console.log(`Scalability ${level}: ${result.throughput.toFixed(2)} req/s, ${(result.successRate * 100).toFixed(1)}% success`);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Basic scalability assertions
      scalabilityResults.forEach(result => {
        expect(result.successRate).toBeGreaterThan(0.6); // At least 60% success rate
      });

      // System should handle increased load reasonably
      const lowLoad = scalabilityResults[0];
      const highLoad = scalabilityResults[scalabilityResults.length - 1];
      
      // Only check throughput degradation if both values are valid
      if (lowLoad.throughput !== Infinity && highLoad.throughput !== Infinity) {
        expect(highLoad.throughput).toBeGreaterThan(lowLoad.throughput * 0.3); // Shouldn't drop below 30% efficiency
      } else {
        // If we have Infinity throughput, just check that we still have good success rates
        expect(highLoad.successRate).toBeGreaterThan(0.5);
      }
    });
  });

  describe('Real-World Traffic Simulation', () => {
    test('should handle realistic traffic patterns', async () => {
      // Simulate realistic user behavior patterns
      const trafficPatterns = [
        { hotelName: 'Luxury Resort', rating: 5, highlights: ['location', 'service', 'amenities'], weight: 0.3 },
        { hotelName: 'Business Hotel', rating: 4, highlights: ['wifi', 'location'], weight: 0.25 },
        { hotelName: 'Budget Inn', rating: 3, highlights: ['value', 'cleanliness'], weight: 0.2 },
        { hotelName: 'Family Resort', rating: 4, highlights: ['pool', 'kids', 'food'], weight: 0.15 },
        { hotelName: 'Boutique Hotel', rating: 5, highlights: ['design', 'service'], weight: 0.1 }
      ];

      const totalRequests = 100;
      const requests = [];

      // Generate requests based on realistic patterns
      for (let i = 0; i < totalRequests; i++) {
        const random = Math.random();
        let cumulativeWeight = 0;
        let selectedPattern = trafficPatterns[0];

        for (const pattern of trafficPatterns) {
          cumulativeWeight += pattern.weight;
          if (random <= cumulativeWeight) {
            selectedPattern = pattern;
            break;
          }
        }

        // Add some randomization to make each request unique
        const params = {
          hotelName: `${selectedPattern.hotelName} ${Math.floor(i / 10)}`,
          rating: selectedPattern.rating,
          highlights: selectedPattern.highlights,
          tripType: ['leisure', 'business', 'family'][i % 3],
          nights: Math.floor(Math.random() * 7) + 1
        };

        requests.push(hybridGenerator.generate(params));

        // Simulate realistic request timing (some clustering, some spread)
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        }
      }

      const results = await Promise.allSettled(requests);
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      // Real-world expectations
      expect(successful.length / totalRequests).toBeGreaterThan(0.85); // 85% success rate
      
      // Check distribution of sources
      const successfulResults = successful.map(r => r.value);
      const sources = successfulResults.reduce((acc, r) => {
        acc[r.source] = (acc[r.source] || 0) + 1;
        return acc;
      }, {});

      console.log('Real-world simulation:', {
        totalRequests,
        successful: successful.length,
        failed: failed.length,
        sources
      });

      // Should use caching effectively for similar requests
      expect(sources.cache || 0).toBeGreaterThan(0);
    });
  });
});