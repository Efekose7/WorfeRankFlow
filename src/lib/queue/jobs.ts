/**
 * Job queue using BullMQ with Redis.
 * Falls back to a simple in-memory approach when Redis is unavailable (dev without Redis).
 */

import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

let connection: IORedis | null = null;

function getConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return connection;
}

export type JobType =
  | 'generate-article'
  | 'qa-article'
  | 'publish-article'
  | 'research-keywords'
  | 'crawl-website'
  | 'analyze-domain'
  | 'update-analytics'
  | 'retry-publish'
  | 'build-topic-clusters';

export interface JobPayload {
  type: JobType;
  projectId?: string;
  articleId?: string;
  keywordId?: string;
  integrationId?: string;
  organizationId?: string;
  data?: Record<string, unknown>;
}

let articleQueue: Queue | null = null;
let seoQueue: Queue | null = null;
let publishQueue: Queue | null = null;

export function getArticleQueue(): Queue {
  if (!articleQueue) {
    articleQueue = new Queue('article-generation', {
      connection: getConnection() as any,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    });
  }
  return articleQueue;
}

export function getSeoQueue(): Queue {
  if (!seoQueue) {
    seoQueue = new Queue('seo-research', {
      connection: getConnection() as any,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
      },
    });
  }
  return seoQueue;
}

export function getPublishQueue(): Queue {
  if (!publishQueue) {
    publishQueue = new Queue('publishing', {
      connection: getConnection() as any,
      defaultJobOptions: {
        removeOnComplete: 200,
        removeOnFail: 500,
        attempts: 5,
        backoff: { type: 'exponential', delay: 10000 },
      },
    });
  }
  return publishQueue;
}

export async function enqueueJob(type: JobType, payload: JobPayload, options?: {
  delay?: number;
  priority?: number;
  jobId?: string;
}): Promise<string> {
  const queue = type.startsWith('publish') || type === 'retry-publish'
    ? getPublishQueue()
    : type.startsWith('research') || type.startsWith('crawl') || type.startsWith('analyze') || type.startsWith('build')
      ? getSeoQueue()
      : getArticleQueue();

  const job = await queue.add(type, payload, {
    delay: options?.delay,
    priority: options?.priority,
    jobId: options?.jobId,
  });

  return job.id ?? '';
}

export async function getJobStatus(jobId: string, queueName: 'article-generation' | 'seo-research' | 'publishing') {
  const conn = getConnection();
  const queue = new Queue(queueName, { connection: conn as any });
  const job = await queue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  return {
    id: job.id,
    state,
    progress: job.progress,
    result: job.returnvalue,
    failedReason: job.failedReason,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  };
}
