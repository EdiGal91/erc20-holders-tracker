import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('sync_transfers')
export class SyncTransfersProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    console.log('Processing sync_transfers job:', job.id, job.data);

    return { processed: true, jobId: job.id };
  }
}
