import { JOBS } from "@limitrausch/contracts";

export const jobsByRaidHelperName = new Map(
  JOBS.filter((job) => job.raidHelperName !== undefined).map((job) => [
    job.raidHelperName,
    job,
  ]),
);

export const jobsById = new Map(JOBS.map((job) => [job.id, job]));
