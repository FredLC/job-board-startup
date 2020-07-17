const fetch = require('node-fetch');
const redis = require('redis');
const client = redis.createClient();

const { promisify } = require('util');
const setAsync = promisify(client.set).bind(client);

const baseUrl = 'https://jobs.github.com/positions.json';

async function fetchGithub() {
  console.log('fetching Github');

  let resultCount = 1,
    onPage = 0;
  const allJobs = [];

  // fetch jobs
  while (resultCount > 0) {
    const res = await fetch(`${baseUrl}?page=${onPage}`);
    const jobs = await res.json();
    allJobs.push(...jobs);
    resultCount = jobs.length;
    console.log(`Got ${jobs.length} jobs`);
    onPage++;
  }

  console.log(`Total jobs: ${allJobs.length}`);

  // filter aglo
  const jrJobs = allJobs.filter((job) => {
    const jobTitle = job.title.toLowerCase();

    if (
      jobTitle.includes('senior') ||
      jobTitle.includes('manager') ||
      jobTitle.includes('sr.') ||
      jobTitle.includes('sr') ||
      jobTitle.includes('architect') ||
      jobTitle.includes('cto')
    ) {
      return false;
    }

    return true;
  });

  // set in redis
  console.log(`Filtered down to: ${jrJobs.length} jobs`);
  const success = await setAsync('github', JSON.stringify(jrJobs));
  console.log(success);
}

module.exports = fetchGithub;
